import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Remove blacklisted keys from an env map.
 */
export function blacklistEnvMap(
  envMap: Record<string, string>,
  blacklist: string[]
): Record<string, string> {
  const patterns = blacklist.map((p) => new RegExp(`^${p.replace(/\*/g, '.*')}$`));
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    const blocked = patterns.some((re) => re.test(key));
    if (!blocked) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Read an env file, remove blacklisted keys, and return the filtered map.
 */
export function blacklistEnvFile(
  filePath: string,
  blacklist: string[]
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return blacklistEnvMap(envMap, blacklist);
}

/**
 * Read an env file, remove blacklisted keys, and write the result back.
 */
export function writeBlacklistedEnv(
  filePath: string,
  blacklist: string[],
  outputPath?: string
): void {
  const filtered = blacklistEnvFile(filePath, blacklist);
  const serialized = serializeEnv(filtered);
  fs.writeFileSync(outputPath ?? filePath, serialized, 'utf-8');
}
