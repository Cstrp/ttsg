import { Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import chalk from 'chalk';
import ora from 'ora';
import { parseAudioFormat } from '../../common/types/audio-format.type';
import { SettingsService } from '../../settings/settings.service';
import { StorageService } from '../../storage/storage.service';
import { TtsService } from '../../tts/tts.service';

interface SynthesizeCommandOptions {
  text?: string;
  file?: string;
  format?: string;
  voice?: string;
  language?: string;
  output?: string;
  rate?: number;
  pitch?: number;
}

@Command({
  name: 'synthesize',
  description: 'Synthesize speech from text or file',
})
@Injectable()
export class SynthesizeCommand extends CommandRunner {
  constructor(
    private readonly ttsService: TtsService,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: SynthesizeCommandOptions,
  ): Promise<void> {
    if (!options.text && !options.file) {
      console.error(chalk.red('Error: Provide --text or --file'));
      process.exit(1);
    }

    let text: string;
    if (options.file) {
      text = await this.storageService.readTextFile(options.file);
    } else {
      text = options.text ?? '';
    }

    const format =
      (options.format ? parseAudioFormat(options.format) : undefined) ??
      this.settingsService.getDefaultFormat();

    const spinner = ora('Synthesizing speech...').start();
    try {
      const buffer = await this.ttsService.synthesize({
        text,
        voice: options.voice ?? this.settingsService.getDefaultVoice(),
        languageCode:
          options.language ?? this.settingsService.getDefaultLanguage(),
        format,
        speakingRate: options.rate ?? this.settingsService.getSpeakingRate(),
        pitch: options.pitch ?? this.settingsService.getPitch(),
      });

      const filename = options.output ?? `speech-${Date.now()}`;
      const path = await this.storageService.saveAudio(
        buffer,
        filename,
        format,
      );
      spinner.succeed(chalk.green(`Saved to ${path}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`Synthesis failed: ${message}`));
      process.exit(1);
    }
  }

  @Option({
    flags: '-t, --text <text>',
    description: 'Text to synthesize',
  })
  parseText(val: string): string {
    return val;
  }

  @Option({
    flags: '-f, --file <path>',
    description: 'Path to text file',
  })
  parseFile(val: string): string {
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
    flags: '-l, --language <code>',
    description: 'Language code',
  })
  parseLanguage(val: string): string {
    return val;
  }

  @Option({
    flags: '-o, --output <filename>',
    description: 'Output filename (without extension)',
  })
  parseOutput(val: string): string {
    return val;
  }

  @Option({
    flags: '--rate <rate>',
    description: 'Speaking rate (0.25-4.0)',
  })
  parseRate(val: string): number {
    return parseFloat(val);
  }

  @Option({
    flags: '--pitch <pitch>',
    description: 'Pitch (-20.0 to 20.0)',
  })
  parsePitch(val: string): number {
    return parseFloat(val);
  }
}
