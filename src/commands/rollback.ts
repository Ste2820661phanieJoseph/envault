import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import {
  loadRollbacks,
  addRollbackEntry,
  getRollbackEntry,
} from '../storage/rollback';
import { getVaultPath, vaultExists } from '../storage/vault';
import { decrypt, encrypt } from '../crypto';
import { retrieveProjectKey } from '../crypto/keystore';
import { appendAuditLog } from '../storage/audit';

/**
 * Resolves the vault directory for the current project.
 */
function getVaultDir(projectId: string): string {
  return path.join(process.env.HOME || '~', '.envault', 'vaults', projectId);
}

/**
 * Registers the `rollback` command and its subcommands onto the given CLI program.
 *
 * Subcommands:
 *   - rollback list              List all rollback entries for the project
 *   - rollback save <label>      Save the current vault state as a rollback point
 *   - rollback restore <id>      Restore the vault to a previous rollback point
 */
export function registerRollbackCommand(program: Command): void {
  const rollback = program
    .command('rollback')
    .description('Manage rollback points for the vault');

  // List all rollback entries
  rollback
    .command('list')
    .description('List all saved rollback points')
    .requiredOption('-p, --project <id>', 'Project ID')
    .action((opts) => {
      const vaultDir = getVaultDir(opts.project);
      const entries = loadRollbacks(vaultDir);

      if (entries.length === 0) {
        console.log('No rollback points found.');
        return;
      }

      console.log(`Rollback points for project "${opts.project}":\n`);
      entries.forEach((entry) => {
        console.log(`  [${entry.id}] ${entry.label} — ${new Date(entry.createdAt).toLocaleString()}`);
      });
    });

  // Save current vault state as a rollback point
  rollback
    .command('save <label>')
    .description('Save the current vault state as a rollback point')
    .requiredOption('-p, --project <id>', 'Project ID')
    .action((label: string, opts) => {
      const vaultDir = getVaultDir(opts.project);
      const vaultPath = getVaultPath(vaultDir);

      if (!vaultExists(vaultDir)) {
        console.error('No vault found for this project. Run `envault init` first.');
        process.exit(1);
      }

      const encryptedData = fs.readFileSync(vaultPath, 'utf-8');
      const entry = addRollbackEntry(vaultDir, label, encryptedData);

      appendAuditLog(vaultDir, {
        action: 'rollback:save',
        projectId: opts.project,
        detail: `Saved rollback point "${label}" with id ${entry.id}`,
        timestamp: new Date().toISOString(),
      });

      console.log(`Rollback point saved: [${entry.id}] "${label}"`);
    });

  // Restore vault to a previous rollback point
  rollback
    .command('restore <id>')
    .description('Restore the vault to a saved rollback point')
    .requiredOption('-p, --project <id>', 'Project ID')
    .action((id: string, opts) => {
      const vaultDir = getVaultDir(opts.project);
      const vaultPath = getVaultPath(vaultDir);
      const entry = getRollbackEntry(vaultDir, id);

      if (!entry) {
        console.error(`Rollback point "${id}" not found.`);
        process.exit(1);
      }

      // Write the stored encrypted data back to the vault file
      fs.writeFileSync(vaultPath, entry.data, 'utf-8');

      appendAuditLog(vaultDir, {
        action: 'rollback:restore',
        projectId: opts.project,
        detail: `Restored vault to rollback point "${entry.label}" (id: ${entry.id})`,
        timestamp: new Date().toISOString(),
      });

      console.log(`Vault restored to rollback point [${entry.id}] "${entry.label}" (${new Date(entry.createdAt).toLocaleString()}).`);
    });
}
