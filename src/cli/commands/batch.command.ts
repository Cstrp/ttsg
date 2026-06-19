import { Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import chalk from 'chalk';
import ora from 'ora';
import { readdir, readFile, stat } from 'fs/promises';
import { basename, extname, join } from 'path';
import { parseAudioFormat } from '../../common/types/audio-format.type';
import { SynthesisOptions } from '../../common/types/synthesis-options.interface';
import { SettingsService } from '../../settings/settings.service';
import { StorageService } from '../../storage/storage.service';
import { TtsService } from '../../tts/tts.service';

interface BatchCommandOptions {
  dir?: string;
  files?: string;
  format?: string;
  voice?: string;
  concurrency?: number;
}

@Command({
  name: 'batch',
  description: 'Batch synthesize text files in parallel',
})
@Injectable()
export class BatchCommand extends CommandRunner {
  constructor(
    private readonly ttsService: TtsService,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: BatchCommandOptions,
  ): Promise<void> {
    if (!options.dir && !options.files) {
      console.error(chalk.red('Error: Provide --dir or --files'));
      process.exit(1);
    }

    let filePaths: string[] = [];

    if (options.dir) {
      filePaths = await this.collectTextFiles(options.dir);
    } else if (options.files) {
      filePaths = options.files
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
    }

    if (filePaths.length === 0) {
      console.log(chalk.yellow('No text files found.'));
      return;
    }

    const format =
      (options.format ? parseAudioFormat(options.format) : undefined) ??
      this.settingsService.getDefaultFormat();

    const requests: SynthesisOptions[] = [];
    for (const filePath of filePaths) {
      const text = await readFile(filePath, 'utf-8');
      const baseName = basename(filePath, extname(filePath));
      requests.push({
        text,
        format,
        voice: options.voice ?? this.settingsService.getDefaultVoice(),
        languageCode: this.settingsService.getDefaultLanguage(),
        speakingRate: this.settingsService.getSpeakingRate(),
        pitch: this.settingsService.getPitch(),
        outputFilename: baseName,
      });
    }

    const spinner = ora(`Synthesizing ${requests.length} files...`).start();

    const results = await this.ttsService.synthesizeBatch(
      requests,
      options.concurrency ?? this.settingsService.getConcurrency(),
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

  private async collectTextFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir);
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);
      if (
        entryStat.isFile() &&
        ['.txt', '.md', '.text'].includes(extname(entry).toLowerCase())
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  @Option({
    flags: '-d, --dir <path>',
    description: 'Directory containing text files',
  })
  parseDir(val: string): string {
    return val;
  }

  @Option({
    flags: '--files <paths>',
    description: 'Comma-separated list of text file paths',
  })
  parseFiles(val: string): string {
    return val;
  }

  @Option({
    flags: '--format <format>',
    description: 'Audio format (MP3, WAV, OGG, M4A)',
  })
  parseFormat(val: string): string {
    return val;
  }

  @Option({
    flags: '-v, --voice <voice>',
    description: 'Voice name',
  })
  parseVoice(val: string): string {
    return val;
  }

  @Option({
    flags: '-c, --concurrency <n>',
    description: 'Parallel synthesis limit',
  })
  parseConcurrency(val: string): number {
    return parseInt(val, 10);
  }
}
