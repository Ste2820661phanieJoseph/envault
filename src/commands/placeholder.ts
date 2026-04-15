import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { detectPlaceholders, fillPlaceholdersInFile } from '../storage/env-placeholder';
import { parseEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerPlaceholderCommand(program: Command): void {
  const placeholder = program
    .command('placeholder')
    .description('Detect and fill placeholder values in .env files');

  placeholder
    .command('check [envFile]')
    .description('List all placeholder values in an env file')
    .action((envFile: string = '.env') => {
      const filePath = path.resolve(envFile);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const envMap = parseEnv(raw);
      const placeholders = detectPlaceholders(envMap);
      if (placeholders.length === 0) {
        console.log('No placeholders detected.');
      } else {
        console.log(`Found ${placeholders.length} placeholder(s):`);
        for (const p of placeholders) {
          const display = p.placeholder === '' ? '(empty)' : p.placeholder;
          console.log(`  ${p.key} = ${display}`);
        }
      }
    });

  placeholder
    .command('fill [envFile]')
    .description('Fill placeholders from KEY=VALUE pairs')
    .option('-v, --values <pairs...>', 'KEY=VALUE pairs to fill')
    .action(async (envFile: string = '.env', opts: { values?: string[] }) => {
      const filePath = path.resolve(envFile);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const values: Record<string, string> = {};
      for (const pair of opts.values ?? []) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        values[pair.slice(0, idx)] = pair.slice(idx + 1);
      }
      const filled = await fillPlaceholdersInFile(filePath, values);
      const count = Object.keys(values).filter((k) => filled[k] === values[k]).length;
      console.log(`Filled ${count} placeholder(s) in ${envFile}.`);
    });
}
