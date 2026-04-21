import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface MaskOptions {
  keys?: string[];
  pattern?: RegExp;
  maskChar?: string;
  showLast?: number;
}

const DEFAULT_SENSITIVE_PATTERN = /password|secret|token|key|auth|credential|private|api_?key/i;

export function maskValue(value: string, maskChar = '*', showLast = 0): string {
  if (value.length === 0) return value;
  if (showLast > 0 && value.length > showLast) {
    const visible = value.slice(-showLast);
    const masked = maskChar.repeat(value.length - showLast);
    return masked + visible;
  }
  return maskChar.repeat(value.length);
}

export function maskEnvMap(
  env: Record<string, string>,
  options: MaskOptions = {}
): Record<string, string> {
  const {
    keys,
    pattern = DEFAULT_SENSITIVE_PATTERN,
    maskChar = '*',
    showLast = 0,
  } = options;

  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(env)) {
    const shouldMask =
      (keys && keys.includes(k)) ||
      (!keys && pattern.test(k));

    result[k] = shouldMask ? maskValue(v, maskChar, showLast) : v;
  }

  return result;
}

export function maskEnvFile(
  filePath: string,
  options: MaskOptions = {}
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnv(raw);
  return maskEnvMap(env, options);
}

export function writeMaskedEnv(
  filePath: string,
  options: MaskOptions = {}
): void {
  const masked = maskEnvFile(filePath, options);
  fs.writeFileSync(filePath, serializeEnv(masked), 'utf-8');
}
