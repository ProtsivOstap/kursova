import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum, User } from 'src/auth/types/user.type';
import { UserDecorator } from 'src/auth/decorators/user.decorator';

@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  @Post('read')
  async readCsv(): Promise<any[]> {
    return this.csvImportService.readCsvFileParts();
  }

  @Post('parts/supplier')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(RoleEnum.supplier)
  @UseInterceptors(FileInterceptor('file'))
  async importPartsSupplier(
    @UserDecorator() user: User,
    @UploadedFile() file: any,
  ) {
    return this.csvImportService.loadPartsSupplier(user, file.path as string);
  }
}
