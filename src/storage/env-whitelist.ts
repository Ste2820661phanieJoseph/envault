import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Filters an env map to only include keys present in the whitelist.
 */
export function whitelistEnvMap(
  envMap: Record<string, string>,
  whitelist: string[]
): Record<string, string> {
  const set = new Set(whitelist.map((k) => k.trim()).filter(Boolean));
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    if (set.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Reads an env file, applies whitelist filtering, and returns the filtered map.
 */
export function whitelistEnvFile(
  filePath: string,
  whitelist: string[]
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return whitelistEnvMap(envMap, whitelist);
}

/**
 * Reads an env file, applies whitelist filtering, and writes the result to outPath.
 */
export function writeWhitelistedEnv(
  filePath: string,
  whitelist: string[],
  outPath: string
): void {
  const filtered = whitelistEnvFile(filePath, whitelist);
  fs.writeFileSync(outPath, serializeEnv(filtered), 'utf-8');
}
