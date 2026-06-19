import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { GOOGLE_TTS_CLIENT } from './google-tts.constants';

export const googleTtsProvider: Provider = {
  provide: GOOGLE_TTS_CLIENT,
  useFactory: (configService: ConfigService<AppConfig, true>) => {
    const projectId = configService.get('googleCloudProject', { infer: true });
    return new TextToSpeechClient({ projectId });
  },
  inject: [ConfigService],
};
