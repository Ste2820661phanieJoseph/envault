import { Command } from 'commander';
import * as path from 'path';
import { addMember, removeMember, updateMemberRole, listMembers, TeamMember } from '../storage/teams';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerTeamCommand(program: Command): void {
  const team = program.command('team').description('Manage team members for the vault');

  team
    .command('add <email>')
    .description('Add a team member')
    .requiredOption('--name <name>', 'Display name of the member')
    .option('--role <role>', 'Role: admin, member, or viewer', 'member')
    .option('--id <id>', 'Unique member ID', () => Date.now().toString())
    .action((email: string, opts: { name: string; role: string; id: string }) => {
      const role = opts.role as TeamMember['role'];
      if (!['admin', 'member', 'viewer'].includes(role)) {
        console.error(`Invalid role '${role}'. Must be admin, member, or viewer.`);
        process.exit(1);
      }
      try {
        const member = addMember(getVaultDir(), { id: opts.id, name: opts.name, email, role });
        console.log(`Added ${member.name} (${member.email}) as ${member.role}.`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  team
    .command('remove <email>')
    .description('Remove a team member')
    .action((email: string) => {
      const removed = removeMember(getVaultDir(), email);
      if (removed) {
        console.log(`Removed member: ${email}`);
      } else {
        console.error(`No member found with email: ${email}`);
        process.exit(1);
      }
    });

  team
    .command('role <email> <role>')
    .description('Update the role of a team member')
    .action((email: string, role: string) => {
      if (!['admin', 'member', 'viewer'].includes(role)) {
        console.error(`Invalid role '${role}'. Must be admin, member, or viewer.`);
        process.exit(1);
      }
      const updated = updateMemberRole(getVaultDir(), email, role as TeamMember['role']);
      if (updated) {
        console.log(`Updated ${email} to role '${role}'.`);
      } else {
        console.error(`No member found with email: ${email}`);
        process.exit(1);
      }
    });

  team
    .command('list')
    .description('List all team members')
    .action(() => {
      const members = listMembers(getVaultDir());
      if (members.length === 0) {
        console.log('No team members found.');
        return;
      }
      console.log('Team members:');
      members.forEach((m) => {
        console.log(`  [${m.role}] ${m.name} <${m.email}> (added: ${m.addedAt})`);
      });
    });
}
