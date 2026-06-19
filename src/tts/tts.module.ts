import { Module } from '@nestjs/common';
import { googleTtsProvider } from './google-tts.provider';
import { TtsService } from './tts.service';
import { VoiceCacheService } from './voice-cache.service';

@Module({
  providers: [googleTtsProvider, TtsService, VoiceCacheService],
  exports: [TtsService, VoiceCacheService],
})
export class TtsModule {}
