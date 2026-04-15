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

describe('env-schema storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getSchemaPath returns correct path', () => {
    expect(getSchemaPath(tmpDir)).toBe(path.join(tmpDir, 'schema.json'));
  });

  it('loadSchema returns empty schema if file does not exist', () => {
    const schema = loadSchema(tmpDir);
    expect(schema.fields).toEqual([]);
  });

  it('saveSchema and loadSchema round-trip', () => {
    const schema = loadSchema(tmpDir);
    schema.fields.push({ key: 'API_KEY', required: true, description: 'API key' });
    saveSchema(tmpDir, schema);
    const loaded = loadSchema(tmpDir);
    expect(loaded.fields).toHaveLength(1);
    expect(loaded.fields[0].key).toBe('API_KEY');
  });

  it('addSchemaField adds a new field', () => {
    const updated = addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    expect(updated.fields).toHaveLength(1);
    expect(updated.fields[0].key).toBe('DB_URL');
  });

  it('addSchemaField updates existing field', () => {
    addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    const updated = addSchemaField(tmpDir, { key: 'DB_URL', required: false, description: 'updated' });
    expect(updated.fields).toHaveLength(1);
    expect(updated.fields[0].required).toBe(false);
    expect(updated.fields[0].description).toBe('updated');
  });

  it('removeSchemaField removes a field', () => {
    addSchemaField(tmpDir, { key: 'DB_URL', required: true });
    addSchemaField(tmpDir, { key: 'API_KEY', required: false });
    const updated = removeSchemaField(tmpDir, 'DB_URL');
    expect(updated.fields).toHaveLength(1);
    expect(updated.fields[0].key).toBe('API_KEY');
  });

  describe('validateAgainstSchema', () => {
    it('passes when all required fields are present', () => {
      const schema = { fields: [{ key: 'API_KEY', required: true }], createdAt: '', updatedAt: '' };
      const result = validateAgainstSchema({ API_KEY: 'secret' }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when required field is missing', () => {
      const schema = { fields: [{ key: 'API_KEY', required: true }], createdAt: '', updatedAt: '' };
      const result = validateAgainstSchema({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('API_KEY');
    });

    it('fails when value does not match pattern', () => {
      const schema = { fields: [{ key: 'PORT', required: false, pattern: '^\\d+$' }], createdAt: '', updatedAt: '' };
      const result = validateAgainstSchema({ PORT: 'abc' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('PORT');
    });

    it('passes when optional field is absent', () => {
      const schema = { fields: [{ key: 'OPTIONAL', required: false }], createdAt: '', updatedAt: '' };
      const result = validateAgainstSchema({}, schema);
      expect(result.valid).toBe(true);
    });
  });
});
