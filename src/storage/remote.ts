import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface RemoteConfig {
  url: string;
  projectId: string;
  token?: string;
  lastSynced?: string;
}

export interface RemoteStore {
  remotes: Record<string, RemoteConfig>;
}

const REMOTE_FILE = '.envault-remote.json';

export function getRemotePath(cwd: string = process.cwd()): string {
  return path.join(cwd, REMOTE_FILE);
}

export function loadRemoteConfig(cwd: string = process.cwd()): RemoteStore {
  const remotePath = getRemotePath(cwd);
  if (!fs.existsSync(remotePath)) {
    return { remotes: {} };
  }
  try {
    const raw = fs.readFileSync(remotePath, 'utf-8');
    return JSON.parse(raw) as RemoteStore;
  } catch {
    return { remotes: {} };
  }
}

export function saveRemoteConfig(store: RemoteStore, cwd: string = process.cwd()): void {
  const remotePath = getRemotePath(cwd);
  fs.writeFileSync(remotePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addRemote(name: string, config: RemoteConfig, cwd: string = process.cwd()): void {
  const store = loadRemoteConfig(cwd);
  store.remotes[name] = config;
  saveRemoteConfig(store, cwd);
}

export function removeRemote(name: string, cwd: string = process.cwd()): boolean {
  const store = loadRemoteConfig(cwd);
  if (!store.remotes[name]) return false;
  delete store.remotes[name];
  saveRemoteConfig(store, cwd);
  return true;
}

export function getRemote(name: string, cwd: string = process.cwd()): RemoteConfig | undefined {
  const store = loadRemoteConfig(cwd);
  return store.remotes[name];
}

export function listRemotes(cwd: string = process.cwd()): Array<{ name: string; config: RemoteConfig }> {
  const store = loadRemoteConfig(cwd);
  return Object.entries(store.remotes).map(([name, config]) => ({ name, config }));
}

export function updateLastSynced(name: string, cwd: string = process.cwd()): void {
  const store = loadRemoteConfig(cwd);
  if (store.remotes[name]) {
    store.remotes[name].lastSynced = new Date().toISOString();
    saveRemoteConfig(store, cwd);
  }
}
