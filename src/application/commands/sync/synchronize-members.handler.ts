import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SynchronizeMembersCommand } from './synchronize-members.command';
import {
  CrewnetService,
  User,
  UserCreate,
  UserUpdate,
} from 'src/integration/crewnet/crewnet.service';
import {
  CamposMember,
  CamposService,
  CamposUserResult,
} from 'src/integration/campos/campos.service';
import { Logger } from '@nestjs/common';
import { generateCrewnetEmail } from 'src/utils/utils';

const MAX_MEMBERS_TO_ADD = 500; // Limit the number of members to add in one run to avoid overwhelming the Crewnet API

/**
 * Handler for synchronizing members between Campos and Crewnet.
 *
 * This command compares the members in both systems and ensures that they are consistent.
 * The synchronization process involves:
 * - Fetching all members from Campos and Crewnet.
 * - Comparing the lists to identify members that are missing in either system.
 * - Adding missing members to Crewnet and optionally removing extra members from Crewnet.
 * - Logging the results of the synchronization process.
 *
 * This handler can be invoked as part of a scheduled task or manually to ensure that the member data is up-to-date across both systems.
 */
@CommandHandler(SynchronizeMembersCommand)
export class SynchronizeMembersHandler implements ICommandHandler<SynchronizeMembersCommand> {
  constructor(
    private readonly camposService: CamposService,
    private readonly crewnetService: CrewnetService,
    private readonly logger: Logger,
  ) {}

  async execute(command: SynchronizeMembersCommand): Promise<void> {
    this.logger.log('Starting synchronization of members...');

    // Get all members from Campos
    const camposMembers = await this.camposService.getAllActiveMembers();
    this.logger.log(`Fetched ${camposMembers.length} members from Campos.`);

    // Get all members from Crewnet
    const crewnetMembers = await this.crewnetService.getAllMembers();
    this.logger.log(`Fetched ${crewnetMembers.length} members from Crewnet.`);

    // Compare and find differences
    const membersToAddToCrewnet = this.determineUsersToAdd(
      camposMembers,
      crewnetMembers,
    );
    this.logger.log(
      `Identified ${membersToAddToCrewnet.length} members to add to Crewnet.`,
    );

    // Add missing members to Crewnet
    await this.addMembersToCrewnet(membersToAddToCrewnet, command.dry);

    // Log results and changes made
    this.logger.log('Synchronization of members completed.');
  }

  private determineUsersToAdd(
    camposMembers: CamposMember[],
    crewnetMembers: User[],
  ): UserCreate[] {
    const toAdd: UserCreate[] = [];
    for (const member of camposMembers) {
      const crewnetEmail = generateCrewnetEmail(member.id);
      const existsInCrewnet = crewnetMembers.some(
        (cm) => cm.email === crewnetEmail,
      );
      if (!existsInCrewnet) {
        toAdd.push(this.mapCamposUserToCrewnetUser(member));
      }
    }

    return toAdd;
  }

  private mapCamposUserToCrewnetUser(member: CamposUserResult): UserCreate {
    const { firstName, lastName } = this.splitName(member.name);
    return {
      first_name: firstName,
      last_name: lastName,
      birthday: member.birthdate || '1900-01-01',
      email: generateCrewnetEmail(member.id),
    };
  }

  // Utility function to split full name into first names and last name.
  private splitName(fullName: string): { firstName: string; lastName: string } {
    const nameParts = fullName.trim().split(' ');
    let firstName = nameParts.slice(0, -1).join(' ') || '';
    let lastName = nameParts.slice(-1).join(' ') || '';

    return { firstName: firstName.trim(), lastName: lastName.trim() };
  }

  private async addMembersToCrewnet(
    members: UserCreate[],
    dryRun: boolean,
    maxMembersToAdd: number = MAX_MEMBERS_TO_ADD,
  ): Promise<void> {
    let loopCount = 0;
    for (const member of members) {
      // Limit the number of members added in one run to avoid overwhelming the Crewnet API
      if (loopCount >= maxMembersToAdd) {
        break;
      }

      if (!dryRun) {
        try {
          const userId = await this.crewnetService.userCreate(member);

          const updateUser: UserUpdate = {
            first_name: member.first_name,
            last_name: member.last_name,
            birthday: member.birthday,
            email: member.email,
          };
          await this.crewnetService.userUpdate(userId, updateUser);

          this.logger.log(
            `Added member '${member.first_name} ${member.last_name} (${member.email})' to Crewnet.`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to add member '${member.first_name} ${member.last_name} (${member.email})' to Crewnet: ${error.message}`,
          );
        }
      } else {
        this.logger.log(
          `[Dry Run] Would add member '${member.first_name} ${member.last_name} (${member.email})' to Crewnet.`,
        );
      }
      loopCount++;
    }
  }
}
