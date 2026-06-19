import { SynthesisOptions } from '../common/types/synthesis-options.interface';
import { SynthesisResult } from '../common/types/synthesis-result.interface';
import { VoiceInfo } from '../common/types/voice-info.interface';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GOOGLE_TTS_CLIENT } from './google-tts.constants';
import { AppConfig } from '../config/configuration';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pLimit from 'p-limit';
import {
  AUDIO_FORMAT_ENCODING_MAP,
  AudioFormat,
} from '../common/types/audio-format.type';

@Injectable()
export class TtsService {
  private readonly concurrency: number;

  constructor(
    @Inject(GOOGLE_TTS_CLIENT)
    private readonly client: TextToSpeechClient,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    this.concurrency = this.configService.get('tts.concurrency', {
      infer: true,
    });
  }

  async listVoices(languageCode?: string): Promise<VoiceInfo[]> {
    const [response] = await this.client.listVoices(
      languageCode ? { languageCode } : {},
    );
    return (response.voices ?? []).map((voice) => ({
      name: voice.name ?? '',
      languageCodes: voice.languageCodes ?? [],
      ssmlGender: String(voice.ssmlGender ?? 'SSML_VOICE_GENDER_UNSPECIFIED'),
      naturalSampleRateHertz: voice.naturalSampleRateHertz ?? 0,
    }));
  }

  async synthesize(options: SynthesisOptions): Promise<Buffer> {
    const format = this.resolveFormat(options.format);
    const languageCode =
      options.languageCode ??
      this.configService.get('tts.defaultLanguage', { infer: true });
    const voiceName =
      options.voice ||
      this.configService.get('tts.defaultVoice', { infer: true });
    const speakingRate =
      options.speakingRate ??
      this.configService.get('tts.speakingRate', { infer: true });
    const pitch =
      options.pitch ?? this.configService.get('tts.pitch', { infer: true });

    const [response] = await this.client.synthesizeSpeech({
      input: { text: options.text },
      voice: {
        languageCode,
        name: voiceName || undefined,
      },
      audioConfig: {
        audioEncoding: AUDIO_FORMAT_ENCODING_MAP[format],
        speakingRate,
        pitch,
        sampleRateHertz: format === 'WAV' ? 24000 : undefined,
      },
    });

    if (!response.audioContent) {
      throw new Error('Google TTS returned empty audio content');
    }

    return Buffer.from(response.audioContent as Uint8Array);
  }

  async synthesizeBatch(
    requests: SynthesisOptions[],
    concurrency?: number,
  ): Promise<SynthesisResult[]> {
    const limit = pLimit(concurrency ?? this.concurrency);
    const tasks = requests.map((options) =>
      limit(async (): Promise<SynthesisResult> => {
        try {
          const buffer = await this.synthesize(options);
          return { options, success: true, buffer };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return { options, success: false, error: message };
        }
      }),
    );
    return Promise.all(tasks);
  }

  private resolveFormat(format?: AudioFormat): AudioFormat {
    if (format) {
      return format;
    }
    return this.configService.get('tts.defaultFormat', { infer: true });
  }
}
