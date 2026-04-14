import { compareEnvMaps, compareEnvFiles, hasDifferences } from '../compare';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compare-'));
}

describe('compareEnvMaps', () => {
  it('detects keys only in A', () => {
    const result = compareEnvMaps({ FOO: '1', BAR: '2' }, { FOO: '1' });
    expect(result.onlyInA).toEqual({ BAR: '2' });
    expect(result.unchanged).toEqual({ FOO: '1' });
  });

  it('detects keys only in B', () => {
    const result = compareEnvMaps({ FOO: '1' }, { FOO: '1', BAZ: '3' });
    expect(result.onlyInB).toEqual({ BAZ: '3' });
  });

  it('detects changed values', () => {
    const result = compareEnvMaps({ FOO: 'old' }, { FOO: 'new' });
    expect(result.changed).toEqual({ FOO: { a: 'old', b: 'new' } });
  });

  it('detects unchanged values', () => {
    const result = compareEnvMaps({ FOO: 'same' }, { FOO: 'same' });
    expect(result.unchanged).toEqual({ FOO: 'same' });
    expect(Object.keys(result.changed)).toHaveLength(0);
  });

  it('handles empty maps', () => {
    const result = compareEnvMaps({}, {});
    expect(hasDifferences(result)).toBe(false);
  });
});

describe('compareEnvFiles', () => {
  it('compares two env files on disk', () => {
    const dir = makeTmpDir();
    const fileA = path.join(dir, '.env.a');
    const fileB = path.join(dir, '.env.b');
    fs.writeFileSync(fileA, 'FOO=1\nBAR=2\n');
    fs.writeFileSync(fileB, 'FOO=1\nBAZ=3\n');
    const result = compareEnvFiles(fileA, fileB);
    expect(result.unchanged).toEqual({ FOO: '1' });
    expect(result.onlyInA).toEqual({ BAR: '2' });
    expect(result.onlyInB).toEqual({ BAZ: '3' });
  });

  it('treats missing file as empty', () => {
    const dir = makeTmpDir();
    const fileA = path.join(dir, '.env.a');
    const fileB = path.join(dir, '.env.missing');
    fs.writeFileSync(fileA, 'FOO=bar\n');
    const result = compareEnvFiles(fileA, fileB);
    expect(result.onlyInA).toEqual({ FOO: 'bar' });
  });
});

describe('hasDifferences', () => {
  it('returns false when all keys unchanged', () => {
    const result = compareEnvMaps({ A: '1' }, { A: '1' });
    expect(hasDifferences(result)).toBe(false);
  });

  it('returns true when there are differences', () => {
    const result = compareEnvMaps({ A: '1' }, { A: '2' });
    expect(hasDifferences(result)).toBe(true);
  });
});
