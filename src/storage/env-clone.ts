import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export interface CloneOptions {
  overwrite?: boolean;
  keys?: string[];        // if provided, only clone these keys
  excludeKeys?: string[]; // if provided, exclude these keys
}

export function cloneEnvMap(
  source: Record<string, string>,
  target: Record<string, string>,
  options: CloneOptions = {}
): Record<string, string> {
  const { keys, excludeKeys = [], overwrite = true } = options;
  const result = { ...target };

  const sourceKeys = keys ? keys.filter((k) => k in source) : Object.keys(source);

  for (const key of sourceKeys) {
    if (excludeKeys.includes(key)) continue;
    if (!overwrite && key in result) continue;
    result[key] = source[key];
  }

  return result;
}

export function cloneEnvFile(
  sourcePath: string,
  targetPath: string,
  options: CloneOptions = {}
): Record<string, string> {
  const sourceContent = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf-8') : '';
  const targetContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : '';

  const sourceMap = parseEnv(sourceContent);
  const targetMap = parseEnv(targetContent);

  return cloneEnvMap(sourceMap, targetMap, options);
}

export function writeClonedEnv(
  sourcePath: string,
  targetPath: string,
  options: CloneOptions = {}
): Record<string, string> {
  const merged = cloneEnvFile(sourcePath, targetPath, options);
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, serializeEnv(merged), 'utf-8');
  return merged;
}
