import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { sortEnvMap, writeSortedEnv } from '../env-sort';
import { parseEnv } from '../../env/parser';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-int-'));
}

describe('env-sort integration', () => {
  it('round-trips: parse -> sort -> serialize -> parse preserves values', () => {
    const dir = makeTmpDir();
    const input = path.join(dir, '.env');
    const output = path.join(dir, '.env.out');
    const original = 'ZEBRA=zebra_val\nAPPLE=apple_val\nMANGO=mango_val\n';
    fs.writeFileSync(input, original);

    writeSortedEnv(input, output);

    const result = parseEnv(fs.readFileSync(output, 'utf-8'));
    expect(result['ZEBRA']).toBe('zebra_val');
    expect(result['APPLE']).toBe('apple_val');
    expect(result['MANGO']).toBe('mango_val');
  });

  it('groupByPrefix keeps all keys and values intact', () => {
    const env = {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      APP_NAME: 'envault',
      APP_ENV: 'test',
    };
    const sorted = sortEnvMap(env, { groupByPrefix: true });
    expect(Object.keys(sorted)).toHaveLength(4);
    expect(sorted['DB_HOST']).toBe('localhost');
    expect(sorted['APP_NAME']).toBe('envault');
  });

  it('handles keys with no underscore in groupByPrefix mode', () => {
    const env = { SIMPLE: 'val', DB_HOST: 'host' };
    const sorted = sortEnvMap(env, { groupByPrefix: true });
    expect(sorted['SIMPLE']).toBe('val');
    expect(sorted['DB_HOST']).toBe('host');
  });

  it('produces stable sort on already-sorted input', () => {
    const env = { ALPHA: '1', BETA: '2', GAMMA: '3' };
    const first = Object.keys(sortEnvMap(env));
    const second = Object.keys(sortEnvMap(env));
    expect(first).toEqual(second);
  });
});
