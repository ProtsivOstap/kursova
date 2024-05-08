import { Controller, Post } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';

@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  @Post('read')
  async readCsv(): Promise<any[]> {
    return this.csvImportService.readCsvFileParts();
  }
}
