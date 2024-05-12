import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { GetSuppliersDto } from './dtos/get-suppliers.dto';
import { User } from 'src/auth/types/user.type';

@Injectable()
export class SuppliersService {
  constructor(private readonly dbService: DbService) {}

  async getSuppliers(
    {
      partNumber,
      specificPartName,
      partGroupName,
      generalPartName,
      supplierName,
      limit = 10,
      page = 1,
      orderBy = 'supplierName',
    }: GetSuppliersDto,
    user: User,
  ) {
    const client = await this.dbService.openConnection(user.role); // change role
    const mainQuery = `
    SELECT
    s.supplier_name as "supplierName",
    s.supplier_id as "supplierId",
    (SELECT COUNT(*) FROM order_components oc WHERE oc.supplier_id = s.supplier_id AND oc.status = 'assigned_to_supplier') as "componentsToComplete",
    (SELECT COUNT(*) FROM order_components oc WHERE oc.supplier_id = s.supplier_id AND oc.status = 'approved_user') as "finishedComponents"`;

    let query = `
    FROM suppliers as s
    LEFT JOIN parts_supplier as ps ON ps.supplier_id = s.supplier_id
    LEFT JOIN parts as p ON ps.part_id = p.part_id
    LEFT JOIN parts_descriptions as pd ON pd.part_description_id = p.part_description_id
    LEFT JOIN order_components as oc ON oc.supplier_id = s.supplier_id
    WHERE 1=1
  `;

    if (partNumber) query += ` AND p.part_number LIKE '%${partNumber}%'`;
    if (specificPartName)
      query += ` AND pd.specific_part_name LIKE '%${specificPartName}%'`;
    if (partGroupName)
      query += ` AND pd.part_group_name LIKE '%${partGroupName}%'`;
    if (generalPartName)
      query += ` AND pd.general_part_name LIKE '%${generalPartName}%'`;
    if (supplierName) query += ` AND s.supplier_name LIKE '%${supplierName}%'`;

    query += ` GROUP BY s.supplier_name, s.supplier_id`;

    const countQuery = `
    SELECT COUNT(*) AS number
    FROM (
    SELECT
        s.supplier_id
        ${query}
        ) AS subquery
    `;

    const totalNumber = await client.query(countQuery);

    if (orderBy === 'componentsToComplete') {
      query += ` ORDER BY "componentsToComplete" DESC`;
    } else if (orderBy === 'finishedComponents') {
      query += ` ORDER BY "finishedComponents" DESC`;
    } else if (orderBy === 'supplierName') {
      query += ` ORDER BY "supplierName" ASC`;
    }

    query += ` LIMIT ${limit}
               OFFSET ${(page - 1) * limit}`;
    console.log(mainQuery + query);

    const suppliers = await client.query(mainQuery + query);
    await client.end();
    return {
      suppliers: suppliers.rows,
      totalNumber: totalNumber.rows[0].number,
    };
  }

  async getSupplierById(supplierId: string, user: User) {
    const client = await this.dbService.openConnection(user.role); // change role
    const supplierData = await client.query(
      `select s.supplier_name as "supplierName", s.supplier_id as "supplierId",
        u.email as "supplierEmail"
        from suppliers as s
        left join users as u on s.user_id = u.user_id
        where s.supplier_id = ${supplierId}`,
    );
    const supplierPartsData = await client.query(`
    select p.part_number as "partNumber",
    p.part_id as "partId",
    pd.specific_part_name as "specificPartName",
    pd.part_group_name as "partGroupName",
    pd.general_part_name as "generalPartName",
    cm.name as "carModelName",
    cm.year as "carModelYear",
    cb.brand_name as "carBrand"
    from parts_supplier ps
    inner join parts as p on ps.part_id = p.part_id
    inner join parts_descriptions as pd on pd.part_description_id = p.part_description_id
    inner join car_models as cm ON p.car_model_id = cm.car_model_id
    inner join car_brands as cb ON cb.car_brand_id = cm.car_brand_id
    where ps.supplier_id = ${supplierData.rows[0].supplierId};
    `);
    const supplierOrderComponentsData = await client.query(`
    select oc.status, oc.order_id as "orderId", oc.price as "price", oc.order_component_id as "orderComponentId",
    p.part_number as "partNumber",
    p.part_id as "partId",
    pd.specific_part_name as "specificPartName",
      pd.part_group_name as "partGroupName",
      pd.general_part_name as "generalPartName",
      cm.name as "carModelName",
      cm.year as "carModelYear",
      cb.brand_name as "carBrand"
    from order_components oc
    inner join parts as p on oc.part_id = p.part_id
    inner join parts_descriptions as pd on pd.part_description_id = p.part_description_id
    inner join car_models as cm ON p.car_model_id = cm.car_model_id
    inner join car_brands as cb ON cb.car_brand_id = cm.car_brand_id
    where oc.supplier_id=${supplierData.rows[0].supplierId}
    `);
    await client.end();
    return {
      ...supplierData.rows[0],
      parts: supplierPartsData.rows,
      orderComponents: supplierOrderComponentsData.rows,
    };
  }
}
