import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  createBackup,
  listBackups,
  getBackup,
  removeBackup,
} from '../storage/backup';

export function getVaultDir(projectId: string): string {
  return path.join(process.env.HOME || '.', '.envault', projectId);
}

export function registerBackupCommand(program: Command): void {
  const backup = program.command('backup').description('Manage vault backups');

  backup
    .command('create <projectId> <envFile>')
    .description('Create a backup of an env file')
    .option('-l, --label <label>', 'Optional label for the backup')
    .action((projectId: string, envFile: string, opts: { label?: string }) => {
      if (!fs.existsSync(envFile)) {
        console.error(`File not found: ${envFile}`);
        process.exit(1);
      }
      const data = fs.readFileSync(envFile, 'utf-8');
      const vaultDir = getVaultDir(projectId);
      fs.mkdirSync(vaultDir, { recursive: true });
      const entry = createBackup(vaultDir, data, opts.label);
      console.log(`Backup created: ${entry.id} at ${entry.timestamp}`);
    });

  backup
    .command('list <projectId>')
    .description('List all backups for a project')
    .action((projectId: string) => {
      const vaultDir = getVaultDir(projectId);
      const backups = listBackups(vaultDir);
      if (backups.length === 0) {
        console.log('No backups found.');
        return;
      }
      backups.forEach((b) => {
        const label = b.label ? ` [${b.label}]` : '';
        console.log(`${b.id}${label} — ${b.timestamp}`);
      });
    });

  backup
    .command('restore <projectId> <backupId> <outFile>')
    .description('Restore a backup to a file')
    .action((projectId: string, backupId: string, outFile: string) => {
      const vaultDir = getVaultDir(projectId);
      const entry = getBackup(vaultDir, backupId);
      if (!entry) {
        console.error(`Backup not found: ${backupId}`);
        process.exit(1);
      }
      fs.writeFileSync(outFile, entry.data, 'utf-8');
      console.log(`Restored backup ${backupId} to ${outFile}`);
    });

  backup
    .command('remove <projectId> <backupId>')
    .description('Remove a backup')
    .action((projectId: string, backupId: string) => {
      const vaultDir = getVaultDir(projectId);
      const removed = removeBackup(vaultDir, backupId);
      if (!removed) {
        console.error(`Backup not found: ${backupId}`);
        process.exit(1);
      }
      console.log(`Backup ${backupId} removed.`);
    });
}
