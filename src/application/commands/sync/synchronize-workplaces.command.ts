import { Command } from "@nestjs/cqrs";


export class SynchronizeWorkplacesCommand extends Command<void> {
    constructor(public readonly dry: boolean = false) {
        super();
    }
}
