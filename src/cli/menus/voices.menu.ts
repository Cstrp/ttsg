import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { VoiceInfo } from '../../common/types/voice-info.interface';
import { SettingsService } from '../../settings/settings.service';
import { VoiceCacheService } from '../../tts/voice-cache.service';

@Injectable()
export class VoicesMenu {
  constructor(
    private readonly voiceCacheService: VoiceCacheService,
    private readonly settingsService: SettingsService,
  ) {}

  async run(): Promise<void> {
    const { input } = await import('@inquirer/prompts');
    const language = await input({
      message: 'Filter by language code (leave empty for all):',
      default: this.settingsService.getDefaultLanguage(),
    });

    const spinner = await import('ora');
    const oraInstance = spinner.default('Loading voices...').start();
    const voices = await this.voiceCacheService.listVoices(
      language || undefined,
    );
    oraInstance.succeed(`Found ${voices.length} voices`);

    this.printVoiceTable(voices);

    const { confirm } = await import('@inquirer/prompts');
    const viewMore = await confirm({
      message: 'Filter by another language?',
      default: false,
    });
    if (viewMore) {
      await this.run();
    }
  }

  printVoiceTable(voices: VoiceInfo[]): void {
    console.log(chalk.bold('\nAvailable voices:\n'));
    console.log(
      chalk.dim(`${'Name'.padEnd(40)} ${'Languages'.padEnd(20)} Gender`),
    );
    for (const voice of voices.slice(0, 50)) {
      const langs = voice.languageCodes.join(', ').slice(0, 18);
      console.log(
        `${voice.name.padEnd(40)} ${langs.padEnd(20)} ${voice.ssmlGender}`,
      );
    }
    if (voices.length > 50) {
      console.log(chalk.dim(`\n  ... and ${voices.length - 50} more`));
    }
    console.log();
  }
}
