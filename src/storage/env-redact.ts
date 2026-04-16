import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

const DEFAULT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
];

export function redactEnvMap(
  env: Record<string, string>,
  patterns: RegExp[] = DEFAULT_PATTERNS,
  placeholder = '***REDACTED***'
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    const shouldRedact = patterns.some((p) => p.test(key));
    result[key] = shouldRedact ? placeholder : value;
  }
  return result;
}

export function redactEnvFile(
  filePath: string,
  patterns: RegExp[] = DEFAULT_PATTERNS,
  placeholder = '***REDACTED***'
): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnv(content);
  return redactEnvMap(env, patterns, placeholder);
}

export function writeRedactedEnv(
  filePath: string,
  outPath: string,
  patterns: RegExp[] = DEFAULT_PATTERNS,
  placeholder = '***REDACTED***'
): void {
  const redacted = redactEnvFile(filePath, patterns, placeholder);
  fs.writeFileSync(outPath, serializeEnv(redacted), 'utf-8');
}
