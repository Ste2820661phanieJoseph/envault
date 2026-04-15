import * as fs from 'fs';
import * as path from 'path';

export interface EnvSchemaField {
  key: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  pattern?: string;
}

export interface EnvSchema {
  fields: EnvSchemaField[];
  version: number;
  updatedAt: string;
}

export function getSchemaPath(vaultDir: string, project: string): string {
  return path.join(vaultDir, project, 'schema.json');
}

export function loadSchema(vaultDir: string, project: string): EnvSchema {
  const schemaPath = getSchemaPath(vaultDir, project);
  if (!fs.existsSync(schemaPath)) {
    return { fields: [], version: 1, updatedAt: new Date().toISOString() };
  }
  const raw = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(raw) as EnvSchema;
}

export function saveSchema(vaultDir: string, project: string, schema: EnvSchema): void {
  const schemaPath = getSchemaPath(vaultDir, project);
  fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');
}

export function addSchemaField(vaultDir: string, project: string, field: EnvSchemaField): EnvSchema {
  const schema = loadSchema(vaultDir, project);
  const existing = schema.fields.findIndex(f => f.key === field.key);
  if (existing >= 0) {
    schema.fields[existing] = field;
  } else {
    schema.fields.push(field);
  }
  schema.updatedAt = new Date().toISOString();
  saveSchema(vaultDir, project, schema);
  return schema;
}

export function removeSchemaField(vaultDir: string, project: string, key: string): EnvSchema {
  const schema = loadSchema(vaultDir, project);
  schema.fields = schema.fields.filter(f => f.key !== key);
  schema.updatedAt = new Date().toISOString();
  saveSchema(vaultDir, project, schema);
  return schema;
}

export function validateAgainstSchema(
  envMap: Record<string, string>,
  schema: EnvSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !(field.key in envMap)) {
      errors.push(`Missing required key: ${field.key}`);
      continue;
    }
    if (field.pattern && field.key in envMap) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(envMap[field.key])) {
        errors.push(`Key "${field.key}" does not match pattern: ${field.pattern}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
