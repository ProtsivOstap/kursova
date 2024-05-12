import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { DbService } from 'src/db/db.service';
import { Client } from 'pg';
import { User } from 'src/auth/types/user.type';
import * as csvParser from 'csv-parser';

@Injectable()
export class CsvImportService {
  constructor(private readonly dbService: DbService) {}

  async loadPartsSupplier(supplierUser: User, filePath: string) {
    console.log(filePath);

    const client = await this.dbService.openConnection(supplierUser.role);
    await client.query('BEGIN');
    const partsData = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        partsData.push(row);
      })
      .on('end', async () => {
        try {
          const userSupplier = await client.query(
            `select supplier_id from suppliers where  user_id = ${supplierUser.user_id}`,
          );
          const supplierId = userSupplier.rows[0].supplier_id;
          for (const data of partsData) {
            // Extract data from the row
            const {
              partNumber,
              generalPartName,
              partGroupName,
              specificPartName,
              carBrandName,
              carModelName,
              carModelYear,
            } = data;

            // Check if part already exists
            const existingPart = await this.checkExistingPart(
              client,
              partNumber,
            );
            if (existingPart) {
              console.log(
                `Part with part number ${partNumber} already exists. Skipping...`,
              );
              continue;
            }

            // Check existing part description or create one
            let partDescriptionId = await this.checkExistingPartDescription(
              client,
              generalPartName,
              partGroupName,
              specificPartName,
            );
            if (!partDescriptionId) {
              partDescriptionId = await this.insertPartDescription(
                client,
                generalPartName,
                partGroupName,
                specificPartName,
              );
            }

            // Check existing car brand or create one
            let carBrandId = await this.checkExistingCarBrand(
              client,
              carBrandName,
            );
            if (!carBrandId) {
              carBrandId = await this.insertCarBrand(client, carBrandName);
            }

            // Check existing car model or create one
            let carModelId = await this.checkExistingCarModel(
              client,
              carBrandId,
              carModelName,
              carModelYear,
            );
            if (!carModelId) {
              carModelId = await this.insertCarModel(
                client,
                carBrandId,
                carModelName,
                carModelYear,
              );
            }

            // Insert part
            const insertedPartId = await this.insertPart(
              client,
              partNumber,
              partDescriptionId,
              'available',
              carModelId,
            );

            await this.linkPartSupplier(supplierId, insertedPartId, client);
            console.log(
              `Part with part number ${partNumber} inserted successfully.`,
            );
          }
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error occurred while importing parts:', error);
        } finally {
          await client.query('END');
          await client.end();
        }
      });
  }

  async linkPartSupplier(supplierId: string, partId: string, client: Client) {
    await client.query(`
    insert into parts_supplier (part_id, supplier_id) values ('${partId}','${supplierId}');
    `);
  }

  async checkExistingPart(
    client: Client,
    partNumber: string,
  ): Promise<boolean> {
    const queryResult = await client.query(
      'SELECT EXISTS(SELECT 1 FROM parts WHERE part_number = $1)',
      [partNumber],
    );
    return queryResult.rows[0].exists;
  }

  async checkExistingPartDescription(
    client: Client,
    generalPartName: string,
    partGroupName: string,
    specificPartName: string,
  ): Promise<number> {
    const queryResult = await client.query(
      'SELECT part_description_id FROM parts_descriptions WHERE general_part_name = $1 AND part_group_name = $2 AND specific_part_name = $3',
      [generalPartName, partGroupName, specificPartName],
    );
    return queryResult.rows.length > 0
      ? queryResult.rows[0].part_description_id
      : null;
  }

  async insertPartDescription(
    client: Client,
    generalPartName: string,
    partGroupName: string,
    specificPartName: string,
  ): Promise<number> {
    const queryResult = await client.query(
      'INSERT INTO parts_descriptions (general_part_name, part_group_name, specific_part_name) VALUES ($1, $2, $3) RETURNING part_description_id',
      [generalPartName, partGroupName, specificPartName],
    );
    return queryResult.rows[0].part_description_id;
  }

  async checkExistingCarBrand(
    client: Client,
    brandName: string,
  ): Promise<number> {
    const queryResult = await client.query(
      'SELECT car_brand_id FROM car_brands WHERE brand_name = $1',
      [brandName],
    );
    return queryResult.rows.length > 0
      ? queryResult.rows[0].car_brand_id
      : null;
  }

  async insertCarBrand(client: Client, brandName: string): Promise<number> {
    const queryResult = await client.query(
      'INSERT INTO car_brands (brand_name) VALUES ($1) RETURNING car_brand_id',
      [brandName],
    );
    return queryResult.rows[0].car_brand_id;
  }

  async checkExistingCarModel(
    client: Client,
    carBrandId: number,
    carModelName: string,
    carModelYear: string,
  ): Promise<number> {
    const queryResult = await client.query(
      'SELECT car_model_id FROM car_models WHERE car_brand_id = $1 AND name = $2 AND year = $3',
      [carBrandId, carModelName, carModelYear],
    );
    return queryResult.rows.length > 0
      ? queryResult.rows[0].car_model_id
      : null;
  }

  async insertCarModel(
    client: Client,
    carBrandId: number,
    carModelName: string,
    carModelYear: string,
  ): Promise<number> {
    const queryResult = await client.query(
      'INSERT INTO car_models (car_brand_id, name, year) VALUES ($1, $2, $3) RETURNING car_model_id',
      [carBrandId, carModelName, carModelYear],
    );
    return queryResult.rows[0].car_model_id;
  }

  async insertPart(
    client: Client,
    partNumber: string,
    partDescriptionId: number,
    status: string,
    carModelId: number,
  ): Promise<string> {
    const res = await client.query(
      'INSERT INTO parts (part_number, part_description_id, status, car_model_id) VALUES ($1, $2, $3, $4) returning part_id',
      [partNumber, partDescriptionId, status, carModelId],
    );
    return res.rows[0].part_id;
  }

  async generateCars(client: Client) {
    const carModelsAndBrands = {
      Toyota: [
        'Camry',
        'Corolla',
        'Rav4',
        'Highlander',
        'Tacoma',
        'Sienna',
        'Prius',
        '4Runner',
        'Tundra',
        'Avalon',
        'Yaris',
        'Supra',
        'C-HR',
        'Land Cruiser',
        'Mirai',
        '86',
        'Sequoia',
        'GR Supra',
        'GR86',
        'Corolla Cross',
      ],
      Honda: [
        'Accord',
        'Civic',
        'CR-V',
        'Pilot',
        'Odyssey',
        'Ridgeline',
        'Fit',
        'HR-V',
        'Insight',
        'Passport',
        'Clarity',
        'Accord Hybrid',
        'Civic Type R',
        'CR-V Hybrid',
        'Odyssey Hybrid',
        'Pilot Hybrid',
        'Ridgeline Hybrid',
        'City',
        'Jazz',
        'Breeze',
      ],
      Ford: [
        'F-150',
        'Escape',
        'Explorer',
        'Edge',
        'Mustang',
        'Ranger',
        'Fusion',
        'Expedition',
        'Focus',
        'Taurus',
        'Bronco Sport',
        'Maverick',
        'EcoSport',
        'Transit',
        'Bronco',
        'Escape Hybrid',
        'Explorer Hybrid',
        'Mach-E',
        'F-150 Hybrid',
        'Expedition Max',
      ],
      Chevrolet: [
        'Silverado',
        'Equinox',
        'Tahoe',
        'Malibu',
        'Camaro',
        'Traverse',
        'Colorado',
        'Impala',
        'Blazer',
        'Suburban',
        'Trailblazer',
        'Spark',
        'Trax',
        'Bolt EV',
        'Corvette',
        'Express Cargo',
        'Silverado 2500HD',
        'Silverado 3500HD',
        'Express Passenger',
        'Silverado 1500',
      ],
      Volkswagen: [
        'Jetta',
        'Tiguan',
        'Passat',
        'Atlas',
        'Golf',
        'Arteon',
        'Touareg',
        'ID.4',
        'Taos',
        'Atlas Cross Sport',
        'Golf GTI',
        'Golf R',
        'e-Golf',
        'Jetta GLI',
        'ID. Buzz',
        'ID. Space Vizzion',
        'ID. Buggy',
        'ID. Roomzz',
        'ID. Crozz',
        'ID. Vizzion',
      ],
      Nissan: [
        'Altima',
        'Rogue',
        'Sentra',
        'Frontier',
        'Pathfinder',
        'Titan',
        'Versa',
        'Murano',
        'Armada',
        'Kicks',
        'Maxima',
        '370Z',
        'NV Cargo',
        'NV Passenger',
        'NV200',
        'Rogue Sport',
        'Leaf',
        'GT-R',
        'Rogue Hybrid',
        'NV200 Taxi',
      ],
      BMW: [
        '3 Series',
        '5 Series',
        'X3',
        'X5',
        '7 Series',
        'X1',
        'X7',
        '4 Series',
        'X6',
        '2 Series',
        'i3',
        'i4',
        'M3',
        'M5',
        'M2',
        'M4',
        'X2',
        'X4',
        'Z4',
        '8 Series',
      ],
      'Mercedes-Benz': [
        'C-Class',
        'E-Class',
        'G-Class',
        'GLC',
        'S-Class',
        'GLE',
        'A-Class',
        'GLA',
        'CLA',
        'GLS',
        'Metris',
        'SLC',
        'GLB',
        'GLS',
        'EQC',
        'AMG GT',
        'Sprinter',
        'Maybach S',
        'G-Class',
        'EQS',
      ],
      Audi: [
        'A4',
        'Q5',
        'A6',
        'Q7',
        'Q3',
        'A5',
        'A3',
        'Q8',
        'A7',
        'e-tron',
        'S3',
        'S4',
        'S5',
        'SQ5',
        'S6',
        'S7',
        'RS 3',
        'RS 5',
        'RS 6',
        'TT',
      ],
      Hyundai: [
        'Sonata',
        'Tucson',
        'Santa Fe',
        'Elantra',
        'Kona',
        'Palisade',
        'Accent',
        'Venue',
        'Nexo',
        'Veloster',
        'IONIQ',
        'Elantra Hybrid',
        'Santa Fe Hybrid',
        'Sonata Hybrid',
        'Tucson Hybrid',
        'Kona Electric',
        'IONIQ Electric',
        'IONIQ 5',
        'IONIQ 6',
        'IONIQ 7',
      ],
    };

    for (const [carBrand, carModels] of Object.entries(carModelsAndBrands)) {
      const createdCarBrand = await client.query(
        `INSERT INTO car_brands (brand_name) VALUES ('${carBrand}') returning car_brand_id`,
      );
      let insertQuery = `INSERT INTO car_models (year, name, car_brand_id) VALUES`;
      carModels.forEach(
        (model) =>
          (insertQuery += `(${Math.floor(Math.random() * (2024 - 2000 + 1)) + 2000}, '${model}', ${createdCarBrand.rows[0].car_brand_id}), `),
      );

      await client.query(insertQuery.slice(0, -2));
    }
  }

  async readCsvFileParts(): Promise<any> {
    const client = await this.dbService.openConnection('root');
    await client.query(`BEGIN`);
    try {
      const partFilePath =
        '/Users/ostap/Desktop/labs/kursova/csvData/tecdocdatabase2Q2018/articles.csv';
      const partDescriptionFilePath =
        '/Users/ostap/Desktop/labs/kursova/csvData/tecdocdatabase2Q2018/products.csv';

      const partsResults: any[] = await this.readCsvPartsFile(partFilePath);
      const partDescriptionResults: any[] =
        await this.readCsvPartsDescriptionsFile(partDescriptionFilePath);
      const supplierData = await this.readCsvSupplierFile(
        '/Users/ostap/Desktop/labs/kursova/csvData/tecdocdatabase2Q2018/suppliers.csv',
      );

      await this.generateCars(client);
      for (const partData of partsResults) {
        const existingPart = await client.query(`
      select part_id from parts where part_number = '${partData.partNumber}'
        `);
        if (existingPart.rows[0]) continue;
        const supplier = supplierData.find(
          (supplier) => supplier.id === partData.oldSupplierId,
        );
        const savedSupplier = await client.query(`
        select supplier_id from suppliers where supplier_name = '${supplier.Description}';
      `);
        if (!savedSupplier.rows[0]) continue;

        const relatedPartDescription = partDescriptionResults.find(
          (partDesc) => partData.productId === partDesc.productId,
        );

        const existingPartDescription = await client.query(
          `select part_description_id from parts_descriptions where
        general_part_name='${relatedPartDescription.generalPartName}'
        and part_group_name ='${relatedPartDescription.partGroupName}'
        and specific_part_name ='${relatedPartDescription.specificPartName}'`,
        );
        let existingPartDescriptionId =
          existingPartDescription.rows[0]?.part_description_id;
        if (!existingPartDescriptionId) {
          const savedPartDescription =
            await client.query(`insert into parts_descriptions (general_part_name, part_group_name, specific_part_name)
        values ('${relatedPartDescription.generalPartName}', '${relatedPartDescription.partGroupName}', '${relatedPartDescription.specificPartName}')
        returning part_description_id`);
          existingPartDescriptionId =
            savedPartDescription.rows[0].part_description_id;
        }
        const createdPart = await client.query(`
      INSERT INTO parts (part_number, part_description_id, status, car_model_id)
      VALUES ('${partData.partNumber}', ${existingPartDescriptionId}, 'available', (SELECT car_model_id FROM car_models ORDER BY RANDOM() LIMIT 1))
      RETURNING part_id`);

        await client.query(`
        insert into parts_supplier (part_id, supplier_id) values (${createdPart.rows[0].part_id}, ${savedSupplier.rows[0].supplier_id});
      `);
      }
    } catch (error) {
      console.log(error);
      await client.query(`ROLLBACK`);
    }
    await client.query(`END`);
  }

  async readCsvFile(): Promise<any[]> {
    const client = await this.dbService.openConnection('root');
    const pathToFile =
      '/Users/ostap/Desktop/labs/kursova/csvData/tecdocdatabase2Q2018/suppliers.csv';

    const results: any[] = await this.readCsvSupplierFile(pathToFile);
    const createdSuppliers = [];
    for (const data of results) {
      const existingSupplier = await client.query(
        `SELECT supplier_name FROM suppliers WHERE supplier_name = $1`,
        [data.Description],
      );
      if (existingSupplier.rows[0]) {
        console.log(existingSupplier.rows[0]);
        return;
      }
      data.Description = data.Description.replace(/'/g, '');
      const user =
        await client.query(`insert into users (first_name, last_name, role, password, email)
                  values
                  ('supplier_${data.Description}','supplier_${data.Description}','supplier','supplier_password','${data.Description}@gmail.com')
                  returning user_id`);

      try {
        const createdSupplier =
          await client.query(`INSERT INTO suppliers (supplier_name, user_id) VALUES 
            ('${data.Description}', '${user.rows[0].user_id}')`);
        createdSuppliers.push({
          newSupplierId: createdSupplier.rows[0],
          oldSupplierId: data.id,
        });
      } catch (error) {
        console.log(
          error,
          `INSERT INTO suppliers (supplier_name, user_id) VALUES 
              ('${data.Description}', '${user.rows[0].user_id}')`,
        );
      }
    }
    console.log(createdSuppliers);
  }

  private async readCsvSupplierFile(pathToFile: string): Promise<any[]> {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(pathToFile)
        .pipe(
          csv({
            separator: '\t',
            newline: '\n',
            headers: [
              'DataVersion',
              'id',
              'internalID',
              'MatchCode',
              'NbrOfArticles',
              'HasNewVersionArticles',
              'Description',
            ],
          }),
        )
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private async readCsvPartsFile(pathToFile: string): Promise<any[]> {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(pathToFile)
        .pipe(
          csv({
            separator: '\t',
            newline: '\n',
            headers: [
              'id',
              'DataSupplierArticleNumber',
              'Supplier',
              'CurrentProduct',
              'NormalizedDescription',
              'HasLinkitems',
              'HasPassengerCar',
              'HasCommercialVehicle',
              'HasMotorbike',
              'HasEngine',
              'HasAxle',
              'HasCVManuID',
              'LotSize1',
              'LotSize2',
              'FlagMaterialCertification',
              'FlagSelfServicePacking',
              'FlagRemanufactured',
              'FlagAccessory',
              'IsPseudoArticle',
              'IsValid',
              'Description',
              'ArticleStateAttributeGroup',
              'ArticleStateAttributeType',
              'ArticleStateDisplayTitle',
              'ArticleStateDisplayValue',
              'PackingUnit',
              'QuantityPerPackingUnit',
            ],
          }),
        )
        .on('data', (data) =>
          results.push({
            partNumber: data.DataSupplierArticleNumber,
            productId: data.CurrentProduct,
            oldSupplierId: data.Supplier,
          }),
        )
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private async readCsvPartsDescriptionsFile(
    pathToFile: string,
  ): Promise<any[]> {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(pathToFile)
        .pipe(
          csv({
            separator: '\t',
            newline: '\n',
            headers: [
              'ID',
              'internalID',
              'NormalizedDescription',
              'AssemblyGroupDescription',
              'UsageDescription',
              'Description',
            ],
          }),
        )
        .on('data', (data) =>
          results.push({
            productId: data.ID,
            generalPartName: data.NormalizedDescription,
            partGroupName:
              data.AssemblyGroupDescription === ''
                ? 'Universal'
                : data.AssemblyGroupDescription,
            //   data.AssemblyGroupDescription ?? 'Universal',
            specificPartName: data.Description,
          }),
        )
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }
}
