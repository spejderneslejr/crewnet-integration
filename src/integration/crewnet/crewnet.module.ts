import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { CrewnetService } from './crewnet.service';
import { CrewnetHttpConfigService } from './crewnet-http-config.service';
import { CrewnetHttpConfigModule } from './crewnet-http-config.module';

@Module({
  imports: [
    CrewnetHttpConfigModule,
    HttpModule.registerAsync({
      imports: [CrewnetHttpConfigModule],
      useExisting: CrewnetHttpConfigService,
    }),
  ],
  providers: [CrewnetService, Logger],
  exports: [CrewnetService],
})
export class CrewnetModule {}
