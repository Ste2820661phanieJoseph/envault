import * as fs from 'fs';
import * as path from 'path';

export interface SchemaField {
  key: string;
  required: boolean;
  description?: string;
  pattern?: string;
  defaultValue?: string;
}

export interface EnvSchema {
  fields: SchemaField[];
  createdAt: string;
  updatedAt: string;
}

export function getSchemaPath(vaultDir: string): string {
  return path.join(vaultDir, 'schema.json');
}

export function loadSchema(vaultDir: string): EnvSchema {
  const schemaPath = getSchemaPath(vaultDir);
  if (!fs.existsSync(schemaPath)) {
    return { fields: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  const raw = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(raw) as EnvSchema;
}

export function saveSchema(vaultDir: string, schema: EnvSchema): void {
  const schemaPath = getSchemaPath(vaultDir);
  schema.updatedAt = new Date().toISOString();
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');
}

export function addSchemaField(vaultDir: string, field: SchemaField): EnvSchema {
  const schema = loadSchema(vaultDir);
  const existing = schema.fields.findIndex(f => f.key === field.key);
  if (existing >= 0) {
    schema.fields[existing] = field;
  } else {
    schema.fields.push(field);
  }
  saveSchema(vaultDir, schema);
  return schema;
}

export function removeSchemaField(vaultDir: string, key: string): EnvSchema {
  const schema = loadSchema(vaultDir);
  schema.fields = schema.fields.filter(f => f.key !== key);
  saveSchema(vaultDir, schema);
  return schema;
}

export function validateAgainstSchema(
  envMap: Record<string, string>,
  schema: EnvSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of schema.fields) {
    const value = envMap[field.key];
    if (field.required && (value === undefined || value === '')) {
      errors.push(`Missing required field: ${field.key}`);
      continue;
    }
    if (value !== undefined && field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        errors.push(`Field "${field.key}" does not match pattern: ${field.pattern}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
