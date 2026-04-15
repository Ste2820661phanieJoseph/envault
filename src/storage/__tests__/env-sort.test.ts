import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { sortEnvMap, sortEnvFile, writeSortedEnv } from '../env-sort';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-'));
}

describe('sortEnvMap', () => {
  it('sorts keys ascending by default', () => {
    const env = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const sorted = sortEnvMap(env);
    expect(Object.keys(sorted)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('sorts keys descending', () => {
    const env = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const sorted = sortEnvMap(env, { order: 'desc' });
    expect(Object.keys(sorted)).toEqual(['ZEBRA', 'MANGO', 'APPLE']);
  });

  it('groups by prefix and sorts within groups', () => {
    const env = { DB_PORT: '5432', APP_NAME: 'test', DB_HOST: 'localhost', APP_ENV: 'dev' };
    const sorted = sortEnvMap(env, { groupByPrefix: true });
    const keys = Object.keys(sorted);
    expect(keys.indexOf('APP_ENV')).toBeLessThan(keys.indexOf('APP_NAME'));
    expect(keys.indexOf('DB_HOST')).toBeLessThan(keys.indexOf('DB_PORT'));
    expect(keys.indexOf('APP_NAME')).toBeLessThan(keys.indexOf('DB_HOST'));
  });

  it('returns empty object for empty input', () => {
    expect(sortEnvMap({})).toEqual({});
  });
});

describe('sortEnvFile', () => {
  it('reads and sorts a .env file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'ZEBRA=1\nAPPLE=2\nMANGO=3\n');
    const sorted = sortEnvFile(file);
    expect(Object.keys(sorted)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });
});

describe('writeSortedEnv', () => {
  it('writes sorted env to output file', () => {
    const dir = makeTmpDir();
    const input = path.join(dir, '.env');
    const output = path.join(dir, '.env.sorted');
    fs.writeFileSync(input, 'ZEBRA=1\nAPPLE=2\n');
    writeSortedEnv(input, output);
    const content = fs.readFileSync(output, 'utf-8');
    expect(content.indexOf('APPLE')).toBeLessThan(content.indexOf('ZEBRA'));
  });
});
