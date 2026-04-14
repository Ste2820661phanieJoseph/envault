import * as fs from 'fs';
import * as path from 'path';

export interface RollbackEntry {
  id: string;
  projectId: string;
  timestamp: string;
  label?: string;
  encryptedData: string;
}

export interface RollbackStore {
  entries: RollbackEntry[];
}

export function getRollbackPath(vaultDir: string, projectId: string): string {
  return path.join(vaultDir, projectId, 'rollback.json');
}

export function loadRollbacks(vaultDir: string, projectId: string): RollbackStore {
  const filePath = getRollbackPath(vaultDir, projectId);
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RollbackStore;
}

export function saveRollbacks(vaultDir: string, projectId: string, store: RollbackStore): void {
  const filePath = getRollbackPath(vaultDir, projectId);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addRollbackEntry(
  vaultDir: string,
  projectId: string,
  encryptedData: string,
  label?: string
): RollbackEntry {
  const store = loadRollbacks(vaultDir, projectId);
  const entry: RollbackEntry = {
    id: `rb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    timestamp: new Date().toISOString(),
    label,
    encryptedData,
  };
  store.entries.push(entry);
  saveRollbacks(vaultDir, projectId, store);
  return entry;
}

export function getRollbackEntry(
  vaultDir: string,
  projectId: string,
  id: string
): RollbackEntry | undefined {
  const store = loadRollbacks(vaultDir, projectId);
  return store.entries.find((e) => e.id === id);
}

export function removeRollbackEntry(vaultDir: string, projectId: string, id: string): boolean {
  const store = loadRollbacks(vaultDir, projectId);
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  if (store.entries.length === before) return false;
  saveRollbacks(vaultDir, projectId, store);
  return true;
}

export function listRollbacks(vaultDir: string, projectId: string): RollbackEntry[] {
  return loadRollbacks(vaultDir, projectId).entries;
}
