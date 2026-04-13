import { Command } from 'commander';
import * as path from 'path';
import {
  loadNotifications,
  markAsRead,
  clearNotifications,
  getUnreadNotifications,
} from '../storage/notifications';

function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerNotifyCommand(program: Command): void {
  const notify = program.command('notify').description('Manage envault notifications');

  notify
    .command('list')
    .description('List all notifications')
    .option('--unread', 'Show only unread notifications')
    .action((opts) => {
      const vaultDir = getVaultDir();
      const entries = opts.unread
        ? getUnreadNotifications(vaultDir)
        : loadNotifications(vaultDir).notifications;

      if (entries.length === 0) {
        console.log(opts.unread ? 'No unread notifications.' : 'No notifications found.');
        return;
      }

      entries.forEach((n) => {
        const status = n.read ? '  [read]' : '[unread]';
        console.log(`${status} [${n.timestamp}] (${n.type}) ${n.message} — by ${n.actor}`);
      });
    });

  notify
    .command('read <id>')
    .description('Mark a notification as read by ID')
    .action((id: string) => {
      const vaultDir = getVaultDir();
      const success = markAsRead(vaultDir, id);
      if (success) {
        console.log(`Notification ${id} marked as read.`);
      } else {
        console.error(`Notification with ID "${id}" not found.`);
        process.exit(1);
      }
    });

  notify
    .command('clear')
    .description('Clear all notifications')
    .action(() => {
      const vaultDir = getVaultDir();
      clearNotifications(vaultDir);
      console.log('All notifications cleared.');
    });
}
