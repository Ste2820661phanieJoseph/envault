import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export type MergeStrategy = 'ours' | 'theirs' | 'interactive';

export interface MergeConflict {
  key: string;
  ours: string | undefined;
  theirs: string | undefined;
}

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: MergeConflict[];
}

/**
 * Merges two env maps using the given strategy.
 * 'ours' keeps local values on conflict, 'theirs' uses remote values.
 */
export function mergeEnvMaps(
  base: Record<string, string>,
  ours: Record<string, string>,
  theirs: Record<string, string>,
  strategy: Exclude<MergeStrategy, 'interactive'> = 'ours'
): MergeResult {
  const allKeys = new Set([...Object.keys(ours), ...Object.keys(theirs)]);
  const merged: Record<string, string> = {};
  const conflicts: MergeConflict[] = [];

  for (const key of allKeys) {\n    const oursVal = ours[key];
    const theirsVal = theirs[key];
    const baseVal = base[key];

    if (oursVal === theirsVal) {
      if (oursVal !== undefined) merged[key] = oursVal;
    } else if (oursVal === baseVal) {
      // Only theirs changed
      if (theirsVal !== undefined) merged[key] = theirsVal;
    } else if (theirsVal === baseVal) {
      // Only ours changed
      if (oursVal !== undefined) merged[key] = oursVal;
    } else {
      // Both changed — conflict
      conflicts.push({ key, ours: oursVal, theirs: theirsVal });
      merged[key] = strategy === 'ours'
        ? (oursVal ?? theirsVal ?? '')
        : (theirsVal ?? oursVal ?? '');
    }
  }

  return { merged, conflicts };
}

/**
 * Merges two .env files on disk using the given strategy.
 */
export async function mergeEnvFiles(
  basePath: string,
  oursPath: string,
  theirsPath: string,
  strategy: Exclude<MergeStrategy, 'interactive'> = 'ours'
): Promise<MergeResult> {
  const readMap = (p: string): Record<string, string> => {
    if (!fs.existsSync(p)) return {};
    return parseEnv(fs.readFileSync(p, 'utf8'));
  };
  return mergeEnvMaps(readMap(basePath), readMap(oursPath), readMap(theirsPath), strategy);
}

/**
 * Writes a merged env map to the given output path.
 */
export function writeMergedEnv(
  outputPath: string,
  merged: Record<string, string>
): void {
  fs.writeFileSync(outputPath, serializeEnv(merged), 'utf8');
}
