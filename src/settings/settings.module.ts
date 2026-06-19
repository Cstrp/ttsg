import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { SettingsService } from './settings.service';

@Module({
  imports: [StorageModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
