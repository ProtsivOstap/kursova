import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DbModule } from '../db/db.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [DbModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
