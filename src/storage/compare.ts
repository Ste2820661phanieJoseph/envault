import * as fs from 'fs';
import * as path from 'path';
import { parseEnv } from '../env/parser';

export interface CompareResult {
  onlyInA: Record<string, string>;
  onlyInB: Record<string, string>;
  changed: Record<string, { a: string; b: string }>;
  unchanged: Record<string, string>;
}

export function compareEnvMaps(
  a: Record<string, string>,
  b: Record<string, string>
): CompareResult {
  const result: CompareResult = {
    onlyInA: {},
    onlyInB: {},
    changed: {},
    unchanged: {},
  };

  for (const key of Object.keys(a)) {
    if (!(key in b)) {
      result.onlyInA[key] = a[key];
    } else if (a[key] !== b[key]) {
      result.changed[key] = { a: a[key], b: b[key] };
    } else {
      result.unchanged[key] = a[key];
    }
  }

  for (const key of Object.keys(b)) {
    if (!(key in a)) {
      result.onlyInB[key] = b[key];
    }
  }

  return result;
}

export function compareEnvFiles(
  fileA: string,
  fileB: string
): CompareResult {
  const rawA = fs.existsSync(fileA) ? fs.readFileSync(fileA, 'utf-8') : '';
  const rawB = fs.existsSync(fileB) ? fs.readFileSync(fileB, 'utf-8') : '';
  const mapA = parseEnv(rawA);
  const mapB = parseEnv(rawB);
  return compareEnvMaps(mapA, mapB);
}

export function hasDifferences(result: CompareResult): boolean {
  return (
    Object.keys(result.onlyInA).length > 0 ||
    Object.keys(result.onlyInB).length > 0 ||
    Object.keys(result.changed).length > 0
  );
}
