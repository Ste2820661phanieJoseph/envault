import { Command } from 'commander';
import {
  addTemplate,
  removeTemplate,
  listTemplates,
  getTemplate,
  applyTemplate,
  EnvTemplate,
  TemplateKey,
} from '../storage/templates';
import { getVaultPath, vaultExists } from '../storage/vault';
import * as path from 'path';
import * as fs from 'fs';

export function registerTemplateCommand(program: Command): void {
  const template = program.command('template').description('Manage .env templates');

  template
    .command('add <name>')
    .description('Create a new template from a key spec (comma-separated keys)')
    .option('-k, --keys <keys>', 'Comma-separated list of key names', '')
    .option('-d, --description <desc>', 'Template description', '')
    .action((name: string, opts: { keys: string; description: string }) => {
      const vaultDir = getVaultPath(process.cwd());
      const keys: TemplateKey[] = opts.keys
        .split(',')
        .filter(Boolean)
        .map((k) => ({ key: k.trim(), required: true }));
      const tmpl: EnvTemplate = {
        name,
        description: opts.description || undefined,
        keys,
        createdAt: new Date().toISOString(),
      };
      addTemplate(vaultDir, tmpl);
      console.log(`Template '${name}' saved with ${keys.length} key(s).`);
    });

  template
    .command('remove <name>')
    .description('Remove a template by name')
    .action((name: string) => {
      const vaultDir = getVaultPath(process.cwd());
      const removed = removeTemplate(vaultDir, name);
      if (removed) {
        console.log(`Template '${name}' removed.`);
      } else {
        console.error(`Template '${name}' not found.`);
        process.exit(1);
      }
    });

  template
    .command('list')
    .description('List all templates')
    .action(() => {
      const vaultDir = getVaultPath(process.cwd());
      const templates = listTemplates(vaultDir);
      if (templates.length === 0) {
        console.log('No templates found.');
        return;
      }
      templates.forEach((t) => {
        console.log(`- ${t.name}${t.description ? ': ' + t.description : ''} (${t.keys.length} keys)`);
      });
    });

  template
    .command('apply <name>')
    .description('Generate a blank .env scaffold from a template')
    .option('-o, --output <file>', 'Output file path', '.env.example')
    .action((name: string, opts: { output: string }) => {
      const vaultDir = getVaultPath(process.cwd());
      const tmpl = getTemplate(vaultDir, name);
      if (!tmpl) {
        console.error(`Template '${name}' not found.`);
        process.exit(1);
      }
      const applied = applyTemplate(tmpl);
      const lines = Object.entries(applied).map(([k, v]) => `${k}=${v}`);
      fs.writeFileSync(opts.output, lines.join('\n') + '\n', 'utf-8');
      console.log(`Scaffold written to '${opts.output}' (${lines.length} keys).`);
    });
}
