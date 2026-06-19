import { SynthesisOptions } from './synthesis-options.interface';

export interface SynthesisResult {
  options: SynthesisOptions;
  success: boolean;
  buffer?: Buffer;
  outputPath?: string;
  error?: string;
}
