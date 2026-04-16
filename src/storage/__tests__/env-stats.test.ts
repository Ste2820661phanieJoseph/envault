import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { computeEnvStats, computeEnvFileStats, formatEnvStats } from '../env-stats';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-stats-'));
}

describe('computeEnvStats', () => {
  it('counts total keys', () => {
    const stats = computeEnvStats({ A: '1', B: '2' });
    expect(stats.totalKeys).toBe(2);
  });

  it('counts empty values', () => {
    const stats = computeEnvStats({ A: '', B: 'hello', C: '' });
    expect(stats.emptyValues).toBe(2);
  });

  it('detects placeholders', () => {
    const stats = computeEnvStats({ A: '${MY_VAR}', B: 'CHANGEME', C: 'TODO', D: 'real' });
    expect(stats.placeholders).toBe(3);
  });

  it('returns zero duplicates for unique keys', () => {
    const stats = computeEnvStats({ A: '1', B: '2' });
    expect(stats.duplicates).toBe(0);
  });

  it('identifies longest key', () => {
    const stats = computeEnvStats({ SHORT: '1', VERY_LONG_KEY_NAME: '2' });
    expect(stats.longestKey).toBe('VERY_LONG_KEY_NAME');
  });

  it('calculates average key length', () => {
    const stats = computeEnvStats({ AB: '1', ABCD: '2' });
    expect(stats.keyLengthAvg).toBe(3);
  });

  it('handles empty map', () => {
    const stats = computeEnvStats({});
    expect(stats.totalKeys).toBe(0);
    expect(stats.keyLengthAvg).toBe(0);
    expect(stats.longestKey).toBe('');
  });
});

describe('computeEnvFileStats', () => {
  it('reads and stats a .env file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=\nQUX=CHANGEME\n');
    const stats = computeEnvFileStats(file);
    expect(stats.totalKeys).toBe(3);
    expect(stats.emptyValues).toBe(1);
    expect(stats.placeholders).toBe(1);
    fs.rmSync(dir, { recursive: true });
  });
});

describe('formatEnvStats', () => {
  it('returns a formatted string', () => {
    const stats = computeEnvStats({ FOO: 'bar', BAZ: '' });
    const output = formatEnvStats(stats);
    expect(output).toContain('Total keys');
    expect(output).toContain('Empty values');
    expect(output).toContain('Avg key length');
  });
});
