import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { redactEnvMap, redactEnvFile, writeRedactedEnv } from '../env-redact';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-redact-'));
}

describe('redactEnvMap', () => {
  it('redacts keys matching default patterns', () => {
    const env = { API_KEY: '123', DB_PASSWORD: 'secret', HOST: 'localhost' };
    const result = redactEnvMap(env);
    expect(result.API_KEY).toBe('***REDACTED***');
    expect(result.DB_PASSWORD).toBe('***REDACTED***');
    expect(result.HOST).toBe('localhost');
  });

  it('uses custom placeholder', () => {
    const env = { SECRET: 'abc' };
    const result = redactEnvMap(env, undefined, '[HIDDEN]');
    expect(result.SECRET).toBe('[HIDDEN]');
  });

  it('uses custom patterns', () => {
    const env = { MY_CUSTOM: 'value', OTHER: 'keep' };
    const result = redactEnvMap(env, [/my_custom/i]);
    expect(result.MY_CUSTOM).toBe('***REDACTED***');
    expect(result.OTHER).toBe('keep');
  });

  it('leaves non-sensitive keys unchanged', () => {
    const env = { NODE_ENV: 'production', PORT: '3000' };
    const result = redactEnvMap(env);
    expect(result.NODE_ENV).toBe('production');
    expect(result.PORT).toBe('3000');
  });
});

describe('redactEnvFile', () => {
  it('reads and redacts a file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'TOKEN=abc\nHOST=localhost\n');
    const result = redactEnvFile(file);
    expect(result.TOKEN).toBe('***REDACTED***');
    expect(result.HOST).toBe('localhost');
  });
});

describe('writeRedactedEnv', () => {
  it('writes redacted env to output file', () => {
    const dir = makeTmpDir();
    const inFile = path.join(dir, '.env');
    const outFile = path.join(dir, '.env.redacted');
    fs.writeFileSync(inFile, 'API_KEY=secret\nPORT=8080\n');
    writeRedactedEnv(inFile, outFile);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('***REDACTED***');
    expect(content).toContain('PORT=8080');
  });
});
