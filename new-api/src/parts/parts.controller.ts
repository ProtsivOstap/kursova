import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PartsService } from './parts.service';
import { GetPartsDto } from './dtos/getParts.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum, User } from 'src/auth/types/user.type';
import { UserDecorator } from 'src/auth/decorators/user.decorator';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getParts(@Query() data: GetPartsDto, @UserDecorator() user: User) {
    return this.partsService.getParts(data, user);
  }

  @Get('file')
  async downloadFile(@Query() data: GetPartsDto) {
    return this.partsService.downloadFile(data);
  }

  @Get('/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.supplier, RoleEnum.user)
  async getPartById(@Param('id') partId: number, @UserDecorator() user: User) {
    return this.partsService.getPartById(partId, user);
  }
}
