import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  dedupeEnvMap,
  dedupeEnvFile,
  parseRawEntries,
  writeDedupedEnv,
} from '../env-dedupe';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-dedupe-'));
}

describe('parseRawEntries', () => {
  it('parses entries preserving duplicates', () => {
    const content = 'FOO=bar\nBAZ=qux\nFOO=baz';
    const entries = parseRawEntries(content);
    expect(entries).toEqual([['FOO', 'bar'], ['BAZ', 'qux'], ['FOO', 'baz']]);
  });

  it('skips comments and blank lines', () => {
    const content = '# comment\n\nKEY=value';
    const entries = parseRawEntries(content);
    expect(entries).toEqual([['KEY', 'value']]);
  });

  it('strips surrounding quotes from values', () => {
    const content = 'KEY="hello world"';
    const entries = parseRawEntries(content);
    expect(entries).toEqual([['KEY', 'hello world']]);
  });
});

describe('dedupeEnvMap', () => {
  it('returns no duplicates when all keys are unique', () => {
    const result = dedupeEnvMap([['A', '1'], ['B', '2']]);
    expect(result.duplicates).toHaveLength(0);
    expect(result.deduped).toEqual({ A: '1', B: '2' });
  });

  it('keeps last value for duplicate keys', () => {
    const result = dedupeEnvMap([['FOO', 'first'], ['BAR', 'x'], ['FOO', 'last']]);
    expect(result.deduped['FOO']).toBe('last');
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]).toMatchObject({
      key: 'FOO',
      values: ['first', 'last'],
      kept: 'last',
    });
  });

  it('handles multiple duplicates', () => {
    const result = dedupeEnvMap([['X', 'a'], ['X', 'b'], ['X', 'c']]);
    expect(result.deduped['X']).toBe('c');
    expect(result.duplicates[0].values).toEqual(['a', 'b', 'c']);
  });
});

describe('dedupeEnvFile', () => {
  it('deduplicates keys in a file', () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, '.env');
    fs.writeFileSync(filePath, 'KEY=first\nOTHER=value\nKEY=second\n');
    const result = dedupeEnvFile(filePath);
    expect(result.deduped['KEY']).toBe('second');
    expect(result.duplicates).toHaveLength(1);
  });
});

describe('writeDedupedEnv', () => {
  it('writes deduped map to file', () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, '.env.out');
    writeDedupedEnv(filePath, { A: '1', B: '2' });
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');
  });
});
