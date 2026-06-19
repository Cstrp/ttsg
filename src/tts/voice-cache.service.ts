import { VoiceInfo } from '../common/types/voice-info.interface';
import { Injectable } from '@nestjs/common';
import { TtsService } from './tts.service';

@Injectable()
export class VoiceCacheService {
  private cache = new Map<string, VoiceInfo[]>();

  constructor(private readonly ttsService: TtsService) {}

  async listVoices(languageCode?: string): Promise<VoiceInfo[]> {
    const key = languageCode ?? '__all__';
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const voices = await this.ttsService.listVoices(languageCode);
    this.cache.set(key, voices);
    return voices;
  }

  invalidate(languageCode?: string): void {
    if (languageCode) {
      this.cache.delete(languageCode);
      this.cache.delete('__all__');
    } else {
      this.cache.clear();
    }
  }
}
