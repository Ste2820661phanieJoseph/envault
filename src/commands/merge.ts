import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { mergeEnvFiles, writeMergedEnv, MergeConflict } from '../storage/merge';
import { getVaultPath } from '../storage/vault';

function getVaultDir(projectId: string): string {
  return path.dirname(getVaultPath(projectId));
}

async function resolveInteractive(
  conflicts: MergeConflict[],
  merged: Record<string, string>
): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  for (const conflict of conflicts) {
    console.log(`\nConflict on key: ${conflict.key}`);
    console.log(`  [o] ours:   ${conflict.ours ?? '(deleted)'}`);
    console.log(`  [t] theirs: ${conflict.theirs ?? '(deleted)'}`);
    let answer = '';
    while (!['o', 't'].includes(answer)) {
      answer = (await ask('  Choose [o]urs / [t]heirs: ')).trim().toLowerCase();
    }
    if (answer === 'o') {
      if (conflict.ours !== undefined) merged[conflict.key] = conflict.ours;
      else delete merged[conflict.key];
    } else {
      if (conflict.theirs !== undefined) merged[conflict.key] = conflict.theirs;
      else delete merged[conflict.key];
    }
  }
  rl.close();
}

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <base> <ours> <theirs>')
    .description('Three-way merge two .env files using a common base')
    .option('-s, --strategy <strategy>', 'Merge strategy: ours | theirs | interactive', 'ours')
    .option('-o, --output <path>', 'Output path for merged result (defaults to <ours>)')
    .action(async (base: string, ours: string, theirs: string, opts) => {
      const strategy = opts.strategy as 'ours' | 'theirs' | 'interactive';
      const outputPath = opts.output ?? ours;

      if (!fs.existsSync(base)) { console.error(`Base file not found: ${base}`); process.exit(1); }
      if (!fs.existsSync(ours)) { console.error(`Ours file not found: ${ours}`); process.exit(1); }
      if (!fs.existsSync(theirs)) { console.error(`Theirs file not found: ${theirs}`); process.exit(1); }

      const effectiveStrategy = strategy === 'interactive' ? 'ours' : strategy;
      const result = await mergeEnvFiles(base, ours, theirs, effectiveStrategy);

      if (result.conflicts.length > 0) {
        if (strategy === 'interactive') {
          await resolveInteractive(result.conflicts, result.merged);
        } else {
          console.warn(`⚠  ${result.conflicts.length} conflict(s) resolved using strategy "${strategy}":`);
          result.conflicts.forEach(c =>
            console.warn(`   ${c.key}: ours=${c.ours ?? '(del)'} theirs=${c.theirs ?? '(del)'}`);
          );
        }
      }

      writeMergedEnv(outputPath, result.merged);
      console.log(`✔ Merged result written to ${outputPath}`);
      if (result.conflicts.length === 0) console.log('  No conflicts detected.');
    });
}
