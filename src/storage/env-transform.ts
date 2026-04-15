import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export type TransformFn = (key: string, value: string) => { key: string; value: string };

export interface TransformResult {
  original: Record<string, string>;
  transformed: Record<string, string>;
  changes: Array<{ key: string; oldValue: string; newValue: string; newKey?: string }>;
}

export function applyTransform(
  envMap: Record<string, string>,
  fn: TransformFn
): TransformResult {
  const transformed: Record<string, string> = {};
  const changes: TransformResult['changes'] = [];

  for (const [key, value] of Object.entries(envMap)) {
    const result = fn(key, value);
    transformed[result.key] = result.value;
    if (result.key !== key || result.value !== value) {
      changes.push({
        key,
        oldValue: value,
        newValue: result.value,
        ...(result.key !== key ? { newKey: result.key } : {}),
      });
    }
  }

  return { original: envMap, transformed, changes };
}

export function transformEnvFile(
  filePath: string,
  fn: TransformFn
): TransformResult {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return applyTransform(envMap, fn);
}

export function writeTransformedEnv(
  filePath: string,
  result: TransformResult
): void {
  const content = serializeEnv(result.transformed);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export const builtinTransforms: Record<string, TransformFn> = {
  uppercaseKeys: (key, value) => ({ key: key.toUpperCase(), value }),
  lowercaseKeys: (key, value) => ({ key: key.toLowerCase(), value }),
  trimValues: (key, value) => ({ key, value: value.trim() }),
  prefixKeys: (prefix: string) =>
    ((key: string, value: string) => ({ key: `${prefix}${key}`, value })) as TransformFn,
};
