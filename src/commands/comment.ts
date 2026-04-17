import { Command } from 'commander';
import * as path from 'path';
import { readEnvWithComments, writeEnvWithComments, addComment, removeComment } from '../storage/env-comment';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerCommentCommand(program: Command): void {
  const cmd = program.command('comment').description('Manage inline comments for env keys');

  cmd
    .command('add <file> <key> <comment>')
    .description('Add or update a comment for a key in an env file')
    .action(async (file: string, key: string, comment: string) => {
      try {
        const filePath = path.resolve(file);
        const map = await readEnvWithComments(filePath);
        const updated = addComment(map, key, comment);
        await writeEnvWithComments(filePath, updated);
        console.log(`Comment added to "${key}" in ${filePath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('remove <file> <key>')
    .description('Remove the comment for a key in an env file')
    .action(async (file: string, key: string) => {
      try {
        const filePath = path.resolve(file);
        const map = await readEnvWithComments(filePath);
        const updated = removeComment(map, key);
        await writeEnvWithComments(filePath, updated);
        console.log(`Comment removed from "${key}" in ${filePath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('list <file>')
    .description('List all keys with their comments')
    .action(async (file: string) => {
      try {
        const filePath = path.resolve(file);
        const map = await readEnvWithComments(filePath);
        for (const [key, { comment }] of Object.entries(map)) {
          console.log(`${key}: ${comment ?? '(no comment)'}`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
