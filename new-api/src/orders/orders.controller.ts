import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PartOrder } from './dtos/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() data: PartOrder[]) {
    return this.ordersService.createOrder(data);
  }
}
