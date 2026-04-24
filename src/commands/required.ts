import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import {
  checkRequiredKeysInFile,
  formatRequiredResult,
} from '../storage/env-required';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerRequiredCommand(program: Command): void {
  program
    .command('required <keys...>')
    .description('Check that required env keys are present in an env file')
    .option('-f, --file <path>', 'Path to the .env file', '.env')
    .option('--json', 'Output result as JSON')
    .option('--strict', 'Exit with non-zero code if any keys are missing')
    .action((keys: string[], options: { file: string; json?: boolean; strict?: boolean }) => {
      const filePath = path.isAbsolute(options.file)
        ? options.file
        : path.join(process.cwd(), options.file);

      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: file not found: ${filePath}`);
      }

      const result = checkRequiredKeysInFile(filePath, keys);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatRequiredResult(result));
      }

      if (options.strict && !result.allPresent) {
        process.exit(1);
      }
    });
}
