import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { DbModule } from 'src/db/db.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [DbModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PartsController],
  providers: [PartsService],
})
export class PartsModule {}
