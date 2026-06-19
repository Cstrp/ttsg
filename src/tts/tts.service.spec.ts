import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisOptions } from '../common/types/synthesis-options.interface';
import { AppConfig } from '../config/configuration';
import { GOOGLE_TTS_CLIENT } from './google-tts.constants';
import { TtsService } from './tts.service';

describe('TtsService', () => {
  let service: TtsService;
  let mockClient: {
    listVoices: jest.Mock;
    synthesizeSpeech: jest.Mock;
  };

  const mockConfig: AppConfig = {
    googleApplicationCredentials: './credentials/key.json',
    googleCloudProject: 'test-project',
    tts: {
      outputDir: './output',
      defaultLanguage: 'en-US',
      defaultVoice: 'en-US-Standard-A',
      defaultFormat: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      concurrency: 2,
    },
  };

  beforeEach(async () => {
    mockClient = {
      listVoices: jest.fn(),
      synthesizeSpeech: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtsService,
        {
          provide: GOOGLE_TTS_CLIENT,
          useValue: mockClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof AppConfig | `tts.${string}`) => {
              const path = String(key);
              if (path === 'tts.concurrency') return mockConfig.tts.concurrency;
              if (path === 'tts.defaultLanguage')
                return mockConfig.tts.defaultLanguage;
              if (path === 'tts.defaultVoice')
                return mockConfig.tts.defaultVoice;
              if (path === 'tts.defaultFormat')
                return mockConfig.tts.defaultFormat;
              if (path === 'tts.speakingRate')
                return mockConfig.tts.speakingRate;
              if (path === 'tts.pitch') return mockConfig.tts.pitch;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TtsService>(TtsService);
  });

  it('lists voices from the client', async () => {
    mockClient.listVoices.mockResolvedValue([
      {
        voices: [
          {
            name: 'en-US-Standard-A',
            languageCodes: ['en-US'],
            ssmlGender: 'FEMALE',
            naturalSampleRateHertz: 24000,
          },
        ],
      },
    ]);

    const voices = await service.listVoices('en-US');
    expect(voices).toHaveLength(1);
    expect(voices[0].name).toBe('en-US-Standard-A');
    expect(mockClient.listVoices).toHaveBeenCalledWith({
      languageCode: 'en-US',
    });
  });

  it('synthesizes speech and returns a buffer', async () => {
    const audio = Buffer.from('audio-data');
    mockClient.synthesizeSpeech.mockResolvedValue([{ audioContent: audio }]);

    const result = await service.synthesize({ text: 'Hello world' });
    expect(result).toEqual(audio);
    expect(mockClient.synthesizeSpeech).toHaveBeenCalled();
  });

  it('throws when audio content is empty', async () => {
    mockClient.synthesizeSpeech.mockResolvedValue([{ audioContent: null }]);
    await expect(service.synthesize({ text: 'Hello' })).rejects.toThrow(
      'empty audio content',
    );
  });

  it('handles partial batch failures', async () => {
    mockClient.synthesizeSpeech
      .mockResolvedValueOnce([{ audioContent: Buffer.from('ok') }])
      .mockRejectedValueOnce(new Error('API failure'));

    const requests: SynthesisOptions[] = [
      { text: 'first' },
      { text: 'second' },
    ];
    const results = await service.synthesizeBatch(requests, 2);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[0].buffer).toBeDefined();
    expect(results[1].success).toBe(false);
    expect(results[1].error).toBe('API failure');
  });
});
