import { Module } from '@nestjs/common';
import { BatchCommand } from './commands/batch.command';
import { FilesCommand } from './commands/files.command';
import { InteractiveCommand } from './commands/interactive.command';
import { SynthesizeCommand } from './commands/synthesize.command';
import { VoicesCommand } from './commands/voices.command';
import { BatchMenu } from './menus/batch.menu';
import { CliMenuService } from './menus/cli-menu.service';
import { FilesMenu } from './menus/files.menu';
import { SettingsMenu } from './menus/settings.menu';
import { SynthesizeMenu } from './menus/synthesize.menu';
import { VoicesMenu } from './menus/voices.menu';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import { TtsModule } from '../tts/tts.module';

@Module({
  imports: [TtsModule, StorageModule, SettingsModule],
  providers: [
    InteractiveCommand,
    SynthesizeCommand,
    BatchCommand,
    VoicesCommand,
    FilesCommand,
    CliMenuService,
    SynthesizeMenu,
    BatchMenu,
    FilesMenu,
    SettingsMenu,
    VoicesMenu,
  ],
})
export class CliModule {}
