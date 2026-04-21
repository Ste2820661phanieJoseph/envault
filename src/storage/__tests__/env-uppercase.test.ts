import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  uppercaseEnvKeys,
  uppercaseEnvFile,
  writeUppercasedEnv,
} from '../env-uppercase';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-uppercase-'));
}

describe('uppercaseEnvKeys', () => {
  it('converts all keys to uppercase', () => {
    const result = uppercaseEnvKeys({ foo: 'bar', baz: 'qux' });
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('preserves values unchanged', () => {
    const result = uppercaseEnvKeys({ Api_Key: 'secret123' });
    expect(result['API_KEY']).toBe('secret123');
  });

  it('throws on key collision after uppercasing', () => {
    expect(() =>
      uppercaseEnvKeys({ foo: 'a', FOO: 'b' })
    ).toThrow(/collision/i);
  });

  it('returns empty object for empty input', () => {
    expect(uppercaseEnvKeys({})).toEqual({});
  });
});

describe('uppercaseEnvFile', () => {
  it('reads and uppercases keys from a file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'db_host=localhost\ndb_port=5432\n');
    const result = uppercaseEnvFile(file);
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('throws when file does not exist', () => {
    expect(() => uppercaseEnvFile('/nonexistent/.env')).toThrow(
      /not found/i
    );
  });
});

describe('writeUppercasedEnv', () => {
  it('overwrites source file when no output path given', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'my_var=hello\n');
    writeUppercasedEnv(file);
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('MY_VAR=hello');
    expect(content).not.toContain('my_var');
  });

  it('writes to a separate output file when provided', () => {
    const dir = makeTmpDir();
    const src = path.join(dir, '.env');
    const dest = path.join(dir, '.env.upper');
    fs.writeFileSync(src, 'node_env=production\n');
    writeUppercasedEnv(src, dest);
    expect(fs.existsSync(dest)).toBe(true);
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('NODE_ENV=production');
    // source should be unchanged
    expect(fs.readFileSync(src, 'utf-8')).toContain('node_env=production');
  });
});
