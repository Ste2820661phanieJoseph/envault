import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { validateEnvMap, validateEnvFile, ValidationRule } from '../validate';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-'));
}

describe('validateEnvMap', () => {
  const rules: ValidationRule[] = [
    { key: 'API_KEY', required: true, minLength: 8 },
    { key: 'APP_ENV', required: true, pattern: '^(development|staging|production)$' },
    { key: 'TOKEN', required: false, maxLength: 10 },
  ];

  it('passes with valid env map', () => {
    const result = validateEnvMap(
      { API_KEY: 'supersecret', APP_ENV: 'production' },
      rules
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when required key is missing', () => {
    const result = validateEnvMap({ APP_ENV: 'staging' }, rules);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required key: API_KEY');
  });

  it('fails when pattern does not match', () => {
    const result = validateEnvMap({ API_KEY: 'supersecret', APP_ENV: 'local' }, rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/APP_ENV/);
  });

  it('fails when value is shorter than minLength', () => {
    const result = validateEnvMap({ API_KEY: 'short', APP_ENV: 'production' }, rules);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/shorter than minimum/);
  });

  it('warns when value exceeds maxLength', () => {
    const result = validateEnvMap(
      { API_KEY: 'supersecret', APP_ENV: 'production', TOKEN: 'this-is-too-long' },
      rules
    );
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/TOKEN/);
  });
});

describe('validateEnvFile', () => {
  it('returns error when file does not exist', () => {
    const result = validateEnvFile('/nonexistent/.env', []);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/File not found/);
  });

  it('validates env file correctly', () => {
    const tmpDir = makeTmpDir();
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'API_KEY=supersecret\nAPP_ENV=production\n');
    const rules: ValidationRule[] = [
      { key: 'API_KEY', required: true },
      { key: 'APP_ENV', required: true },
    ];
    const result = validateEnvFile(envPath, rules);
    expect(result.valid).toBe(true);
    fs.rmSync(tmpDir, { recursive: true });
  });
});
