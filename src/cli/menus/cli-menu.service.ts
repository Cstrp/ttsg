import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { BatchMenu } from './batch.menu';
import { FilesMenu } from './files.menu';
import { SettingsMenu } from './settings.menu';
import { SynthesizeMenu } from './synthesize.menu';
import { VoicesMenu } from './voices.menu';

type MenuAction =
  | 'synthesize-text'
  | 'synthesize-file'
  | 'batch'
  | 'files'
  | 'settings'
  | 'voices'
  | 'exit';

@Injectable()
export class CliMenuService {
  constructor(
    private readonly synthesizeMenu: SynthesizeMenu,
    private readonly batchMenu: BatchMenu,
    private readonly filesMenu: FilesMenu,
    private readonly settingsMenu: SettingsMenu,
    private readonly voicesMenu: VoicesMenu,
  ) {}

  async run(): Promise<void> {
    console.log(chalk.bold.blue('\n  Google Cloud Text-to-Speech CLI\n'));

    let running = true;
    while (running) {
      const { select } = await import('@inquirer/prompts');
      const action = await select<MenuAction>({
        message: 'What would you like to do?',
        choices: [
          { name: 'Synthesize text', value: 'synthesize-text' },
          { name: 'Synthesize from file', value: 'synthesize-file' },
          { name: 'Batch synthesize', value: 'batch' },
          { name: 'Browse output files', value: 'files' },
          { name: 'Settings', value: 'settings' },
          { name: 'List voices', value: 'voices' },
          { name: 'Exit', value: 'exit' },
        ],
      });

      switch (action) {
        case 'synthesize-text':
          await this.synthesizeMenu.runFromText();
          break;
        case 'synthesize-file':
          await this.synthesizeMenu.runFromFile();
          break;
        case 'batch':
          await this.batchMenu.run();
          break;
        case 'files':
          await this.filesMenu.run();
          break;
        case 'settings':
          await this.settingsMenu.run();
          break;
        case 'voices':
          await this.voicesMenu.run();
          break;
        case 'exit':
          running = false;
          break;
      }
    }

    console.log(chalk.dim('Seeya later, alligator!'));
    process.exit(0);
  }
}
