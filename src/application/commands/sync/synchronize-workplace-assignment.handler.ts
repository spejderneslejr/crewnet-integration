import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CamposService } from 'src/integration/campos/campos.service';
import { CrewnetService } from 'src/integration/crewnet/crewnet.service';
import { SynchronizeWorkplaceAssignmentCommand } from './synchronize-workplace-assignment.command';
import { generateCrewnetEmail } from 'src/utils/utils';

@CommandHandler(SynchronizeWorkplaceAssignmentCommand)
export class SynchronizeWorkplaceAssignmentHandler implements ICommandHandler<SynchronizeWorkplaceAssignmentCommand> {
  constructor(
    private readonly camposService: CamposService,
    private readonly crewnetService: CrewnetService,
    private readonly logger: Logger,
  ) {}
  async execute(command: SynchronizeWorkplaceAssignmentCommand): Promise<void> {
    this.logger.log('Starting workplace assignment synchronization...');

    // Get all workplaces from Crewnet
    let workplaces = await this.crewnetService.getAllWorkplaces();

    // Get all users from Crewnet
    let crewnetMembers = await this.crewnetService.getAllMembers();

    const crewnetMembersNotInCampos = [];

    // For each unit, find the members that belong to that unit
    // For each workplace, find the members that belong to that workplace
    for (const workplace of workplaces) {
      const camposMembersInUnit = await this.camposService.getUsersByUnitName(
        workplace.name,
      );
      this.logger.log(
        `Found ${camposMembersInUnit.length} members in Campos for unit ${workplace.name}.`,
      );

      try {
        const crewnetMembersInWorkplace =
          await this.crewnetService.getUsersByWorkplaceId(workplace.id);
        this.logger.log(
          `Found ${crewnetMembersInWorkplace.length} members in Crewnet for workplace ${workplace.name}.`,
        );

        // Compare the lists and find the differences
        const camposMemberEmails = camposMembersInUnit.map((member) =>
          generateCrewnetEmail(member.id),
        );
        const crewnetMemberEmails = crewnetMembersInWorkplace.map(
          (member) => crewnetMembers.find((cm) => cm.id === member.id)?.email,
        );
        const membersToAdd: Array<{ crewnetId: number }> = [];
        const membersToRemove: Array<{ crewnetId: number }> = [];
        for (const email of camposMemberEmails) {
          if (!crewnetMemberEmails.includes(email)) {
            const memberToAdd = crewnetMembers.find((cm) => cm.email === email);
            if (memberToAdd) {
              membersToAdd.push({ crewnetId: memberToAdd.id });
            } else {
              this.logger.error(
                `Member with email ${email} found in Campos but not in Crewnet. This should not happen as members should have been synchronized first.`,
              );
            }
          }
        }

        for (const email of crewnetMemberEmails) {
          if (!camposMemberEmails.includes(email)) {
            const memberToRemove = crewnetMembers.find(
              (cm) => cm.email === email,
            );
            if (memberToRemove) {
              membersToRemove.push({ crewnetId: memberToRemove.id });
            } else {
              this.logger.error(
                `Member with email ${email} found in Crewnet but not in Campos. This should not happen as members should have been synchronized first.`,
              );
            }
          }
        }

        this.logger.log(
          `For workplace ${workplace.name} (${workplace.id}), identified ${membersToAdd.length} members to add and ${membersToRemove.length} members to remove.`,
        );

        // Add missing members to workplaces in Crewnet if not in dry run mode
        for (const member of membersToAdd) {
          if (!command.dry) {
            try {
              await this.crewnetService.addMemberToWorkplace(
                workplace.id,
                member.crewnetId,
              );
              this.logger.debug(
                `Added member with Crewnet ID ${member.crewnetId} to workplace ${workplace.name} (${workplace.id}).`,
              );
            } catch (error) {
              this.logger.error(
                `Failed to add member with Crewnet ID ${member.crewnetId} to workplace ${workplace.name} (${workplace.id}): ${error.message}`,
              );
            }
          } else {
            this.logger.log(
              `[Dry Run] Would add member with Crewnet ID ${member.crewnetId} to workplace ${workplace.name} (${workplace.id}).`,
            );
          }
        }

        // Add extra members to a list for logging purposes, but do not remove them from workplaces in Crewnet as this could lead to data loss if there are discrepancies between the systems. Instead, log the members that would be removed in a dry run or if there are discrepancies.
        for (const member of membersToRemove) {
          const memberEmail = crewnetMembers.find(
            (cm) => cm.id === member.crewnetId,
          )?.email;
          if (memberEmail) {
            crewnetMembersNotInCampos.push(memberEmail);
          }
        }

        // Remove extra members from workplaces in Crewnet
        // for (const member of membersToRemove) {
        //   if (!command.dry) {
        //     try {
        //       await this.crewnetService.removeMemberFromWorkplace(
        //         workplace.id,
        //         member.crewnetId,
        //       );
        //       this.logger.debug(
        //         `Removed member with Crewnet ID ${member.crewnetId} from workplace ${workplace.name} (${workplace.id}).`,
        //       );
        //     } catch (error) {
        //       this.logger.error(
        //         `Failed to remove member with Crewnet ID ${member.crewnetId} from workplace ${workplace.name} (${workplace.id}): ${error.message}`,
        //       );
        //     }
        //   } else {
        //     this.logger.log(
        //       `[Dry Run] Would remove member with Crewnet ID ${member.crewnetId} from workplace ${workplace.name} (${workplace.id}).`,
        //     );
        //   }
        // }
      } catch (error) {
        this.logger.error(
          `Error fetching members for workplace ${workplace.name} (ID: ${workplace.id}): ${error.message}`,
        );
        continue; // Skip to the next workplace
      }
    }

    // Log all members that are in Crewnet but not in Campos. One line per member. This indicates a discrepancy between the systems that should be investigated, but we will not remove these members from workplaces in Crewnet as this could lead to data loss if there are discrepancies between the systems.
    if (crewnetMembersNotInCampos.length > 0) {
      for (const email of crewnetMembersNotInCampos) {
        this.logger.warn(
          `Member with email ${email} is assigned to a workplace in Crewnet but does not exist in Campos. This indicates a discrepancy between the systems that should be investigated.`,
        );
      }
    } else {
      this.logger.log(
        'No members were found in Crewnet that are not in Campos. Workplace assignments are fully synchronized.',
      );
    }

    this.logger.log('Workplace assignment synchronization complete.');
  }
}
