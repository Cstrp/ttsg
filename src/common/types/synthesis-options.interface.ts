import { AudioFormat } from './audio-format.type';

export interface SynthesisOptions {
  text: string;
  voice?: string;
  languageCode?: string;
  format?: AudioFormat;
  speakingRate?: number;
  pitch?: number;
  outputFilename?: string;
}
