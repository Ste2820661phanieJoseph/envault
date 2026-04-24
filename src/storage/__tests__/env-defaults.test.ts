import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  applyDefaults,
  applyDefaultsToFile,
  writeEnvWithDefaults,
  getMissingDefaults,
} from '../env-defaults';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-defaults-'));
}

describe('applyDefaults', () => {
  it('fills in missing keys', () => {
    const result = applyDefaults({ A: '1' }, { B: '2', C: '3' });
    expect(result).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('fills in empty string values', () => {
    const result = applyDefaults({ A: '' }, { A: 'default' });
    expect(result.A).toBe('default');
  });

  it('does not overwrite existing non-empty values', () => {
    const result = applyDefaults({ A: 'existing' }, { A: 'default' });
    expect(result.A).toBe('existing');
  });

  it('returns a new object and does not mutate input', () => {
    const original = { A: '1' };
    const result = applyDefaults(original, { B: '2' });
    expect(result).not.toBe(original);
    expect(original).not.toHaveProperty('B');
  });
});

describe('applyDefaultsToFile', () => {
  it('reads file and applies defaults', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'A=1\n', 'utf-8');
    const result = applyDefaultsToFile(file, { B: '2' });
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('returns only defaults when file does not exist', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env.missing');
    const result = applyDefaultsToFile(file, { X: 'default' });
    expect(result).toEqual({ X: 'default' });
  });
});

describe('writeEnvWithDefaults', () => {
  it('writes merged env to disk', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'A=1\n', 'utf-8');
    writeEnvWithDefaults(file, { B: '2' });
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');
  });
});

describe('getMissingDefaults', () => {
  it('returns keys missing from env map', () => {
    const missing = getMissingDefaults({ A: '1' }, { A: 'x', B: 'y', C: 'z' });
    expect(missing).toEqual(expect.arrayContaining(['B', 'C']));
    expect(missing).not.toContain('A');
  });

  it('includes keys with empty string values', () => {
    const missing = getMissingDefaults({ A: '' }, { A: 'default' });
    expect(missing).toContain('A');
  });

  it('returns empty array when all defaults are present', () => {
    const missing = getMissingDefaults({ A: '1', B: '2' }, { A: 'x', B: 'y' });
    expect(missing).toHaveLength(0);
  });
});
