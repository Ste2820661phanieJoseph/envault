import { Command } from 'commander';
import * as path from 'path';
import {
  addSchedule,
  removeSchedule,
  listSchedules,
  updateLastRun,
} from '../storage/schedule';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerScheduleCommand(program: Command): void {
  const schedule = program
    .command('schedule')
    .description('Manage automated sync schedules for vault actions');

  schedule
    .command('add')
    .description('Add a new schedule entry')
    .requiredOption('--project <projectId>', 'Project ID')
    .requiredOption('--cron <expression>', 'Cron expression')
    .requiredOption('--action <action>', 'Action to run: push | pull | backup')
    .option('--profile <profile>', 'Optional profile name')
    .action((opts) => {
      const vaultDir = getVaultDir();
      const action = opts.action as 'push' | 'pull' | 'backup';
      if (!['push', 'pull', 'backup'].includes(action)) {
        console.error(`Invalid action "${action}". Must be push, pull, or backup.`);
        process.exit(1);
      }
      const entry = addSchedule(vaultDir, {
        projectId: opts.project,
        cron: opts.cron,
        action,
        profile: opts.profile,
        enabled: true,
      });
      console.log(`Schedule added: ${entry.id} (${entry.cron} → ${entry.action})`);
    });

  schedule
    .command('remove <id>')
    .description('Remove a schedule entry by ID')
    .action((id: string) => {
      const vaultDir = getVaultDir();
      const removed = removeSchedule(vaultDir, id);
      if (removed) {
        console.log(`Schedule ${id} removed.`);
      } else {
        console.error(`No schedule found with id: ${id}`);
        process.exit(1);
      }
    });

  schedule
    .command('list')
    .description('List all schedule entries')
    .action(() => {
      const vaultDir = getVaultDir();
      const entries = listSchedules(vaultDir);
      if (entries.length === 0) {
        console.log('No schedules configured.');
        return;
      }
      entries.forEach((e) => {
        const last = e.lastRun ? `last run: ${e.lastRun}` : 'never run';
        console.log(`[${e.id}] ${e.cron} → ${e.action} (${e.projectId}) | ${last}`);
      });
    });

  schedule
    .command('touch <id>')
    .description('Mark a schedule as just run (update lastRun timestamp)')
    .action((id: string) => {
      const vaultDir = getVaultDir();
      const ok = updateLastRun(vaultDir, id);
      if (ok) {
        console.log(`Updated lastRun for schedule ${id}.`);
      } else {
        console.error(`Schedule not found: ${id}`);
        process.exit(1);
      }
    });
}
