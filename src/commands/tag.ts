import { Command } from 'commander';
import { addTag, removeTag, listTags, findTag } from '../storage/tags';
import { getVaultPath, vaultExists } from '../storage/vault';
import * as fs from 'fs';
import * as crypto from 'crypto';

function computeVaultHash(projectId: string): string {
  const vaultPath = getVaultPath(projectId);
  if (!fs.existsSync(vaultPath)) return '';
  const content = fs.readFileSync(vaultPath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export function registerTagCommand(program: Command): void {
  const tag = program.command('tag').description('Manage vault snapshot tags');

  tag
    .command('add <projectId> <tagName>')
    .description('Tag the current vault snapshot')
    .option('--author <author>', 'Tag author', process.env.USER || 'unknown')
    .action((projectId: string, tagName: string, opts: { author: string }) => {
      if (!vaultExists(projectId)) {
        console.error(`No vault found for project "${projectId}". Run init first.`);
        process.exit(1);
      }
      const hash = computeVaultHash(projectId);
      try {
        const entry = addTag(projectId, tagName, hash, opts.author);
        console.log(`Tag "${entry.tag}" created at ${entry.createdAt} (hash: ${hash})`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  tag
    .command('remove <projectId> <tagName>')
    .description('Remove a tag')
    .action((projectId: string, tagName: string) => {
      const removed = removeTag(projectId, tagName);
      if (removed) {
        console.log(`Tag "${tagName}" removed.`);
      } else {
        console.error(`Tag "${tagName}" not found.`);
        process.exit(1);
      }
    });

  tag
    .command('list <projectId>')
    .description('List all tags for a project')
    .action((projectId: string) => {
      const tags = listTags(projectId);
      if (tags.length === 0) {
        console.log('No tags found.');
        return;
      }
      tags.forEach((t) => {
        console.log(`  ${t.tag}  hash:${t.vaultHash}  by:${t.createdBy}  at:${t.createdAt}`);
      });
    });

  tag
    .command('show <projectId> <tagName>')
    .description('Show details of a specific tag')
    .action((projectId: string, tagName: string) => {
      const entry = findTag(projectId, tagName);
      if (!entry) {
        console.error(`Tag "${tagName}" not found.`);
        process.exit(1);
      }
      console.log(JSON.stringify(entry, null, 2));
    });
}
