import * as fs from 'fs';
import * as path from 'path';

export interface Profile {
  name: string;
  envFile: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilesStore {
  active: string | null;
  profiles: Record<string, Profile>;
}

const PROFILES_FILE = '.envault-profiles.json';

export function getProfilesPath(projectDir: string = process.cwd()): string {
  return path.join(projectDir, PROFILES_FILE);
}

export function loadProfiles(projectDir: string = process.cwd()): ProfilesStore {
  const filePath = getProfilesPath(projectDir);
  if (!fs.existsSync(filePath)) {
    return { active: null, profiles: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ProfilesStore;
}

export function saveProfiles(store: ProfilesStore, projectDir: string = process.cwd()): void {
  const filePath = getProfilesPath(projectDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addProfile(
  name: string,
  envFile: string,
  description?: string,
  projectDir: string = process.cwd()
): Profile {
  const store = loadProfiles(projectDir);
  if (store.profiles[name]) {
    throw new Error(`Profile "${name}" already exists.`);
  }
  const now = new Date().toISOString();
  const profile: Profile = { name, envFile, description, createdAt: now, updatedAt: now };
  store.profiles[name] = profile;
  if (!store.active) store.active = name;
  saveProfiles(store, projectDir);
  return profile;
}

export function removeProfile(name: string, projectDir: string = process.cwd()): void {
  const store = loadProfiles(projectDir);
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  delete store.profiles[name];
  if (store.active === name) {
    const remaining = Object.keys(store.profiles);
    store.active = remaining.length > 0 ? remaining[0] : null;
  }
  saveProfiles(store, projectDir);
}

export function setActiveProfile(name: string, projectDir: string = process.cwd()): void {
  const store = loadProfiles(projectDir);
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  store.active = name;
  saveProfiles(store, projectDir);
}

export function getActiveProfile(projectDir: string = process.cwd()): Profile | null {
  const store = loadProfiles(projectDir);
  if (!store.active) return null;
  return store.profiles[store.active] ?? null;
}

export function listProfiles(projectDir: string = process.cwd()): Profile[] {
  const store = loadProfiles(projectDir);
  return Object.values(store.profiles);
}
