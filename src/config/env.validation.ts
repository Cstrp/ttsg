import * as Joi from 'joi';

export const validationSchema = Joi.object({
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
  GOOGLE_CLOUD_PROJECT: Joi.string().required(),
  TTS_OUTPUT_DIR: Joi.string().default('./output'),
  TTS_DEFAULT_LANGUAGE: Joi.string().default('en-US'),
  TTS_DEFAULT_VOICE: Joi.string().allow('').default(''),
  TTS_DEFAULT_FORMAT: Joi.string()
    .valid('MP3', 'WAV', 'OGG', 'M4A', 'mp3', 'wav', 'ogg', 'm4a')
    .default('MP3'),
  TTS_SPEAKING_RATE: Joi.number().min(0.25).max(4.0).default(1.0),
  TTS_PITCH: Joi.number().min(-20.0).max(20.0).default(0.0),
  TTS_CONCURRENCY: Joi.number().integer().min(1).max(20).default(3),
});
