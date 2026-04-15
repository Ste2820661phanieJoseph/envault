import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { addSchemaField, removeSchemaField, loadSchema, validateAgainstSchema } from '../storage/env-schema';
import { parseEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerSchemaCommand(program: Command): void {
  const schema = program.command('schema').description('Manage env schema definitions');

  schema
    .command('add <key>')
    .description('Add or update a schema field')
    .option('--required', 'Mark field as required', false)
    .option('--description <desc>', 'Field description')
    .option('--pattern <regex>', 'Validation regex pattern')
    .option('--default <value>', 'Default value')
    .action((key: string, opts) => {
      const vaultDir = getVaultDir();
      const updated = addSchemaField(vaultDir, {
        key,
        required: opts.required,
        description: opts.description,
        pattern: opts.pattern,
        defaultValue: opts.default,
      });
      console.log(`Schema field "${key}" saved. Total fields: ${updated.fields.length}`);
    });

  schema
    .command('remove <key>')
    .description('Remove a schema field')
    .action((key: string) => {
      const vaultDir = getVaultDir();
      removeSchemaField(vaultDir, key);
      console.log(`Schema field "${key}" removed.`);
    });

  schema
    .command('list')
    .description('List all schema fields')
    .action(() => {
      const vaultDir = getVaultDir();
      const s = loadSchema(vaultDir);
      if (s.fields.length === 0) {
        console.log('No schema fields defined.');
        return;
      }
      s.fields.forEach(f => {
        const req = f.required ? '[required]' : '[optional]';
        const desc = f.description ? ` - ${f.description}` : '';
        const pat = f.pattern ? ` (pattern: ${f.pattern})` : '';
        console.log(`  ${f.key} ${req}${desc}${pat}`);
      });
    });

  schema
    .command('validate [envFile]')
    .description('Validate an env file against the schema')
    .action((envFile?: string) => {
      const vaultDir = getVaultDir();
      const filePath = envFile ? path.resolve(envFile) : path.join(process.cwd(), '.env');
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const envMap = parseEnv(raw);
      const s = loadSchema(vaultDir);
      const result = validateAgainstSchema(envMap, s);
      if (result.valid) {
        console.log('Validation passed.');
      } else {
        console.error('Validation failed:');
        result.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
      }
    });
}
