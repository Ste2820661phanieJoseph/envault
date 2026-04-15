import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export interface CopyOptions {
  overwrite?: boolean;
  keys?: string[];
}

export interface CopyResult {
  copied: string[];
  skipped: string[];
  source: string;
  destination: string;
}

export function copyEnvKeys(
  sourceMap: Record<string, string>,
  destMap: Record<string, string>,
  options: CopyOptions = {}
): CopyResult {
  const { overwrite = false, keys } = options;
  const copied: string[] = [];
  const skipped: string[] = [];

  const keysToCopy = keys ? keys : Object.keys(sourceMap);

  for (const key of keysToCopy) {
    if (!(key in sourceMap)) {
      skipped.push(key);
      continue;
    }
    if (!overwrite && key in destMap) {
      skipped.push(key);
      continue;
    }
    destMap[key] = sourceMap[key];
    copied.push(key);
  }

  return { copied, skipped, source: '', destination: '' };
}

export function copyEnvFile(
  sourcePath: string,
  destPath: string,
  options: CopyOptions = {}
): CopyResult {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
  const sourceMap = parseEnv(sourceContent);

  const destMap: Record<string, string> = fs.existsSync(destPath)
    ? parseEnv(fs.readFileSync(destPath, 'utf-8'))
    : {};

  const result = copyEnvKeys(sourceMap, destMap, options);
  result.source = sourcePath;
  result.destination = destPath;

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, serializeEnv(destMap), 'utf-8');

  return result;
}
