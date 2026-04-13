import * as fs from 'fs';
import * as path from 'path';

export interface ShareEntry {
  id: string;
  projectId: string;
  sharedWith: string; // email or username
  sharedBy: string;
  createdAt: string;
  expiresAt?: string;
  permissions: 'read' | 'write';
}

export interface SharingConfig {
  shares: ShareEntry[];
}

export function getSharingPath(vaultDir: string): string {
  return path.join(vaultDir, 'sharing.json');
}

export function loadSharing(vaultDir: string): SharingConfig {
  const filePath = getSharingPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { shares: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SharingConfig;
}

export function saveSharing(vaultDir: string, config: SharingConfig): void {
  const filePath = getSharingPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addShare(vaultDir: string, entry: ShareEntry): void {
  const config = loadSharing(vaultDir);
  const existing = config.shares.find(
    (s) => s.projectId === entry.projectId && s.sharedWith === entry.sharedWith
  );
  if (existing) {
    throw new Error(`Already shared with ${entry.sharedWith} for project ${entry.projectId}`);
  }
  config.shares.push(entry);
  saveSharing(vaultDir, config);
}

export function removeShare(vaultDir: string, id: string): void {
  const config = loadSharing(vaultDir);
  const index = config.shares.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Share with id "${id}" not found`);
  }
  config.shares.splice(index, 1);
  saveSharing(vaultDir, config);
}

export function listShares(vaultDir: string, projectId?: string): ShareEntry[] {
  const config = loadSharing(vaultDir);
  if (projectId) {
    return config.shares.filter((s) => s.projectId === projectId);
  }
  return config.shares;
}

export function isShareExpired(entry: ShareEntry): boolean {
  if (!entry.expiresAt) return false;
  return new Date(entry.expiresAt) < new Date();
}
