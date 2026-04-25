import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  sanitizeEnvMap,
  sanitizeEnvFile,
  writeSanitizedEnv,
} from '../env-sanitize';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sanitize-'));
}

describe('sanitizeEnvMap', () => {
  it('removes empty values by default', () => {
    const env = { FOO: 'bar', EMPTY: '', BAZ: 'qux' };
    const result = sanitizeEnvMap(env);
    expect(result.sanitized).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.removedKeys).toContain('EMPTY');
  });

  it('trims whitespace from values by default', () => {
    const env = { FOO: '  bar  ', BAZ: 'qux' };
    const result = sanitizeEnvMap(env);
    expect(result.sanitized['FOO']).toBe('bar');
    expect(result.modifiedKeys).toContain('FOO');
  });

  it('strips quotes when option is set', () => {
    const env = { FOO: '"hello"', BAR: "'world'" };
    const result = sanitizeEnvMap(env, { stripQuotes: true });
    expect(result.sanitized['FOO']).toBe('hello');
    expect(result.sanitized['BAR']).toBe('world');
  });

  it('keeps empty values when removeEmpty is false', () => {
    const env = { FOO: '', BAR: 'baz' };
    const result = sanitizeEnvMap(env, { removeEmpty: false });
    expect(result.sanitized).toHaveProperty('FOO');
    expect(result.removedKeys).toHaveLength(0);
  });

  it('returns original map unchanged', () => {
    const env = { FOO: 'bar' };
    const result = sanitizeEnvMap(env);
    expect(result.original).toEqual(env);
  });

  it('reports no modifications when values are clean', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = sanitizeEnvMap(env);
    expect(result.modifiedKeys).toHaveLength(0);
    expect(result.removedKeys).toHaveLength(0);
  });
});

describe('sanitizeEnvFile and writeSanitizedEnv', () => {
  it('reads, sanitizes, and writes env file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=  bar  \nEMPTY=\nBAZ=qux\n', 'utf-8');

    const result = sanitizeEnvFile(file);
    expect(result.sanitized['FOO']).toBe('bar');
    expect(result.removedKeys).toContain('EMPTY');

    writeSanitizedEnv(file, result);
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('FOO=bar');
    expect(written).not.toContain('EMPTY');
  });
});
