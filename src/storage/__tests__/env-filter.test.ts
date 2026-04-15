import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { filterEnvMap, filterEnvFile, writeFilteredEnv } from '../env-filter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-filter-'));
}

describe('filterEnvMap', () => {
  const env = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    API_KEY: 'secret',
    API_URL: 'https://example.com',
    DEBUG: 'true',
  };

  it('returns all keys when no filter options are specified', () => {
    expect(filterEnvMap(env, {})).toEqual(env);
  });

  it('filters by specific keys', () => {
    const result = filterEnvMap(env, { keys: ['DB_HOST', 'DEBUG'] });
    expect(result).toEqual({ DB_HOST: 'localhost', DEBUG: 'true' });
  });

  it('filters by prefix', () => {
    const result = filterEnvMap(env, { prefix: 'DB_' });
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('filters by suffix', () => {
    const result = filterEnvMap(env, { suffix: '_KEY' });
    expect(result).toEqual({ API_KEY: 'secret' });
  });

  it('filters by regex pattern', () => {
    const result = filterEnvMap(env, { pattern: /^API_/ });
    expect(result).toEqual({ API_KEY: 'secret', API_URL: 'https://example.com' });
  });

  it('excludes specific keys', () => {
    const result = filterEnvMap(env, { excludeKeys: ['DEBUG', 'API_KEY'] });
    expect(result).not.toHaveProperty('DEBUG');
    expect(result).not.toHaveProperty('API_KEY');
    expect(result).toHaveProperty('DB_HOST');
  });

  it('excludes by prefix', () => {
    const result = filterEnvMap(env, { excludePrefix: 'API_' });
    expect(result).not.toHaveProperty('API_KEY');
    expect(result).not.toHaveProperty('API_URL');
    expect(result).toHaveProperty('DB_HOST');
  });

  it('exclusion takes priority over inclusion', () => {
    const result = filterEnvMap(env, { prefix: 'DB_', excludeKeys: ['DB_HOST'] });
    expect(result).toEqual({ DB_PORT: '5432' });
  });
});

describe('filterEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('filters keys from a file', () => {
    const filePath = path.join(tmpDir, '.env');
    fs.writeFileSync(filePath, 'DB_HOST=localhost\nAPI_KEY=secret\nDEBUG=true\n');
    const result = filterEnvFile(filePath, { prefix: 'DB_' });
    expect(result).toEqual({ DB_HOST: 'localhost' });
  });

  it('throws if file does not exist', () => {
    expect(() => filterEnvFile(path.join(tmpDir, 'missing.env'), {})).toThrow('File not found');
  });
});

describe('writeFilteredEnv', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('writes filtered env to output file', () => {
    const inputPath = path.join(tmpDir, '.env');
    const outputPath = path.join(tmpDir, '.env.filtered');
    fs.writeFileSync(inputPath, 'DB_HOST=localhost\nAPI_KEY=secret\n');
    const result = writeFilteredEnv(inputPath, outputPath, { prefix: 'DB_' });
    expect(result).toEqual({ DB_HOST: 'localhost' });
    const written = fs.readFileSync(outputPath, 'utf-8');
    expect(written).toContain('DB_HOST=localhost');
    expect(written).not.toContain('API_KEY');
  });
});
