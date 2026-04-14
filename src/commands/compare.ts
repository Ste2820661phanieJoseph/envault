import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { compareEnvFiles, hasDifferences, CompareResult } from '../storage/compare';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

function printCompareResult(result: CompareResult, labelA: string, labelB: string): void {
  if (!hasDifferences(result)) {
    console.log('No differences found.');
    return;
  }

  if (Object.keys(result.onlyInA).length > 0) {
    console.log(`\nOnly in ${labelA}:`);
    for (const [k, v] of Object.entries(result.onlyInA)) {
      console.log(`  - ${k}=${v}`);
    }
  }

  if (Object.keys(result.onlyInB).length > 0) {
    console.log(`\nOnly in ${labelB}:`);
    for (const [k, v] of Object.entries(result.onlyInB)) {
      console.log(`  + ${k}=${v}`);
    }
  }

  if (Object.keys(result.changed).length > 0) {
    console.log('\nChanged:');
    for (const [k, { a, b }] of Object.entries(result.changed)) {
      console.log(`  ~ ${k}: ${a} → ${b}`);
    }
  }
}

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <fileA> <fileB>')
    .description('Compare two .env files and show differences')
    .option('--keys-only', 'Show only key names without values')
    .action((fileA: string, fileB: string, opts: { keysOnly?: boolean }) => {
      const absA = path.resolve(fileA);
      const absB = path.resolve(fileB);

      if (!fs.existsSync(absA)) {
        console.error(`File not found: ${absA}`);
        process.exit(1);
      }
      if (!fs.existsSync(absB)) {
        console.error(`File not found: ${absB}`);
        process.exit(1);
      }

      const result = compareEnvFiles(absA, absB);

      if (opts.keysOnly) {
        const allDiffKeys = [
          ...Object.keys(result.onlyInA),
          ...Object.keys(result.onlyInB),
          ...Object.keys(result.changed),
        ];
        if (allDiffKeys.length === 0) {
          console.log('No differences found.');
        } else {
          console.log('Differing keys:');
          allDiffKeys.forEach((k) => console.log(`  ${k}`));
        }
        return;
      }

      printCompareResult(result, fileA, fileB);
    });
}
