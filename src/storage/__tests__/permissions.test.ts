import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadPermissions,
  savePermissions,
  addPermission,
  removePermission,
  getPermission,
  hasRole,
  getPermissionsPath,
} from '../permissions';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-permissions-'));
}

describe('permissions storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no file exists', () => {
    const store = loadPermissions(tmpDir);
    expect(store.permissions).toEqual([]);
  });

  it('saves and loads permissions', () => {
    const store = { projectId: 'proj1', permissions: [] };
    savePermissions(tmpDir, store);
    const loaded = loadPermissions(tmpDir);
    expect(loaded.projectId).toBe('proj1');
  });

  it('adds a new permission', () => {
    addPermission(tmpDir, 'alice', 'read', 'admin');
    const p = getPermission(tmpDir, 'alice');
    expect(p).toBeDefined();
    expect(p!.role).toBe('read');
    expect(p!.grantedBy).toBe('admin');
  });

  it('updates an existing permission', () => {
    addPermission(tmpDir, 'alice', 'read', 'admin');
    addPermission(tmpDir, 'alice', 'write', 'admin');
    const store = loadPermissions(tmpDir);
    const aliceEntries = store.permissions.filter((p) => p.user === 'alice');
    expect(aliceEntries).toHaveLength(1);
    expect(aliceEntries[0].role).toBe('write');
  });

  it('removes a permission', () => {
    addPermission(tmpDir, 'bob', 'admin', 'system');
    removePermission(tmpDir, 'bob');
    expect(getPermission(tmpDir, 'bob')).toBeUndefined();
  });

  it('hasRole returns true for same role', () => {
    addPermission(tmpDir, 'carol', 'write', 'system');
    expect(hasRole(tmpDir, 'carol', 'write')).toBe(true);
  });

  it('hasRole returns true for lower role', () => {
    addPermission(tmpDir, 'carol', 'admin', 'system');
    expect(hasRole(tmpDir, 'carol', 'read')).toBe(true);
  });

  it('hasRole returns false for higher role', () => {
    addPermission(tmpDir, 'dave', 'read', 'system');
    expect(hasRole(tmpDir, 'dave', 'admin')).toBe(false);
  });

  it('hasRole returns false for unknown user', () => {
    expect(hasRole(tmpDir, 'unknown', 'read')).toBe(false);
  });

  it('getPermissionsPath returns correct path', () => {
    const p = getPermissionsPath('/some/dir');
    expect(p).toBe('/some/dir/permissions.json');
  });
});
