import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrewnetApiConfigService } from './crewnet-api-config.service';
import { CrewnetHttpConfigService } from './crewnet-http-config.service';

@Module({
  imports: [ConfigModule],
  providers: [CrewnetApiConfigService, CrewnetHttpConfigService],
  exports: [CrewnetApiConfigService, CrewnetHttpConfigService],
})
export class CrewnetHttpConfigModule {}
