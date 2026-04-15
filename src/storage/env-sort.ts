import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  order?: SortOrder;
  groupByPrefix?: boolean;
}

export function sortEnvMap(
  env: Record<string, string>,
  options: SortOptions = {}
): Record<string, string> {
  const { order = 'asc', groupByPrefix = false } = options;
  const entries = Object.entries(env);

  if (groupByPrefix) {
    const groups: Record<string, [string, string][]> = {};
    for (const [key, value] of entries) {
      const prefix = key.includes('_') ? key.split('_')[0] : '__ungrouped__';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push([key, value]);
    }
    const sortedGroupKeys = Object.keys(groups).sort((a, b) =>
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
    const sorted: Record<string, string> = {};
    for (const groupKey of sortedGroupKeys) {
      const groupEntries = groups[groupKey].sort(([a], [b]) =>
        order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      );
      for (const [k, v] of groupEntries) {
        sorted[k] = v;
      }
    }
    return sorted;
  }

  const sorted = entries.sort(([a], [b]) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  );
  return Object.fromEntries(sorted);
}

export function sortEnvFile(
  inputPath: string,
  options: SortOptions = {}
): Record<string, string> {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const env = parseEnv(content);
  return sortEnvMap(env, options);
}

export function writeSortedEnv(
  inputPath: string,
  outputPath: string,
  options: SortOptions = {}
): void {
  const sorted = sortEnvFile(inputPath, options);
  fs.writeFileSync(outputPath, serializeEnv(sorted), 'utf-8');
}
