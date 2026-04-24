import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import {
  applyDefaultsToFile,
  writeEnvWithDefaults,
  getMissingDefaults,
  DefaultsMap,
} from '../storage/env-defaults';
import { parseEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerDefaultsCommand(program: Command): void {
  const defaults = program
    .command('defaults')
    .description('Manage default values for env keys');

  defaults
    .command('apply <envFile> <defaultsFile>')
    .description('Apply defaults from a defaults file to an env file')
    .option('--write', 'Write the result back to the env file')
    .action((envFile: string, defaultsFile: string, opts: { write?: boolean }) => {
      if (!fs.existsSync(defaultsFile)) {
        console.error(`Defaults file not found: ${defaultsFile}`);
        process.exit(1);
      }
      const defaultsContent = fs.readFileSync(defaultsFile, 'utf-8');
      const defaultsMap: DefaultsMap = parseEnv(defaultsContent);

      if (opts.write) {
        writeEnvWithDefaults(envFile, defaultsMap);
        console.log(`Defaults applied and written to ${envFile}`);
      } else {
        const result = applyDefaultsToFile(envFile, defaultsMap);
        for (const [key, value] of Object.entries(result)) {
          console.log(`${key}=${value}`);
        }
      }
    });

  defaults
    .command('check <envFile> <defaultsFile>')
    .description('Show which default keys are missing from an env file')
    .action((envFile: string, defaultsFile: string) => {
      if (!fs.existsSync(defaultsFile)) {
        console.error(`Defaults file not found: ${defaultsFile}`);
        process.exit(1);
      }
      const envContent = fs.existsSync(envFile)
        ? fs.readFileSync(envFile, 'utf-8')
        : '';
      const envMap = parseEnv(envContent);
      const defaultsContent = fs.readFileSync(defaultsFile, 'utf-8');
      const defaultsMap: DefaultsMap = parseEnv(defaultsContent);
      const missing = getMissingDefaults(envMap, defaultsMap);
      if (missing.length === 0) {
        console.log('All default keys are present.');
      } else {
        console.log(`Missing or empty keys (${missing.length}):`);
        missing.forEach((key) => console.log(`  - ${key}`));
      }
    });
}
