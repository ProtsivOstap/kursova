import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PartOrder } from './dtos/create-order.dto';
import { GetOrdersDto } from './dtos/get-orders.dto';
import { UserDecorator } from 'src/auth/decorators/user.decorator';
import { RoleEnum, User } from 'src/auth/types/user.type';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AssignToSupplierDto } from './dtos/assign-to-supplier.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.user)
  async createOrder(@Body() data: PartOrder[], @UserDecorator() user: User) {
    return this.ordersService.createOrder(data, user);
  }

  @Get()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getOrders(@Query() filters: GetOrdersDto, @UserDecorator() user: User) {
    return this.ordersService.getOrders(filters, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getOrdersById(
    @Param('id') orderId: string,
    @UserDecorator() user: User,
  ) {
    return this.ordersService.getOrderById(orderId, user);
  }

  @Put('/:orderComponentId/accept')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.supplier, RoleEnum.user)
  async acceptComponentOrder(
    @Param('orderComponentId') orderComponentId: string,
    @UserDecorator() user: User,
    @Body() data: { price?: string },
  ) {
    return this.ordersService.acceptComponentOrder(
      orderComponentId,
      user,
      data.price,
    );
  }

  @Put('/:orderComponentId/decline')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.supplier, RoleEnum.user)
  async declineComponentOrder(
    @Param('orderComponentId') orderComponentId: string,
    @UserDecorator() user: User,
  ) {
    return this.ordersService.declineComponentOrder(orderComponentId, user);
  }

  @Put('/:orderComponentId/assign/supplier')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin)
  async assignToSupplier(
    @Body() data: AssignToSupplierDto,
    @Param('orderComponentId') ocId: string,
    @UserDecorator() user: User,
  ) {
    return this.ordersService.assignToSupplier(data.supplierName, ocId, user);
  }

  @Put('/:id/assign/admin')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin)
  async assignToAdmin(
    @UserDecorator() user: User,
    @Param('id') orderId: number,
  ) {
    return this.ordersService.assignToAdmin(user, orderId);
  }

  @Put('/:id/decline/admin')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin)
  async declineOrder(
    @Param('id') orderId: string,
    @UserDecorator() user: User,
  ) {
    return this.ordersService.declineOrderAdmin(orderId, user);
  }
}
