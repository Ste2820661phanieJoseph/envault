import * as fs from 'fs';
import * as path from 'path';

export interface EnvGroup {
  name: string;
  keys: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvGroupsStore {
  groups: Record<string, EnvGroup>;
}

export function getEnvGroupsPath(vaultDir: string): string {
  return path.join(vaultDir, 'envgroups.json');
}

export function loadEnvGroups(vaultDir: string): EnvGroupsStore {
  const filePath = getEnvGroupsPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { groups: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as EnvGroupsStore;
}

export function saveEnvGroups(vaultDir: string, store: EnvGroupsStore): void {
  const filePath = getEnvGroupsPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addEnvGroup(
  vaultDir: string,
  name: string,
  keys: string[],
  description?: string
): EnvGroup {
  const store = loadEnvGroups(vaultDir);
  const now = new Date().toISOString();
  const group: EnvGroup = {
    name,
    keys,
    description,
    createdAt: now,
    updatedAt: now,
  };
  store.groups[name] = group;
  saveEnvGroups(vaultDir, store);
  return group;
}

export function removeEnvGroup(vaultDir: string, name: string): boolean {
  const store = loadEnvGroups(vaultDir);
  if (!store.groups[name]) return false;
  delete store.groups[name];
  saveEnvGroups(vaultDir, store);
  return true;
}

export function updateEnvGroup(
  vaultDir: string,
  name: string,
  keys: string[],
  description?: string
): EnvGroup | null {
  const store = loadEnvGroups(vaultDir);
  if (!store.groups[name]) return null;
  store.groups[name] = {
    ...store.groups[name],
    keys,
    description: description ?? store.groups[name].description,
    updatedAt: new Date().toISOString(),
  };
  saveEnvGroups(vaultDir, store);
  return store.groups[name];
}

export function listEnvGroups(vaultDir: string): EnvGroup[] {
  const store = loadEnvGroups(vaultDir);
  return Object.values(store.groups);
}

export function getEnvGroup(vaultDir: string, name: string): EnvGroup | null {
  const store = loadEnvGroups(vaultDir);
  return store.groups[name] ?? null;
}
