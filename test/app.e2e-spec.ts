import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { validationSchema } from '../src/config/env.validation';
import { StorageService } from '../src/storage/storage.service';

describe('CLI bootstrap (e2e)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_APPLICATION_CREDENTIALS: './credentials/test-key.json',
      GOOGLE_CLOUD_PROJECT: 'test-project',
      TTS_OUTPUT_DIR: './output-test-e2e',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('bootstraps storage with validated config', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
        }),
      ],
      providers: [StorageService],
    }).compile();

    const storage = moduleFixture.get(StorageService);
    await storage.onModuleInit();
    expect(storage.getOutputDir()).toContain('output-test-e2e');
    await moduleFixture.close();
  });
});
