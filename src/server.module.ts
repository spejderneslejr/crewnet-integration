import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CamposModule } from './integration/campos/campos.module';
import { CrewnetModule } from './integration/crewnet/crewnet.module';
import { EndpointsController } from './endpoints/endpoints.controller';
import { EndpointsModule } from './endpoints/endpoints.module';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    CqrsModule.forRoot(),
    ScheduleModule.forRoot(),
    CrewnetModule,
    CamposModule,
    EndpointsModule,

    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [Logger, ScheduledTasksService, EndpointsController],
})
export class ServerModule {}
