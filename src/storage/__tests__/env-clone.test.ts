import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cloneEnvMap, cloneEnvFile, writeClonedEnv } from '../env-clone';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-clone-'));
}

describe('cloneEnvMap', () => {
  it('copies all keys from source to empty target', () => {
    const source = { A: '1', B: '2' };
    const result = cloneEnvMap(source, {});
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('merges with existing target keys', () => {
    const source = { A: '1', B: '2' };
    const target = { C: '3' };
    const result = cloneEnvMap(source, target);
    expect(result).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('does not overwrite when overwrite=false', () => {
    const source = { A: 'new' };
    const target = { A: 'old' };
    const result = cloneEnvMap(source, target, { overwrite: false });
    expect(result.A).toBe('old');
  });

  it('only clones specified keys', () => {
    const source = { A: '1', B: '2', C: '3' };
    const result = cloneEnvMap(source, {}, { keys: ['A', 'C'] });
    expect(result).toEqual({ A: '1', C: '3' });
    expect(result.B).toBeUndefined();
  });

  it('excludes specified keys', () => {
    const source = { A: '1', B: '2', C: '3' };
    const result = cloneEnvMap(source, {}, { excludeKeys: ['B'] });
    expect(result).toEqual({ A: '1', C: '3' });
  });
});

describe('cloneEnvFile and writeClonedEnv', () => {
  it('clones from source file to target file', () => {
    const dir = makeTmpDir();
    const src = path.join(dir, '.env.source');
    const tgt = path.join(dir, '.env.target');
    fs.writeFileSync(src, 'FOO=bar\nBAZ=qux\n');
    fs.writeFileSync(tgt, 'EXISTING=yes\n');

    const result = writeClonedEnv(src, tgt);
    expect(result.FOO).toBe('bar');
    expect(result.BAZ).toBe('qux');
    expect(result.EXISTING).toBe('yes');

    const written = fs.readFileSync(tgt, 'utf-8');
    expect(written).toContain('FOO=bar');
  });

  it('handles missing source gracefully', () => {
    const dir = makeTmpDir();
    const src = path.join(dir, '.env.missing');
    const tgt = path.join(dir, '.env.target');
    fs.writeFileSync(tgt, 'A=1\n');
    const result = cloneEnvFile(src, tgt);
    expect(result).toEqual({ A: '1' });
  });
});
