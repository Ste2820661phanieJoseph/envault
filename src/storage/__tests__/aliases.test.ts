import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAliasesPath,
  loadAliases,
  saveAliases,
  addAlias,
  removeAlias,
  resolveAlias,
  listAliases,
} from '../aliases';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-aliases-'));
}

describe('aliases storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getAliasesPath returns correct path', () => {
    expect(getAliasesPath(tmpDir)).toBe(path.join(tmpDir, 'aliases.json'));
  });

  it('loadAliases returns empty object when file missing', () => {
    expect(loadAliases(tmpDir)).toEqual({});
  });

  it('saveAliases and loadAliases round-trip', () => {
    const data = { prod: 'production', dev: 'development' };
    saveAliases(tmpDir, data);
    expect(loadAliases(tmpDir)).toEqual(data);
  });

  it('addAlias creates a new alias', () => {
    const result = addAlias(tmpDir, 'stg', 'staging');
    expect(result).toEqual({ stg: 'staging' });
    expect(loadAliases(tmpDir)).toEqual({ stg: 'staging' });
  });

  it('addAlias overwrites an existing alias', () => {
    addAlias(tmpDir, 'stg', 'staging');
    const result = addAlias(tmpDir, 'stg', 'staging-v2');
    expect(result['stg']).toBe('staging-v2');
  });

  it('removeAlias deletes an existing alias', () => {
    addAlias(tmpDir, 'stg', 'staging');
    const result = removeAlias(tmpDir, 'stg');
    expect(result).toEqual({});
  });

  it('removeAlias throws when alias not found', () => {
    expect(() => removeAlias(tmpDir, 'nonexistent')).toThrow(
      'Alias "nonexistent" does not exist.'
    );
  });

  it('resolveAlias returns profile name when alias exists', () => {
    addAlias(tmpDir, 'p', 'production');
    expect(resolveAlias(tmpDir, 'p')).toBe('production');
  });

  it('resolveAlias returns input unchanged when alias not found', () => {
    expect(resolveAlias(tmpDir, 'production')).toBe('production');
  });

  it('listAliases returns all aliases', () => {
    addAlias(tmpDir, 'a', 'alpha');
    addAlias(tmpDir, 'b', 'beta');
    expect(listAliases(tmpDir)).toEqual({ a: 'alpha', b: 'beta' });
  });
});
