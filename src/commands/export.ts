import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../storage/vault';
import { retrieveProjectKey } from '../crypto/keystore';
import { decrypt } from '../crypto/encryption';
import { parseEnv, serializeEnv } from '../env/parser';
import { appendAuditLog } from '../storage/audit';

export type ExportFormat = 'dotenv' | 'json' | 'shell';

function formatEnv(vars: Record<string, string>, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(vars, null, 2);
    case 'shell':
      return Object.entries(vars)
        .map(([k, v]) => `export ${k}=${JSON.stringify(v)}`)
        .join('\n');
    case 'dotenv':
    default:
      return serializeEnv(vars);
  }
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export decrypted env variables to a file or stdout')
    .option('-p, --project <name>', 'Project name', 'default')
    .option('-o, --output <file>', 'Output file path (defaults to stdout)')
    .option('-f, --format <format>', 'Output format: dotenv | json | shell', 'dotenv')
    .action(async (options) => {
      const { project, output, format } = options;

      if (!vaultExists(project)) {
        console.error(`No vault found for project "${project}". Run envault init first.`);
        process.exit(1);
      }

      const key = await retrieveProjectKey(project);
      if (!key) {
        console.error('Encryption key not found. Cannot decrypt vault.');
        process.exit(1);
      }

      const vaultPath = getVaultPath(project);
      const raw = fs.readFileSync(vaultPath, 'utf-8');
      const { encrypted, iv, tag } = JSON.parse(raw);
      const decrypted = decrypt(encrypted, key, iv, tag);
      const vars = parseEnv(decrypted);

      const validFormats: ExportFormat[] = ['dotenv', 'json', 'shell'];
      if (!validFormats.includes(format as ExportFormat)) {
        console.error(`Invalid format "${format}". Choose from: dotenv, json, shell`);
        process.exit(1);
      }

      const content = formatEnv(vars, format as ExportFormat);

      if (output) {
        const outPath = path.resolve(output);
        fs.writeFileSync(outPath, content, 'utf-8');
        console.log(`Exported ${Object.keys(vars).length} variable(s) to ${outPath}`);
      } else {
        console.log(content);
      }

      await appendAuditLog(project, {
        action: 'export',
        user: process.env.USER || 'unknown',
        timestamp: new Date().toISOString(),
        details: { format, destination: output || 'stdout', count: Object.keys(vars).length },
      });
    });
}
