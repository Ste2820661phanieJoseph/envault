import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyEnvFile } from '../env-copy';
import { parseEnv } from '../../env/parser';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-copy-int-'));
}

describe('copyEnvFile integration', () => {
  it('preserves all existing dest keys not in source', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'NEW=value\n');
    fs.writeFileSync(dest, 'OLD=keep\nANOTHER=also\n');
    copyEnvFile(src, dest);
    const result = parseEnv(fs.readFileSync(dest, 'utf-8'));
    expect(result['OLD']).toBe('keep');
    expect(result['ANOTHER']).toBe('also');
    expect(result['NEW']).toBe('value');
  });

  it('handles quoted values correctly', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'MSG="hello world"\n');
    copyEnvFile(src, dest);
    const result = parseEnv(fs.readFileSync(dest, 'utf-8'));
    expect(result['MSG']).toBe('hello world');
  });

  it('creates destination directory if it does not exist', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, 'nested', 'dir', '.env.dest');
    fs.writeFileSync(src, 'KEY=val\n');
    copyEnvFile(src, dest);
    expect(fs.existsSync(dest)).toBe(true);
  });

  it('returns correct source and destination paths', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'X=1\n');
    const result = copyEnvFile(src, dest);
    expect(result.source).toBe(src);
    expect(result.destination).toBe(dest);
  });

  it('handles empty source file gracefully', () => {
    const tmp = makeTmpDir();
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, '');
    const result = copyEnvFile(src, dest);
    expect(result.copied).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});
