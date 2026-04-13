import { Command } from 'commander';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  addHook,
  removeHook,
  loadHooks,
  getHooksForEvent,
  toggleHook,
  HookEvent,
} from '../storage/hooks';

const VAULT_DIR = path.join(process.cwd(), '.envault');

export function runHooks(event: HookEvent): void {
  const hooks = getHooksForEvent(VAULT_DIR, event);
  for (const hook of hooks) {
    try {
      execSync(hook.command, { stdio: 'inherit' });
    } catch {
      console.error(`Hook failed for event "${event}": ${hook.command}`);
    }
  }
}

export function registerHookCommand(program: Command): void {
  const hook = program.command('hook').description('Manage lifecycle hooks for vault events');

  hook
    .command('add <event> <command>')
    .description('Add a hook for a lifecycle event (pre-push, post-push, pre-pull, post-pull)')
    .action((event: string, command: string) => {
      const validEvents: HookEvent[] = ['pre-push', 'post-push', 'pre-pull', 'post-pull'];
      if (!validEvents.includes(event as HookEvent)) {
        console.error(`Invalid event "${event}". Valid events: ${validEvents.join(', ')}`);
        process.exit(1);
      }
      addHook(VAULT_DIR, event as HookEvent, command);
      console.log(`Hook added: [${event}] ${command}`);
    });

  hook
    .command('remove <event> <command>')
    .description('Remove a hook for a lifecycle event')
    .action((event: string, command: string) => {
      removeHook(VAULT_DIR, event as HookEvent, command);
      console.log(`Hook removed: [${event}] ${command}`);
    });

  hook
    .command('list')
    .description('List all registered hooks')
    .action(() => {
      const config = loadHooks(VAULT_DIR);
      if (config.hooks.length === 0) {
        console.log('No hooks registered.');
        return;
      }
      config.hooks.forEach(h => {
        const status = h.enabled ? 'enabled' : 'disabled';
        console.log(`[${h.event}] (${status}) ${h.command}`);
      });
    });

  hook
    .command('toggle <event> <command> <state>')
    .description('Enable or disable a hook (state: enable|disable)')
    .action((event: string, command: string, state: string) => {
      const enabled = state === 'enable';
      toggleHook(VAULT_DIR, event as HookEvent, command, enabled);
      console.log(`Hook [${event}] "${command}" ${enabled ? 'enabled' : 'disabled'}.`);
    });
}
