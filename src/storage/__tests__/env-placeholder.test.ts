import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectPlaceholders, fillPlaceholders, fillPlaceholdersInFile } from '../env-placeholder';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-placeholder-'));
}

describe('detectPlaceholders', () => {
  it('detects angle-bracket placeholders', () => {
    const result = detectPlaceholders({ API_KEY: '<YOUR_API_KEY>', DB_HOST: 'localhost' });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('API_KEY');
  });

  it('detects double-brace placeholders', () => {
    const result = detectPlaceholders({ TOKEN: '{{TOKEN}}' });
    expect(result[0].key).toBe('TOKEN');
  });

  it('detects CHANGE_ME values', () => {
    const result = detectPlaceholders({ SECRET: 'CHANGE_ME' });
    expect(result[0].key).toBe('SECRET');
  });

  it('detects empty string values', () => {
    const result = detectPlaceholders({ EMPTY: '' });
    expect(result[0].key).toBe('EMPTY');
  });

  it('does not flag real values', () => {
    const result = detectPlaceholders({ HOST: 'example.com', PORT: '3000' });
    expect(result).toHaveLength(0);
  });
});

describe('fillPlaceholders', () => {
  it('fills detected placeholder keys', () => {
    const env = { API_KEY: '<YOUR_API_KEY>', HOST: 'localhost' };
    const filled = fillPlaceholders(env, { API_KEY: 'real-key' });
    expect(filled.API_KEY).toBe('real-key');
    expect(filled.HOST).toBe('localhost');
  });

  it('does not overwrite real values', () => {
    const env = { HOST: 'localhost' };
    const filled = fillPlaceholders(env, { HOST: 'other' });
    expect(filled.HOST).toBe('localhost');
  });

  it('ignores values not in the provided map', () => {
    const env = { API_KEY: '<YOUR_API_KEY>' };
    const filled = fillPlaceholders(env, {});
    expect(filled.API_KEY).toBe('<YOUR_API_KEY>');
  });
});

describe('fillPlaceholdersInFile', () => {
  it('fills placeholders in a file and writes result', async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'API_KEY=<YOUR_API_KEY>\nHOST=localhost\n');
    const result = await fillPlaceholdersInFile(file, { API_KEY: 'secret' });
    expect(result.API_KEY).toBe('secret');
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('API_KEY=secret');
    expect(written).toContain('HOST=localhost');
    fs.rmSync(dir, { recursive: true });
  });
});
