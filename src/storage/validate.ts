import * as fs from 'fs';
import { parseEnv } from '../env/parser';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvMap(
  envMap: Record<string, string>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    const value = envMap[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      errors.push(`Missing required key: ${rule.key}`);
      continue;
    }

    if (value === undefined) continue;

    if (rule.pattern) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        errors.push(`Key "${rule.key}" does not match pattern ${rule.pattern}`);
      }
    }

    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push(`Key "${rule.key}" is shorter than minimum length ${rule.minLength}`);
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      warnings.push(`Key "${rule.key}" exceeds recommended max length ${rule.maxLength}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateEnvFile(
  filePath: string,
  rules: ValidationRule[]
): ValidationResult {
  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`], warnings: [] };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(content);
  return validateEnvMap(envMap, rules);
}
