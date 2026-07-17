import { Command } from '@nestjs/cqrs';

/**
 * Command for synchronizing CampOS unit function assignments with Crewnet workplaces.
 */
export class SynchronizeWorkplaceAssignmentCommand extends Command<void> {
  constructor(public readonly dry: boolean) {
    super();
  }
}
