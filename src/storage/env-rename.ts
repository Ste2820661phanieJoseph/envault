import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface RenameResult {
  success: boolean;
  oldKey: string;
  newKey: string;
  message: string;
}

/**
 * Rename a key in an env map, preserving value and order.
 */
export function renameEnvKey(
  envMap: Record<string, string>,
  oldKey: string,
  newKey: string
): { result: Record<string, string>; info: RenameResult } {
  if (!(oldKey in envMap)) {
    return {
      result: { ...envMap },
      info: { success: false, oldKey, newKey, message: `Key "${oldKey}" not found.` },
    };
  }
  if (newKey in envMap) {
    return {
      result: { ...envMap },
      info: { success: false, oldKey, newKey, message: `Key "${newKey}" already exists.` },
    };
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(newKey)) {
    return {
      result: { ...envMap },
      info: { success: false, oldKey, newKey, message: `Key "${newKey}" is not a valid env variable name.` },
    };
  }

  const renamed: Record<string, string> = {};
  for (const [k, v] of Object.entries(envMap)) {
    if (k === oldKey) {
      renamed[newKey] = v;
    } else {
      renamed[k] = v;
    }
  }

  return {
    result: renamed,
    info: { success: true, oldKey, newKey, message: `Renamed "${oldKey}" to "${newKey}".` },
  };
}

/**
 * Rename a key in an env file in-place.
 */
export async function renameEnvFile(
  filePath: string,
  oldKey: string,
  newKey: string
): Promise<RenameResult> {
  const raw = await fs.promises.readFile(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  const { result, info } = renameEnvKey(envMap, oldKey, newKey);
  if (info.success) {
    await fs.promises.writeFile(filePath, serializeEnv(result), 'utf-8');
  }
  return info;
}
