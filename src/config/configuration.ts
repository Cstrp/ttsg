import { AudioFormat } from '../common/types/audio-format.type';

export interface TtsConfig {
  outputDir: string;
  defaultLanguage: string;
  defaultVoice: string;
  defaultFormat: AudioFormat;
  speakingRate: number;
  pitch: number;
  concurrency: number;
}

export interface AppConfig {
  googleApplicationCredentials: string;
  googleCloudProject: string;
  tts: TtsConfig;
}

export default (): AppConfig => ({
  googleApplicationCredentials:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT ?? '',
  tts: {
    outputDir: process.env.TTS_OUTPUT_DIR ?? './output',
    defaultLanguage: process.env.TTS_DEFAULT_LANGUAGE ?? 'en-US',
    defaultVoice: process.env.TTS_DEFAULT_VOICE ?? '',
    defaultFormat: (process.env.TTS_DEFAULT_FORMAT?.toUpperCase() ??
      'MP3') as AudioFormat,
    speakingRate: parseFloat(process.env.TTS_SPEAKING_RATE ?? '1.0'),
    pitch: parseFloat(process.env.TTS_PITCH ?? '0.0'),
    concurrency: parseInt(process.env.TTS_CONCURRENCY ?? '3', 10),
  },
});
