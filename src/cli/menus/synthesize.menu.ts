import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import ora from 'ora';
import { AudioFormat } from '../../common/types/audio-format.type';
import {
  AUDIO_FORMATS,
  AUDIO_FORMAT_LABELS,
} from '../../common/constants/audio-formats.constant';
import { SynthesisOptions } from '../../common/types/synthesis-options.interface';
import { SettingsService } from '../../settings/settings.service';
import { StorageService } from '../../storage/storage.service';
import { TtsService } from '../../tts/tts.service';
import { VoiceCacheService } from '../../tts/voice-cache.service';

@Injectable()
export class SynthesizeMenu {
  constructor(
    private readonly ttsService: TtsService,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
    private readonly voiceCacheService: VoiceCacheService,
  ) {}

  async runFromText(): Promise<void> {
    const { input } = await import('@inquirer/prompts');
    const text = await input({
      message: 'Enter text to synthesize:',
      validate: (value) =>
        value.trim().length > 0 ? true : 'Text is required',
    });
    await this.synthesize({ text });
  }

  async runFromFile(): Promise<void> {
    const { input } = await import('@inquirer/prompts');
    const filePath = await input({
      message: 'Enter path to text file:',
      validate: (value) =>
        value.trim().length > 0 ? true : 'Path is required',
    });
    const text = await this.storageService.readTextFile(filePath);
    await this.synthesize({ text });
  }

  async synthesize(options: SynthesisOptions): Promise<string | undefined> {
    const { input, select, search } = await import('@inquirer/prompts');

    const voices = await this.voiceCacheService.listVoices(
      options.languageCode ?? this.settingsService.getDefaultLanguage(),
    );

    const voice = await search({
      message: 'Select voice (type to search):',
      source: (term) => {
        const query = (term ?? '').toLowerCase();
        const filtered = voices
          .filter((v) => v.name.toLowerCase().includes(query))
          .slice(0, 25);
        return Promise.resolve([
          { name: 'Default voice', value: '' },
          ...filtered.map((v) => ({
            name: `${v.name} (${v.ssmlGender})`,
            value: v.name,
          })),
        ]);
      },
    });

    const format = await select<AudioFormat>({
      message: 'Select audio format:',
      choices: AUDIO_FORMATS.map((fmt) => ({
        name: AUDIO_FORMAT_LABELS[fmt],
        value: fmt,
      })),
      default: this.settingsService.getDefaultFormat(),
    });

    const filename = await input({
      message: 'Output filename (without extension):',
      default: `speech-${Date.now()}`,
    });

    const synthesisOptions: SynthesisOptions = {
      text: options.text,
      voice: voice || options.voice || this.settingsService.getDefaultVoice(),
      languageCode:
        options.languageCode ?? this.settingsService.getDefaultLanguage(),
      format,
      speakingRate:
        options.speakingRate ?? this.settingsService.getSpeakingRate(),
      pitch: options.pitch ?? this.settingsService.getPitch(),
      outputFilename: filename,
    };

    const spinner = ora('Synthesizing speech...').start();
    try {
      const buffer = await this.ttsService.synthesize(synthesisOptions);
      const path = await this.storageService.saveAudio(
        buffer,
        filename,
        format,
      );
      spinner.succeed(chalk.green(`Saved to ${path}`));
      return path;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`Synthesis failed: ${message}`));
      return undefined;
    }
  }
}
