import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { renameEnvKey, renameEnvFile } from '../env-rename';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rename-'));
}

describe('renameEnvKey', () => {
  it('renames an existing key preserving value', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const { result, info } = renameEnvKey(env, 'FOO', 'FOO_NEW');
    expect(info.success).toBe(true);
    expect(result['FOO_NEW']).toBe('bar');
    expect('FOO' in result).toBe(false);
    expect(result['BAZ']).toBe('qux');
  });

  it('preserves key order', () => {
    const env = { A: '1', B: '2', C: '3' };
    const { result } = renameEnvKey(env, 'B', 'B_RENAMED');
    expect(Object.keys(result)).toEqual(['A', 'B_RENAMED', 'C']);
  });

  it('fails when old key does not exist', () => {
    const env = { FOO: 'bar' };
    const { result, info } = renameEnvKey(env, 'MISSING', 'NEW');
    expect(info.success).toBe(false);
    expect(info.message).toMatch(/not found/);
    expect(result).toEqual(env);
  });

  it('fails when new key already exists', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const { info } = renameEnvKey(env, 'FOO', 'BAZ');
    expect(info.success).toBe(false);
    expect(info.message).toMatch(/already exists/);
  });

  it('fails when new key is not a valid env variable name', () => {
    const env = { FOO: 'bar' };
    const { info } = renameEnvKey(env, 'FOO', '1INVALID');
    expect(info.success).toBe(false);
    expect(info.message).toMatch(/not a valid/);
  });
});

describe('renameEnvFile', () => {
  it('renames a key in an env file', async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n');

    const result = await renameEnvFile(file, 'FOO', 'FOO_RENAMED');
    expect(result.success).toBe(true);

    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('FOO_RENAMED=bar');
    expect(content).not.toContain('FOO=bar');
    expect(content).toContain('BAZ=qux');
  });

  it('does not modify file on failure', async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    const original = 'FOO=bar\n';
    fs.writeFileSync(file, original);

    const result = await renameEnvFile(file, 'MISSING', 'NEW');
    expect(result.success).toBe(false);

    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toBe(original);
  });
});
