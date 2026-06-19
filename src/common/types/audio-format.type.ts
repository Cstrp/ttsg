import { protos } from '@google-cloud/text-to-speech';

export type AudioFormat = 'MP3' | 'WAV' | 'OGG' | 'M4A';

export type GoogleAudioEncoding =
  protos.google.cloud.texttospeech.v1.AudioEncoding;

export const AUDIO_FORMAT_ENCODING_MAP: Record<
  AudioFormat,
  GoogleAudioEncoding
> = {
  MP3: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
  WAV: protos.google.cloud.texttospeech.v1.AudioEncoding.LINEAR16,
  OGG: protos.google.cloud.texttospeech.v1.AudioEncoding.OGG_OPUS,
  M4A: protos.google.cloud.texttospeech.v1.AudioEncoding.M4A,
};

export const AUDIO_FORMAT_EXTENSION_MAP: Record<AudioFormat, string> = {
  MP3: '.mp3',
  WAV: '.wav',
  OGG: '.ogg',
  M4A: '.m4a',
};

export function parseAudioFormat(value: string): AudioFormat | undefined {
  const normalized = value.toUpperCase() as AudioFormat;
  if (normalized in AUDIO_FORMAT_ENCODING_MAP) {
    return normalized;
  }
  return undefined;
}
