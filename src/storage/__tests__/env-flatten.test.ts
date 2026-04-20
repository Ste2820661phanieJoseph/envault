import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  flattenObject,
  flattenEnvMap,
  flattenEnvFile,
} from '../env-flatten';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-flatten-'));
}

describe('flattenObject', () => {
  it('flattens a nested object with default separator and uppercase', () => {
    const obj = { db: { host: 'localhost', port: 5432 } };
    const result = flattenObject(obj);
    expect(result).toEqual({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
    });
  });

  it('applies a custom prefix', () => {
    const obj = { host: 'localhost' };
    const result = flattenObject(obj, { prefix: 'APP' });
    expect(result).toEqual({ APP_HOST: 'localhost' });
  });

  it('preserves lowercase when uppercase is false', () => {
    const obj = { api: { key: 'abc' } };
    const result = flattenObject(obj, { uppercase: false });
    expect(result).toEqual({ api_key: 'abc' });
  });

  it('joins array values with commas', () => {
    const obj = { allowed: ['a', 'b', 'c'] };
    const result = flattenObject(obj);
    expect(result).toEqual({ ALLOWED: 'a,b,c' });
  });

  it('handles null values as empty string', () => {
    const obj = { token: null };
    const result = flattenObject(obj as Record<string, unknown>);
    expect(result).toEqual({ TOKEN: '' });
  });
});

describe('flattenEnvMap', () => {
  it('normalizes keys by removing duplicate separators', () => {
    const envMap = { DB__HOST: 'localhost', API__KEY: 'secret' };
    const result = flattenEnvMap(envMap, { separator: '_' });
    expect(result['DB_HOST']).toBe('localhost');
    expect(result['API_KEY']).toBe('secret');
  });

  it('uppercases keys by default', () => {
    const envMap = { db_host: 'localhost' };
    const result = flattenEnvMap(envMap);
    expect(result['DB_HOST']).toBe('localhost');
  });

  it('preserves values unchanged', () => {
    const envMap = { SECRET_KEY: 'my-secret-value' };
    const result = flattenEnvMap(envMap);
    expect(result['SECRET_KEY']).toBe('my-secret-value');
  });
});

describe('flattenEnvFile', () => {
  it('reads, flattens, and writes an env file', async () => {
    const tmpDir = makeTmpDir();
    const inputPath = path.join(tmpDir, '.env');
    const outputPath = path.join(tmpDir, '.env.flat');

    await fs.promises.writeFile(
      inputPath,
      'db_host=localhost\napi_key=secret\n',
      'utf-8'
    );

    const result = await flattenEnvFile(inputPath, outputPath);

    expect(result['DB_HOST']).toBe('localhost');
    expect(result['API_KEY']).toBe('secret');

    const written = await fs.promises.readFile(outputPath, 'utf-8');
    expect(written).toContain('DB_HOST=localhost');
    expect(written).toContain('API_KEY=secret');
  });

  it('creates output directory if it does not exist', async () => {
    const tmpDir = makeTmpDir();
    const inputPath = path.join(tmpDir, '.env');
    const outputPath = path.join(tmpDir, 'nested', 'dir', '.env.flat');

    await fs.promises.writeFile(inputPath, 'FOO=bar\n', 'utf-8');
    await flattenEnvFile(inputPath, outputPath);

    const exists = fs.existsSync(outputPath);
    expect(exists).toBe(true);
  });
});
