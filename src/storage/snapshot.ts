import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath } from './vault';

export interface Snapshot {
  id: string;
  projectId: string;
  timestamp: string;
  label?: string;
  encryptedData: string;
}

export function getSnapshotsPath(projectId: string): string {
  const vaultPath = getVaultPath(projectId);
  return path.join(path.dirname(vaultPath), 'snapshots.json');
}

export function loadSnapshots(projectId: string): Snapshot[] {
  const snapshotsPath = getSnapshotsPath(projectId);
  if (!fs.existsSync(snapshotsPath)) {
    return [];
  }
  const raw = fs.readFileSync(snapshotsPath, 'utf-8');
  return JSON.parse(raw) as Snapshot[];
}

export function saveSnapshots(projectId: string, snapshots: Snapshot[]): void {
  const snapshotsPath = getSnapshotsPath(projectId);
  fs.writeFileSync(snapshotsPath, JSON.stringify(snapshots, null, 2), 'utf-8');
}

export function createSnapshot(
  projectId: string,
  encryptedData: string,
  label?: string
): Snapshot {
  const snapshots = loadSnapshots(projectId);
  const snapshot: Snapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    timestamp: new Date().toISOString(),
    label,
    encryptedData,
  };
  snapshots.push(snapshot);
  saveSnapshots(projectId, snapshots);
  return snapshot;
}

export function getSnapshot(projectId: string, id: string): Snapshot | undefined {
  const snapshots = loadSnapshots(projectId);
  return snapshots.find((s) => s.id === id);
}

export function deleteSnapshot(projectId: string, id: string): boolean {
  const snapshots = loadSnapshots(projectId);
  const index = snapshots.findIndex((s) => s.id === id);
  if (index === -1) return false;
  snapshots.splice(index, 1);
  saveSnapshots(projectId, snapshots);
  return true;
}

export function listSnapshots(projectId: string): Snapshot[] {
  return loadSnapshots(projectId);
}
