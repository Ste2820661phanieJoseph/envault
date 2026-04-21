import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { writePatchedEnv, PatchOperation } from '../storage/env-patch';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerPatchCommand(program: Command): void {
  const patch = program
    .command('patch')
    .description('Apply patch operations (set/delete/rename) to an env file');

  patch
    .command('set <file> <key> <value>')
    .description('Set a key to a value in the env file')
    .action((file: string, key: string, value: string) => {
      const ops: PatchOperation[] = [{ op: 'set', key, value }];
      const result = writePatchedEnv(file, ops);
      if (result.applied.length > 0) {
        console.log(`Set ${key}=${value} in ${file}`);
      } else {
        console.warn(`Could not set ${key} in ${file}`);
      }
    });

  patch
    .command('delete <file> <key>')
    .description('Delete a key from the env file')
    .action((file: string, key: string) => {
      const ops: PatchOperation[] = [{ op: 'delete', key }];
      const result = writePatchedEnv(file, ops);
      if (result.applied.length > 0) {
        console.log(`Deleted ${key} from ${file}`);
      } else {
        console.warn(`Key ${key} not found in ${file}`);
      }
    });

  patch
    .command('rename <file> <key> <newKey>')
    .description('Rename a key in the env file')
    .action((file: string, key: string, newKey: string) => {
      const ops: PatchOperation[] = [{ op: 'rename', key, newKey }];
      const result = writePatchedEnv(file, ops);
      if (result.applied.length > 0) {
        console.log(`Renamed ${key} -> ${newKey} in ${file}`);
      } else {
        console.warn(`Key ${key} not found in ${file}`);
      }
    });

  patch
    .command('apply <file> <patchFile>')
    .description('Apply a JSON patch file containing an array of operations')
    .action((file: string, patchFile: string) => {
      if (!fs.existsSync(patchFile)) {
        console.error(`Patch file not found: ${patchFile}`);
        process.exit(1);
      }
      const ops: PatchOperation[] = JSON.parse(fs.readFileSync(patchFile, 'utf-8'));
      const result = writePatchedEnv(file, ops);
      console.log(`Applied ${result.applied.length} operation(s), skipped ${result.skipped.length}.`);
    });
}
