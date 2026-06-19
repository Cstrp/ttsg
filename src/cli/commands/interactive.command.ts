import { Injectable } from '@nestjs/common';
import { DefaultCommand, CommandRunner } from 'nest-commander';
import { CliMenuService } from '../menus/cli-menu.service';

@DefaultCommand({
  name: 'interactive',
  description: 'Launch interactive TUI (default)',
})
@Injectable()
export class InteractiveCommand extends CommandRunner {
  constructor(private readonly cliMenuService: CliMenuService) {
    super();
  }

  async run(): Promise<void> {
    await this.cliMenuService.run();
  }
}
