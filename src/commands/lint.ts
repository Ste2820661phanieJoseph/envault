import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { lintEnvFile, lintEnvMap } from '../storage/lint';
import { parseEnv } from '../env/parser';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerLintCommand(program: Command): void {
  program
    .command('lint [file]')
    .description('Lint a .env file or the current vault env for issues')
    .option('--strict', 'Treat warnings as errors')
    .action(async (file: string | undefined, opts: { strict?: boolean }) => {
      try {
        let issues: { key: string; message: string; severity: 'error' | 'warning' }[] = [];

        if (file) {
          const filePath = path.resolve(file);
          if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
          }
          issues = lintEnvFile(filePath);
        } else {
          const vaultDir = getVaultDir();
          const envPath = path.join(vaultDir, 'current.env');
          if (!fs.existsSync(envPath)) {
            console.error('No vault env found. Run `envault init` first.');
            process.exit(1);
          }
          const content = fs.readFileSync(envPath, 'utf-8');
          const envMap = parseEnv(content);
          issues = lintEnvMap(envMap);
        }

        if (issues.length === 0) {
          console.log('✔ No issues found.');
          return;
        }

        let hasErrors = false;
        for (const issue of issues) {
          const label = issue.severity === 'error' ? '✖ ERROR' : '⚠ WARN';
          console.log(`${label} [${issue.key}]: ${issue.message}`);
          if (issue.severity === 'error' || opts.strict) hasErrors = true;
        }

        console.log(`\n${issues.length} issue(s) found.`);
        if (hasErrors) process.exit(1);
      } catch (err: any) {
        console.error('Lint failed:', err.message);
        process.exit(1);
      }
    });
}
