import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mergeEnvMaps, mergeEnvFiles, writeMergedEnv } from '../merge';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-merge-'));
}

describe('mergeEnvMaps', () => {
  const base = { A: '1', B: '2', C: '3' };

  it('keeps unchanged keys', () => {
    const { merged, conflicts } = mergeEnvMaps(base, base, base);
    expect(merged).toEqual(base);
    expect(conflicts).toHaveLength(0);
  });

  it('applies theirs change when ours is unchanged', () => {
    const ours = { ...base };
    const theirs = { ...base, B: 'updated' };
    const { merged, conflicts } = mergeEnvMaps(base, ours, theirs);
    expect(merged.B).toBe('updated');
    expect(conflicts).toHaveLength(0);
  });

  it('applies ours change when theirs is unchanged', () => {
    const ours = { ...base, A: 'mine' };
    const theirs = { ...base };
    const { merged, conflicts } = mergeEnvMaps(base, ours, theirs);
    expect(merged.A).toBe('mine');
    expect(conflicts).toHaveLength(0);
  });

  it('detects conflict when both sides changed differently', () => {
    const ours = { ...base, C: 'ours-c' };
    const theirs = { ...base, C: 'theirs-c' };
    const { merged, conflicts } = mergeEnvMaps(base, ours, theirs, 'ours');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].key).toBe('C');
    expect(merged.C).toBe('ours-c');
  });

  it('uses theirs on conflict when strategy is theirs', () => {
    const ours = { ...base, C: 'ours-c' };
    const theirs = { ...base, C: 'theirs-c' };
    const { merged } = mergeEnvMaps(base, ours, theirs, 'theirs');
    expect(merged.C).toBe('theirs-c');
  });

  it('handles new keys added by theirs', () => {
    const theirs = { ...base, NEW: 'hello' };
    const { merged } = mergeEnvMaps(base, base, theirs);
    expect(merged.NEW).toBe('hello');
  });

  it('handles key deleted in theirs', () => {
    const theirs = { A: '1', C: '3' };
    const { merged } = mergeEnvMaps(base, base, theirs);
    expect(merged.B).toBeUndefined();
  });
});

describe('mergeEnvFiles + writeMergedEnv', () => {
  it('merges files and writes output', async () => {
    const dir = makeTmpDir();
    const base = path.join(dir, 'base.env');
    const ours = path.join(dir, 'ours.env');
    const theirs = path.join(dir, 'theirs.env');
    const out = path.join(dir, 'out.env');

    fs.writeFileSync(base, 'A=1\nB=2\n');
    fs.writeFileSync(ours, 'A=mine\nB=2\n');
    fs.writeFileSync(theirs, 'A=1\nB=theirs\n');

    const result = await mergeEnvFiles(base, ours, theirs);
    expect(result.merged.A).toBe('mine');
    expect(result.merged.B).toBe('theirs');
    expect(result.conflicts).toHaveLength(0);

    writeMergedEnv(out, result.merged);
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('A=mine');
    expect(content).toContain('B=theirs');
  });
});
