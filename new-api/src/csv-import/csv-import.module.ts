import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { CsvImportController } from './csv-import.controller';
import { DbModule } from 'src/db/db.module';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    DbModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: '/Users/ostap/Desktop/labs/kursova/new-program/new-api/src/saved-csv-files',
    }),
  ],
  controllers: [CsvImportController],
  providers: [CsvImportService],
})
export class CsvImportModule {}
