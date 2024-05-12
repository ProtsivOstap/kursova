import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { PartOrder } from './dtos/create-order.dto';
import { GetOrdersDto } from './dtos/get-orders.dto';
import * as _ from 'lodash';
import { RoleEnum, User } from 'src/auth/types/user.type';

@Injectable()
export class OrdersService {
  constructor(private readonly dbService: DbService) {}

  async createOrder(data: PartOrder[], { user_id: userId, role }: User) {
    // add transaction
    const client = await this.dbService.openConnection(role); //change role
    await client.query('BEGIN');
    try {
      const createdOrderId = (
        await client.query(`
        insert into orders (user_id)
        values (${userId}) returning order_id;
    `)
      ).rows[0].order_id;
      for (const part of data) {
        const dataForPart: Record<string, any> = {};
        if (part.partNumber) {
          const existingPart = await client.query(`
        select part_id
        from parts where part_number = '${part.partNumber}'`);
          if (!existingPart.rows[0]) {
            throw Error('no such part number, try again');
          }
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
            and name = '${part.carBrand}' and year = ${part.carModelYear};
          `);
            if (possibleCarModel.rows[0]) {
              dataForPart.carModelId = possibleCarModel.rows[0].car_model_id;
            } else {
              const createdCarModel = await this.dbService.createCarModel(
                possibleCarBrand.rows[0].car_brand_id,
                part.carModelYear,
                part.carModelName,
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
              part.carModelYear,
              part.carModelName,
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
    } catch (error) {
      console.log(error);

      await client.query('ROLLBACK');
    }
    console.log('asddsakdsnkas');

    await client.query('END');
  }

  async assignToSupplier(
    supplierName: string,
    orderComponentId: string,
    user: User,
  ) {
    const client = await this.dbService.openConnection(user.role);
    await client.query(`
    update order_components
    set supplier_id = (select s.supplier_id from suppliers as s where supplier_name = '${supplierName}'),
    status = 'assigned_to_supplier'
    where order_component_id = ${orderComponentId}
    `);
    await client.end();
  }

  async assignToAdmin(user: User, orderId: number) {
    const client = await this.dbService.openConnection(user.role);
    //maybe add trigger to change status
    await client.query(`
      update orders set 
      admin_id = ${user.user_id},
      status = 'in_progress'
      where order_id=${orderId}
    `);
    await client.end();
  }

  async acceptComponentOrder(ocId: string, user: User, price?: string) {
    const client = await this.dbService.openConnection(user.role);
    if (user.role === RoleEnum.supplier) {
      if (!price) throw Error('no price provided');
      const updatePart = await client.query(`
        update parts
        set status = 'available'
        where parts.part_id = (select oc.part_id from order_components as oc where oc.order_component_id = ${ocId}) returning part_id;
      `);
      const userSupplier = await client.query(
        `select supplier_id from suppliers where  user_id = ${user.user_id}`,
      );
      const possibleRelationPartSupplier = await client.query(`
      select part_id from parts_supplier where part_id = ${updatePart.rows[0].part_id} 
      and supplier_id = ${userSupplier.rows[0].supplier_id}
      `);
      if (!possibleRelationPartSupplier.rows[0]) {
        await client.query(
          `insert into parts_supplier (part_id, supplier_id) VALUES 
          ('${updatePart.rows[0].part_id} ','${userSupplier.rows[0].supplier_id}');`,
        );
      }
      await client.query(`
      update order_components set
      price = '${price}',
      status = 'approved_supplier'
      where order_component_id = ${ocId}
     `);
    } else {
      await client.query(`
      update order_components set
      status = 'approved_user'
      where order_component_id = ${ocId}
     `);
    }
    await client.end();
  }

  async declineOrderAdmin(orderId: string, user: User) {
    const client = await this.dbService.openConnection(user.role); //change role
    await client.query(`
    update orders
    set status = 'declined'
    where order_id = ${orderId}
    `);
    await client.end();
  }

  async declineComponentOrder(ocId: string, user: User) {
    // change all order to declined
    const client = await this.dbService.openConnection(user.role); //change role
    if (user.role === RoleEnum.supplier) {
      await client.query(`
      update order_components set
      status = 'declined_supplier',
      supplier_id = null
      where order_component_id = ${ocId}
     `);
    } else {
      await client.query(`
      update order_components set
      status = 'declined_user',
      supplier_id = null
      where order_component_id = ${ocId}
     `);
    }
    await client.end();
  }

  private generatePartNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async getOrders(filters: GetOrdersDto, user: User) {
    const client = await this.dbService.openConnection(user.role); //change role

    // await client.query(`insert into users (first_name, last_name, role, password, email) VALUES
    // ('ostap2','protsiv2','user','user_password','ostap2@gmail.com');`);

    const selectMainQuery = `
      SELECT created_at AS "createdAt", 
      u1.last_name AS "clientLastName",
      u2.last_name AS "adminLastName", 
      o.status AS "status", 
      o.order_id AS "orderId"
    `;

    let query = `
        FROM orders AS o
        LEFT JOIN users AS u1 ON u1.user_id = o.user_id
        LEFT JOIN users AS u2 ON u2.user_id = o.admin_id
        LEFT JOIN order_components oc ON o.order_id = oc.order_id
        LEFT JOIN suppliers s ON s.supplier_id = oc.supplier_id
        LEFT JOIN parts p ON p.part_id = oc.part_id
        LEFT JOIN parts_descriptions pd ON pd.part_description_id = p.part_description_id
        WHERE 1=1`; // Always true to make it easier to add conditions
    if (user.role === RoleEnum.admin) {
      query += ` AND (o.admin_id = ${user.user_id} OR o.admin_id IS NULL)`;
    } else if (user.role === RoleEnum.user) {
      query += ` AND o.user_id = ${user.user_id}`;
    } else {
      const userSupplier = await client.query(
        `select supplier_id from suppliers where  user_id = ${user.user_id}`,
      );
      query += ` AND s.supplier_id = ${userSupplier.rows[0].supplier_id}`;
    }
    if (filters.generalPartName) {
      query += ` AND pd.general_part_name LIKE '%${filters.generalPartName}%'`;
    }
    if (filters.partGroupName) {
      query += ` AND pd.part_group_name LIKE '%${filters.partGroupName}%'`;
    }
    if (filters.specificPartName) {
      query += ` AND pd.specific_part_name LIKE '%${filters.specificPartName}%'`;
    }
    if (filters.supplierName) {
      query += ` AND s.supplier_name LIKE '%${filters.supplierName}%'`;
    }
    if (filters.partNumber) {
      query += ` AND p.part_number LIKE '%${filters.partNumber}%'`;
    }
    if (filters.status) {
      query += ` AND o.status = '${filters.status}'`;
    }
    if (filters.clientLastName) {
      query += ` AND u1.last_name LIKE '%${filters.clientLastName}%'`;
    }
    if (filters.adminLastName) {
      query += ` AND u2.last_name LIKE '%${filters.adminLastName}%'`;
    }

    query += ` GROUP BY u2.last_name, u1.last_name, created_at, o.status, o.order_id order by created_at desc`;
    const selectCountQuery = `
    SELECT COUNT(*) AS number
    FROM (
    SELECT
        o.order_id
        ${query}
        ) AS subquery
        `;
    const paginationQuery = `
    LIMIT ${filters.limit}
    OFFSET ${(filters.page - 1) * filters.limit};
    `;
    console.log(selectMainQuery + query);

    const orders = await client.query(
      selectMainQuery + query + paginationQuery,
    );

    const totalNumber = await client.query(selectCountQuery);
    await client.end();
    return { orders: orders.rows, totalNumber: totalNumber.rows[0].number };
  }

  async getOrderById(orderId: string, user: User) {
    const client = await this.dbService.openConnection(user.role);
    let selectMainQuery = `
    SELECT 
    o.created_at AS "createdAt",
    o.status AS "status",
    o.order_id AS "orderId",
    u1.last_name AS "clientLastName",
    u1.email as "clientEmail",
    u1.user_id as "clientUserId",
    u1.first_name as "clientFirstName",
    u2.last_name AS "adminLastName",
    u2.email as "adminEmail",
    u2.user_id as "adminUserId",
    u2.first_name as "adminFirstName",
    oc.order_component_id as "orderComponentId",
    oc.status as "orderComponentStatus",
    oc.price as "orderComponentPrice",
    p.part_number as "partNumber",
    p.status as "partStatus",
    pd.specific_part_name as "specificPartName",
    pd.part_group_name as "partGroupName",
    pd.general_part_name as "generalPartName",
    s.supplier_name as "supplierName",
    s.supplier_id as "supplierId"
    from orders o
    LEFT JOIN users AS u1 ON u1.user_id = o.user_id
    LEFT JOIN users AS u2 ON u2.user_id = o.admin_id
    LEFT JOIN order_components oc ON o.order_id = oc.order_id
    LEFT JOIN suppliers s ON s.supplier_id = oc.supplier_id
    LEFT JOIN parts p ON p.part_id = oc.part_id
    LEFT JOIN parts_descriptions pd ON pd.part_description_id = p.part_description_id
    where o.order_id = ${orderId}
  `;
    if (user.role === RoleEnum.supplier) {
      const userSupplier = await client.query(
        `select supplier_id from suppliers where  user_id = ${user.user_id}`,
      );
      selectMainQuery += `AND s.supplier_id = ${userSupplier.rows[0].supplier_id}`;
    }
    const res = (await client.query(selectMainQuery)).rows;

    const formattedRes = {
      createdAt: res[0].createdAt,
      status: res[0].status,
      orderId: res[0].orderId,
      client: {
        lastName: res[0].clientLastName,
        email: res[0].clientEmail,
        id: res[0].clientUserId,
        firstName: res[0].clientFirstName,
      },
      admin: {
        lastName: res[0].adminLastName,
        email: res[0].adminEmail,
        id: res[0].adminUserId,
        firstName: res[0].adminFirstName,
      },
      orderComponents: _.chain(res)
        .groupBy('orderComponentId')
        .map((orderComponents) =>
          _.map(orderComponents, (component) =>
            _.pick(component, [
              'specificPartName',
              'partGroupName',
              'generalPartName', //
              'supplierName', //y
              'supplierId', //no
              'orderComponentPrice', //no
              'orderComponentStatus', //
              'orderComponentId',
            ]),
          ),
        )
        .flatMap()
        .value(),
    };
    await client.end();
    return formattedRes;
  }
}
