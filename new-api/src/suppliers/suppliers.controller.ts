import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { GetSuppliersDto } from './dtos/get-suppliers.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum, User } from 'src/auth/types/user.type';
import { UserDecorator } from 'src/auth/decorators/user.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getSuppliers(
    @Query() data: GetSuppliersDto,
    @UserDecorator() user: User,
  ) {
    return this.suppliersService.getSuppliers(data, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getSupplierById(
    @Param('id') supplierId: string,
    @UserDecorator() user: User,
  ) {
    return this.suppliersService.getSupplierById(supplierId, user);
  }
}
