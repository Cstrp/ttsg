import { AudioFormat } from '../common/types/audio-format.type';

export interface TtsSettings {
  defaultVoice: string;
  defaultLanguage: string;
  defaultFormat: AudioFormat;
  speakingRate: number;
  pitch: number;
  concurrency: number;
  outputDir: string;
}
