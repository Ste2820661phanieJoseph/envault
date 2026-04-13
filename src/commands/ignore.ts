import { Command } from 'commander';
import * as path from 'path';
import {
  loadIgnore,
  addIgnorePattern,
  removeIgnorePattern,
} from '../storage/ignore';

export function getVaultDir(projectId: string): string {
  return path.join(process.env.HOME || '~', '.envault', 'vaults', projectId);
}

export function registerIgnoreCommand(program: Command): void {
  const ignore = program.command('ignore').description('Manage ignored env keys');

  ignore
    .command('add <projectId> <pattern>')
    .description('Add a key pattern to the ignore list')
    .action((projectId: string, pattern: string) => {
      const vaultDir = getVaultDir(projectId);
      const config = addIgnorePattern(vaultDir, pattern);
      console.log(`Added ignore pattern: ${pattern}`);
      console.log(`Current patterns: ${config.patterns.join(', ') || '(none)'}`);
    });

  ignore
    .command('remove <projectId> <pattern>')
    .description('Remove a key pattern from the ignore list')
    .action((projectId: string, pattern: string) => {
      const vaultDir = getVaultDir(projectId);
      const config = removeIgnorePattern(vaultDir, pattern);
      console.log(`Removed ignore pattern: ${pattern}`);
      console.log(`Current patterns: ${config.patterns.join(', ') || '(none)'}`);
    });

  ignore
    .command('list <projectId>')
    .description('List all ignored key patterns')
    .action((projectId: string) => {
      const vaultDir = getVaultDir(projectId);
      const config = loadIgnore(vaultDir);
      if (config.patterns.length === 0) {
        console.log('No ignore patterns defined.');
      } else {
        console.log('Ignored patterns:');
        config.patterns.forEach((p) => console.log(`  - ${p}`));
      }
    });
}
