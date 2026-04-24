import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  namespaceEnvFile,
  removeNamespaceFromEnvMap,
  filterByNamespace,
  writeNamespacedEnv,
} from '../storage/env-namespace';
import { parseEnv, serializeEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerNamespaceCommand(program: Command): void {
  const ns = program.command('namespace').description('Namespace env keys with a prefix');

  ns.command('add <namespace> <file>')
    .description('Add a namespace prefix to all keys in an env file')
    .option('-o, --output <path>', 'Output file path (defaults to overwrite)')
    .action((namespace: string, file: string, opts: { output?: string }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const namespaced = namespaceEnvFile(file, namespace);
      const outPath = opts.output ?? file;
      fs.writeFileSync(outPath, serializeEnv(namespaced), 'utf-8');
      console.log(`Namespaced ${Object.keys(namespaced).length} key(s) with prefix "${namespace.toUpperCase()}__" → ${outPath}`);
    });

  ns.command('remove <namespace> <file>')
    .description('Remove a namespace prefix from matching keys in an env file')
    .option('-o, --output <path>', 'Output file path (defaults to overwrite)')
    .action((namespace: string, file: string, opts: { output?: string }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf-8');
      const env = parseEnv(raw);
      const stripped = removeNamespaceFromEnvMap(env, namespace);
      const outPath = opts.output ?? file;
      fs.writeFileSync(outPath, serializeEnv(stripped), 'utf-8');
      console.log(`Removed namespace "${namespace.toUpperCase()}__" from ${Object.keys(stripped).length} key(s) → ${outPath}`);
    });

  ns.command('filter <namespace> <file>')
    .description('Show only keys belonging to a namespace')
    .action((namespace: string, file: string) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf-8');
      const env = parseEnv(raw);
      const filtered = filterByNamespace(env, namespace);
      const keys = Object.keys(filtered);
      if (keys.length === 0) {
        console.log(`No keys found for namespace "${namespace.toUpperCase()}__"`);
      } else {
        keys.forEach(k => console.log(`${k}=${filtered[k]}`));
      }
    });
}
