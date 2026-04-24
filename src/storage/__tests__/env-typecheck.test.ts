import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  typecheckEnvMap,
  typecheckEnvFile,
  hasTypeErrors,
  TypeCheckRule,
} from '../env-typecheck';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-typecheck-'));
}

const rules: TypeCheckRule[] = [
  { key: 'PORT', type: 'number', required: true },
  { key: 'DEBUG', type: 'boolean' },
  { key: 'API_URL', type: 'url' },
  { key: 'ADMIN_EMAIL', type: 'email' },
  { key: 'APP_NAME', type: 'string' },
];

describe('typecheckEnvMap', () => {
  it('passes valid values', () => {
    const env = { PORT: '3000', DEBUG: 'true', API_URL: 'https://api.example.com', ADMIN_EMAIL: 'admin@example.com', APP_NAME: 'MyApp' };
    const results = typecheckEnvMap(env, rules);
    expect(results.every((r) => r.valid)).toBe(true);
  });

  it('fails invalid number', () => {
    const env = { PORT: 'abc' };
    const results = typecheckEnvMap(env, [{ key: 'PORT', type: 'number' }]);
    expect(results[0].valid).toBe(false);
    expect(results[0].error).toMatch(/not a valid number/);
  });

  it('fails invalid boolean', () => {
    const env = { DEBUG: 'maybe' };
    const results = typecheckEnvMap(env, [{ key: 'DEBUG', type: 'boolean' }]);
    expect(results[0].valid).toBe(false);
  });

  it('fails invalid url', () => {
    const env = { API_URL: 'not-a-url' };
    const results = typecheckEnvMap(env, [{ key: 'API_URL', type: 'url' }]);
    expect(results[0].valid).toBe(false);
  });

  it('fails invalid email', () => {
    const env = { ADMIN_EMAIL: 'notanemail' };
    const results = typecheckEnvMap(env, [{ key: 'ADMIN_EMAIL', type: 'email' }]);
    expect(results[0].valid).toBe(false);
  });

  it('fails required missing key', () => {
    const results = typecheckEnvMap({}, [{ key: 'PORT', type: 'number', required: true }]);
    expect(results[0].valid).toBe(false);
    expect(results[0].error).toMatch(/Required/);
  });

  it('passes optional missing key', () => {
    const results = typecheckEnvMap({}, [{ key: 'DEBUG', type: 'boolean' }]);
    expect(results[0].valid).toBe(true);
  });
});

describe('typecheckEnvFile', () => {
  it('reads and checks a file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'PORT=8080\nDEBUG=false\n');
    const results = typecheckEnvFile(file, [
      { key: 'PORT', type: 'number' },
      { key: 'DEBUG', type: 'boolean' },
    ]);
    expect(results.every((r) => r.valid)).toBe(true);
  });
});

describe('hasTypeErrors', () => {
  it('returns true when errors exist', () => {
    const results = typecheckEnvMap({ PORT: 'bad' }, [{ key: 'PORT', type: 'number' }]);
    expect(hasTypeErrors(results)).toBe(true);
  });

  it('returns false when all valid', () => {
    const results = typecheckEnvMap({ PORT: '3000' }, [{ key: 'PORT', type: 'number' }]);
    expect(hasTypeErrors(results)).toBe(false);
  });
});
