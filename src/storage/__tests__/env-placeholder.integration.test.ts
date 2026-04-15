import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectPlaceholders, fillPlaceholders, fillPlaceholdersInFile } from '../env-placeholder';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ph-int-'));
}

describe('env-placeholder integration', () => {
  it('round-trips: detect then fill produces clean env', async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    const original = 'API_KEY=<YOUR_API_KEY>\nDB_URL={{DB_URL}}\nHOST=localhost\nSECRET=CHANGE_ME\n';
    fs.writeFileSync(file, original);

    const { parseEnv } = await import('../../env/parser');
    const envMap = parseEnv(fs.readFileSync(file, 'utf-8'));
    const placeholders = detectPlaceholders(envMap);
    expect(placeholders.map((p) => p.key).sort()).toEqual(['API_KEY', 'DB_URL', 'SECRET']);

    const values: Record<string, string> = {
      API_KEY: 'key-abc',
      DB_URL: 'postgres://localhost/db',
      SECRET: 'supersecret',
    };
    const filled = await fillPlaceholdersInFile(file, values);
    expect(filled.API_KEY).toBe('key-abc');
    expect(filled.DB_URL).toBe('postgres://localhost/db');
    expect(filled.SECRET).toBe('supersecret');
    expect(filled.HOST).toBe('localhost');

    const remaining = detectPlaceholders(filled);
    expect(remaining).toHaveLength(0);

    fs.rmSync(dir, { recursive: true });
  });

  it('fillPlaceholders does not overwrite non-placeholder values even if key is in values map', () => {
    const env = { HOST: 'production.example.com', API_KEY: '<KEY>' };
    const filled = fillPlaceholders(env, { HOST: 'other-host', API_KEY: 'real' });
    expect(filled.HOST).toBe('production.example.com');
    expect(filled.API_KEY).toBe('real');
  });

  it('handles YOUR_ prefix pattern as placeholder', () => {
    const env = { DB_PASS: 'YOUR_DB_PASSWORD' };
    const placeholders = detectPlaceholders(env);
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0].key).toBe('DB_PASS');
  });
});
