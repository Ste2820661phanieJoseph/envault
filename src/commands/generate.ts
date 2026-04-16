import { Command } from 'commander';
import * as path from 'path';
import { generateEnvMap, writeGeneratedEnv, FieldType, GenerateField } from '../storage/env-generate';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate <output>')
    .description('Generate an .env file with random values for specified keys')
    .option('-f, --field <entries...>', 'Fields in format KEY:type[:length] (types: random,uuid,alphanumeric,numeric)')
    .action((output: string, opts: { field?: string[] }) => {
      const fields: GenerateField[] = [];

      for (const entry of opts.field ?? []) {
        const parts = entry.split(':');
        if (parts.length < 2) {
          console.error(`Invalid field spec: ${entry}. Use KEY:type[:length]`);
          process.exit(1);
        }
        const [key, type, lengthStr] = parts;
        const length = lengthStr ? parseInt(lengthStr, 10) : undefined;
        fields.push({ key, type: type as FieldType, length });
      }

      if (fields.length === 0) {
        console.error('No fields specified. Use --field KEY:type[:length]');
        process.exit(1);
      }

      const map = generateEnvMap(fields);
      const outPath = path.resolve(process.cwd(), output);
      writeGeneratedEnv(outPath, map);
      console.log(`Generated ${fields.length} field(s) → ${outPath}`);
      for (const [k, v] of Object.entries(map)) {
        console.log(`  ${k}=${v}`);
      }
    });
}
