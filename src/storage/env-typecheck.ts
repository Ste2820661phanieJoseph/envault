import * as fs from 'fs';
import { parseEnv } from '../env/parser';

export type EnvFieldType = 'string' | 'number' | 'boolean' | 'url' | 'email';

export interface TypeCheckRule {
  key: string;
  type: EnvFieldType;
  required?: boolean;
}

export interface TypeCheckResult {
  key: string;
  value: string | undefined;
  expectedType: EnvFieldType;
  valid: boolean;
  error?: string;
}

const VALIDATORS: Record<EnvFieldType, (v: string) => boolean> = {
  string: () => true,
  number: (v) => !isNaN(Number(v)) && v.trim() !== '',
  boolean: (v) => ['true', 'false', '1', '0', 'yes', 'no'].includes(v.toLowerCase()),
  url: (v) => { try { new URL(v); return true; } catch { return false; } },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};

export function typecheckEnvMap(
  env: Record<string, string>,
  rules: TypeCheckRule[]
): TypeCheckResult[] {
  return rules.map((rule) => {
    const value = env[rule.key];
    if (value === undefined || value === '') {
      if (rule.required) {
        return { key: rule.key, value, expectedType: rule.type, valid: false, error: 'Required key is missing or empty' };
      }
      return { key: rule.key, value, expectedType: rule.type, valid: true };
    }
    const valid = VALIDATORS[rule.type](value);
    return {
      key: rule.key,
      value,
      expectedType: rule.type,
      valid,
      error: valid ? undefined : `Value "${value}" is not a valid ${rule.type}`,
    };
  });
}

export function typecheckEnvFile(
  filePath: string,
  rules: TypeCheckRule[]
): TypeCheckResult[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnv(content);
  return typecheckEnvMap(env, rules);
}

export function hasTypeErrors(results: TypeCheckResult[]): boolean {
  return results.some((r) => !r.valid);
}
