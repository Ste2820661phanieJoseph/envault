import { Command } from 'commander';
import * as path from 'path';
import {
  addAlias,
  removeAlias,
  listAliases,
  resolveAlias,
} from '../storage/aliases';
import { getVaultPath } from '../storage/vault';

export function registerAliasCommand(program: Command): void {
  const alias = program
    .command('alias')
    .description('Manage profile aliases for quick access');

  alias
    .command('add <alias> <profile>')
    .description('Create an alias pointing to a profile')
    .action((aliasName: string, profileName: string) => {
      const vaultDir = path.dirname(getVaultPath(process.cwd()));
      try {
        addAlias(vaultDir, aliasName, profileName);
        console.log(`Alias "${aliasName}" -> "${profileName}" created.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('remove <alias>')
    .description('Remove an existing alias')
    .action((aliasName: string) => {
      const vaultDir = path.dirname(getVaultPath(process.cwd()));
      try {
        removeAlias(vaultDir, aliasName);
        console.log(`Alias "${aliasName}" removed.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('resolve <alias>')
    .description('Print the profile name an alias resolves to')
    .action((aliasName: string) => {
      const vaultDir = path.dirname(getVaultPath(process.cwd()));
      const resolved = resolveAlias(vaultDir, aliasName);
      console.log(resolved);
    });

  alias
    .command('list')
    .description('List all aliases')
    .action(() => {
      const vaultDir = path.dirname(getVaultPath(process.cwd()));
      const aliases = listAliases(vaultDir);
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log('No aliases defined.');
        return;
      }
      entries.forEach(([a, p]) => console.log(`${a} -> ${p}`));
    });
}
