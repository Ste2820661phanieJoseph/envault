import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { transformEnvFile, writeTransformedEnv, TransformRule } from '../storage/env-transform';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerTransformCommand(program: Command): void {
  const transform = program
    .command('transform')
    .description('Apply transformations to an env file');

  transform
    .command('run <input>')
    .description('Apply transform rules to <input> and print or save the result')
    .option('-o, --output <file>', 'Write transformed output to a file')
    .option('--uppercase-keys', 'Convert all keys to uppercase')
    .option('--lowercase-values', 'Convert all values to lowercase')
    .option('--prefix <prefix>', 'Add a prefix to all keys')
    .option('--strip-prefix <prefix>', 'Remove a prefix from all keys')
    .option('--mask <keys>', 'Comma-separated list of keys to mask')
    .option('--rename <from:to>', 'Rename a key (format: OLD:NEW)')
    .action((input: string, opts) => {
      if (!fs.existsSync(input)) {
        console.error(`Input file not found: ${input}`);
        process.exit(1);
      }

      const rules: TransformRule[] = [];

      if (opts.uppercaseKeys) rules.push({ type: 'uppercase-keys' });
      if (opts.lowercaseValues) rules.push({ type: 'lowercase-values' });
      if (opts.prefix) rules.push({ type: 'prefix', options: { prefix: opts.prefix } });
      if (opts.stripPrefix) rules.push({ type: 'strip-prefix', options: { prefix: opts.stripPrefix } });
      if (opts.mask) rules.push({ type: 'mask', options: { keys: opts.mask } });
      if (opts.rename) {
        const [from, to] = opts.rename.split(':');
        if (from && to) rules.push({ type: 'rename', options: { from, to } });
      }

      if (rules.length === 0) {
        console.error('No transform rules specified. Use --help for options.');
        process.exit(1);
      }

      const result = transformEnvFile(input, rules);

      if (opts.output) {
        writeTransformedEnv(result, opts.output);
        console.log(`Transformed env written to ${opts.output}`);
      } else {
        for (const [k, v] of Object.entries(result)) {
          console.log(`${k}=${v}`);
        }
      }
    });
}
