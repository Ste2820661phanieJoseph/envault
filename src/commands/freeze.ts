import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import {
  freezeEnvFile,
  unfreezeEnvKeys,
  getFrozenKeys,
  loadFrozenKeys,
  saveFrozenKeys,
} from '../storage/env-freeze';
import { parseEnv } from '../env/parser';

function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

function getFrozenStorePath(vaultDir: string): string {
  return path.join(vaultDir, 'frozen-keys');
}

export function registerFreezeCommand(program: Command): void {
  const freeze = program
    .command('freeze')
    .description('Freeze or unfreeze env keys to prevent accidental overwrite');

  freeze
    .command('add <keys...>')
    .description('Freeze one or more env keys')
    .option('-f, --file <path>', 'Path to .env file', '.env')
    .action((keys: string[], opts: { file: string }) => {
      const vaultDir = getVaultDir();
      if (!fs.existsSync(vaultDir)) {
        console.error('Vault not initialized. Run `envault init` first.');
        process.exit(1);
      }
      const storePath = getFrozenStorePath(vaultDir);
      const result = freezeEnvFile(opts.file, keys, storePath);
      if (result.frozen.length > 0) {
        console.log(`Frozen: ${result.frozen.join(', ')}`);
      }
      if (result.skipped.length > 0) {
        console.warn(`Skipped (not found): ${result.skipped.join(', ')}`);
      }
    });

  freeze
    .command('remove <keys...>')
    .description('Unfreeze one or more env keys')
    .action((keys: string[]) => {
      const vaultDir = getVaultDir();
      const storePath = getFrozenStorePath(vaultDir);
      const current = loadFrozenKeys(storePath);
      const { frozen, unfrozen } = unfreezeEnvKeys({}, keys, current);
      saveFrozenKeys(storePath, frozen);
      if (unfrozen.length > 0) {
        console.log(`Unfrozen: ${unfrozen.join(', ')}`);
      } else {
        console.log('No matching frozen keys found.');
      }
    });

  freeze
    .command('list')
    .description('List all currently frozen keys')
    .option('-f, --file <path>', 'Path to .env file', '.env')
    .action((opts: { file: string }) => {
      const vaultDir = getVaultDir();
      const storePath = getFrozenStorePath(vaultDir);
      const frozenSet = loadFrozenKeys(storePath);
      if (frozenSet.size === 0) {
        console.log('No frozen keys.');
        return;
      }
      let envMap: Record<string, string> = {};
      if (fs.existsSync(opts.file)) {
        envMap = parseEnv(fs.readFileSync(opts.file, 'utf-8'));
      }
      const active = getFrozenKeys(envMap, frozenSet);
      const all = Array.from(frozenSet);
      console.log('Frozen keys:');
      all.forEach((k) => {
        const inFile = active.includes(k) ? '' : ' (not in file)';
        console.log(`  - ${k}${inFile}`);
      });
    });
}
