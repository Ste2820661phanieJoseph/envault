import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getProfilesPath,
  loadProfiles,
  addProfile,
  removeProfile,
  setActiveProfile,
  getActiveProfile,
  listProfiles,
} from '../profiles';

describe('profiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-profiles-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no profiles file exists', () => {
    const store = loadProfiles(tmpDir);
    expect(store.active).toBeNull();
    expect(store.profiles).toEqual({});
  });

  it('getProfilesPath returns correct path', () => {
    const p = getProfilesPath(tmpDir);
    expect(p).toBe(path.join(tmpDir, '.envault-profiles.json'));
  });

  it('addProfile creates a profile and sets it as active', () => {
    const profile = addProfile('development', '.env.development', 'Dev env', tmpDir);
    expect(profile.name).toBe('development');
    expect(profile.envFile).toBe('.env.development');
    expect(profile.description).toBe('Dev env');
    const store = loadProfiles(tmpDir);
    expect(store.active).toBe('development');
    expect(store.profiles['development']).toBeDefined();
  });

  it('addProfile throws if profile already exists', () => {
    addProfile('staging', '.env.staging', undefined, tmpDir);
    expect(() => addProfile('staging', '.env.staging', undefined, tmpDir)).toThrow(
      'Profile "staging" already exists.'
    );
  });

  it('listProfiles returns all profiles', () => {
    addProfile('development', '.env.development', undefined, tmpDir);
    addProfile('production', '.env.production', undefined, tmpDir);
    const profiles = listProfiles(tmpDir);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.name)).toContain('development');
    expect(profiles.map((p) => p.name)).toContain('production');
  });

  it('setActiveProfile changes the active profile', () => {
    addProfile('development', '.env.development', undefined, tmpDir);
    addProfile('production', '.env.production', undefined, tmpDir);
    setActiveProfile('production', tmpDir);
    const active = getActiveProfile(tmpDir);
    expect(active?.name).toBe('production');
  });

  it('setActiveProfile throws if profile does not exist', () => {
    expect(() => setActiveProfile('nonexistent', tmpDir)).toThrow(
      'Profile "nonexistent" does not exist.'
    );
  });

  it('removeProfile deletes the profile and updates active', () => {
    addProfile('development', '.env.development', undefined, tmpDir);
    addProfile('production', '.env.production', undefined, tmpDir);
    setActiveProfile('development', tmpDir);
    removeProfile('development', tmpDir);
    const store = loadProfiles(tmpDir);
    expect(store.profiles['development']).toBeUndefined();
    expect(store.active).toBe('production');
  });

  it('removeProfile sets active to null when last profile removed', () => {
    addProfile('development', '.env.development', undefined, tmpDir);
    removeProfile('development', tmpDir);
    const store = loadProfiles(tmpDir);
    expect(store.active).toBeNull();
  });

  it('removeProfile throws if profile does not exist', () => {
    expect(() => removeProfile('ghost', tmpDir)).toThrow('Profile "ghost" does not exist.');
  });

  it('getActiveProfile returns null when no profiles exist', () => {
    const active = getActiveProfile(tmpDir);
    expect(active).toBeNull();
  });
});
