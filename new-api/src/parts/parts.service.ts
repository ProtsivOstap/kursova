import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { GetPartsDto } from './dtos/getParts.dto';
import * as _ from 'lodash';
import { User } from 'src/auth/types/user.type';

@Injectable()
export class PartsService {
  constructor(private readonly dbService: DbService) {}

  async getParts(
    {
      limit,
      page,
      partNumber,
      specificPartName,
      partGroupName,
      generalPartName,
      carModelName,
      carModelYear,
      carBrand,
    }: GetPartsDto,
    user: User,
  ) {
    const client = await this.dbService.openConnection(user.role); //add role
    const mainQuery = `
SELECT
  p.part_number as "partNumber",
  p.part_id as "partId",
  pd.specific_part_name as "specificPartName",
  pd.part_group_name as "partGroupName",
  pd.general_part_name as "generalPartName",
  cm.name as "carModelName",
  cm.year as "carModelYear",
  cb.brand_name as "carBrand"
`;

    let query = `
FROM parts as p
LEFT JOIN parts_descriptions as pd ON p.part_description_id = pd.part_description_id
LEFT JOIN car_models as cm ON p.car_model_id = cm.car_model_id
LEFT JOIN car_brands as cb ON cb.car_brand_id = cm.car_brand_id
`;

    const filters = [];
    if (partNumber) filters.push(`p.part_number LIKE '%${partNumber}%'`);
    if (specificPartName)
      filters.push(`pd.specific_part_name LIKE '%${specificPartName}%'`);
    if (partGroupName)
      filters.push(`pd.part_group_name LIKE '%${partGroupName}%'`);
    if (generalPartName)
      filters.push(`pd.general_part_name LIKE '%${generalPartName}%'`);
    if (carModelName) filters.push(`cm.name LIKE '%${carModelName}%'`);
    if (carModelYear) filters.push(`cm.year = '${carModelYear}'`);
    if (carBrand) filters.push(`cb.brand_name LIKE '%${carBrand}%'`);
    filters.push(`p.status = 'available'`);
    if (filters.length > 0) {
      query += 'WHERE ' + filters.join(' AND ');
    }

    const countQuery = `SELECT COUNT(*) as number`;
    const totalNumber = await client.query(countQuery + query);

    query += ` ORDER BY part_number
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit};`;
    const foundParts = await client.query(mainQuery + query);
    console.log(mainQuery + query);
    await client.end();
    return {
      parts: foundParts.rows,
      totalNumber: totalNumber.rows[0].number,
    };
  }

  async downloadFile({
    partNumber,
    specificPartName,
    partGroupName,
    generalPartName,
    carModelName,
    carModelYear,
    carBrand,
  }: GetPartsDto) {
    const client = await this.dbService.openConnection('root'); //add role
    const mainQuery = `
    COPY (
SELECT
  p.part_number as "partNumber",
  p.part_id as "partId",
  pd.specific_part_name as "specificPartName",
  pd.part_group_name as "partGroupName",
  pd.general_part_name as "generalPartName",
  cm.name as "carModelName",
  cm.year as "carModelYear",
  cb.brand_name as "carBrand"
`;

    let query = `
FROM parts as p
LEFT JOIN parts_descriptions as pd ON p.part_description_id = pd.part_description_id
LEFT JOIN car_models as cm ON p.car_model_id = cm.car_model_id
LEFT JOIN car_brands as cb ON cb.car_brand_id = cm.car_brand_id
`;

    const filters = [];
    if (partNumber) filters.push(`p.part_number LIKE '%${partNumber}%'`);
    if (specificPartName)
      filters.push(`pd.specific_part_name LIKE '%${specificPartName}%'`);
    if (partGroupName)
      filters.push(`pd.part_group_name LIKE '%${partGroupName}%'`);
    if (generalPartName)
      filters.push(`pd.general_part_name LIKE '%${generalPartName}%'`);
    if (carModelName) filters.push(`cm.name LIKE '%${carModelName}%'`);
    if (carModelYear) filters.push(`cm.year LIKE '%${carModelYear}%'`);
    if (carBrand) filters.push(`cb.brand_name LIKE '%${carBrand}%'`);
    filters.push(`p.status = 'available'`);
    if (filters.length > 0) {
      query += 'WHERE ' + filters.join(' AND ');
    }

    query += ` ORDER BY part_number`;
    query += `) TO '/tmp/test.csv' WITH CSV HEADER;`;

    const foundParts = await client.query(mainQuery + query);
    await client.end();
    return {
      parts: foundParts.rows,
    };
  }

  async getPartById(partId: number, user: User) {
    const client = await this.dbService.openConnection(user.role); //add role
    const query = `
    select p.part_number as "partNumber", p.part_id as "partId",
    pd.specific_part_name as "specificPartName", pd.part_group_name as "partGroupName",
    pd.general_part_name as "generalPartName", cm.name as "carModelName", cm.year as "carModelYear",
    cb.brand_name as "carBrand", s.supplier_name as "supplierName", s.supplier_id as "supplierId"
    from parts as p
    left join parts_descriptions as pd on p.part_description_id = pd.part_description_id
    left join car_models as cm on p.car_model_id = cm.car_model_id
    left join car_brands as cb on cb.car_brand_id = cm.car_brand_id
    left join parts_supplier as ps on ps.part_id = p.part_id
    left join suppliers as s on s.supplier_id = ps.supplier_id
    where p.part_id = ${partId}`;
    const foundPartData = (await client.query(query)).rows;
    const suppliers = foundPartData.map((rowData) => {
      return {
        supplierId: rowData.supplierId,
        supplierName: rowData.supplierName,
      };
    });
    await client.end();
    return _.omit({ ...foundPartData[0], suppliers }, [
      'supplierName',
      'supplierId',
    ]);
  }
}
