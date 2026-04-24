import * as fs from 'fs';
import { parseEnv } from '../env/parser';

export interface RequiredCheckResult {
  missing: string[];
  present: string[];
  allPresent: boolean;
}

/**
 * Check which required keys are missing from an env map.
 */
export function checkRequiredKeys(
  envMap: Record<string, string>,
  requiredKeys: string[]
): RequiredCheckResult {
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of requiredKeys) {
    const value = envMap[key];
    if (value === undefined || value === '') {
      missing.push(key);
    } else {
      present.push(key);
    }
  }

  return {
    missing,
    present,
    allPresent: missing.length === 0,
  };
}

/**
 * Read an env file and check which required keys are missing.
 */
export function checkRequiredKeysInFile(
  filePath: string,
  requiredKeys: string[]
): RequiredCheckResult {
  if (!fs.existsSync(filePath)) {
    return {
      missing: [...requiredKeys],
      present: [],
      allPresent: requiredKeys.length === 0,
    };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(content);
  return checkRequiredKeys(envMap, requiredKeys);
}

/**
 * Format a RequiredCheckResult into a human-readable string.
 */
export function formatRequiredResult(result: RequiredCheckResult): string {
  const lines: string[] = [];
  if (result.allPresent) {
    lines.push('All required keys are present.');
  } else {
    lines.push(`Missing required keys (${result.missing.length}):`);
    for (const key of result.missing) {
      lines.push(`  - ${key}`);
    }
  }
  if (result.present.length > 0) {
    lines.push(`Present (${result.present.length}): ${result.present.join(', ')}`);
  }
  return lines.join('\n');
}
