import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  interpolateEnvMap,
  interpolateEnvFile,
  writeInterpolatedEnv,
} from '../env-interpolate';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-interpolate-'));
}

describe('interpolateEnvMap', () => {
  it('resolves ${VAR} style references', () => {
    const map = { BASE: '/home/user', PATH: '${BASE}/bin' };
    const result = interpolateEnvMap(map);
    expect(result.PATH).toBe('/home/user/bin');
  });

  it('resolves $VAR style references', () => {
    const map = { HOST: 'localhost', URL: 'http://$HOST:3000' };
    const result = interpolateEnvMap(map);
    expect(result.URL).toBe('http://localhost:3000');
  });

  it('uses context for external variables', () => {
    const map = { GREETING: 'Hello, ${NAME}!' };
    const context = { NAME: 'World' };
    const result = interpolateEnvMap(map, context);
    expect(result.GREETING).toBe('Hello, World!');
  });

  it('leaves unresolved references unchanged', () => {
    const map = { VALUE: '${UNDEFINED_VAR}' };
    const result = interpolateEnvMap(map);
    expect(result.VALUE).toBe('${UNDEFINED_VAR}');
  });

  it('handles chained references', () => {
    const map = { A: 'foo', B: '${A}bar', C: '${B}baz' };
    const result = interpolateEnvMap(map);
    expect(result.C).toBe('foobarbaz');
  });

  it('does not mutate original map', () => {
    const map = { X: 'val', Y: '${X}_extra' };
    const result = interpolateEnvMap(map);
    expect(map.Y).toBe('${X}_extra');
    expect(result.Y).toBe('val_extra');
  });

  it('handles circular references without infinite loop', () => {
    const map = { A: '${B}', B: '${A}' };
    expect(() => interpolateEnvMap(map)).not.toThrow();
  });
});

describe('interpolateEnvFile', () => {
  it('reads and interpolates a file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'BASE=/app\nPATH=${BASE}/bin\n');
    const result = interpolateEnvFile(file);
    expect(result.PATH).toBe('/app/bin');
  });

  it('throws if file does not exist', () => {
    expect(() => interpolateEnvFile('/nonexistent/.env')).toThrow('File not found');
  });
});

describe('writeInterpolatedEnv', () => {
  it('writes interpolated output to a file', () => {
    const dir = makeTmpDir();
    const input = path.join(dir, '.env');
    const output = path.join(dir, '.env.out');
    fs.writeFileSync(input, 'HOST=localhost\nURL=http://${HOST}:8080\n');
    writeInterpolatedEnv(input, output);
    const written = fs.readFileSync(output, 'utf-8');
    expect(written).toContain('URL=http://localhost:8080');
  });
});
