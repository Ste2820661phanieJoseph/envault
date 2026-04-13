import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addProfile,
  removeProfile,
  setActiveProfile,
  getActiveProfile,
  listProfiles,
  loadProfiles,
  getProfilesPath,
} from '../profiles';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-profiles-'));
  const vaultDir = path.join(tmpDir, '.envault');
  fs.mkdirSync(vaultDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getProfilesPath', () => {
  it('returns path inside .envault directory', () => {
    const p = getProfilesPath(tmpDir);
    expect(p).toContain('.envault');
    expect(p).toEndWith('profiles.json');
  });
});

describe('loadProfiles', () => {
  it('returns empty store when file does not exist', () => {
    const store = loadProfiles(tmpDir);
    expect(store.active).toBeNull();
    expect(store.profiles).toEqual({});
  });
});

describe('addProfile', () => {
  it('adds a profile and persists it', () => {
    const profile = addProfile(tmpDir, 'dev', '/path/.env.dev', 'Development');
    expect(profile.name).toBe('dev');
    expect(profile.envFile).toBe('/path/.env.dev');
    expect(profile.description).toBe('Development');
    const store = loadProfiles(tmpDir);
    expect(store.profiles['dev']).toBeDefined();
  });

  it('overwrites an existing profile with the same name', () => {
    addProfile(tmpDir, 'dev', '/old.env');
    addProfile(tmpDir, 'dev', '/new.env');
    const store = loadProfiles(tmpDir);
    expect(store.profiles['dev'].envFile).toBe('/new.env');
  });
});

describe('removeProfile', () => {
  it('removes an existing profile', () => {
    addProfile(tmpDir, 'staging', '/staging.env');
    const result = removeProfile(tmpDir, 'staging');
    expect(result).toBe(true);
    const store = loadProfiles(tmpDir);
    expect(store.profiles['staging']).toBeUndefined();
  });

  it('returns false for non-existent profile', () => {
    const result = removeProfile(tmpDir, 'ghost');
    expect(result).toBe(false);
  });

  it('clears active if removed profile was active', () => {
    addProfile(tmpDir, 'prod', '/prod.env');
    setActiveProfile(tmpDir, 'prod');
    removeProfile(tmpDir, 'prod');
    const store = loadProfiles(tmpDir);
    expect(store.active).toBeNull();
  });
});

describe('setActiveProfile / getActiveProfile', () => {
  it('sets and retrieves the active profile', () => {
    addProfile(tmpDir, 'qa', '/qa.env');
    const ok = setActiveProfile(tmpDir, 'qa');
    expect(ok).toBe(true);
    const active = getActiveProfile(tmpDir);
    expect(active?.name).toBe('qa');
  });

  it('returns false when profile does not exist', () => {
    const ok = setActiveProfile(tmpDir, 'missing');
    expect(ok).toBe(false);
  });

  it('returns null when no active profile is set', () => {
    expect(getActiveProfile(tmpDir)).toBeNull();
  });
});

describe('listProfiles', () => {
  it('returns all profiles as an array', () => {
    addProfile(tmpDir, 'dev', '/dev.env');
    addProfile(tmpDir, 'prod', '/prod.env');
    const profiles = listProfiles(tmpDir);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.name)).toEqual(expect.arrayContaining(['dev', 'prod']));
  });

  it('returns empty array when no profiles exist', () => {
    expect(listProfiles(tmpDir)).toEqual([]);
  });
});
