import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SynchronizeWorkplacesCommand } from './synchronize-workplaces.command';
import { Logger } from '@nestjs/common/services';
import {
  CrewnetService,
  SyncWorkplace,
} from 'src/integration/crewnet/crewnet.service';
import {
  CamposService,
  UnitResult,
} from 'src/integration/campos/campos.service';

const VALID_UNIT_TYPES = ['Område', 'Udvalg', 'Team', 'Arbejdsgruppe'];

/**
 * Handler for synchronizing workplaces between Campos and Crewnet.
 *
 * This command compares the organizational units in Campos with the workplaces in Crewnet and ensures that they are consistent.
 * The synchronization process involves:
 * - Fetching all organizational units from Campos and filtering by valid types.
 * - Fetching all workplaces from Crewnet.
 * - Comparing the lists to identify workplaces that are missing in Crewnet.
 * - Adding missing workplaces to Crewnet.
 */
@CommandHandler(SynchronizeWorkplacesCommand)
export class SynchronizeWorkplacesHandler implements ICommandHandler<SynchronizeWorkplacesCommand> {
  constructor(
    private readonly camposService: CamposService,
    private readonly crewnetService: CrewnetService,
    private readonly logger: Logger,
  ) {}

  async execute(command: SynchronizeWorkplacesCommand): Promise<void> {
    this.logger.log('Starting workplace synchronization...');

    // Get all units from Campos and filter by valid types
    const units = await this.camposService.getAllActiveUnits(VALID_UNIT_TYPES);

    this.logger.log(`Fetched ${units.length} units from Campos.`);

    // Get all workplaces from Crewnet
    const workplaces = await this.crewnetService.getAllWorkplaces();

    this.logger.log(`Fetched ${workplaces.length} workplaces from Crewnet.`);

    // Compare and find differences
    const workplacesToAdd = this.determineWorkplacesToAdd(units, workplaces);
    this.logger.log(
      `Identified ${workplacesToAdd.length} workplaces to add to Crewnet.`,
    );

    // Add missing workplaces to Crewnet
    await this.addWorkplacesToCrewnet(workplacesToAdd, command.dry);

    // Log extra workplaces in Crewnet that are not in Campos, but do not remove them as they might be used for other purposes
    this.warnAboutExtraWorkplaces(workplaces, units);

    this.logger.log('Workplace synchronization complete.');
  }

  private determineWorkplacesToAdd(
    camposUnits: UnitResult[],
    crewnetWorkplaces: SyncWorkplace[],
  ): UnitResult[] {
    return camposUnits.filter((unit) => {
      const existsInCrewnet = crewnetWorkplaces.some(
        (workplace) => workplace.name === unit.name,
      );
      return !existsInCrewnet;
    });
  }

  private async addWorkplacesToCrewnet(
    workplaces: UnitResult[],
    dryRun: boolean,
  ) {
    for (const unit of workplaces) {
      if (dryRun) {
        this.logger.log(`[Dry Run] Would add workplace: ${unit.name}`);
      } else {
        try {
          await this.crewnetService.workplaceCreate(unit.name);
          this.logger.log(`Added workplace: ${unit.name}`);
        } catch (error) {
          this.logger.error(`Failed to add workplace: ${unit.name}`, error);
        }
      }
    }
  }

  private warnAboutExtraWorkplaces(
    workplaces: SyncWorkplace[],
    camposUnits: UnitResult[],
  ) {
    const extraWorkplaces = workplaces.filter((workplace) => {
      const existsInCampos = camposUnits.some(
        (unit) => unit.name === workplace.name,
      );
      return !existsInCampos;
    });

    if (extraWorkplaces.length > 0) {
      this.logger.warn(
        `There are ${extraWorkplaces.length} workplaces in Crewnet that do not have a corresponding unit in Campos. These will not be removed: ${extraWorkplaces
          .map((w) => `${w.name} (${w.id})`)
          .join(', ')}`,
      );
    }
  }
}
