import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface PatchOperation {
  op: 'set' | 'delete' | 'rename';
  key: string;
  value?: string;
  newKey?: string;
}

export interface PatchResult {
  applied: PatchOperation[];
  skipped: PatchOperation[];
  map: Record<string, string>;
}

export function applyPatch(
  envMap: Record<string, string>,
  operations: PatchOperation[]
): PatchResult {
  const result: Record<string, string> = { ...envMap };
  const applied: PatchOperation[] = [];
  const skipped: PatchOperation[] = [];

  for (const op of operations) {
    if (op.op === 'set') {
      if (op.value === undefined) {
        skipped.push(op);
        continue;
      }
      result[op.key] = op.value;
      applied.push(op);
    } else if (op.op === 'delete') {
      if (!(op.key in result)) {
        skipped.push(op);
        continue;
      }
      delete result[op.key];
      applied.push(op);
    } else if (op.op === 'rename') {
      if (!op.newKey || !(op.key in result)) {
        skipped.push(op);
        continue;
      }
      result[op.newKey] = result[op.key];
      delete result[op.key];
      applied.push(op);
    } else {
      skipped.push(op);
    }
  }

  return { applied, skipped, map: result };
}

export function patchEnvFile(
  filePath: string,
  operations: PatchOperation[]
): PatchResult {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  const envMap = parseEnv(raw);
  return applyPatch(envMap, operations);
}

export function writePatchedEnv(
  filePath: string,
  operations: PatchOperation[]
): PatchResult {
  const patchResult = patchEnvFile(filePath, operations);
  fs.writeFileSync(filePath, serializeEnv(patchResult.map), 'utf-8');
  return patchResult;
}
