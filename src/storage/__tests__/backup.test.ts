import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createBackup,
  listBackups,
  getBackup,
  removeBackup,
  loadBackups,
  getBackupPath,
} from '../backup';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-backup-'));
}

describe('backup storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no backup file exists', () => {
    const store = loadBackups(tmpDir);
    expect(store.backups).toEqual([]);
  });

  it('creates a backup entry', () => {
    const entry = createBackup(tmpDir, 'KEY=value', 'initial');
    expect(entry.id).toMatch(/^backup-/);
    expect(entry.label).toBe('initial');
    expect(entry.data).toBe('KEY=value');
    expect(entry.timestamp).toBeTruthy();
  });

  it('persists backup to disk', () => {
    createBackup(tmpDir, 'KEY=value');
    expect(fs.existsSync(getBackupPath(tmpDir))).toBe(true);
    const store = loadBackups(tmpDir);
    expect(store.backups).toHaveLength(1);
  });

  it('lists all backups', () => {
    createBackup(tmpDir, 'A=1', 'first');
    createBackup(tmpDir, 'B=2', 'second');
    const backups = listBackups(tmpDir);
    expect(backups).toHaveLength(2);
    expect(backups[0].label).toBe('first');
    expect(backups[1].label).toBe('second');
  });

  it('retrieves a backup by id', () => {
    const entry = createBackup(tmpDir, 'SECRET=abc');
    const found = getBackup(tmpDir, entry.id);
    expect(found).toBeDefined();
    expect(found?.data).toBe('SECRET=abc');
  });

  it('returns undefined for unknown id', () => {
    const found = getBackup(tmpDir, 'nonexistent-id');
    expect(found).toBeUndefined();
  });

  it('removes a backup by id', () => {
    const entry = createBackup(tmpDir, 'X=1');
    const result = removeBackup(tmpDir, entry.id);
    expect(result).toBe(true);
    expect(listBackups(tmpDir)).toHaveLength(0);
  });

  it('returns false when removing nonexistent backup', () => {
    const result = removeBackup(tmpDir, 'ghost-id');
    expect(result).toBe(false);
  });
});
