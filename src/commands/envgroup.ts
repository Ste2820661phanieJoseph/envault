import { Command } from 'commander';
import * as path from 'path';
import {
  addEnvGroup,
  removeEnvGroup,
  updateEnvGroup,
  listEnvGroups,
  getEnvGroup,
} from '../storage/envgroups';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerEnvGroupCommand(program: Command): void {
  const group = program
    .command('group')
    .description('Manage named groups of environment variable keys');

  group
    .command('add <name> <keys...>')
    .description('Create a new env group with the given keys')
    .option('-d, --description <desc>', 'Optional description for the group')
    .action((name: string, keys: string[], opts: { description?: string }) => {
      const vaultDir = getVaultDir();
      const created = addEnvGroup(vaultDir, name, keys, opts.description);
      console.log(`Group "${created.name}" created with keys: ${created.keys.join(', ')}`);
    });

  group
    .command('remove <name>')
    .description('Remove an env group by name')
    .action((name: string) => {
      const vaultDir = getVaultDir();
      const removed = removeEnvGroup(vaultDir, name);
      if (removed) {
        console.log(`Group "${name}" removed.`);
      } else {
        console.error(`Group "${name}" not found.`);
        process.exitCode = 1;
      }
    });

  group
    .command('update <name> <keys...>')
    .description('Update keys (and optionally description) of an existing group')
    .option('-d, --description <desc>', 'New description for the group')
    .action((name: string, keys: string[], opts: { description?: string }) => {
      const vaultDir = getVaultDir();
      const updated = updateEnvGroup(vaultDir, name, keys, opts.description);
      if (updated) {
        console.log(`Group "${name}" updated.`);
      } else {
        console.error(`Group "${name}" not found.`);
        process.exitCode = 1;
      }
    });

  group
    .command('list')
    .description('List all env groups')
    .action(() => {
      const vaultDir = getVaultDir();
      const groups = listEnvGroups(vaultDir);
      if (groups.length === 0) {
        console.log('No groups defined.');
        return;
      }
      groups.forEach((g) => {
        const desc = g.description ? ` — ${g.description}` : '';
        console.log(`${g.name}${desc}: ${g.keys.join(', ')}`);
      });
    });

  group
    .command('show <name>')
    .description('Show details of a specific env group')
    .action((name: string) => {
      const vaultDir = getVaultDir();
      const found = getEnvGroup(vaultDir, name);
      if (!found) {
        console.error(`Group "${name}" not found.`);
        process.exitCode = 1;
        return;
      }
      console.log(`Name:        ${found.name}`);
      console.log(`Keys:        ${found.keys.join(', ')}`);
      if (found.description) console.log(`Description: ${found.description}`);
      console.log(`Created:     ${found.createdAt}`);
      console.log(`Updated:     ${found.updatedAt}`);
    });

  group
    .command('rename <oldName> <newName>')
    .description('Rename an existing env group')
    .action((oldName: string, newName: string) => {
      const vaultDir = getVaultDir();
      const existing = getEnvGroup(vaultDir, oldName);
      if (!existing) {
        console.error(`Group "${oldName}" not found.`);
        process.exitCode = 1;
        return;
      }
      const conflict = getEnvGroup(vaultDir, newName);
      if (conflict) {
        console.error(`A group named "${newName}" already exists.`);
        process.exitCode = 1;
        return;
      }
      removeEnvGroup(vaultDir, oldName);
      addEnvGroup(vaultDir, newName, existing.keys, existing.description);
      console.log(`Group "${oldName}" renamed to "${newName}".`);
    });
}
