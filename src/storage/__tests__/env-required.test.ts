import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  checkRequiredKeys,
  checkRequiredKeysInFile,
  formatRequiredResult,
} from '../env-required';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-required-'));
}

describe('checkRequiredKeys', () => {
  it('returns allPresent=true when all keys exist with values', () => {
    const env = { API_KEY: 'abc', DB_URL: 'postgres://localhost' };
    const result = checkRequiredKeys(env, ['API_KEY', 'DB_URL']);
    expect(result.allPresent).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.present).toEqual(['API_KEY', 'DB_URL']);
  });

  it('reports missing keys that are absent', () => {
    const env = { API_KEY: 'abc' };
    const result = checkRequiredKeys(env, ['API_KEY', 'DB_URL']);
    expect(result.allPresent).toBe(false);
    expect(result.missing).toContain('DB_URL');
    expect(result.present).toContain('API_KEY');
  });

  it('treats empty string values as missing', () => {
    const env = { API_KEY: '' };
    const result = checkRequiredKeys(env, ['API_KEY']);
    expect(result.allPresent).toBe(false);
    expect(result.missing).toContain('API_KEY');
  });

  it('returns allPresent=true for empty required list', () => {
    const result = checkRequiredKeys({ FOO: 'bar' }, []);
    expect(result.allPresent).toBe(true);
  });
});

describe('checkRequiredKeysInFile', () => {
  it('returns all missing when file does not exist', () => {
    const result = checkRequiredKeysInFile('/nonexistent/.env', ['KEY1', 'KEY2']);
    expect(result.missing).toEqual(['KEY1', 'KEY2']);
    expect(result.allPresent).toBe(false);
  });

  it('reads env file and checks keys', () => {
    const tmpDir = makeTmpDir();
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'API_KEY=secret\nDB_URL=postgres://localhost\n');
    const result = checkRequiredKeysInFile(envFile, ['API_KEY', 'DB_URL', 'MISSING']);
    expect(result.present).toContain('API_KEY');
    expect(result.present).toContain('DB_URL');
    expect(result.missing).toContain('MISSING');
  });
});

describe('formatRequiredResult', () => {
  it('formats success message', () => {
    const result = { missing: [], present: ['A', 'B'], allPresent: true };
    const output = formatRequiredResult(result);
    expect(output).toContain('All required keys are present.');
    expect(output).toContain('Present (2)');
  });

  it('formats missing keys', () => {
    const result = { missing: ['SECRET'], present: [], allPresent: false };
    const output = formatRequiredResult(result);
    expect(output).toContain('Missing required keys (1)');
    expect(output).toContain('- SECRET');
  });
});
