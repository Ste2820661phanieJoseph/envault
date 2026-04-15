import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export type EnvMap = Record<string, string>;

/**
 * Interpolates variable references (${VAR} or $VAR) within env values
 * using other values in the same map or provided context.
 */
export function interpolateEnvMap(
  envMap: EnvMap,
  context: EnvMap = {}
): EnvMap {
  const merged: EnvMap = { ...context, ...envMap };
  const result: EnvMap = {};

  for (const [key, value] of Object.entries(envMap)) {
    result[key] = resolveValue(value, merged);
  }

  return result;
}

function resolveValue(value: string, context: EnvMap, depth = 0): string {
  if (depth > 10) {
    // Prevent infinite recursion for circular references
    return value;
  }

  return value.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g, (match, braced, bare) => {
    const varName = braced ?? bare;
    if (varName && varName in context) {
      return resolveValue(context[varName], context, depth + 1);
    }
    return match;
  });
}

/**
 * Reads an env file, interpolates all variable references, and returns the result.
 */
export function interpolateEnvFile(
  filePath: string,
  context: EnvMap = {}
): EnvMap {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return interpolateEnvMap(envMap, context);
}

/**
 * Interpolates an env file and writes the result to an output path.
 */
export function writeInterpolatedEnv(
  inputPath: string,
  outputPath: string,
  context: EnvMap = {}
): void {
  const interpolated = interpolateEnvFile(inputPath, context);
  fs.writeFileSync(outputPath, serializeEnv(interpolated), 'utf-8');
}
