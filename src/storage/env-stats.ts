import * as fs from 'fs';
import { parseEnv } from '../env/parser';

export interface EnvStats {
  totalKeys: number;
  emptyValues: number;
  placeholders: number;
  duplicates: number;
  longestKey: string;
  longestValue: string;
  keyLengthAvg: number;
}

export function computeEnvStats(envMap: Record<string, string>): EnvStats {
  const keys = Object.keys(envMap);
  const values = Object.values(envMap);

  const emptyValues = values.filter(v => v === '').length;
  const placeholders = values.filter(v => /^\$\{.+\}$/.test(v) || v === 'CHANGEME' || v === 'TODO').length;

  const seen = new Set<string>();
  let duplicates = 0;
  for (const k of keys) {
    if (seen.has(k)) duplicates++;
    else seen.add(k);
  }

  const longestKey = keys.reduce((a, b) => (b.length > a.length ? b : a), '');
  const longestValue = values.reduce((a, b) => (b.length > a.length ? b : a), '');
  const keyLengthAvg = keys.length > 0 ? keys.reduce((sum, k) => sum + k.length, 0) / keys.length : 0;

  return {
    totalKeys: keys.length,
    emptyValues,
    placeholders,
    duplicates,
    longestKey,
    longestValue,
    keyLengthAvg: Math.round(keyLengthAvg * 100) / 100,
  };
}

export function computeEnvFileStats(filePath: string): EnvStats {
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(content);
  return computeEnvStats(envMap);
}

export function formatEnvStats(stats: EnvStats): string {
  return [
    `Total keys      : ${stats.totalKeys}`,
    `Empty values    : ${stats.emptyValues}`,
    `Placeholders    : ${stats.placeholders}`,
    `Duplicates      : ${stats.duplicates}`,
    `Longest key     : ${stats.longestKey || '(none)'}`,
    `Longest value   : ${stats.longestValue.length > 40 ? stats.longestValue.slice(0, 40) + '...' : stats.longestValue || '(none)'}`,
    `Avg key length  : ${stats.keyLengthAvg}`,
  ].join('\n');
}
