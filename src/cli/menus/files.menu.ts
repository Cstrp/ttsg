import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class FilesMenu {
  constructor(private readonly storageService: StorageService) {}

  async run(): Promise<void> {
    const files = await this.storageService.listFiles();

    if (files.length === 0) {
      console.log(chalk.yellow('No output files found.'));
      return;
    }

    console.log(chalk.bold('\nOutput files:\n'));
    for (const file of files) {
      const sizeKb = (file.size / 1024).toFixed(1);
      console.log(
        `  ${chalk.cyan(file.name)}  ${chalk.dim(`${sizeKb} KB`)}  ${chalk.dim(file.createdAt.toLocaleString())}`,
      );
    }

    const { confirm, select } = await import('@inquirer/prompts');
    const action = await select<'back' | 'delete'>({
      message: 'What would you like to do?',
      choices: [
        { name: 'Go back', value: 'back' },
        { name: 'Delete a file', value: 'delete' },
      ],
    });

    if (action === 'delete') {
      const toDelete = await select({
        message: 'Select file to delete:',
        choices: files.map((f) => ({ name: f.name, value: f.name })),
      });
      const confirmed = await confirm({
        message: `Delete ${toDelete}?`,
        default: false,
      });
      if (confirmed) {
        await this.storageService.deleteFile(toDelete);
        console.log(chalk.green(`Deleted ${toDelete}`));
      }
    }
  }
}
