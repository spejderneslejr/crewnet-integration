import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';
import { Interval, DateTime } from 'luxon';
import { SynchronizeMembersCommand } from './application/commands/sync/synchronize-members.command';
import { SynchronizeWorkplacesCommand } from './application/commands/sync/synchronize-workplaces.command';
import { SynchronizeWorkplaceAssignmentCommand } from './application/commands/sync/synchronize-workplace-assignment.command';

@Injectable()
export class ScheduledTasksService {
  private dryRun = false;
  constructor(
    private readonly logger: Logger,
    private readonly commandBus: CommandBus,
    configService: ConfigService,
  ) {
    if (configService.get('dry_run') === 'true') {
      this.dryRun = true;
    }
  }

  logDuration(job: string, start: DateTime) {
    const end = DateTime.now();
    const seconds = Interval.fromDateTimes(start, end).length('seconds');
    this.logger.log(
      `${job} completed in ${seconds} seconds (start:${start.toLocaleString(
        DateTime.TIME_24_WITH_SECONDS,
      )}, end: ${end.toLocaleString(DateTime.TIME_24_WITH_SECONDS)})`,
    );
  }

  /**
   * A scheduled task that runs every hour to synchronize members, workplaces, and workplace assignments.
   */
  @Cron('0 0 * * * *')
  async syncAllMembers() {
    const startTime = DateTime.now();
    this.logger.log('Scheduled run of syncAllMembers');

    if (this.dryRun) {
      this.logger.log('Dry run mode');
    }
    await this.commandBus.execute(new SynchronizeMembersCommand(this.dryRun));

    await this.commandBus.execute(
      new SynchronizeWorkplacesCommand(this.dryRun),
    );
    await this.commandBus.execute(
      new SynchronizeWorkplaceAssignmentCommand(this.dryRun),
    );

    this.logDuration('syncAllMembers', startTime);
  }
}
