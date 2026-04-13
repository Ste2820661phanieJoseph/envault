import * as fs from 'fs';
import * as path from 'path';
import { parseEnv } from '../env/parser';

export interface SearchResult {
  key: string;
  value: string;
  profile?: string;
  snapshot?: string;
}

export interface SearchOptions {
  keyPattern?: string;
  valuePattern?: string;
  caseSensitive?: boolean;
}

export function searchEnvFile(
  filePath: string,
  options: SearchOptions
): SearchResult[] {
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseEnv(raw);
  const results: SearchResult[] = [];

  const flags = options.caseSensitive ? '' : 'i';
  const keyRx = options.keyPattern ? new RegExp(options.keyPattern, flags) : null;
  const valRx = options.valuePattern ? new RegExp(options.valuePattern, flags) : null;

  for (const [key, value] of Object.entries(parsed)) {
    const keyMatch = keyRx ? keyRx.test(key) : true;
    const valMatch = valRx ? valRx.test(value) : true;
    if (keyMatch && valMatch) {
      results.push({ key, value });
    }
  }

  return results;
}

export function searchVaultDir(
  vaultDir: string,
  options: SearchOptions
): SearchResult[] {
  if (!fs.existsSync(vaultDir)) return [];

  const results: SearchResult[] = [];
  const entries = fs.readdirSync(vaultDir);

  for (const entry of entries) {
    const fullPath = path.join(vaultDir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && entry.endsWith('.env')) {
      const profile = entry.replace(/\.env$/, '');
      const fileResults = searchEnvFile(fullPath, options).map((r) => ({
        ...r,
        profile,
      }));
      results.push(...fileResults);
    }
  }

  return results;
}
