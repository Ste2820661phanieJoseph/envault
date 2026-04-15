import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { copyEnvFile } from '../storage/env-copy';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <source> <destination>')
    .description('Copy env keys from one file to another')
    .option('-o, --overwrite', 'Overwrite existing keys in destination', false)
    .option('-k, --keys <keys>', 'Comma-separated list of keys to copy')
    .action((source: string, destination: string, options: { overwrite: boolean; keys?: string }) => {
      const srcPath = path.resolve(source);
      const destPath = path.resolve(destination);

      if (!fs.existsSync(srcPath)) {
        console.error(`Error: Source file not found: ${srcPath}`);
        process.exit(1);
      }

      const keys = options.keys
        ? options.keys.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined;

      try {
        const result = copyEnvFile(srcPath, destPath, {
          overwrite: options.overwrite,
          keys,
        });

        if (result.copied.length > 0) {
          console.log(`Copied ${result.copied.length} key(s): ${result.copied.join(', ')}`);
        }
        if (result.skipped.length > 0) {
          console.log(`Skipped ${result.skipped.length} key(s): ${result.skipped.join(', ')}`);
        }
        if (result.copied.length === 0) {
          console.log('No keys were copied.');
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
