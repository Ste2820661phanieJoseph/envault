import { Command } from 'commander';
import * as path from 'path';
import { searchVaultDir, SearchResult } from '../storage/search';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search for keys or values in the vault')
    .option('-k, --key <pattern>', 'Regex pattern to match against keys')
    .option('-v, --value <pattern>', 'Regex pattern to match against values')
    .option('-c, --case-sensitive', 'Use case-sensitive matching', false)
    .action((opts) => {
      if (!opts.key && !opts.value) {
        console.error('Error: provide at least --key or --value pattern.');
        process.exit(1);
      }

      const vaultDir = getVaultDir();
      const results: SearchResult[] = searchVaultDir(vaultDir, {
        keyPattern: opts.key,
        valuePattern: opts.value,
        caseSensitive: opts.caseSensitive,
      });

      if (results.length === 0) {
        console.log('No matches found.');
        return;
      }

      console.log(`Found ${results.length} match(es):\n`);
      for (const r of results) {
        const profileLabel = r.profile ? `[${r.profile}] ` : '';
        console.log(`  ${profileLabel}${r.key}=${r.value}`);
      }
    });
}
