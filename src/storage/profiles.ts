import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath } from './vault';

export interface Profile {
  name: string;
  description?: string;
  envFile: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilesStore {
  active: string | null;
  profiles: Record<string, Profile>;
}

export function getProfilesPath(projectPath: string): string {
  return path.join(getVaultPath(projectPath), 'profiles.json');
}

export function loadProfiles(projectPath: string): ProfilesStore {
  const filePath = getProfilesPath(projectPath);
  if (!fs.existsSync(filePath)) {
    return { active: null, profiles: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ProfilesStore;
}

export function saveProfiles(projectPath: string, store: ProfilesStore): void {
  const filePath = getProfilesPath(projectPath);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addProfile(
  projectPath: string,
  name: string,
  envFile: string,
  description?: string
): Profile {
  const store = loadProfiles(projectPath);
  const now = new Date().toISOString();
  const profile: Profile = {
    name,
    description,
    envFile,
    createdAt: now,
    updatedAt: now,
  };
  store.profiles[name] = profile;
  saveProfiles(projectPath, store);
  return profile;
}

export function removeProfile(projectPath: string, name: string): boolean {
  const store = loadProfiles(projectPath);
  if (!store.profiles[name]) return false;
  delete store.profiles[name];
  if (store.active === name) store.active = null;
  saveProfiles(projectPath, store);
  return true;
}

export function setActiveProfile(projectPath: string, name: string): boolean {
  const store = loadProfiles(projectPath);
  if (!store.profiles[name]) return false;
  store.active = name;
  saveProfiles(projectPath, store);
  return true;
}

export function getActiveProfile(projectPath: string): Profile | null {
  const store = loadProfiles(projectPath);
  if (!store.active) return null;
  return store.profiles[store.active] ?? null;
}

export function listProfiles(projectPath: string): Profile[] {
  const store = loadProfiles(projectPath);
  return Object.values(store.profiles);
}
