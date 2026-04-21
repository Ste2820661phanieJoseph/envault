import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { applyPatch, patchEnvFile, writePatchedEnv, PatchOperation } from '../env-patch';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-patch-'));
}

describe('applyPatch', () => {
  const base = { FOO: 'bar', BAZ: 'qux' };

  it('applies set operation', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'FOO', value: 'newval' }];
    const result = applyPatch(base, ops);
    expect(result.map.FOO).toBe('newval');
    expect(result.applied).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
  });

  it('applies delete operation', () => {
    const ops: PatchOperation[] = [{ op: 'delete', key: 'BAZ' }];
    const result = applyPatch(base, ops);
    expect(result.map).not.toHaveProperty('BAZ');
    expect(result.applied).toHaveLength(1);
  });

  it('applies rename operation', () => {
    const ops: PatchOperation[] = [{ op: 'rename', key: 'FOO', newKey: 'FOO_NEW' }];
    const result = applyPatch(base, ops);
    expect(result.map).not.toHaveProperty('FOO');
    expect(result.map.FOO_NEW).toBe('bar');
    expect(result.applied).toHaveLength(1);
  });

  it('skips set without value', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'X' }];
    const result = applyPatch(base, ops);
    expect(result.skipped).toHaveLength(1);
  });

  it('skips delete for missing key', () => {
    const ops: PatchOperation[] = [{ op: 'delete', key: 'MISSING' }];
    const result = applyPatch(base, ops);
    expect(result.skipped).toHaveLength(1);
  });

  it('skips rename for missing key', () => {
    const ops: PatchOperation[] = [{ op: 'rename', key: 'MISSING', newKey: 'OTHER' }];
    const result = applyPatch(base, ops);
    expect(result.skipped).toHaveLength(1);
  });

  it('does not mutate original map', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'FOO', value: 'changed' }];
    applyPatch(base, ops);
    expect(base.FOO).toBe('bar');
  });
});

describe('patchEnvFile / writePatchedEnv', () => {
  it('patches an env file and writes result', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n', 'utf-8');
    const ops: PatchOperation[] = [
      { op: 'set', key: 'FOO', value: 'updated' },
      { op: 'delete', key: 'BAZ' },
    ];
    const result = writePatchedEnv(file, ops);
    expect(result.applied).toHaveLength(2);
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('FOO=updated');
    expect(written).not.toContain('BAZ');
  });

  it('handles non-existent file gracefully', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, 'missing.env');
    const ops: PatchOperation[] = [{ op: 'set', key: 'NEW', value: '1' }];
    const result = patchEnvFile(file, ops);
    expect(result.map.NEW).toBe('1');
  });
});
