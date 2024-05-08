import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { PartOrder } from './dtos/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly dbService: DbService) {}

  async createOrder(data: PartOrder[], userId: number = 13092) {
    // add transaction
    const client = await this.dbService.openConnection('root'); //change role
    const createdOrderId = (
      await client.query(`
        insert into orders (user_id)
        values (${userId}) returning order_id;
    `)
    ).rows[0].order_id;
    for (const part of data) {
      const dataForPart: Record<string, any> = {};
      if (part.partCode) {
        const existingPart = await client.query(`
        select part_id
        from parts where part_number = '${part.partCode}'`);
        dataForPart.partId = existingPart.rows[0].part_id;
      } else {
        const possibleDescription = await client.query(`
        select part_description_id as "partDescriptionId"
        from parts_descriptions
            where general_part_name='${part.generalPartName}'
              and specific_part_name='${part.specificPartName}'
                and part_group_name = '${part.partGroupName}';
        `);
        if (!possibleDescription.rows[0]) {
          const createdDescription = await client.query(`
            insert into parts_descriptions (general_part_name, part_group_name, specific_part_name)
            values ('${part.generalPartName}', '${part.partGroupName}', '${part.specificPartName}') returning part_description_id;
        `);
          dataForPart.partDescriptionId =
            createdDescription.rows[0].part_description_id;
        } else {
          dataForPart.partDescriptionId =
            possibleDescription.rows[0].partDescriptionId;
        }

        const possibleCarBrand = await client.query(`
        select car_brand_id
        from car_brands
        where brand_name='${part.carBrand}';
        `);
        if (possibleCarBrand.rows[0]) {
          dataForPart.carBrandId = possibleCarBrand.rows[0].car_brand_id;

          const possibleCarModel = await client.query(`
            select car_model_id
            from car_models where car_brand_id=${possibleCarBrand.rows[0].car_brand_id} 
            and name = '${part.carBrand}' and year = ${part.carYear};
          `);
          if (possibleCarModel.rows[0]) {
            dataForPart.carModelId = possibleCarModel.rows[0].car_model_id;
          } else {
            const createdCarModel = await this.dbService.createCarModel(
              possibleCarBrand.rows[0].car_brand_id,
              part.carYear,
              part.carModel,
            );
            dataForPart.carModelId = createdCarModel.rows[0].car_model_id;
          }
        } else {
          const createdCarBrand = await client.query(`
            insert into car_brands (brand_name)
            values ('${part.carBrand}') returning car_brand_id;
        `);
          dataForPart.carBrandId = createdCarBrand.rows[0].car_brand_id;

          const createdCarModel = await this.dbService.createCarModel(
            createdCarBrand.rows[0].car_brand_id,
            part.carYear,
            part.carModel,
          );
          dataForPart.carModelId = createdCarModel.rows[0].car_model_id;
        }
        const generatedPartCode = this.generatePartNumber();
        const createdPart = await client.query(`
            insert into parts (part_number, part_description_id, status, car_model_id) 
            VALUES ('${generatedPartCode}',${dataForPart.partDescriptionId},'requested',${dataForPart.carModelId}) returning part_id;
        `);
        dataForPart.partId = createdPart.rows[0].part_id;
      }

      await client.query(`
        insert into order_components (part_id, order_id)
        VALUES (${dataForPart.partId}, ${createdOrderId})
      `);
    }
  }

  async assignToSupplier(
    adminId: number,
    orderComponentId: number,
    supplierId: number,
  ) {}

  private async generatePartNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }
}
