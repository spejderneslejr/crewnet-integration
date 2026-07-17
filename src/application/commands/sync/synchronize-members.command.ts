import { Command } from "@nestjs/cqrs";

/**
 * Command to synchronize members from CampOS to Crewnet.
 * 
 * This command can be executed with an optional "dry run" mode, 
 * which will log the actions that would be taken without actually performing any updates. 
 */
export class SynchronizeMembersCommand extends Command<void> {
    constructor(public readonly dry: boolean = false) {
        super();
    }
}
