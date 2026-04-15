import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { validateEnvFile, ValidationRule } from '../storage/validate';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

function loadRules(rulesPath: string): ValidationRule[] {
  if (!fs.existsSync(rulesPath)) return [];
  const raw = fs.readFileSync(rulesPath, 'utf-8');
  return JSON.parse(raw) as ValidationRule[];
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Validate a .env file against defined rules')
    .argument('<envfile>', 'Path to the .env file to validate')
    .option('-r, --rules <path>', 'Path to JSON rules file', path.join(getVaultDir(), 'rules.json'))
    .action((envfile: string, options: { rules: string }) => {
      const rulesPath = path.resolve(options.rules);
      const rules = loadRules(rulesPath);

      if (rules.length === 0) {
        console.warn('No validation rules found. Add rules to:', rulesPath);
        process.exit(0);
      }

      const result = validateEnvFile(path.resolve(envfile), rules);

      if (result.warnings.length > 0) {
        console.warn('Warnings:');
        result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
      }

      if (!result.valid) {
        console.error('Validation failed:');
        result.errors.forEach((e) => console.error(`  ✖ ${e}`));
        process.exit(1);
      }

      console.log('✔ Validation passed.');
    });
}
