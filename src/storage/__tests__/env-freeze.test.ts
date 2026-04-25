import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  freezeEnvKeys,
  unfreezeEnvKeys,
  applyFreezeGuard,
  getFrozenKeys,
  freezeEnvFile,
  loadFrozenKeys,
  saveFrozenKeys,
} from '../env-freeze';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-freeze-'));
}

describe('freezeEnvKeys', () => {
  it('marks existing keys as frozen', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const { frozen, result } = freezeEnvKeys(env, ['FOO']);
    expect(frozen.has('FOO')).toBe(true);
    expect(result.frozen).toEqual(['FOO']);
    expect(result.skipped).toEqual([]);
  });

  it('skips keys not in envMap', () => {
    const env = { FOO: 'bar' };
    const { result } = freezeEnvKeys(env, ['MISSING']);
    expect(result.skipped).toEqual(['MISSING']);
    expect(result.frozen).toEqual([]);
  });

  it('preserves existing frozen keys', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const existing = new Set(['BAZ']);
    const { frozen } = freezeEnvKeys(env, ['FOO'], existing);
    expect(frozen.has('BAZ')).toBe(true);
    expect(frozen.has('FOO')).toBe(true);
  });
});

describe('unfreezeEnvKeys', () => {
  it('removes keys from frozen set', () => {
    const frozen = new Set(['FOO', 'BAR']);
    const { frozen: newFrozen, unfrozen } = unfreezeEnvKeys({}, ['FOO'], frozen);
    expect(newFrozen.has('FOO')).toBe(false);
    expect(newFrozen.has('BAR')).toBe(true);
    expect(unfrozen).toEqual(['FOO']);
  });

  it('ignores keys not in frozen set', () => {
    const frozen = new Set(['FOO']);
    const { unfrozen } = unfreezeEnvKeys({}, ['MISSING'], frozen);
    expect(unfrozen).toEqual([]);
  });
});

describe('applyFreezeGuard', () => {
  it('restores frozen keys from existing map', () => {
    const incoming = { FOO: 'changed', BAR: 'new' };
    const existing = { FOO: 'original', BAR: 'old' };
    const frozen = new Set(['FOO']);
    const result = applyFreezeGuard(incoming, existing, frozen);
    expect(result.FOO).toBe('original');
    expect(result.BAR).toBe('new');
  });
});

describe('getFrozenKeys', () => {
  it('returns only frozen keys present in envMap', () => {
    const envMap = { FOO: '1', BAR: '2' };
    const frozen = new Set(['FOO', 'MISSING']);
    expect(getFrozenKeys(envMap, frozen)).toEqual(['FOO']);
  });
});

describe('freezeEnvFile / loadFrozenKeys / saveFrozenKeys', () => {
  it('persists and loads frozen keys', () => {
    const dir = makeTmpDir();
    const storePath = path.join(dir, '.frozen');
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n');

    const result = freezeEnvFile(envFile, ['FOO', 'BAZ'], storePath);
    expect(result.frozen).toContain('FOO');
    expect(result.frozen).toContain('BAZ');

    const loaded = loadFrozenKeys(storePath);
    expect(loaded.has('FOO')).toBe(true);
    expect(loaded.has('BAZ')).toBe(true);
  });

  it('returns empty set when store does not exist', () => {
    const dir = makeTmpDir();
    const loaded = loadFrozenKeys(path.join(dir, 'nonexistent'));
    expect(loaded.size).toBe(0);
  });
});
