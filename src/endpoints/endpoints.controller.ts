import { Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CamposService } from 'src/integration/campos/campos.service';
import { CrewnetService } from 'src/integration/crewnet/crewnet.service';
import { CommandBus } from '@nestjs/cqrs';
import { SynchronizeMembersCommand } from 'src/application/commands/sync/synchronize-members.command';
import { SynchronizeWorkplacesCommand } from 'src/application/commands/sync/synchronize-workplaces.command';
import { SynchronizeWorkplaceAssignmentCommand } from 'src/application/commands/sync/synchronize-workplace-assignment.command';

@Controller()
export class EndpointsController {
  dryRun: boolean;
  constructor(
    private readonly camposService: CamposService,
    private readonly crewnet: CrewnetService,
    private readonly commandBus: CommandBus,
    configService: ConfigService,
  ) {
    if (configService.get('dry_run') === 'true') {
      this.dryRun = true;
    }
  }

  @Get('/health')
  async healthCheck(): Promise<any> {
    // Check if we can connect to Campos and Crewnet
    let camposHealth = 'ok';
    let crewnetHealth = 'ok';

    try {
      await this.camposService.getAllActiveMembers();
    } catch (error) {
      camposHealth = 'error';
    }

    try {
      await this.crewnet.getAllMembers();
    } catch (error) {
      crewnetHealth = 'error';
    }

    const result = {
      isDryRun: this.dryRun,
      campos: {
        status: camposHealth,
      },
      crewnet: {
        status: crewnetHealth,
      },
    };

    return result;
  }

  @Post('/sync/members')
  async synchronizeMembers(): Promise<void> {
    await this.commandBus.execute(new SynchronizeMembersCommand(this.dryRun));
  }

  @Post('/sync/workplaces')
  async synchronizeWorkplaces(): Promise<any> {
    await this.commandBus.execute(
      new SynchronizeWorkplacesCommand(this.dryRun),
    );
  }

  @Post('/sync/workplace-assignments')
  async synchronizeWorkplaceAssignments(): Promise<any> {
    await this.commandBus.execute(
      new SynchronizeWorkplaceAssignmentCommand(this.dryRun),
    );
  }

  @Post('/sync/all')
  async synchronizeAll(): Promise<any> {
    await this.commandBus.execute(new SynchronizeMembersCommand(this.dryRun));

    await this.commandBus.execute(
      new SynchronizeWorkplacesCommand(this.dryRun),
    );
    await this.commandBus.execute(
      new SynchronizeWorkplaceAssignmentCommand(this.dryRun),
    );
  }
}
