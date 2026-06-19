import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { AudioFormat } from '../common/types/audio-format.type';
import { AppConfig } from '../config/configuration';
import { StorageService } from '../storage/storage.service';
import { TtsSettings } from './settings.interface';

const SETTINGS_FILENAME = '.ttsg-settings.json';

@Injectable()
export class SettingsService implements OnModuleInit {
  private settings: TtsSettings;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly storageService: StorageService,
  ) {
    this.settings = this.buildDefaults();
  }

  async onModuleInit(): Promise<void> {
    await this.load();
    this.storageService.setOutputDir(this.settings.outputDir);
    await this.storageService.ensureOutputDir();
  }

  getSettings(): TtsSettings {
    return { ...this.settings };
  }

  getDefaultVoice(): string {
    return this.settings.defaultVoice;
  }

  getDefaultLanguage(): string {
    return this.settings.defaultLanguage;
  }

  getDefaultFormat(): AudioFormat {
    return this.settings.defaultFormat;
  }

  getSpeakingRate(): number {
    return this.settings.speakingRate;
  }

  getPitch(): number {
    return this.settings.pitch;
  }

  getConcurrency(): number {
    return this.settings.concurrency;
  }

  getOutputDir(): string {
    return this.settings.outputDir;
  }

  async updateSettings(partial: Partial<TtsSettings>): Promise<void> {
    this.settings = { ...this.settings, ...partial };
    await this.save();
  }

  private buildDefaults(): TtsSettings {
    const tts = this.configService.get('tts', { infer: true });
    return {
      defaultVoice: tts.defaultVoice,
      defaultLanguage: tts.defaultLanguage,
      defaultFormat: tts.defaultFormat,
      speakingRate: tts.speakingRate,
      pitch: tts.pitch,
      concurrency: tts.concurrency,
      outputDir: tts.outputDir,
    };
  }

  private getSettingsPath(): string {
    return join(this.settings.outputDir, SETTINGS_FILENAME);
  }

  private async load(): Promise<void> {
    const path = this.getSettingsPath();
    try {
      const content = await readFile(path, 'utf-8');
      const parsed = JSON.parse(content) as Partial<TtsSettings>;
      this.settings = { ...this.buildDefaults(), ...parsed };
    } catch {
      this.settings = this.buildDefaults();
    }
  }

  private async save(): Promise<void> {
    const path = this.getSettingsPath();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(this.settings, null, 2), 'utf-8');
  }
}
