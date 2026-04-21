import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface DedupeResult {
  deduped: Record<string, string>;
  duplicates: Array<{ key: string; values: string[]; kept: string }>;
}

/**
 * Detects and removes duplicate keys from an env map.
 * When duplicates exist, the last occurrence wins (consistent with most shell behavior).
 */
export function dedupeEnvMap(
  entries: Array<[string, string]>
): DedupeResult {
  const seen = new Map<string, string[]>();

  for (const [key, value] of entries) {
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(value);
  }

  const deduped: Record<string, string> = {};
  const duplicates: DedupeResult['duplicates'] = [];

  for (const [key, values] of seen.entries()) {
    const kept = values[values.length - 1];
    deduped[key] = kept;
    if (values.length > 1) {
      duplicates.push({ key, values, kept });
    }
  }

  return { deduped, duplicates };
}

/**
 * Reads an env file, deduplicates keys, and returns the result.
 * The raw file is parsed to preserve duplicate entries before deduplication.
 */
export function dedupeEnvFile(filePath: string): DedupeResult {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const entries = parseRawEntries(raw);
  return dedupeEnvMap(entries);
}

/**
 * Parses raw env content into an ordered list of [key, value] pairs,
 * preserving duplicates (unlike parseEnv which uses an object).
 */
export function parseRawEntries(content: string): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) entries.push([key, value]);
  }
  return entries;
}

/**
 * Writes a deduped env map back to the given file path.
 */
export function writeDedupedEnv(
  filePath: string,
  deduped: Record<string, string>
): void {
  fs.writeFileSync(filePath, serializeEnv(deduped), 'utf-8');
}
