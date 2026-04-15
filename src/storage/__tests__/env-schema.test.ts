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
  EnvSchema,
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

  it('getSchemaPath returns correct path', () => {
    const p = getSchemaPath(tmpDir, 'myproject');
    expect(p).toBe(path.join(tmpDir, 'myproject', 'schema.json'));
  });

  it('loadSchema returns empty schema if file does not exist', () => {
    const schema = loadSchema(tmpDir, 'myproject');
    expect(schema.fields).toEqual([]);
    expect(schema.version).toBe(1);
  });

  it('saveSchema and loadSchema round-trip', () => {
    const schema: EnvSchema = {
      fields: [{ key: 'API_KEY', required: true, description: 'API key' }],
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    saveSchema(tmpDir, 'myproject', schema);
    const loaded = loadSchema(tmpDir, 'myproject');
    expect(loaded.fields).toHaveLength(1);
    expect(loaded.fields[0].key).toBe('API_KEY');
  });

  it('addSchemaField adds a new field', () => {
    const schema = addSchemaField(tmpDir, 'myproject', { key: 'DB_URL', required: true });
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].key).toBe('DB_URL');
  });

  it('addSchemaField updates existing field', () => {
    addSchemaField(tmpDir, 'myproject', { key: 'DB_URL', required: true });
    const schema = addSchemaField(tmpDir, 'myproject', { key: 'DB_URL', required: false, description: 'updated' });
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].required).toBe(false);
    expect(schema.fields[0].description).toBe('updated');
  });

  it('removeSchemaField removes a field', () => {
    addSchemaField(tmpDir, 'myproject', { key: 'DB_URL', required: true });
    const schema = removeSchemaField(tmpDir, 'myproject', 'DB_URL');
    expect(schema.fields).toHaveLength(0);
  });

  it('validateAgainstSchema passes when all required keys present', () => {
    const schema: EnvSchema = {
      fields: [{ key: 'API_KEY', required: true }],
      version: 1,
      updatedAt: '',
    };
    const result = validateAgainstSchema({ API_KEY: 'abc123' }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateAgainstSchema fails when required key is missing', () => {
    const schema: EnvSchema = {
      fields: [{ key: 'API_KEY', required: true }],
      version: 1,
      updatedAt: '',
    };
    const result = validateAgainstSchema({}, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/API_KEY/);
  });

  it('validateAgainstSchema fails when pattern does not match', () => {
    const schema: EnvSchema = {
      fields: [{ key: 'PORT', required: true, pattern: '^\\d+$' }],
      version: 1,
      updatedAt: '',
    };
    const result = validateAgainstSchema({ PORT: 'not-a-number' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/PORT/);
  });
});
