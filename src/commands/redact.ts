import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { redactEnvFile, writeRedactedEnv } from '../storage/env-redact';
import { serializeEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerRedactCommand(program: Command): void {
  program
    .command('redact <envfile>')
    .description('Print or save a redacted version of an .env file')
    .option('-o, --output <file>', 'Write redacted output to a file instead of stdout')
    .option('-p, --placeholder <text>', 'Placeholder text for redacted values', '***REDACTED***')
    .option('-k, --keys <patterns>', 'Comma-separated regex patterns to match keys for redaction')
    .action((envfile: string, opts: { output?: string; placeholder: string; keys?: string }) => {
      const filePath = path.resolve(envfile);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }

      const patterns = opts.keys
        ? opts.keys.split(',').map((p) => new RegExp(p.trim(), 'i'))
        : undefined;

      if (opts.output) {
        const outPath = path.resolve(opts.output);
        writeRedactedEnv(filePath, outPath, patterns, opts.placeholder);
        console.log(`Redacted env written to ${outPath}`);
      } else {
        const redacted = redactEnvFile(filePath, patterns, opts.placeholder);
        process.stdout.write(serializeEnv(redacted));
      }
    });
}
