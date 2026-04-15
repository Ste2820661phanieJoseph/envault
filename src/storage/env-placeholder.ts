import * as fs from 'fs';
import * as path from 'path';

export interface PlaceholderResult {
  key: string;
  placeholder: string;
  hasValue: boolean;
}

/**
 * Scans an env map and returns entries where the value looks like a placeholder.
 * Placeholders are values like <KEY>, {{KEY}}, CHANGE_ME, TODO, or empty strings.
 */
export function detectPlaceholders(envMap: Record<string, string>): PlaceholderResult[] {
  const placeholderPatterns = [
    /^<[^>]+>$/,
    /^\{\{[^}]+\}\}$/,
    /^CHANGE_ME$/i,
    /^TODO$/i,
    /^REPLACE_ME$/i,
    /^YOUR_[A-Z_]+$/,
    /^\s*$/,
  ];

  return Object.entries(envMap).map(([key, value]) => {
    const isPlaceholder = placeholderPatterns.some((re) => re.test(value));
    return { key, placeholder: value, hasValue: !isPlaceholder };
  }).filter((r) => !r.hasValue);
}

/**
 * Fills placeholders in an env map using a provided values map.
 * Only fills keys that currently look like placeholders.
 */
export function fillPlaceholders(
  envMap: Record<string, string>,
  values: Record<string, string>
): Record<string, string> {
  const placeholders = detectPlaceholders(envMap);
  const placeholderKeys = new Set(placeholders.map((p) => p.key));
  const result: Record<string, string> = { ...envMap };
  for (const key of placeholderKeys) {
    if (values[key] !== undefined) {
      result[key] = values[key];
    }
  }
  return result;
}

/**
 * Reads an env file, fills placeholders, and writes the result back.
 */
export async function fillPlaceholdersInFile(
  filePath: string,
  values: Record<string, string>
): Promise<Record<string, string>> {
  const { parseEnv, serializeEnv } = await import('../env/parser');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  const filled = fillPlaceholders(envMap, values);
  fs.writeFileSync(filePath, serializeEnv(filled), 'utf-8');
  return filled;
}
