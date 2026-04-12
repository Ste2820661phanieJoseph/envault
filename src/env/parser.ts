/**
 * Parses and serializes .env file content
 */

export interface EnvRecord {
  [key: string]: string;
}

/**
 * Parse a .env file string into a key-value record.
 * Supports comments (#), blank lines, and quoted values.
 */
export function parseEnv(content: string): EnvRecord {
  const result: EnvRecord = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialize a key-value record back into .env file content.
 * Values containing spaces or special characters are double-quoted.
 */
export function serializeEnv(record: EnvRecord): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const needsQuotes = /[\s#"'\\]/.test(value) || value === '';
    const serializedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
    lines.push(`${key}=${serializedValue}`);
  }

  return lines.join('\n') + (lines.length > 0 ? '\n' : '');
}
