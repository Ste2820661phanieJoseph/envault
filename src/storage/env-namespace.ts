import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Applies a namespace prefix to all keys using double-underscore separator.
 * e.g. namespace="APP" => DB_HOST becomes APP__DB_HOST
 */
export function namespaceEnvMap(
  env: Record<string, string>,
  namespace: string
): Record<string, string> {
  const prefix = namespace.toUpperCase() + '__';
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[`${prefix}${key}`] = value;
  }
  return result;
}

/**
 * Removes a namespace prefix from all matching keys.
 * Keys without the prefix are dropped.
 */
export function removeNamespaceFromEnvMap(
  env: Record<string, string>,
  namespace: string
): Record<string, string> {
  const prefix = namespace.toUpperCase() + '__';
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    }
  }
  return result;
}

/**
 * Extracts all keys belonging to a given namespace without stripping the prefix.
 */
export function filterByNamespace(
  env: Record<string, string>,
  namespace: string
): Record<string, string> {
  const prefix = namespace.toUpperCase() + '__';
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  }
  return result;
}

export function namespaceEnvFile(filePath: string, namespace: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return namespaceEnvMap(parseEnv(raw), namespace);
}

export function writeNamespacedEnv(
  filePath: string,
  env: Record<string, string>,
  namespace: string
): void {
  const namespaced = namespaceEnvMap(env, namespace);
  fs.writeFileSync(filePath, serializeEnv(namespaced), 'utf-8');
}
