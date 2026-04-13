import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addEnvGroup,
  removeEnvGroup,
  updateEnvGroup,
  listEnvGroups,
  getEnvGroup,
  loadEnvGroups,
} from '../envgroups';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-envgroups-'));
}

describe('envgroups storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no file exists', () => {
    const store = loadEnvGroups(tmpDir);
    expect(store.groups).toEqual({});
  });

  it('adds a group and persists it', () => {
    const group = addEnvGroup(tmpDir, 'database', ['DB_HOST', 'DB_PORT'], 'DB vars');
    expect(group.name).toBe('database');
    expect(group.keys).toEqual(['DB_HOST', 'DB_PORT']);
    expect(group.description).toBe('DB vars');
    const loaded = loadEnvGroups(tmpDir);
    expect(loaded.groups['database']).toBeDefined();
  });

  it('lists all groups', () => {
    addEnvGroup(tmpDir, 'auth', ['JWT_SECRET']);
    addEnvGroup(tmpDir, 'cache', ['REDIS_URL']);
    const groups = listEnvGroups(tmpDir);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.name)).toContain('auth');
    expect(groups.map((g) => g.name)).toContain('cache');
  });

  it('gets a specific group', () => {
    addEnvGroup(tmpDir, 'smtp', ['SMTP_HOST', 'SMTP_PORT']);
    const group = getEnvGroup(tmpDir, 'smtp');
    expect(group).not.toBeNull();
    expect(group!.keys).toContain('SMTP_HOST');
  });

  it('returns null for missing group', () => {
    const group = getEnvGroup(tmpDir, 'nonexistent');
    expect(group).toBeNull();
  });

  it('removes a group', () => {
    addEnvGroup(tmpDir, 'remove-me', ['KEY1']);
    const removed = removeEnvGroup(tmpDir, 'remove-me');
    expect(removed).toBe(true);
    expect(getEnvGroup(tmpDir, 'remove-me')).toBeNull();
  });

  it('returns false when removing nonexistent group', () => {
    const removed = removeEnvGroup(tmpDir, 'ghost');
    expect(removed).toBe(false);
  });

  it('updates an existing group', () => {
    addEnvGroup(tmpDir, 'api', ['API_KEY']);
    const updated = updateEnvGroup(tmpDir, 'api', ['API_KEY', 'API_SECRET'], 'API vars');
    expect(updated).not.toBeNull();
    expect(updated!.keys).toContain('API_SECRET');
    expect(updated!.description).toBe('API vars');
  });

  it('returns null when updating nonexistent group', () => {
    const result = updateEnvGroup(tmpDir, 'ghost', ['X']);
    expect(result).toBeNull();
  });
});
