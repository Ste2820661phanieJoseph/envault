import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Lowercases all keys in an env map.
 * Duplicate keys (after lowercasing) are resolved by keeping the last occurrence.
 *
 * @param envMap - Record of env key/value pairs
 * @returns New record with all keys lowercased
 */
export function lowercaseEnvKeys(
  envMap: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envMap)) {
    const lower = key.toLowerCase();
    result[lower] = value;
  }
  return result;
}

/**
 * Reads an env file, lowercases all keys, and returns the transformed map.
 * Does not write to disk.
 *
 * @param filePath - Absolute or relative path to the .env file
 * @returns Transformed env map with lowercased keys
 */
export function lowercaseEnvFile(
  filePath: string
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return lowercaseEnvKeys(envMap);
}

/**
 * Reads an env file, lowercases all keys, and writes the result to an output file.
 * If outputPath is omitted, the input file is overwritten in place.
 *
 * @param filePath   - Path to the source .env file
 * @param outputPath - Optional path for the output file (defaults to filePath)
 */
export function writeLowercasedEnv(
  filePath: string,
  outputPath?: string
): void {
  const lowercased = lowercaseEnvFile(filePath);
  const serialized = serializeEnv(lowercased);
  const dest = outputPath ?? filePath;
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dest, serialized, 'utf-8');
}
