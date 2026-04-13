import { Command } from 'commander';
import {
  loadPermissions,
  addPermission,
  removePermission,
  getPermission,
  Permission,
} from '../storage/permissions';
import { getVaultPath } from '../storage/vault';
import * as path from 'path';

function getVaultDir(projectId: string): string {
  return path.dirname(getVaultPath(process.cwd(), projectId));
}

export function registerPermissionsCommand(program: Command): void {
  const perm = program.command('permissions').description('Manage project permissions');

  perm
    .command('grant <user> <role>')
    .description('Grant a user a role (read, write, admin)')
    .option('--project <projectId>', 'Project ID', 'default')
    .option('--by <grantor>', 'Granted by user', 'system')
    .action((user: string, role: string, opts: { project: string; by: string }) => {
      const validRoles: Permission['role'][] = ['read', 'write', 'admin'];
      if (!validRoles.includes(role as Permission['role'])) {
        console.error(`Invalid role "${role}". Must be one of: ${validRoles.join(', ')}`);
        process.exit(1);
      }
      const vaultDir = getVaultDir(opts.project);
      addPermission(vaultDir, user, role as Permission['role'], opts.by);
      console.log(`Granted ${role} to ${user} on project ${opts.project}`);
    });

  perm
    .command('revoke <user>')
    .description('Revoke a user\'s permission')
    .option('--project <projectId>', 'Project ID', 'default')
    .action((user: string, opts: { project: string }) => {
      const vaultDir = getVaultDir(opts.project);
      removePermission(vaultDir, user);
      console.log(`Revoked permissions for ${user} on project ${opts.project}`);
    });

  perm
    .command('list')
    .description('List all permissions for a project')
    .option('--project <projectId>', 'Project ID', 'default')
    .action((opts: { project: string }) => {
      const vaultDir = getVaultDir(opts.project);
      const store = loadPermissions(vaultDir);
      if (store.permissions.length === 0) {
        console.log('No permissions set.');
        return;
      }
      store.permissions.forEach((p) => {
        console.log(`  ${p.user} — ${p.role} (granted by ${p.grantedBy} at ${p.grantedAt})`);
      });
    });

  perm
    .command('check <user>')
    .description('Check the role of a user')
    .option('--project <projectId>', 'Project ID', 'default')
    .action((user: string, opts: { project: string }) => {
      const vaultDir = getVaultDir(opts.project);
      const p = getPermission(vaultDir, user);
      if (!p) {
        console.log(`No permission found for ${user}`);
      } else {
        console.log(`${user} has role: ${p.role}`);
      }
    });
}
