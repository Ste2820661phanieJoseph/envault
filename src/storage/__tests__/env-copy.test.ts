import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyEnvKeys, copyEnvFile } from '../env-copy';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-copy-test-'));
}

describe('copyEnvKeys', () => {
  it('copies all keys by default', () => {
    const src = { A: '1', B: '2' };
    const dest: Record<string, string> = {};
    const result = copyEnvKeys(src, dest);
    expect(result.copied).toEqual(['A', 'B']);
    expect(result.skipped).toEqual([]);
    expect(dest).toEqual({ A: '1', B: '2' });
  });

  it('skips existing keys when overwrite is false', () => {
    const src = { A: 'new', B: '2' };
    const dest: Record<string, string> = { A: 'old' };
    const result = copyEnvKeys(src, dest, { overwrite: false });
    expect(result.copied).toContain('B');
    expect(result.skipped).toContain('A');
    expect(dest.A).toBe('old');
  });

  it('overwrites existing keys when overwrite is true', () => {
    const src = { A: 'new' };
    const dest: Record<string, string> = { A: 'old' };
    copyEnvKeys(src, dest, { overwrite: true });
    expect(dest.A).toBe('new');
  });

  it('copies only specified keys', () => {
    const src = { A: '1', B: '2', C: '3' };
    const dest: Record<string, string> = {};
    const result = copyEnvKeys(src, dest, { keys: ['A', 'C'] });
    expect(result.copied).toEqual(['A', 'C']);
    expect(dest).toEqual({ A: '1', C: '3' });
  });

  it('skips keys not found in source', () => {
    const src = { A: '1' };
    const dest: Record<string, string> = {};
    const result = copyEnvKeys(src, dest, { keys: ['A', 'MISSING'] });
    expect(result.skipped).toContain('MISSING');
  });
});

describe('copyEnvFile', () => {
  it('copies env file to destination', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'FOO=bar\nBAZ=qux\n');
    const result = copyEnvFile(src, dest);
    expect(result.copied).toContain('FOO');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf-8')).toContain('FOO=bar');
  });

  it('throws if source does not exist', () => {
    expect(() => copyEnvFile('/nonexistent/.env', '/tmp/.env.dest')).toThrow('Source file not found');
  });

  it('merges into existing destination', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'NEW_KEY=hello\n');
    fs.writeFileSync(dest, 'EXISTING=world\n');
    copyEnvFile(src, dest);
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('EXISTING=world');
    expect(content).toContain('NEW_KEY=hello');
  });
});
