import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  whitelistEnvMap,
  whitelistEnvFile,
  writeWhitelistedEnv,
} from '../env-whitelist';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-whitelist-'));
}

describe('whitelistEnvMap', () => {
  it('returns only keys in the whitelist', () => {
    const envMap = { FOO: 'foo', BAR: 'bar', BAZ: 'baz' };
    const result = whitelistEnvMap(envMap, ['FOO', 'BAZ']);
    expect(result).toEqual({ FOO: 'foo', BAZ: 'baz' });
  });

  it('returns empty object when no keys match', () => {
    const envMap = { FOO: 'foo', BAR: 'bar' };
    const result = whitelistEnvMap(envMap, ['MISSING']);
    expect(result).toEqual({});
  });

  it('returns empty object when whitelist is empty', () => {
    const envMap = { FOO: 'foo', BAR: 'bar' };
    const result = whitelistEnvMap(envMap, []);
    expect(result).toEqual({});
  });

  it('trims whitespace from whitelist entries', () => {
    const envMap = { FOO: 'foo', BAR: 'bar' };
    const result = whitelistEnvMap(envMap, ['  FOO  ', 'BAR']);
    expect(result).toEqual({ FOO: 'foo', BAR: 'bar' });
  });
});

describe('whitelistEnvFile', () => {
  it('reads and filters an env file', () => {
    const tmpDir = makeTmpDir();
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'FOO=foo\nBAR=bar\nBAZ=baz\n', 'utf-8');
    const result = whitelistEnvFile(envFile, ['FOO', 'BAZ']);
    expect(result).toEqual({ FOO: 'foo', BAZ: 'baz' });
  });
});

describe('writeWhitelistedEnv', () => {
  it('writes only whitelisted keys to output file', () => {
    const tmpDir = makeTmpDir();
    const envFile = path.join(tmpDir, '.env');
    const outFile = path.join(tmpDir, '.env.out');
    fs.writeFileSync(envFile, 'FOO=foo\nBAR=bar\nBAZ=baz\n', 'utf-8');
    writeWhitelistedEnv(envFile, ['BAR'], outFile);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('BAR=bar');
    expect(content).not.toContain('FOO');
    expect(content).not.toContain('BAZ');
  });
});
