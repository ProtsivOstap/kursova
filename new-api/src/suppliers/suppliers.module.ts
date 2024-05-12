import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { DbModule } from 'src/db/db.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [DbModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
