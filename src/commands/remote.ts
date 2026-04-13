import { Command } from 'commander';
import { addRemote, removeRemote, getRemote, listRemotes } from '../storage/remote';

export function registerRemoteCommand(program: Command): void {
  const remote = program
    .command('remote')
    .description('Manage remote vault connections');

  remote
    .command('add <name> <url>')
    .description('Add a new remote vault')
    .requiredOption('-p, --project <projectId>', 'Project ID on the remote')
    .option('-t, --token <token>', 'Authentication token')
    .action((name: string, url: string, opts: { project: string; token?: string }) => {
      const existing = getRemote(name);
      if (existing) {
        console.error(`Remote "${name}" already exists. Use 'remote remove' first.`);
        process.exit(1);
      }
      addRemote(name, { url, projectId: opts.project, token: opts.token });
      console.log(`Remote "${name}" added (${url}).`);
    });

  remote
    .command('remove <name>')
    .description('Remove a remote vault')
    .action((name: string) => {
      const removed = removeRemote(name);
      if (!removed) {
        console.error(`Remote "${name}" not found.`);
        process.exit(1);
      }
      console.log(`Remote "${name}" removed.`);
    });

  remote
    .command('list')
    .description('List all configured remotes')
    .action(() => {
      const remotes = listRemotes();
      if (remotes.length === 0) {
        console.log('No remotes configured.');
        return;
      }
      remotes.forEach(({ name, config }) => {
        const synced = config.lastSynced
          ? `  last synced: ${config.lastSynced}`
          : '  never synced';
        console.log(`${name}\t${config.url}\t(project: ${config.projectId})${synced}`);
      });
    });

  remote
    .command('show <name>')
    .description('Show details of a remote')
    .action((name: string) => {
      const config = getRemote(name);
      if (!config) {
        console.error(`Remote "${name}" not found.`);
        process.exit(1);
      }
      console.log(JSON.stringify({ name, ...config }, null, 2));
    });
}
