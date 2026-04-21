import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Trims whitespace from env values, optionally also trimming keys.
 */
export function trimEnvMap(
  env: Record<string, string>,
  options: { trimKeys?: boolean; trimValues?: boolean } = {}
): Record<string, string> {
  const { trimKeys = false, trimValues = true } = options;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    const trimmedKey = trimKeys ? key.trim() : key;
    const trimmedValue = trimValues ? value.trim() : value;
    result[trimmedKey] = trimmedValue;
  }
  return result;
}

/**
 * Reads an env file, trims keys/values, and returns the updated map.
 */
export function trimEnvFile(
  filePath: string,
  options: { trimKeys?: boolean; trimValues?: boolean } = {}
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseEnv(raw);
  return trimEnvMap(parsed, options);
}

/**
 * Reads an env file, trims keys/values, and writes the result back to disk.
 */
export function writeTrimmedEnv(
  filePath: string,
  outputPath: string,
  options: { trimKeys?: boolean; trimValues?: boolean } = {}
): void {
  const trimmed = trimEnvFile(filePath, options);
  const serialized = serializeEnv(trimmed);
  fs.writeFileSync(outputPath, serialized, 'utf-8');
}
