import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { convertEnvFile, ConvertFormat } from '../storage/env-convert';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

const SUPPORTED_FORMATS: ConvertFormat[] = ['dotenv', 'json', 'yaml', 'export'];

export function registerConvertCommand(program: Command): void {
  program
    .command('convert <input> <output>')
    .description('Convert an env file between formats (dotenv, json, yaml, export)')
    .option('-f, --from <format>', 'input format (dotenv|json|yaml|export)', 'dotenv')
    .option('-t, --to <format>', 'output format (dotenv|json|yaml|export)', 'dotenv')
    .action((input: string, output: string, opts: { from: string; to: string }) => {
      const fromFormat = opts.from as ConvertFormat;
      const toFormat = opts.to as ConvertFormat;

      if (!SUPPORTED_FORMATS.includes(fromFormat)) {
        console.error(`Unsupported input format: ${fromFormat}. Choose from: ${SUPPORTED_FORMATS.join(', ')}`);
        process.exit(1);
      }

      if (!SUPPORTED_FORMATS.includes(toFormat)) {
        console.error(`Unsupported output format: ${toFormat}. Choose from: ${SUPPORTED_FORMATS.join(', ')}`);
        process.exit(1);
      }

      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        process.exit(1);
      }

      const outputPath = path.resolve(output);

      try {
        convertEnvFile(inputPath, outputPath, fromFormat, toFormat);
        console.log(`Converted ${fromFormat} -> ${toFormat}: ${outputPath}`);
      } catch (err: any) {
        console.error(`Conversion failed: ${err.message}`);
        process.exit(1);
      }
    });
}
