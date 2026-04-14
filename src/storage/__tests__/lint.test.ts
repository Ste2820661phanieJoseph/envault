import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  lintEnvMap,
  lintEnvFile,
  defaultRules,
  LintResult,
} from '../lint';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lint-'));
}

describe('lintEnvMap', () => {
  it('returns no results for a clean env map', () => {
    const results = lintEnvMap({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    expect(results).toHaveLength(0);
  });

  it('flags empty values', () => {
    const results = lintEnvMap({ API_KEY: '' });
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('flags lowercase keys', () => {
    const results = lintEnvMap({ api_key: 'value' });
    expect(results.some((r) => r.rule === 'uppercase-key')).toBe(true);
  });

  it('flags keys with whitespace', () => {
    const results = lintEnvMap({ 'MY KEY': 'value' });
    expect(results.some((r) => r.rule === 'no-whitespace-key')).toBe(true);
  });

  it('flags values wrapped in double quotes', () => {
    const results = lintEnvMap({ API_KEY: '"myvalue"' });
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('flags values wrapped in single quotes', () => {
    const results = lintEnvMap({ API_KEY: "'myvalue'" });
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('respects custom rules', () => {
    const customRule = {
      name: 'no-test-prefix',
      description: 'Keys should not start with TEST_',
      check: (key: string) =>
        key.startsWith('TEST_') ? `Key "${key}" starts with TEST_` : null,
    };
    const results = lintEnvMap({ TEST_KEY: 'value' }, [customRule]);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-test-prefix');
  });

  it('returns multiple violations for a single key', () => {
    const results = lintEnvMap({ 'my key': '' });
    const ruleNames = results.map((r) => r.rule);
    expect(ruleNames).toContain('no-empty-value');
    expect(ruleNames).toContain('no-whitespace-key');
    expect(ruleNames).toContain('uppercase-key');
  });
});

describe('lintEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lints a valid .env file with no issues', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'API_KEY=abc123\nDB_HOST=localhost\n');
    const results = lintEnvFile(envFile);
    expect(results).toHaveLength(0);
  });

  it('detects issues in a .env file', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'api_key=\nDB_HOST=localhost\n');
    const results = lintEnvFile(envFile);
    expect(results.length).toBeGreaterThan(0);
  });

  it('skips comment lines and blank lines', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, '# This is a comment\n\nAPI_KEY=value\n');
    const results = lintEnvFile(envFile);
    expect(results).toHaveLength(0);
  });

  it('throws if file does not exist', () => {
    expect(() => lintEnvFile('/nonexistent/.env')).toThrow('File not found');
  });
});
