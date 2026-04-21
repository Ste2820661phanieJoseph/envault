import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { maskEnvFile, writeMaskedEnv } from '../storage/env-mask';
import { serializeEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerMaskCommand(program: Command): void {
  const mask = program
    .command('mask')
    .description('Mask sensitive values in an env file');

  mask
    .command('show <file>')
    .description('Print env file with sensitive values masked')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to mask')
    .option('-c, --char <char>', 'Mask character to use', '*')
    .option('-l, --show-last <n>', 'Number of trailing characters to reveal', '0')
    .action((file: string, opts: { keys?: string; char: string; showLast: string }) => {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const keys = opts.keys ? opts.keys.split(',').map(k => k.trim()) : undefined;
      const showLast = parseInt(opts.showLast, 10) || 0;
      const masked = maskEnvFile(filePath, { keys, maskChar: opts.char, showLast });
      console.log(serializeEnv(masked));
    });

  mask
    .command('write <file>')
    .description('Overwrite env file with sensitive values masked')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to mask')
    .option('-c, --char <char>', 'Mask character to use', '*')
    .option('-l, --show-last <n>', 'Number of trailing characters to reveal', '0')
    .action((file: string, opts: { keys?: string; char: string; showLast: string }) => {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const keys = opts.keys ? opts.keys.split(',').map(k => k.trim()) : undefined;
      const showLast = parseInt(opts.showLast, 10) || 0;
      writeMaskedEnv(filePath, { keys, maskChar: opts.char, showLast });
      console.log(`Masked sensitive values in ${filePath}`);
    });
}
