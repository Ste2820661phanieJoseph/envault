import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface SanitizeOptions {
  removeEmpty?: boolean;
  removeComments?: boolean;
  trimValues?: boolean;
  stripQuotes?: boolean;
}

export interface SanitizeResult {
  original: Record<string, string>;
  sanitized: Record<string, string>;
  removedKeys: string[];
  modifiedKeys: string[];
}

export function sanitizeEnvMap(
  env: Record<string, string>,
  options: SanitizeOptions = {}
): SanitizeResult {
  const { removeEmpty = true, trimValues = true, stripQuotes = false } = options;
  const sanitized: Record<string, string> = {};
  const removedKeys: string[] = [];
  const modifiedKeys: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    let newValue = value;

    if (trimValues) {
      newValue = newValue.trim();
    }

    if (stripQuotes) {
      newValue = newValue.replace(/^["']|["']$/g, '');
    }

    if (removeEmpty && newValue === '') {
      removedKeys.push(key);
      continue;
    }

    if (newValue !== value) {
      modifiedKeys.push(key);
    }

    sanitized[key] = newValue;
  }

  return { original: env, sanitized, removedKeys, modifiedKeys };
}

export function sanitizeEnvFile(
  filePath: string,
  options: SanitizeOptions = {}
): SanitizeResult {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnv(raw);
  return sanitizeEnvMap(env, options);
}

export function writeSanitizedEnv(
  filePath: string,
  result: SanitizeResult
): void {
  const content = serializeEnv(result.sanitized);
  fs.writeFileSync(filePath, content, 'utf-8');
}
