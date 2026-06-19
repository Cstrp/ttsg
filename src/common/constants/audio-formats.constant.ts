import { AudioFormat } from '../types/audio-format.type';

export const AUDIO_FORMATS: readonly AudioFormat[] = [
  'MP3',
  'WAV',
  'OGG',
  'M4A',
] as const;

export const AUDIO_FORMAT_LABELS: Record<AudioFormat, string> = {
  MP3: 'MP3',
  WAV: 'WAV (LINEAR16)',
  OGG: 'OGG Opus',
  M4A: 'M4A',
};
