import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { maskValue, maskEnvMap, maskEnvFile, writeMaskedEnv } from '../env-mask';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-mask-'));
}

describe('maskValue', () => {
  it('masks entire value by default', () => {
    expect(maskValue('supersecret')).toBe('***********');
  });

  it('uses custom mask character', () => {
    expect(maskValue('abc', '#')).toBe('###');
  });

  it('reveals last N characters', () => {
    expect(maskValue('supersecret', '*', 4)).toBe('*******cret');
  });

  it('returns empty string unchanged', () => {
    expect(maskValue('')).toBe('');
  });
});

describe('maskEnvMap', () => {
  const env = {
    DB_HOST: 'localhost',
    DB_PASSWORD: 'hunter2',
    API_KEY: 'abc123',
    APP_NAME: 'myapp',
  };

  it('masks keys matching default sensitive pattern', () => {
    const result = maskEnvMap(env);
    expect(result.DB_HOST).toBe('localhost');
    expect(result.APP_NAME).toBe('myapp');
    expect(result.DB_PASSWORD).toBe('*******');
    expect(result.API_KEY).toBe('******');
  });

  it('masks only specified keys', () => {
    const result = maskEnvMap(env, { keys: ['DB_HOST'] });
    expect(result.DB_HOST).toBe('*********');
    expect(result.DB_PASSWORD).toBe('hunter2');
  });

  it('respects showLast option', () => {
    const result = maskEnvMap(env, { showLast: 2 });
    expect(result.DB_PASSWORD).toBe('*****r2');
  });

  it('uses custom pattern', () => {
    const result = maskEnvMap(env, { pattern: /APP_NAME/ });
    expect(result.APP_NAME).toBe('*****');
    expect(result.DB_PASSWORD).toBe('hunter2');
  });
});

describe('maskEnvFile / writeMaskedEnv', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('reads and masks an env file', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'API_KEY=secret123\nAPP_NAME=myapp\n');
    const result = maskEnvFile(file);
    expect(result.API_KEY).toBe('*********');
    expect(result.APP_NAME).toBe('myapp');
  });

  it('writes masked values back to file', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'DB_PASSWORD=hunter2\nHOST=localhost\n');
    writeMaskedEnv(file);
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('DB_PASSWORD=*******');
    expect(content).toContain('HOST=localhost');
  });
});
