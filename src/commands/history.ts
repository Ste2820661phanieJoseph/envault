import { Command } from 'commander';
import { loadHistory, getLatestEntry } from '../storage/history';

export function registerHistoryCommand(program: Command): void {
  const historyCmd = program
    .command('history')
    .description('View the action history for a project vault');

  historyCmd
    .command('list <projectId>')
    .description('List all history entries for a project')
    .option('-n, --limit <number>', 'Limit number of entries shown', '20')
    .action((projectId: string, options: { limit: string }) => {
      const limit = parseInt(options.limit, 10);
      if (isNaN(limit) || limit <= 0) {
        console.error('Error: --limit must be a positive integer.');
        process.exit(1);
      }
      const history = loadHistory(projectId);
      if (history.length === 0) {
        console.log(`No history found for project "${projectId}".`);
        return;
      }
      const entries = history.slice(-limit).reverse();
      console.log(`History for project "${projectId}" (last ${entries.length} entries):\n`);
      for (const entry of entries) {
        console.log(
          `  [${entry.timestamp}] ${entry.action.toUpperCase()} by ${entry.user} (checksum: ${entry.checksum})`
        );
      }
    });

  historyCmd
    .command('latest <projectId>')
    .description('Show the most recent history entry for a project')
    .action((projectId: string) => {
      const latest = getLatestEntry(projectId);
      if (!latest) {
        console.log(`No history found for project "${projectId}".`);
        return;
      }
      console.log(`Latest entry for project "${projectId}":`);
      console.log(`  Action:    ${latest.action}`);
      console.log(`  User:      ${latest.user}`);
      console.log(`  Checksum:  ${latest.checksum}`);
      console.log(`  Timestamp: ${latest.timestamp}`);
    });
}
