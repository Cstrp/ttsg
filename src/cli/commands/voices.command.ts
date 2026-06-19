import { Injectable } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import ora from 'ora';
import { VoiceCacheService } from '../../tts/voice-cache.service';
import { VoicesMenu } from '../menus/voices.menu';

interface VoicesCommandOptions {
  language?: string;
}

@Command({
  name: 'voices',
  description: 'List available TTS voices',
})
@Injectable()
export class VoicesCommand extends CommandRunner {
  constructor(
    private readonly voiceCacheService: VoiceCacheService,
    private readonly voicesMenu: VoicesMenu,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: VoicesCommandOptions,
  ): Promise<void> {
    const spinner = ora('Loading voices...').start();
    const voices = await this.voiceCacheService.listVoices(options.language);
    spinner.succeed(`Found ${voices.length} voices`);
    this.voicesMenu.printVoiceTable(voices);
  }

  @Option({
    flags: '-l, --language <code>',
    description: 'Filter by language code',
  })
  parseLanguage(val: string): string {
    return val;
  }
}
