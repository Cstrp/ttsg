import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { AudioFormat } from '../../common/types/audio-format.type';
import {
  AUDIO_FORMATS,
  AUDIO_FORMAT_LABELS,
} from '../../common/constants/audio-formats.constant';
import { SettingsService } from '../../settings/settings.service';
import { StorageService } from '../../storage/storage.service';
import { VoiceCacheService } from '../../tts/voice-cache.service';

@Injectable()
export class SettingsMenu {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
    private readonly voiceCacheService: VoiceCacheService,
  ) {}

  async run(): Promise<void> {
    const { select } = await import('@inquirer/prompts');

    const setting = await select<
      | 'language'
      | 'voice'
      | 'format'
      | 'rate'
      | 'pitch'
      | 'concurrency'
      | 'outputDir'
      | 'back'
    >({
      message: 'Select setting to modify:',
      choices: [
        {
          name: `Language: ${this.settingsService.getDefaultLanguage()}`,
          value: 'language',
        },
        {
          name: `Voice: ${this.settingsService.getDefaultVoice() || '(default)'}`,
          value: 'voice',
        },
        {
          name: `Format: ${this.settingsService.getDefaultFormat()}`,
          value: 'format',
        },
        {
          name: `Speaking rate: ${this.settingsService.getSpeakingRate()}`,
          value: 'rate',
        },
        { name: `Pitch: ${this.settingsService.getPitch()}`, value: 'pitch' },
        {
          name: `Concurrency: ${this.settingsService.getConcurrency()}`,
          value: 'concurrency',
        },
        {
          name: `Output directory: ${this.settingsService.getOutputDir()}`,
          value: 'outputDir',
        },
        { name: 'Go back', value: 'back' },
      ],
    });

    if (setting === 'back') {
      return;
    }

    const {
      input,
      select: selectPrompt,
      search,
    } = await import('@inquirer/prompts');

    switch (setting) {
      case 'language': {
        const language = await input({
          message: 'Default language code:',
          default: this.settingsService.getDefaultLanguage(),
        });
        await this.settingsService.updateSettings({
          defaultLanguage: language,
        });
        this.voiceCacheService.invalidate();
        break;
      }
      case 'voice': {
        const voices = await this.voiceCacheService.listVoices(
          this.settingsService.getDefaultLanguage(),
        );
        const voice = await search({
          message: 'Select default voice:',
          source: (term) => {
            const query = (term ?? '').toLowerCase();
            return Promise.resolve(
              voices
                .filter((v) => v.name.toLowerCase().includes(query))
                .slice(0, 20)
                .map((v) => ({ name: v.name, value: v.name })),
            );
          },
        });
        await this.settingsService.updateSettings({ defaultVoice: voice });
        break;
      }
      case 'format': {
        const format = await selectPrompt<AudioFormat>({
          message: 'Default audio format:',
          choices: AUDIO_FORMATS.map((fmt) => ({
            name: AUDIO_FORMAT_LABELS[fmt],
            value: fmt,
          })),
          default: this.settingsService.getDefaultFormat(),
        });
        await this.settingsService.updateSettings({ defaultFormat: format });
        break;
      }
      case 'rate': {
        const rateStr = await input({
          message: 'Speaking rate (0.25 - 4.0):',
          default: String(this.settingsService.getSpeakingRate()),
        });
        const rate = parseFloat(rateStr);
        if (!isNaN(rate) && rate >= 0.25 && rate <= 4.0) {
          await this.settingsService.updateSettings({ speakingRate: rate });
        } else {
          console.log(chalk.red('Invalid speaking rate.'));
        }
        break;
      }
      case 'pitch': {
        const pitchStr = await input({
          message: 'Pitch (-20.0 - 20.0):',
          default: String(this.settingsService.getPitch()),
        });
        const pitch = parseFloat(pitchStr);
        if (!isNaN(pitch) && pitch >= -20.0 && pitch <= 20.0) {
          await this.settingsService.updateSettings({ pitch });
        } else {
          console.log(chalk.red('Invalid pitch.'));
        }
        break;
      }
      case 'concurrency': {
        const concStr = await input({
          message: 'Batch concurrency (1 - 20):',
          default: String(this.settingsService.getConcurrency()),
        });
        const concurrency = parseInt(concStr, 10);
        if (!isNaN(concurrency) && concurrency >= 1 && concurrency <= 20) {
          await this.settingsService.updateSettings({ concurrency });
        } else {
          console.log(chalk.red('Invalid concurrency.'));
        }
        break;
      }
      case 'outputDir': {
        const outputDir = await input({
          message: 'Output directory:',
          default: this.settingsService.getOutputDir(),
        });
        await this.settingsService.updateSettings({ outputDir });
        this.storageService.setOutputDir(outputDir);
        await this.storageService.ensureOutputDir();
        break;
      }
    }

    console.log(chalk.green('Settings updated.'));
  }
}
