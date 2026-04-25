import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { writeClonedEnv } from '../storage/env-clone';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <source> <target>')
    .description('Clone env variables from one file into another')
    .option('--no-overwrite', 'Do not overwrite existing keys in target')
    .option('--keys <keys>', 'Comma-separated list of keys to clone')
    .option('--exclude <keys>', 'Comma-separated list of keys to exclude')
    .action((source: string, target: string, opts) => {
      const sourcePath = path.resolve(source);
      const targetPath = path.resolve(target);

      if (!fs.existsSync(sourcePath)) {
        console.error(`Source file not found: ${sourcePath}`);
        process.exit(1);
      }

      const options: { overwrite?: boolean; keys?: string[]; excludeKeys?: string[] } = {
        overwrite: opts.overwrite !== false,
      };

      if (opts.keys) {
        options.keys = opts.keys.split(',').map((k: string) => k.trim());
      }

      if (opts.exclude) {
        options.excludeKeys = opts.exclude.split(',').map((k: string) => k.trim());
      }

      try {
        const result = writeClonedEnv(sourcePath, targetPath, options);
        const count = Object.keys(result).length;
        console.log(`Cloned env from ${source} to ${target} (${count} keys total).`);
      } catch (err: any) {
        console.error(`Clone failed: ${err.message}`);
        process.exit(1);
      }
    });
}
