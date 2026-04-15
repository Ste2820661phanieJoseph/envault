import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  applyTransform,
  transformEnvFile,
  writeTransformedEnv,
  TransformRule,
} from '../env-transform';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-transform-'));
}

describe('applyTransform', () => {
  const base = { DB_HOST: 'localhost', DB_PASS: 'secret', API_KEY: 'abc123' };

  it('uppercase-keys transforms all keys', () => {
    const result = applyTransform({ db_host: 'localhost' }, { type: 'uppercase-keys' });
    expect(result).toEqual({ DB_HOST: 'localhost' });
  });

  it('lowercase-values lowercases values', () => {
    const result = applyTransform({ KEY: 'HELLO' }, { type: 'lowercase-values' });
    expect(result).toEqual({ KEY: 'hello' });
  });

  it('prefix adds prefix to all keys', () => {
    const result = applyTransform({ HOST: 'localhost' }, { type: 'prefix', options: { prefix: 'APP_' } });
    expect(result).toHaveProperty('APP_HOST', 'localhost');
  });

  it('strip-prefix removes prefix from matching keys', () => {
    const result = applyTransform({ APP_HOST: 'localhost', OTHER: 'val' }, { type: 'strip-prefix', options: { prefix: 'APP_' } });
    expect(result).toHaveProperty('HOST', 'localhost');
    expect(result).toHaveProperty('OTHER', 'val');
  });

  it('mask replaces specified key values with ***', () => {
    const result = applyTransform(base, { type: 'mask', options: { keys: 'DB_PASS,API_KEY' } });
    expect(result.DB_PASS).toBe('***');
    expect(result.API_KEY).toBe('***');
    expect(result.DB_HOST).toBe('localhost');
  });

  it('rename renames a specific key', () => {
    const result = applyTransform({ OLD_KEY: 'value', OTHER: 'x' }, { type: 'rename', options: { from: 'OLD_KEY', to: 'NEW_KEY' } });
    expect(result).toHaveProperty('NEW_KEY', 'value');
    expect(result).not.toHaveProperty('OLD_KEY');
    expect(result).toHaveProperty('OTHER', 'x');
  });
});

describe('transformEnvFile', () => {
  it('reads a file and applies rules', () => {
    const tmp = makeTmpDir();
    const file = path.join(tmp, '.env');
    fs.writeFileSync(file, 'db_host=localhost\ndb_pass=secret\n');

    const result = transformEnvFile(file, [{ type: 'uppercase-keys' }]);
    expect(result).toHaveProperty('DB_HOST', 'localhost');
    expect(result).toHaveProperty('DB_PASS', 'secret');
  });

  it('applies multiple rules in sequence', () => {
    const tmp = makeTmpDir();
    const file = path.join(tmp, '.env');
    fs.writeFileSync(file, 'host=LOCALHOST\n');

    const result = transformEnvFile(file, [
      { type: 'uppercase-keys' },
      { type: 'lowercase-values' },
    ]);
    expect(result).toEqual({ HOST: 'localhost' });
  });
});

describe('writeTransformedEnv', () => {
  it('writes serialized env to output path', () => {
    const tmp = makeTmpDir();
    const out = path.join(tmp, 'out', '.env');
    writeTransformedEnv({ KEY: 'value' }, out);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('KEY=value');
  });
});
