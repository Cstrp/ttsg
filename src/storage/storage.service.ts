import { OutputFileInfo } from '../common/types/output-file-info.interface';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '../config/configuration';
import { ConfigService } from '@nestjs/config';
import { basename, join, resolve } from 'path';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import {
  AudioFormat,
  AUDIO_FORMAT_EXTENSION_MAP,
} from '../common/types/audio-format.type';

@Injectable()
export class StorageService implements OnModuleInit {
  private outputDir: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.outputDir = this.configService.get('tts.outputDir', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureOutputDir();
  }

  getOutputDir(): string {
    return this.outputDir;
  }

  setOutputDir(dir: string): void {
    this.outputDir = resolve(dir);
  }

  async ensureOutputDir(): Promise<void> {
    await mkdir(this.outputDir, { recursive: true });
  }

  async saveAudio(
    buffer: Buffer,
    filename: string,
    format: AudioFormat,
  ): Promise<string> {
    await this.ensureOutputDir();
    const sanitized = this.sanitizeFilename(filename, format);
    const filePath = join(this.outputDir, sanitized);
    await writeFile(filePath, buffer);
    return filePath;
  }

  async readTextFile(filePath: string): Promise<string> {
    return readFile(filePath, 'utf-8');
  }

  async listFiles(): Promise<OutputFileInfo[]> {
    await this.ensureOutputDir();
    const entries = await readdir(this.outputDir);
    const files: OutputFileInfo[] = [];

    for (const entry of entries) {
      if (entry.startsWith('.')) {
        continue;
      }
      const filePath = join(this.outputDir, entry);
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        continue;
      }
      files.push({
        name: entry,
        path: filePath,
        size: fileStat.size,
        createdAt: fileStat.birthtime,
      });
    }

    return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteFile(name: string): Promise<void> {
    const filePath = this.resolvePath(name);
    await unlink(filePath);
  }

  resolvePath(name: string): string {
    const safeName = basename(name);
    return join(this.outputDir, safeName);
  }

  private sanitizeFilename(filename: string, format: AudioFormat): string {
    const base = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = AUDIO_FORMAT_EXTENSION_MAP[format];
    if (base.toLowerCase().endsWith(extension)) {
      return base;
    }
    const withoutExt = base.replace(/\.[^.]+$/, '');
    return `${withoutExt}${extension}`;
  }
}
