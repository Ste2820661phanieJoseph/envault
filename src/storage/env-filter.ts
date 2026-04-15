import * as fs from 'fs';
import { parseEnv, serializeEnv } from '../env/parser';

export interface FilterOptions {
  keys?: string[];
  prefix?: string;
  suffix?: string;
  pattern?: RegExp;
  excludeKeys?: string[];
  excludePrefix?: string;
}

/**
 * Filter an env map by the given options, returning only matching keys.
 */
export function filterEnvMap(
  envMap: Record<string, string>,
  options: FilterOptions
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(envMap)) {
    // Exclusion rules take priority
    if (options.excludeKeys && options.excludeKeys.includes(key)) continue;
    if (options.excludePrefix && key.startsWith(options.excludePrefix)) continue;

    // Inclusion rules (any match passes)
    let included = false;

    if (options.keys && options.keys.includes(key)) included = true;
    if (options.prefix && key.startsWith(options.prefix)) included = true;
    if (options.suffix && key.endsWith(options.suffix)) included = true;
    if (options.pattern && options.pattern.test(key)) included = true;

    // If no inclusion filter specified, include everything not excluded
    const hasInclusionFilter =
      options.keys || options.prefix || options.suffix || options.pattern;

    if (!hasInclusionFilter || included) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Read an env file, apply filter options, and return the filtered map.
 */
export function filterEnvFile(
  filePath: string,
  options: FilterOptions
): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(content);
  return filterEnvMap(envMap, options);
}

/**
 * Read an env file, apply filter options, and write the result to an output file.
 */
export function writeFilteredEnv(
  inputPath: string,
  outputPath: string,
  options: FilterOptions
): Record<string, string> {
  const filtered = filterEnvFile(inputPath, options);
  fs.writeFileSync(outputPath, serializeEnv(filtered), 'utf-8');
  return filtered;
}
