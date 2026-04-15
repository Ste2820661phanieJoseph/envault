import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getSchemaPath,
  loadSchema,
  saveSchema,
  addSchemaField,
  removeSchemaField,
  validateAgainstSchema,
} from '../env-schema';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schema-'));
}

describe('env-schema', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getSchemaPath returns correct path', () => {
    expect(getSchemaPath(tmpDir)).toBe(path.join(tmpDir, 'schema.json'));
  });

  test('loadSchema returns empty schema when file does not exist', () => {
    const schema = loadSchema(tmpDir);
    expect(schema.fields).toEqual([]);
    expect(schema.createdAt).toBeDefined();
  });

  test('saveSchema and loadSchema round-trip', () => {
    const schema = {
      fields: [{ key: 'API_KEY', required: true, description: 'API Key' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    saveSchema(tmpDir, schema);
    const loaded = loadSchema(tmpDir);
    expect(loaded.fields).toHaveLength(1);
    expect(loaded.fields[0].key).toBe('API_KEY');
  });

  test('addSchemaField adds a new field', () => {
    const schema = addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].key).toBe('DB_URL');
  });

  test('addSchemaField updates existing field', () => {
    addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    const schema = addSchemaField(tmpDir, { key: 'DB_URL', required: false, description: 'Updated' });
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].required).toBe(false);
    expect(schema.fields[0].description).toBe('Updated');
  });

  test('removeSchemaField removes a field', () => {
    addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    const schema = removeSchemaField(tmpDir, 'DB_URL');
    expect(schema.fields).toHaveLength(0);
  });

  test('validateAgainstSchema passes when all required fields present', () => {
    addSchemaField(tmpDir, { key: 'API_KEY', required: true });
    const result = validateAgainstSchema(tmpDir, { API_KEY: 'abc123' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateAgainstSchema fails when required field missing', () => {
    addSchemaField(tmpDir, { key: 'API_KEY', required: true });
    const result = validateAgainstSchema(tmpDir, {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('API_KEY');
  });

  test('validateAgainstSchema fails when pattern does not match', () => {
    addSchemaField(tmpDir, { key: 'PORT', required: false, pattern: '^\\d+$' });
    const result = validateAgainstSchema(tmpDir, { PORT: 'not-a-number' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('PORT');
  });

  test('validateAgainstSchema passes when pattern matches', () => {
    addSchemaField(tmpDir, { key: 'PORT', required: false, pattern: '^\\d+$' });
    const result = validateAgainstSchema(tmpDir, { PORT: '3000' });
    expect(result.valid).toBe(true);
  });
});
