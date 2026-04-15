import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { applyTransform, transformEnvFile, writeTransformedEnv } from '../env-transform';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-transform-'));
}

describe('applyTransform', () => {
  const sample = { api_key: 'secret123', db_host: 'localhost' };

  it('uppercase-keys transforms all keys to uppercase', () => {
    const result = applyTransform(sample, { type: 'uppercase-keys' });
    expect(result).toEqual({ API_KEY: 'secret123', DB_HOST: 'localhost' });
  });

  it('lowercase-keys transforms all keys to lowercase', () => {
    const input = { API_KEY: 'secret123', DB_HOST: 'localhost' };
    const result = applyTransform(input, { type: 'lowercase-keys' });
    expect(result).toEqual({ api_key: 'secret123', db_host: 'localhost' });
  });

  it('prefix adds prefix to all keys', () => {
    const result = applyTransform(sample, { type: 'prefix', prefix: 'APP_' });
    expect(result).toHaveProperty('APP_api_key', 'secret123');
    expect(result).toHaveProperty('APP_db_host', 'localhost');
  });

  it('strip-prefix removes prefix from matching keys', () => {
    const input = { APP_api_key: 'secret123', APP_db_host: 'localhost', other: 'val' };
    const result = applyTransform(input, { type: 'strip-prefix', prefix: 'APP_' });
    expect(result).toHaveProperty('api_key', 'secret123');
    expect(result).toHaveProperty('db_host', 'localhost');
    expect(result).toHaveProperty('other', 'val');
  });

  it('mask-values replaces values with asterisks', () => {
    const result = applyTransform(sample, { type: 'mask-values' });
    expect(result['api_key']).toBe('*'.repeat('secret123'.length));
    expect(result['db_host']).toBe('*'.repeat('localhost'.length));
  });

  it('mask-values uses custom maskChar', () => {
    const result = applyTransform({ key: 'abc' }, { type: 'mask-values', maskChar: '#' });
    expect(result['key']).toBe('###');
  });

  it('mask-values handles empty string value', () => {
    const result = applyTransform({ key: '' }, { type: 'mask-values' });
    expect(result['key']).toBe('');
  });
});

describe('transformEnvFile', () => {
  it('reads and transforms a .env file', () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, '.env');
    fs.writeFileSync(filePath, 'API_KEY=secret\nDB_HOST=localhost\n', 'utf-8');
    const result = transformEnvFile(filePath, { type: 'lowercase-keys' });
    expect(result).toHaveProperty('api_key', 'secret');
    expect(result).toHaveProperty('db_host', 'localhost');
    fs.rmSync(dir, { recursive: true });
  });
});

describe('writeTransformedEnv', () => {
  it('writes transformed env to output file', () => {
    const dir = makeTmpDir();
    const inputPath = path.join(dir, '.env');
    const outputPath = path.join(dir, 'out', '.env.transformed');
    fs.writeFileSync(inputPath, 'api_key=secret\ndb_host=localhost\n', 'utf-8');
    writeTransformedEnv(inputPath, outputPath, { type: 'uppercase-keys' });
    const contents = fs.readFileSync(outputPath, 'utf-8');
    expect(contents).toContain('API_KEY=secret');
    expect(contents).toContain('DB_HOST=localhost');
    fs.rmSync(dir, { recursive: true });
  });
});
