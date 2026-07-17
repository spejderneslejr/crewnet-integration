import { Logger, Module } from '@nestjs/common';
import { CamposService } from './campos.service';
import { CamposApiConfigService } from './campos-api-config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CamposService, CamposApiConfigService, Logger],
  exports: [CamposService],
  controllers: [],
})
export class CamposModule {}
