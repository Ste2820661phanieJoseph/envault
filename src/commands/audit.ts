import { Command } from 'commander';
import { loadAuditLog, getRecentEntries, clearAuditLog } from '../storage/audit';

export function registerAuditCommand(program: Command): void {
  const audit = program
    .command('audit')
    .description('View and manage the audit log for a project');

  audit
    .command('log <projectId>')
    .description('Display recent audit entries for a project')
    .option('-n, --limit <number>', 'Number of recent entries to show', '20')
    .action((projectId: string, options: { limit: string }) => {
      const limit = parseInt(options.limit, 10);
      const entries = getRecentEntries(projectId, limit);

      if (entries.length === 0) {
        console.log(`No audit entries found for project: ${projectId}`);
        return;
      }

      console.log(`\nAudit log for project: ${projectId}\n`);
      console.log('─'.repeat(60));
      entries.forEach((entry) => {
        const time = new Date(entry.timestamp).toLocaleString();
        const detail = entry.details ? ` — ${entry.details}` : '';
        console.log(`[${time}] ${entry.user} performed ${entry.action.toUpperCase()}${detail}`);
      });
      console.log('─'.repeat(60));
    });

  audit
    .command('clear <projectId>')
    .description('Clear the audit log for a project')
    .option('--confirm', 'Confirm clearing the audit log without prompt')
    .action((projectId: string, options: { confirm: boolean }) => {
      if (!options.confirm) {
        console.error('Use --confirm flag to clear the audit log.');
        process.exit(1);
      }
      clearAuditLog(projectId);
      console.log(`Audit log cleared for project: ${projectId}`);
    });

  audit
    .command('export <projectId>')
    .description('Export the full audit log as JSON')
    .action((projectId: string) => {
      const entries = loadAuditLog(projectId);
      console.log(JSON.stringify(entries, null, 2));
    });
}
