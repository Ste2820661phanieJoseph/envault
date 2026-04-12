import { Command } from 'commander';
import chalk from 'chalk';
import { isLocked, acquireLock, releaseLock } from '../storage/lock';

export function registerLockCommands(program: Command): void {
  const lockCmd = program
    .command('lock')
    .description('Manage project vault locks');

  lockCmd
    .command('status <projectId>')
    .description('Check if a project vault is currently locked')
    .action((projectId: string) => {
      if (isLocked(projectId)) {
        console.log(chalk.yellow(`🔒 Project "${projectId}" is currently locked.`));
      } else {
        console.log(chalk.green(`🔓 Project "${projectId}" is not locked.`));
      }
    });

  lockCmd
    .command('acquire <projectId>')
    .description('Manually acquire a lock on a project vault')
    .action((projectId: string) => {
      const acquired = acquireLock(projectId);
      if (acquired) {
        console.log(chalk.green(`✅ Lock acquired for project "${projectId}".`));
      } else {
        console.error(chalk.red(`❌ Could not acquire lock for "${projectId}". It is already locked.`));
        process.exit(1);
      }
    });

  lockCmd
    .command('release <projectId>')
    .description('Manually release a lock on a project vault')
    .action((projectId: string) => {
      if (!isLocked(projectId)) {
        console.log(chalk.yellow(`⚠️  No active lock found for "${projectId}".`));
        return;
      }
      releaseLock(projectId);
      console.log(chalk.green(`✅ Lock released for project "${projectId}".`));
    });
}
