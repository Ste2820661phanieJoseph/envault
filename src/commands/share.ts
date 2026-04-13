import { Command } from 'commander';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { addShare, removeShare, listShares, isShareExpired } from '../storage/sharing';
import { getVaultPath } from '../storage/vault';

const DEFAULT_VAULT_DIR = path.join(process.env.HOME || '~', '.envault');

export function registerShareCommand(program: Command): void {
  const share = program.command('share').description('Manage project sharing with team members');

  share
    .command('add <projectId> <user>')
    .description('Share a project with a user')
    .option('--write', 'Grant write permissions (default: read)', false)
    .option('--expires <date>', 'Expiry date in ISO format (e.g. 2025-12-31)')
    .option('--by <sharedBy>', 'Who is sharing (identifier)', 'current-user')
    .action((projectId: string, user: string, opts) => {
      const permissions: 'read' | 'write' = opts.write ? 'write' : 'read';
      const entry = {
        id: randomUUID(),
        projectId,
        sharedWith: user,
        sharedBy: opts.by,
        createdAt: new Date().toISOString(),
        expiresAt: opts.expires,
        permissions,
      };
      try {
        addShare(DEFAULT_VAULT_DIR, entry);
        console.log(`Shared project "${projectId}" with ${user} (${permissions})`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  share
    .command('remove <id>')
    .description('Remove a share by its ID')
    .action((id: string) => {
      try {
        removeShare(DEFAULT_VAULT_DIR, id);
        console.log(`Share "${id}" removed.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  share
    .command('list')
    .description('List all shares')
    .option('--project <projectId>', 'Filter by project ID')
    .action((opts) => {
      const shares = listShares(DEFAULT_VAULT_DIR, opts.project);
      if (shares.length === 0) {
        console.log('No shares found.');
        return;
      }
      shares.forEach((s) => {
        const expiredLabel = isShareExpired(s) ? ' [EXPIRED]' : '';
        const expiresLabel = s.expiresAt ? ` (expires: ${s.expiresAt})` : '';
        console.log(
          `[${s.id}] ${s.projectId} → ${s.sharedWith} (${s.permissions})${expiresLabel}${expiredLabel}`
        );
      });
    });
}
