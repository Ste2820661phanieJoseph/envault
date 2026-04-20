import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export interface FlattenOptions {
  separator?: string;
  prefix?: string;
  uppercase?: boolean;
}

/**
 * Flattens a nested object into a flat env map using a separator.
 * e.g. { db: { host: 'localhost' } } => { DB_HOST: 'localhost' }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  options: FlattenOptions = {},
  _prefix = ''
): Record<string, string> {
  const { separator = '_', prefix = '', uppercase = true } = options;
  const result: Record<string, string> = {};
  const basePrefix = _prefix || prefix;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = basePrefix ? `${basePrefix}${separator}${key}` : key;
    const finalKey = uppercase ? fullKey.toUpperCase() : fullKey;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenObject(
        value as Record<string, unknown>,
        options,
        fullKey
      );
      Object.assign(result, nested);
    } else {
      result[finalKey] = Array.isArray(value)
        ? value.join(',')
        : String(value ?? '');
    }
  }

  return result;
}

/**
 * Flattens an existing env map by splitting keys that contain the separator
 * and re-joining with the canonical separator.
 */
export function flattenEnvMap(
  envMap: Record<string, string>,
  options: FlattenOptions = {}
): Record<string, string> {
  const { separator = '_', uppercase = true } = options;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(envMap)) {
    const parts = key.split(separator).filter(Boolean);
    const normalizedKey = parts.join(separator);
    const finalKey = uppercase ? normalizedKey.toUpperCase() : normalizedKey;
    result[finalKey] = value;
  }

  return result;
}

/**
 * Reads an env file, flattens its keys, and writes the result.
 */
export async function flattenEnvFile(
  inputPath: string,
  outputPath: string,
  options: FlattenOptions = {}
): Promise<Record<string, string>> {
  const raw = await fs.promises.readFile(inputPath, 'utf-8');
  const envMap = parseEnv(raw);
  const flattened = flattenEnvMap(envMap, options);
  const serialized = serializeEnv(flattened);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, serialized, 'utf-8');
  return flattened;
}
