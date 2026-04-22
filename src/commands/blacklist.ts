import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { blacklistEnvFile, writeBlacklistedEnv } from '../storage/env-blacklist';
import { serializeEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerBlacklistCommand(program: Command): void {
  const cmd = program
    .command('blacklist <envFile>')
    .description('Remove blacklisted keys from an env file')
    .requiredOption('-k, --keys <keys>', 'Comma-separated list of keys or glob patterns to remove')
    .option('-o, --output <outputFile>', 'Write result to a different file instead of overwriting')
    .option('--dry-run', 'Print result without writing', false)
    .action((envFile: string, options: { keys: string; output?: string; dryRun: boolean }) => {
      const filePath = path.resolve(process.cwd(), envFile);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const blacklist = options.keys.split(',').map((k) => k.trim()).filter(Boolean);
      if (blacklist.length === 0) {
        console.error('No keys specified for blacklist.');
        process.exit(1);
      }

      if (options.dryRun) {
        const filtered = blacklistEnvFile(filePath, blacklist);
        console.log(serializeEnv(filtered));
        return;
      }

      const outputPath = options.output ? path.resolve(process.cwd(), options.output) : undefined;
      writeBlacklistedEnv(filePath, blacklist, outputPath);
      console.log(`Blacklisted keys [${blacklist.join(', ')}] removed from ${outputPath ?? filePath}`);
    });

  return;
}
