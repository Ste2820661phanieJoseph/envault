import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface FreezeResult {
  frozen: string[];
  skipped: string[];
}

/**
 * Returns a new env map with the specified keys marked as frozen
 * by appending a special comment marker in the serialized form.
 * Internally, frozen keys are tracked in a separate set.
 */
export function freezeEnvKeys(
  envMap: Record<string, string>,
  keys: string[],
  currentFrozen: Set<string> = new Set()
): { envMap: Record<string, string>; frozen: Set<string>; result: FreezeResult } {
  const frozen = new Set(currentFrozen);
  const result: FreezeResult = { frozen: [], skipped: [] };

  for (const key of keys) {
    if (key in envMap) {
      frozen.add(key);
      result.frozen.push(key);
    } else {
      result.skipped.push(key);
    }
  }

  return { envMap: { ...envMap }, frozen, result };
}

export function unfreezeEnvKeys(
  envMap: Record<string, string>,
  keys: string[],
  currentFrozen: Set<string>
): { envMap: Record<string, string>; frozen: Set<string>; unfrozen: string[] } {
  const frozen = new Set(currentFrozen);
  const unfrozen: string[] = [];

  for (const key of keys) {
    if (frozen.has(key)) {
      frozen.delete(key);
      unfrozen.push(key);
    }
  }

  return { envMap: { ...envMap }, frozen, unfrozen };
}

export function applyFreezeGuard(
  incoming: Record<string, string>,
  existing: Record<string, string>,
  frozen: Set<string>
): Record<string, string> {
  const result = { ...incoming };
  for (const key of frozen) {
    if (key in existing) {
      result[key] = existing[key];
    }
  }
  return result;
}

export function getFrozenKeys(
  envMap: Record<string, string>,
  frozen: Set<string>
): string[] {
  return Array.from(frozen).filter((k) => k in envMap);
}

export function freezeEnvFile(
  filePath: string,
  keys: string[],
  frozenStorePath: string
): FreezeResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(content);
  const existing = loadFrozenKeys(frozenStorePath);
  const { frozen, result } = freezeEnvKeys(envMap, keys, existing);
  saveFrozenKeys(frozenStorePath, frozen);
  return result;
}

export function loadFrozenKeys(storePath: string): Set<string> {
  if (!fs.existsSync(storePath)) return new Set();
  const raw = fs.readFileSync(storePath, 'utf-8').trim();
  if (!raw) return new Set();
  return new Set(raw.split('\n').filter(Boolean));
}

export function saveFrozenKeys(storePath: string, frozen: Set<string>): void {
  fs.writeFileSync(storePath, Array.from(frozen).join('\n'), 'utf-8');
}
