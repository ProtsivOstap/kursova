import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DbService {
  private client: Client;
  async openConnection(userRole: string) {
    if (this.client) return this.client;
    let username;
    let password;

    if (userRole === 'admin') {
      username = 'admin';
      password = 'admin_password';
    } else if (userRole === 'user') {
      username = 'user';
      password = 'user_password';
    } else if (userRole === 'root') {
      username = 'postgres';
      password = 'password';
    } else if (userRole === 'supplier') {
      username = 'supplier';
      password = 'supplier_password';
    }

    this.client = new Client({
      host: 'localhost',
      port: 5432,
      user: username,
      password,
      database: 'kursova',
    });
    await this.client.connect();
    return this.client;
  }

  getClient(): Client {
    return this.client;
  }

  async createCarModel(brandId: number, year: number, modelName: string) {
    return this.client.query(`
    insert into car_models (year, name, car_brand_id) 
    VALUES (${year},'${modelName}',${brandId}) returning car_model_id;
    `);
  }
}
