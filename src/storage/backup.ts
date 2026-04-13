import * as fs from 'fs';
import * as path from 'path';

export interface BackupEntry {
  id: string;
  timestamp: string;
  label?: string;
  data: string;
}

export interface BackupStore {
  backups: BackupEntry[];
}

export function getBackupPath(vaultDir: string): string {
  return path.join(vaultDir, 'backups.json');
}

export function loadBackups(vaultDir: string): BackupStore {
  const filePath = getBackupPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { backups: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as BackupStore;
}

export function saveBackups(vaultDir: string, store: BackupStore): void {
  const filePath = getBackupPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function createBackup(
  vaultDir: string,
  data: string,
  label?: string
): BackupEntry {
  const store = loadBackups(vaultDir);
  const entry: BackupEntry = {
    id: `backup-${Date.now()}`,
    timestamp: new Date().toISOString(),
    label,
    data,
  };
  store.backups.push(entry);
  saveBackups(vaultDir, store);
  return entry;
}

export function getBackup(vaultDir: string, id: string): BackupEntry | undefined {
  const store = loadBackups(vaultDir);
  return store.backups.find((b) => b.id === id);
}

export function removeBackup(vaultDir: string, id: string): boolean {
  const store = loadBackups(vaultDir);
  const index = store.backups.findIndex((b) => b.id === id);
  if (index === -1) return false;
  store.backups.splice(index, 1);
  saveBackups(vaultDir, store);
  return true;
}

export function listBackups(vaultDir: string): BackupEntry[] {
  return loadBackups(vaultDir).backups;
}
