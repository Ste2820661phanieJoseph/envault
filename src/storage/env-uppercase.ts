import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

/**
 * Converts all keys in an env map to uppercase.
 */
export function uppercaseEnvKeys(
  env: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    const upper = key.toUpperCase();
    if (upper in result) {
      throw new Error(
        `Key collision after uppercasing: '${key}' -> '${upper}'`
      );
    }
    result[upper] = value;
  }
  return result;
}

/**
 * Reads an env file, uppercases all keys, and returns the transformed map.
 */
export function uppercaseEnvFile(
  filePath: string
): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseEnv(raw);
  return uppercaseEnvKeys(parsed);
}

/**
 * Reads an env file, uppercases all keys, and writes the result to outputPath.
 * If outputPath is omitted the source file is overwritten.
 */
export function writeUppercasedEnv(
  filePath: string,
  outputPath?: string
): void {
  const transformed = uppercaseEnvFile(filePath);
  const serialized = serializeEnv(transformed);
  const dest = outputPath ?? filePath;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, serialized, 'utf-8');
}
