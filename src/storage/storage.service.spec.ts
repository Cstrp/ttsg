import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { AppConfig } from '../config/configuration';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let tempDir: string;

  const mockConfig: AppConfig = {
    googleApplicationCredentials: './credentials/key.json',
    googleCloudProject: 'test-project',
    tts: {
      outputDir: '',
      defaultLanguage: 'en-US',
      defaultVoice: '',
      defaultFormat: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      concurrency: 3,
    },
  };

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ttsg-storage-'));
    mockConfig.tts.outputDir = tempDir;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'tts.outputDir') return mockConfig.tts.outputDir;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('saves audio with correct extension', async () => {
    const buffer = Buffer.from('test-audio');
    const path = await service.saveAudio(buffer, 'hello', 'MP3');
    expect(path).toContain('hello.mp3');
    const content = await readFile(path);
    expect(content).toEqual(buffer);
  });

  it('lists saved files', async () => {
    await service.saveAudio(Buffer.from('a'), 'file1', 'MP3');
    await service.saveAudio(Buffer.from('b'), 'file2', 'WAV');
    const files = await service.listFiles();
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.name).sort()).toEqual(['file1.mp3', 'file2.wav']);
  });

  it('deletes a file by name', async () => {
    await service.saveAudio(Buffer.from('a'), 'remove-me', 'MP3');
    await service.deleteFile('remove-me.mp3');
    const files = await service.listFiles();
    expect(files).toHaveLength(0);
  });

  it('sanitizes unsafe filenames', async () => {
    const path = await service.saveAudio(
      Buffer.from('x'),
      '../../etc/passwd',
      'OGG',
    );
    expect(path).toContain('passwd.ogg');
    expect(path.startsWith(tempDir)).toBe(true);
  });
});
