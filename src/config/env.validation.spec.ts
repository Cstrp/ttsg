import { validationSchema } from './env.validation';

describe('validationSchema', () => {
  const validEnv = {
    GOOGLE_APPLICATION_CREDENTIALS: './credentials/key.json',
    GOOGLE_CLOUD_PROJECT: 'my-project',
  };

  it('accepts valid minimal configuration', () => {
    const result = validationSchema.validate(validEnv);
    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      TTS_DEFAULT_FORMAT: 'MP3',
      TTS_CONCURRENCY: 3,
    });
  });

  it('rejects missing credentials', () => {
    const { error } = validationSchema.validate({
      GOOGLE_CLOUD_PROJECT: 'my-project',
    });
    expect(error).toBeDefined();
  });

  it('rejects invalid format', () => {
    const { error } = validationSchema.validate({
      ...validEnv,
      TTS_DEFAULT_FORMAT: 'FLAC',
    });
    expect(error).toBeDefined();
  });

  it('rejects speaking rate out of range', () => {
    const { error } = validationSchema.validate({
      ...validEnv,
      TTS_SPEAKING_RATE: 10,
    });
    expect(error).toBeDefined();
  });

  it('rejects concurrency below minimum', () => {
    const { error } = validationSchema.validate({
      ...validEnv,
      TTS_CONCURRENCY: 0,
    });
    expect(error).toBeDefined();
  });
});
