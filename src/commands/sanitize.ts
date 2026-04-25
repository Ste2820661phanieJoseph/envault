import { Command } from 'commander';
import * as path from 'path';
import {
  sanitizeEnvFile,
  writeSanitizedEnv,
  SanitizeOptions,
} from '../storage/env-sanitize';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerSanitizeCommand(program: Command): void {
  program
    .command('sanitize <envfile>')
    .description('Sanitize an .env file by removing empty keys, trimming values, and optionally stripping quotes')
    .option('--no-remove-empty', 'Keep empty-valued keys')
    .option('--no-trim', 'Do not trim whitespace from values')
    .option('--strip-quotes', 'Strip surrounding quotes from values')
    .option('--dry-run', 'Preview changes without writing')
    .action((envfile: string, opts: Record<string, boolean>) => {
      const options: SanitizeOptions = {
        removeEmpty: opts['removeEmpty'] !== false,
        trimValues: opts['trim'] !== false,
        stripQuotes: !!opts['stripQuotes'],
      };

      try {
        const result = sanitizeEnvFile(envfile, options);

        if (result.removedKeys.length > 0) {
          console.log(`Removed keys (${result.removedKeys.length}): ${result.removedKeys.join(', ')}`);
        }

        if (result.modifiedKeys.length > 0) {
          console.log(`Modified keys (${result.modifiedKeys.length}): ${result.modifiedKeys.join(', ')}`);
        }

        if (result.removedKeys.length === 0 && result.modifiedKeys.length === 0) {
          console.log('No changes needed. File is already clean.');
          return;
        }

        if (opts['dryRun']) {
          console.log('Dry run complete. No changes written.');
          return;
        }

        writeSanitizedEnv(envfile, result);
        console.log(`Sanitized ${envfile} successfully.`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error sanitizing file: ${message}`);
        process.exit(1);
      }
    });
}
