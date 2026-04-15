import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parseEnv } from '../env/parser';
import { buildDiffReport, saveDiffReport, loadDiffReport, formatDiffReport } from '../storage/env-diff-report';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerDiffReportCommand(program: Command): void {
  const cmd = program.command('diff-report').description('Generate or view a diff report between two .env files or labels');

  cmd
    .command('generate <projectId> <baseFile> <targetFile>')
    .description('Generate a diff report between two env files')
    .option('--base-label <label>', 'Label for the base file', 'base')
    .option('--target-label <label>', 'Label for the target file', 'target')
    .action((projectId: string, baseFile: string, targetFile: string, opts: { baseLabel: string; targetLabel: string }) => {
      if (!fs.existsSync(baseFile)) {
        console.error(`Base file not found: ${baseFile}`);
        process.exit(1);
      }
      if (!fs.existsSync(targetFile)) {
        console.error(`Target file not found: ${targetFile}`);
        process.exit(1);
      }
      const baseMap = parseEnv(fs.readFileSync(baseFile, 'utf-8'));
      const targetMap = parseEnv(fs.readFileSync(targetFile, 'utf-8'));
      const report = buildDiffReport(projectId, opts.baseLabel, opts.targetLabel, baseMap, targetMap);
      const vaultDir = getVaultDir();
      saveDiffReport(vaultDir, projectId, report);
      console.log(formatDiffReport(report));
      console.log(`\nReport saved to vault for project "${projectId}".`);
    });

  cmd
    .command('show <projectId>')
    .description('Show the latest saved diff report for a project')
    .action((projectId: string) => {
      const vaultDir = getVaultDir();
      const report = loadDiffReport(vaultDir, projectId);
      if (!report) {
        console.error(`No diff report found for project "${projectId}".`);
        process.exit(1);
      }
      console.log(formatDiffReport(report));
    });

  cmd
    .command('summary <projectId>')
    .description('Show a summary count of changes in the latest diff report')
    .action((projectId: string) => {
      const vaultDir = getVaultDir();
      const report = loadDiffReport(vaultDir, projectId);
      if (!report) {
        console.error(`No diff report found for project "${projectId}".`);
        process.exit(1);
      }
      const counts = { added: 0, removed: 0, changed: 0, unchanged: 0 };
      for (const e of report.entries) counts[e.status]++;
      console.log(`Summary for ${report.baseLabel} → ${report.targetLabel}:`);
      console.log(`  Added:     ${counts.added}`);
      console.log(`  Removed:   ${counts.removed}`);
      console.log(`  Changed:   ${counts.changed}`);
      console.log(`  Unchanged: ${counts.unchanged}`);
    });
}
