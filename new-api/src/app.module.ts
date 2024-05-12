import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsvImportModule } from './csv-import/csv-import.module';
import { DbModule } from './db/db.module';
import { PartsModule } from './parts/parts.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [CsvImportModule, DbModule, PartsModule, OrdersModule, AuthModule, SuppliersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
