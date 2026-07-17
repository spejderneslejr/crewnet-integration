import { Logger, Module } from '@nestjs/common';
import { SynchronizeMembersHandler } from './commands/sync/synchronize-members.handler';
import { CamposModule } from 'src/integration/campos/campos.module';
import { CrewnetModule } from 'src/integration/crewnet/crewnet.module';
import { SynchronizeWorkplacesHandler } from './commands/sync/synchronize-workplaces.handler';
import { SynchronizeWorkplaceAssignmentHandler } from './commands/sync/synchronize-workplace-assignment.handler';

@Module({
  imports: [CamposModule, CrewnetModule],
  providers: [
    Logger,
    SynchronizeMembersHandler,
    SynchronizeWorkplacesHandler,
    SynchronizeWorkplaceAssignmentHandler,
  ],
})
export class ApplicationModule {}
