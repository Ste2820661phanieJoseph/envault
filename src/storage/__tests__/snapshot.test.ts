import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getSnapshotsPath,
  loadSnapshots,
  createSnapshot,
  getSnapshot,
  deleteSnapshot,
  listSnapshots,
} from '../snapshot';
import { getVaultPath } from '../vault';

jest.mock('../vault', () => ({
  getVaultPath: jest.fn(),
}));

describe('snapshot storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-'));
    (getVaultPath as jest.Mock).mockReturnValue(
      path.join(tmpDir, 'vault.enc')
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no snapshots file exists', () => {
    const snaps = loadSnapshots('proj1');
    expect(snaps).toEqual([]);
  });

  it('creates a snapshot and persists it', () => {
    const snap = createSnapshot('proj1', 'encrypted-data-abc');
    expect(snap.id).toMatch(/^snap_/);
    expect(snap.encryptedData).toBe('encrypted-data-abc');
    expect(snap.projectId).toBe('proj1');
    expect(snap.label).toBeUndefined();

    const snaps = loadSnapshots('proj1');
    expect(snaps).toHaveLength(1);
    expect(snaps[0].id).toBe(snap.id);
  });

  it('creates a snapshot with a label', () => {
    const snap = createSnapshot('proj1', 'data', 'before-release');
    expect(snap.label).toBe('before-release');
  });

  it('retrieves a snapshot by id', () => {
    const snap = createSnapshot('proj1', 'data-xyz');
    const found = getSnapshot('proj1', snap.id);
    expect(found).toBeDefined();
    expect(found?.encryptedData).toBe('data-xyz');
  });

  it('returns undefined for unknown snapshot id', () => {
    const found = getSnapshot('proj1', 'nonexistent-id');
    expect(found).toBeUndefined();
  });

  it('deletes a snapshot by id', () => {
    const snap = createSnapshot('proj1', 'data');
    const result = deleteSnapshot('proj1', snap.id);
    expect(result).toBe(true);
    expect(loadSnapshots('proj1')).toHaveLength(0);
  });

  it('returns false when deleting nonexistent snapshot', () => {
    const result = deleteSnapshot('proj1', 'bad-id');
    expect(result).toBe(false);
  });

  it('lists all snapshots', () => {
    createSnapshot('proj1', 'data1', 'snap-one');
    createSnapshot('proj1', 'data2', 'snap-two');
    const snaps = listSnapshots('proj1');
    expect(snaps).toHaveLength(2);
    expect(snaps.map((s) => s.label)).toEqual(['snap-one', 'snap-two']);
  });
});
