import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Add a prefix to all keys in an env map.
 */
export function addPrefixToEnvMap(
  envMap: Record<string, string>,
  prefix: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    result[`${prefix}${key}`] = value;
  }
  return result;
}

/**
 * Remove a prefix from all keys in an env map.
 * Keys that do not start with the prefix are left unchanged.
 */
export function removePrefixFromEnvMap(
  envMap: Record<string, string>,
  prefix: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Filter only keys that start with the given prefix.
 */
export function filterByPrefix(
  envMap: Record<string, string>,
  prefix: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  }
  return result;
}

export function addPrefixToFile(filePath: string, prefix: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return addPrefixToEnvMap(envMap, prefix);
}

export function removePrefixFromFile(filePath: string, prefix: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return removePrefixFromEnvMap(envMap, prefix);
}

export function writePrefixedEnv(filePath: string, envMap: Record<string, string>): void {
  fs.writeFileSync(filePath, serializeEnv(envMap), 'utf-8');
}
