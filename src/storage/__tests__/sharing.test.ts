import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getSharingPath,
  loadSharing,
  saveSharing,
  addShare,
  removeShare,
  listShares,
  isShareExpired,
  ShareEntry,
} from '../sharing';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sharing-'));
}

function makeEntry(overrides: Partial<ShareEntry> = {}): ShareEntry {
  return {
    id: 'share-1',
    projectId: 'proj-abc',
    sharedWith: 'alice@example.com',
    sharedBy: 'bob@example.com',
    createdAt: new Date().toISOString(),
    permissions: 'read',
    ...overrides,
  };
}

describe('sharing storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty config when no file exists', () => {
    const config = loadSharing(tmpDir);
    expect(config.shares).toEqual([]);
  });

  it('saves and loads sharing config', () => {
    const entry = makeEntry();
    saveSharing(tmpDir, { shares: [entry] });
    const config = loadSharing(tmpDir);
    expect(config.shares).toHaveLength(1);
    expect(config.shares[0].sharedWith).toBe('alice@example.com');
  });

  it('adds a share entry', () => {
    addShare(tmpDir, makeEntry());
    const config = loadSharing(tmpDir);
    expect(config.shares).toHaveLength(1);
  });

  it('throws when adding duplicate share', () => {
    addShare(tmpDir, makeEntry());
    expect(() => addShare(tmpDir, makeEntry())).toThrow(/Already shared/);
  });

  it('removes a share by id', () => {
    addShare(tmpDir, makeEntry());
    removeShare(tmpDir, 'share-1');
    expect(loadSharing(tmpDir).shares).toHaveLength(0);
  });

  it('throws when removing non-existent share', () => {
    expect(() => removeShare(tmpDir, 'nonexistent')).toThrow(/not found/);
  });

  it('lists shares filtered by projectId', () => {
    addShare(tmpDir, makeEntry({ id: 's1', projectId: 'p1', sharedWith: 'a@x.com' }));
    addShare(tmpDir, makeEntry({ id: 's2', projectId: 'p2', sharedWith: 'b@x.com' }));
    expect(listShares(tmpDir, 'p1')).toHaveLength(1);
    expect(listShares(tmpDir)).toHaveLength(2);
  });

  it('detects expired shares', () => {
    const expired = makeEntry({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    const valid = makeEntry({ expiresAt: new Date(Date.now() + 100000).toISOString() });
    expect(isShareExpired(expired)).toBe(true);
    expect(isShareExpired(valid)).toBe(false);
  });

  it('getSharingPath returns correct path', () => {
    expect(getSharingPath('/some/dir')).toBe('/some/dir/sharing.json');
  });
});
