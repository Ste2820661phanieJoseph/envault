import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addPrefixToEnvMap,
  removePrefixFromEnvMap,
  filterByPrefix,
  addPrefixToFile,
  removePrefixFromFile,
  writePrefixedEnv,
} from '../env-prefix';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-prefix-'));
}

describe('addPrefixToEnvMap', () => {
  it('adds prefix to all keys', () => {
    const result = addPrefixToEnvMap({ FOO: 'bar', BAZ: 'qux' }, 'APP_');
    expect(result).toEqual({ APP_FOO: 'bar', APP_BAZ: 'qux' });
  });

  it('returns empty object for empty input', () => {
    expect(addPrefixToEnvMap({}, 'X_')).toEqual({});
  });
});

describe('removePrefixFromEnvMap', () => {
  it('removes prefix from matching keys', () => {
    const result = removePrefixFromEnvMap({ APP_FOO: 'bar', APP_BAZ: 'qux' }, 'APP_');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('leaves keys without the prefix unchanged', () => {
    const result = removePrefixFromEnvMap({ APP_FOO: 'bar', OTHER: 'val' }, 'APP_');
    expect(result).toEqual({ FOO: 'bar', OTHER: 'val' });
  });

  it('returns empty object for empty input', () => {
    expect(removePrefixFromEnvMap({}, 'X_')).toEqual({});
  });
});

describe('filterByPrefix', () => {
  it('returns only keys with the given prefix', () => {
    const result = filterByPrefix({ APP_FOO: '1', APP_BAR: '2', OTHER: '3' }, 'APP_');
    expect(result).toEqual({ APP_FOO: '1', APP_BAR: '2' });
  });

  it('returns empty object when no keys match', () => {
    expect(filterByPrefix({ FOO: 'bar' }, 'X_')).toEqual({});
  });
});

describe('file-based prefix operations', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('addPrefixToFile reads file and adds prefix', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n', 'utf-8');
    const result = addPrefixToFile(file, 'APP_');
    expect(result).toEqual({ APP_FOO: 'bar', APP_BAZ: 'qux' });
  });

  it('removePrefixFromFile reads file and removes prefix', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'APP_FOO=bar\nAPP_BAZ=qux\n', 'utf-8');
    const result = removePrefixFromFile(file, 'APP_');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('writePrefixedEnv writes serialized env to file', () => {
    const file = path.join(tmpDir, '.env.out');
    writePrefixedEnv(file, { APP_FOO: 'bar', APP_BAZ: 'qux' });
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('APP_FOO=bar');
    expect(content).toContain('APP_BAZ=qux');
  });
});
