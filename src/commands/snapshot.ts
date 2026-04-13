import { Command } from 'commander';
import * as fs from 'fs';
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
} from '../storage/snapshot';
import { getVaultPath } from '../storage/vault';

export function registerSnapshotCommand(program: Command): void {
  const snapshot = program
    .command('snapshot')
    .description('Manage vault snapshots for a project');

  snapshot
    .command('create <projectId>')
    .description('Create a snapshot of the current vault')
    .option('-l, --label <label>', 'Optional label for the snapshot')
    .action((projectId: string, options: { label?: string }) => {
      const vaultPath = getVaultPath(projectId);
      if (!fs.existsSync(vaultPath)) {
        console.error(`No vault found for project: ${projectId}`);
        process.exit(1);
      }
      const encryptedData = fs.readFileSync(vaultPath, 'utf-8');
      const snap = createSnapshot(projectId, encryptedData, options.label);
      console.log(`Snapshot created: ${snap.id}`);
      if (snap.label) console.log(`Label: ${snap.label}`);
      console.log(`Timestamp: ${snap.timestamp}`);
    });

  snapshot
    .command('list <projectId>')
    .description('List all snapshots for a project')
    .action((projectId: string) => {
      const snaps = listSnapshots(projectId);
      if (snaps.length === 0) {
        console.log('No snapshots found.');
        return;
      }
      snaps.forEach((s) => {
        const labelPart = s.label ? ` [${s.label}]` : '';
        console.log(`${s.id}${labelPart} — ${s.timestamp}`);
      });
    });

  snapshot
    .command('restore <projectId> <snapshotId>')
    .description('Restore a snapshot to the vault')
    .action((projectId: string, snapshotId: string) => {
      const snap = getSnapshot(projectId, snapshotId);
      if (!snap) {
        console.error(`Snapshot not found: ${snapshotId}`);
        process.exit(1);
      }
      const vaultPath = getVaultPath(projectId);
      fs.writeFileSync(vaultPath, snap.encryptedData, 'utf-8');
      console.log(`Vault restored from snapshot: ${snapshotId}`);
    });

  snapshot
    .command('delete <projectId> <snapshotId>')
    .description('Delete a snapshot')
    .action((projectId: string, snapshotId: string) => {
      const deleted = deleteSnapshot(projectId, snapshotId);
      if (!deleted) {
        console.error(`Snapshot not found: ${snapshotId}`);
        process.exit(1);
      }
      console.log(`Snapshot deleted: ${snapshotId}`);
    });
}
