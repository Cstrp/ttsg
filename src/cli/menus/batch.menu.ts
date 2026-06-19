import { readdir, readFile, stat } from 'fs/promises';
import { SynthesisOptions } from '../../common/types/synthesis-options.interface';
import { SettingsService } from '../../settings/settings.service';
import { StorageService } from '../../storage/storage.service';
import { TtsService } from '../../tts/tts.service';
import { basename, extname, join } from 'path';
import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import ora from 'ora';

@Injectable()
export class BatchMenu {
  constructor(
    private readonly ttsService: TtsService,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
  ) {}

  async run(): Promise<void> {
    const { select, checkbox } = await import('@inquirer/prompts');

    const mode = await select<'directory' | 'files'>({
      message: 'Batch input source:',
      choices: [
        { name: 'Directory of .txt files', value: 'directory' },
        { name: 'Select individual files', value: 'files' },
      ],
    });

    let filePaths: string[] = [];

    if (mode === 'directory') {
      const { input } = await import('@inquirer/prompts');
      const dir = await input({
        message: 'Enter directory path:',
        validate: (value) =>
          value.trim().length > 0 ? true : 'Directory is required',
      });
      filePaths = await this.collectTextFilesFromDir(dir);
    } else {
      const { input } = await import('@inquirer/prompts');
      const pathsInput = await input({
        message: 'Enter comma-separated file paths:',
      });
      filePaths = pathsInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }

    if (filePaths.length === 0) {
      console.log(chalk.yellow('No text files found.'));
      return;
    }

    if (mode === 'files') {
      const selected = await checkbox({
        message: 'Select files to synthesize:',
        choices: filePaths.map((path) => ({
          name: path,
          value: path,
          checked: true,
        })),
      });
      filePaths = selected;
    }

    await this.processBatch(filePaths);
  }

  async processBatch(filePaths: string[]): Promise<void> {
    const format = this.settingsService.getDefaultFormat();
    const requests: SynthesisOptions[] = [];

    for (const filePath of filePaths) {
      const text = await readFile(filePath, 'utf-8');
      const baseName = basename(filePath, extname(filePath));
      requests.push({
        text,
        format,
        voice: this.settingsService.getDefaultVoice(),
        languageCode: this.settingsService.getDefaultLanguage(),
        speakingRate: this.settingsService.getSpeakingRate(),
        pitch: this.settingsService.getPitch(),
        outputFilename: baseName,
      });
    }

    const spinner = ora(`Synthesizing ${requests.length} files...`).start();
    const results = await this.ttsService.synthesizeBatch(
      requests,
      this.settingsService.getConcurrency(),
    );

    let successCount = 0;
    for (const result of results) {
      if (result.success && result.buffer) {
        const filename = result.options.outputFilename ?? `batch-${Date.now()}`;
        const path = await this.storageService.saveAudio(
          result.buffer,
          filename,
          result.options.format ?? format,
        );
        successCount++;
        console.log(chalk.green(`  Saved: ${path}`));
      } else {
        console.log(
          chalk.red(
            `  Failed: ${result.options.outputFilename ?? 'unknown'} - ${result.error}`,
          ),
        );
      }
    }

    spinner.succeed(
      chalk.green(
        `Batch complete: ${successCount}/${results.length} succeeded`,
      ),
    );
  }

  private async collectTextFilesFromDir(dir: string): Promise<string[]> {
    const entries = await readdir(dir);
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);
      if (entryStat.isFile() && extname(entry).toLowerCase() === '.txt') {
        files.push(fullPath);
      }
    }
    return files;
  }
}
