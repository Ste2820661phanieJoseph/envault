import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export type TransformFn = (key: string, value: string) => { key: string; value: string };

export interface TransformRule {
  type: 'rename' | 'uppercase-keys' | 'lowercase-values' | 'prefix' | 'strip-prefix' | 'mask';
  options?: Record<string, string>;
}

export function applyTransform(
  envMap: Record<string, string>,
  rule: TransformRule
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(envMap)) {
    switch (rule.type) {
      case 'uppercase-keys':
        result[k.toUpperCase()] = v;
        break;
      case 'lowercase-values':
        result[k] = v.toLowerCase();
        break;
      case 'prefix': {
        const pfx = rule.options?.prefix ?? '';
        result[`${pfx}${k}`] = v;
        break;
      }
      case 'strip-prefix': {
        const pfx = rule.options?.prefix ?? '';
        const newKey = k.startsWith(pfx) ? k.slice(pfx.length) : k;
        result[newKey] = v;
        break;
      }
      case 'mask': {
        const keys = (rule.options?.keys ?? '').split(',').map((s) => s.trim());
        result[k] = keys.includes(k) ? '***' : v;
        break;
      }
      case 'rename': {
        const from = rule.options?.from;
        const to = rule.options?.to;
        if (from && to && k === from) {
          result[to] = v;
        } else {
          result[k] = v;
        }
        break;
      }
      default:
        result[k] = v;
    }
  }

  return result;
}

export function transformEnvFile(
  filePath: string,
  rules: TransformRule[]
): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`transformEnvFile: file not found: ${filePath}`);
  }
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`transformEnvFile: failed to read file "${filePath}": ${(err as Error).message}`);
  }
  let envMap = parseEnv(raw);
  for (const rule of rules) {
    envMap = applyTransform(envMap, rule);
  }
  return envMap;
}

export function writeTransformedEnv(
  envMap: Record<string, string>,
  outPath: string
): void {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, serializeEnv(envMap), 'utf-8');
}
