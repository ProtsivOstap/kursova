import { Controller, Get, Param, Query } from '@nestjs/common';
import { PartsService } from './parts.service';
import { GetPartsDto } from './dtos/getParts.dto';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  async getParts(@Query() data: GetPartsDto) {
    return this.partsService.getParts(data);
  }

  @Get('/:id')
  async getPartById(@Param('id') partId: number) {
    return this.partsService.getPartById(partId);
  }
}
