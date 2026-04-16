import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateValue, generateEnvMap, writeGeneratedEnv } from '../env-generate';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-gen-'));
}

describe('generateValue', () => {
  it('returns hex string for random type', () => {
    const v = generateValue('random', 16);
    expect(v).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns valid uuid for uuid type', () => {
    const v = generateValue('uuid');
    expect(v).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns alphanumeric string', () => {
    const v = generateValue('alphanumeric', 20);
    expect(v).toMatch(/^[A-Za-z0-9]{20}$/);
  });

  it('returns numeric string', () => {
    const v = generateValue('numeric', 10);
    expect(v).toMatch(/^[0-9]{10}$/);
  });

  it('respects custom length', () => {
    expect(generateValue('random', 8)).toHaveLength(8);
    expect(generateValue('alphanumeric', 12)).toHaveLength(12);
    expect(generateValue('numeric', 6)).toHaveLength(6);
  });
});

describe('generateEnvMap', () => {
  it('generates map with all specified keys', () => {
    const map = generateEnvMap([
      { key: 'SECRET', type: 'random', length: 32 },
      { key: 'APP_ID', type: 'uuid' },
    ]);
    expect(Object.keys(map)).toEqual(['SECRET', 'APP_ID']);
    expect(map.SECRET).toHaveLength(32);
    expect(map.APP_ID).toMatch(/-/);
  });

  it('returns empty map for empty fields', () => {
    expect(generateEnvMap([])).toEqual({});
  });
});

describe('writeGeneratedEnv', () => {
  it('writes key=value lines to file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    writeGeneratedEnv(file, { FOO: 'bar', BAZ: '123' });
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('FOO=bar');
    expect(content).toContain('BAZ=123');
  });

  it('creates parent directories if needed', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, 'nested', 'deep', '.env');
    writeGeneratedEnv(file, { KEY: 'val' });
    expect(fs.existsSync(file)).toBe(true);
  });
});
