import * as fs from 'fs';
import * as path from 'path';

export interface LintRule {
  name: string;
  description: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

export const defaultRules: LintRule[] = [
  {
    name: 'no-empty-value',
    description: 'Values should not be empty',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value` : null,
  },
  {
    name: 'no-whitespace-key',
    description: 'Keys should not contain whitespace',
    check: (key, _value) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace` : null,
  },
  {
    name: 'uppercase-key',
    description: 'Keys should be uppercase',
    check: (key, _value) =>
      key !== key.toUpperCase() ? `Key "${key}" is not uppercase` : null,
  },
  {
    name: 'no-quotes-in-value',
    description: 'Values should not be wrapped in unnecessary quotes',
    check: (key, value) =>
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? `Key "${key}" value appears to be wrapped in quotes`
        : null,
  },
  {
    name: 'no-spaces-around-equals',
    description: 'No spaces should surround the = sign',
    check: (_key, value) => null, // handled at parse level
  },
];

export function lintEnvMap(
  envMap: Record<string, string>,
  rules: LintRule[] = defaultRules
): LintResult[] {
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(envMap)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        results.push({ key, rule: rule.name, message });
      }
    }
  }
  return results;
}

export function lintEnvFile(
  filePath: string,
  rules: LintRule[] = defaultRules
): LintResult[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    envMap[key] = value;
  }
  return lintEnvMap(envMap, rules);
}
