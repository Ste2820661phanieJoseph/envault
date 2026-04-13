import { Command } from 'commander';
import * as path from 'path';
import {
  addProfile,
  removeProfile,
  setActiveProfile,
  getActiveProfile,
  listProfiles,
  loadProfiles,
} from '../storage/profiles';

export function registerProfileCommand(program: Command): void {
  const profileCmd = program
    .command('profile')
    .description('Manage named environment profiles');

  profileCmd
    .command('add <name> <envFile>')
    .description('Add a new profile pointing to an env file')
    .option('-d, --description <desc>', 'Optional description')
    .action((name: string, envFile: string, opts: { description?: string }) => {
      const projectPath = process.cwd();
      const resolved = path.resolve(projectPath, envFile);
      const profile = addProfile(projectPath, name, resolved, opts.description);
      console.log(`Profile '${profile.name}' added (${resolved}).`);
    });

  profileCmd
    .command('remove <name>')
    .description('Remove a profile by name')
    .action((name: string) => {
      const projectPath = process.cwd();
      const removed = removeProfile(projectPath, name);
      if (removed) {
        console.log(`Profile '${name}' removed.`);
      } else {
        console.error(`Profile '${name}' not found.`);
        process.exit(1);
      }
    });

  profileCmd
    .command('use <name>')
    .description('Set the active profile')
    .action((name: string) => {
      const projectPath = process.cwd();
      const ok = setActiveProfile(projectPath, name);
      if (ok) {
        console.log(`Active profile set to '${name}'.`);
      } else {
        console.error(`Profile '${name}' not found.`);
        process.exit(1);
      }
    });

  profileCmd
    .command('current')
    .description('Show the currently active profile')
    .action(() => {
      const projectPath = process.cwd();
      const profile = getActiveProfile(projectPath);
      if (!profile) {
        console.log('No active profile set.');
      } else {
        console.log(`Active profile: ${profile.name} (${profile.envFile})`);
        if (profile.description) console.log(`  ${profile.description}`);
      }
    });

  profileCmd
    .command('list')
    .description('List all profiles')
    .action(() => {
      const projectPath = process.cwd();
      const store = loadProfiles(projectPath);
      const profiles = listProfiles(projectPath);
      if (profiles.length === 0) {
        console.log('No profiles defined.');
        return;
      }
      profiles.forEach((p) => {
        const active = store.active === p.name ? ' (active)' : '';
        console.log(`  ${p.name}${active} — ${p.envFile}`);
        if (p.description) console.log(`    ${p.description}`);
      });
    });
}
