import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface DefaultsMap {
  [key: string]: string;
}

/**
 * Apply default values to an env map.
 * Only fills in keys that are missing or have empty string values.
 */
export function applyDefaults(
  envMap: Record<string, string>,
  defaults: DefaultsMap
): Record<string, string> {
  const result = { ...envMap };
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in result) || result[key] === '') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Apply defaults to an env file and return the resulting map.
 */
export function applyDefaultsToFile(
  filePath: string,
  defaults: DefaultsMap
): Record<string, string> {
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf-8')
    : '';
  const envMap = parseEnv(content);
  return applyDefaults(envMap, defaults);
}

/**
 * Apply defaults to an env file and write the result back to disk.
 */
export function writeEnvWithDefaults(
  filePath: string,
  defaults: DefaultsMap
): void {
  const merged = applyDefaultsToFile(filePath, defaults);
  fs.writeFileSync(filePath, serializeEnv(merged), 'utf-8');
}

/**
 * Identify which default keys are missing (not present or empty) in an env map.
 */
export function getMissingDefaults(
  envMap: Record<string, string>,
  defaults: DefaultsMap
): string[] {
  return Object.keys(defaults).filter(
    (key) => !(key in envMap) || envMap[key] === ''
  );
}
