import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getIgnorePath,
  loadIgnore,
  saveIgnore,
  addIgnorePattern,
  removeIgnorePattern,
  isIgnored,
  filterIgnored,
} from '../ignore';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ignore-test-'));
}

describe('ignore storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty patterns when no ignore file exists', () => {
    const config = loadIgnore(tmpDir);
    expect(config.patterns).toEqual([]);
  });

  it('saves and loads patterns correctly', () => {
    saveIgnore(tmpDir, { patterns: ['SECRET_*', 'INTERNAL_KEY'] });
    const config = loadIgnore(tmpDir);
    expect(config.patterns).toEqual(['SECRET_*', 'INTERNAL_KEY']);
  });

  it('ignores comment lines and blank lines when loading', () => {
    const filePath = getIgnorePath(tmpDir);
    fs.writeFileSync(filePath, '# comment\nSECRET_KEY\n\nINTERNAL\n', 'utf-8');
    const config = loadIgnore(tmpDir);
    expect(config.patterns).toEqual(['SECRET_KEY', 'INTERNAL']);
  });

  it('adds a new pattern without duplicates', () => {
    addIgnorePattern(tmpDir, 'DEBUG_*');
    addIgnorePattern(tmpDir, 'DEBUG_*');
    const config = loadIgnore(tmpDir);
    expect(config.patterns.filter((p) => p === 'DEBUG_*')).toHaveLength(1);
  });

  it('removes an existing pattern', () => {
    addIgnorePattern(tmpDir, 'REMOVE_ME');
    addIgnorePattern(tmpDir, 'KEEP_ME');
    removeIgnorePattern(tmpDir, 'REMOVE_ME');
    const config = loadIgnore(tmpDir);
    expect(config.patterns).not.toContain('REMOVE_ME');
    expect(config.patterns).toContain('KEEP_ME');
  });

  it('isIgnored matches exact keys', () => {
    expect(isIgnored('SECRET_KEY', ['SECRET_KEY'])).toBe(true);
    expect(isIgnored('OTHER_KEY', ['SECRET_KEY'])).toBe(false);
  });

  it('isIgnored matches prefix wildcard', () => {
    expect(isIgnored('SECRET_TOKEN', ['SECRET_*'])).toBe(true);
    expect(isIgnored('PUBLIC_TOKEN', ['SECRET_*'])).toBe(false);
  });

  it('isIgnored matches suffix wildcard', () => {
    expect(isIgnored('MY_SECRET', ['*_SECRET'])).toBe(true);
    expect(isIgnored('MY_KEY', ['*_SECRET'])).toBe(false);
  });

  it('filterIgnored removes matching keys from env object', () => {
    const env = { SECRET_KEY: 'val1', PUBLIC_URL: 'val2', SECRET_TOKEN: 'val3' };
    const result = filterIgnored(env, ['SECRET_*']);
    expect(result).toEqual({ PUBLIC_URL: 'val2' });
  });
});
