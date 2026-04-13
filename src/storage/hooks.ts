import * as fs from 'fs';
import * as path from 'path';

export type HookEvent = 'pre-push' | 'post-push' | 'pre-pull' | 'post-pull';

export interface Hook {
  event: HookEvent;
  command: string;
  enabled: boolean;
}

export interface HooksConfig {
  hooks: Hook[];
}

export function getHooksPath(vaultDir: string): string {
  return path.join(vaultDir, 'hooks.json');
}

export function loadHooks(vaultDir: string): HooksConfig {
  const hooksPath = getHooksPath(vaultDir);
  if (!fs.existsSync(hooksPath)) {
    return { hooks: [] };
  }
  const raw = fs.readFileSync(hooksPath, 'utf-8');
  return JSON.parse(raw) as HooksConfig;
}

export function saveHooks(vaultDir: string, config: HooksConfig): void {
  const hooksPath = getHooksPath(vaultDir);
  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addHook(vaultDir: string, event: HookEvent, command: string): HooksConfig {
  const config = loadHooks(vaultDir);
  const existing = config.hooks.find(h => h.event === event && h.command === command);
  if (existing) {
    return config;
  }
  config.hooks.push({ event, command, enabled: true });
  saveHooks(vaultDir, config);
  return config;
}

export function removeHook(vaultDir: string, event: HookEvent, command: string): HooksConfig {
  const config = loadHooks(vaultDir);
  config.hooks = config.hooks.filter(h => !(h.event === event && h.command === command));
  saveHooks(vaultDir, config);
  return config;
}

export function getHooksForEvent(vaultDir: string, event: HookEvent): Hook[] {
  const config = loadHooks(vaultDir);
  return config.hooks.filter(h => h.event === event && h.enabled);
}

export function toggleHook(vaultDir: string, event: HookEvent, command: string, enabled: boolean): HooksConfig {
  const config = loadHooks(vaultDir);
  const hook = config.hooks.find(h => h.event === event && h.command === command);
  if (hook) {
    hook.enabled = enabled;
    saveHooks(vaultDir, config);
  }
  return config;
}
