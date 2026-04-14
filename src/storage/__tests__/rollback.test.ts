import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getRollbackPath,
  loadRollbacks,
  saveRollbacks,
  addRollbackEntry,
  getRollbackEntry,
  removeRollbackEntry,
  listRollbacks,
} from '../rollback';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rollback-'));
}

describe('rollback storage', () => {
  let tmpDir: string;
  const projectId = 'test-project';

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getRollbackPath returns correct path', () => {
    const p = getRollbackPath(tmpDir, projectId);
    expect(p).toBe(path.join(tmpDir, projectId, 'rollback.json'));
  });

  it('loadRollbacks returns empty store when file does not exist', () => {
    const store = loadRollbacks(tmpDir, projectId);
    expect(store.entries).toEqual([]);
  });

  it('saveRollbacks and loadRollbacks round-trip', () => {
    const store = { entries: [{ id: 'rb_1', projectId, timestamp: new Date().toISOString(), encryptedData: 'abc' }] };
    saveRollbacks(tmpDir, projectId, store);
    const loaded = loadRollbacks(tmpDir, projectId);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].id).toBe('rb_1');
  });

  it('addRollbackEntry creates entry with generated id and timestamp', () => {
    const entry = addRollbackEntry(tmpDir, projectId, 'encrypted-payload', 'before-deploy');
    expect(entry.id).toMatch(/^rb_/);
    expect(entry.encryptedData).toBe('encrypted-payload');
    expect(entry.label).toBe('before-deploy');
    expect(entry.timestamp).toBeTruthy();
  });

  it('addRollbackEntry persists to disk', () => {
    addRollbackEntry(tmpDir, projectId, 'data1');
    addRollbackEntry(tmpDir, projectId, 'data2');
    const entries = listRollbacks(tmpDir, projectId);
    expect(entries).toHaveLength(2);
  });

  it('getRollbackEntry returns correct entry by id', () => {
    const added = addRollbackEntry(tmpDir, projectId, 'secret-data', 'v1');
    const found = getRollbackEntry(tmpDir, projectId, added.id);
    expect(found).toBeDefined();
    expect(found?.encryptedData).toBe('secret-data');
  });

  it('getRollbackEntry returns undefined for missing id', () => {
    const result = getRollbackEntry(tmpDir, projectId, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('removeRollbackEntry removes existing entry and returns true', () => {
    const entry = addRollbackEntry(tmpDir, projectId, 'to-remove');
    const result = removeRollbackEntry(tmpDir, projectId, entry.id);
    expect(result).toBe(true);
    expect(listRollbacks(tmpDir, projectId)).toHaveLength(0);
  });

  it('removeRollbackEntry returns false for non-existent id', () => {
    const result = removeRollbackEntry(tmpDir, projectId, 'ghost-id');
    expect(result).toBe(false);
  });
});
