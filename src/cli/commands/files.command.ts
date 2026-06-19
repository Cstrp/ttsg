import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { Command, CommandRunner, Option } from 'nest-commander';
import { StorageService } from '../../storage/storage.service';

interface FilesCommandOptions {
  delete?: string;
}

@Command({
  name: 'files',
  description: 'List or delete output files',
})
@Injectable()
export class FilesCommand extends CommandRunner {
  constructor(private readonly storageService: StorageService) {
    super();
  }

  async run(
    _passedParams: string[],
    options: FilesCommandOptions,
  ): Promise<void> {
    if (options.delete) {
      try {
        await this.storageService.deleteFile(options.delete);
        console.log(chalk.green(`Deleted ${options.delete}`));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(message));
        process.exit(1);
      }
      return;
    }

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
    console.log();
  }

  @Option({
    flags: '--delete <name>',
    description: 'Delete an output file by name',
  })
  parseDelete(val: string): string {
    return val;
  }
}
