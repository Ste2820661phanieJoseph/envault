import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { blacklistEnvMap, blacklistEnvFile, writeBlacklistedEnv } from '../env-blacklist';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-blacklist-'));
}

describe('blacklistEnvMap', () => {
  it('removes exact key matches', () => {
    const map = { FOO: '1', BAR: '2', BAZ: '3' };
    const result = blacklistEnvMap(map, ['FOO', 'BAZ']);
    expect(result).toEqual({ BAR: '2' });
  });

  it('removes keys matching wildcard patterns', () => {
    const map = { DB_HOST: 'localhost', DB_PASS: 'secret', APP_NAME: 'test' };
    const result = blacklistEnvMap(map, ['DB_*']);
    expect(result).toEqual({ APP_NAME: 'test' });
  });

  it('returns original map when blacklist is empty', () => {
    const map = { A: '1', B: '2' };
    const result = blacklistEnvMap(map, []);
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('returns empty map when all keys are blacklisted', () => {
    const map = { SECRET: 'x', TOKEN: 'y' };
    const result = blacklistEnvMap(map, ['SECRET', 'TOKEN']);
    expect(result).toEqual({});
  });

  it('handles non-matching patterns gracefully', () => {
    const map = { FOO: 'bar' };
    const result = blacklistEnvMap(map, ['NONEXISTENT']);
    expect(result).toEqual({ FOO: 'bar' });
  });
});

describe('blacklistEnvFile', () => {
  it('reads file and removes blacklisted keys', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=1\nBAR=2\nBAZ=3\n', 'utf-8');
    const result = blacklistEnvFile(file, ['BAR']);
    expect(result).toEqual({ FOO: '1', BAZ: '3' });
  });
});

describe('writeBlacklistedEnv', () => {
  it('overwrites original file by default', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'SECRET=abc\nPUBLIC=xyz\n', 'utf-8');
    writeBlacklistedEnv(file, ['SECRET']);
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('SECRET');
    expect(content).toContain('PUBLIC');
  });

  it('writes to output path when specified', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    const out = path.join(dir, '.env.clean');
    fs.writeFileSync(file, 'TOKEN=123\nNAME=app\n', 'utf-8');
    writeBlacklistedEnv(file, ['TOKEN'], out);
    expect(fs.existsSync(out)).toBe(true);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).not.toContain('TOKEN');
    expect(content).toContain('NAME');
    // original should be unchanged
    const original = fs.readFileSync(file, 'utf-8');
    expect(original).toContain('TOKEN');
  });
});
