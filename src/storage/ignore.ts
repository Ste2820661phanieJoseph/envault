import * as fs from 'fs';
import * as path from 'path';

export interface IgnoreConfig {
  patterns: string[];
}

export function getIgnorePath(vaultDir: string): string {
  return path.join(vaultDir, '.envaultignore');
}

export function loadIgnore(vaultDir: string): IgnoreConfig {
  const filePath = getIgnorePath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { patterns: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const patterns = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  return { patterns };
}

export function saveIgnore(vaultDir: string, config: IgnoreConfig): void {
  const filePath = getIgnorePath(vaultDir);
  const content = config.patterns.join('\n') + (config.patterns.length ? '\n' : '');
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function addIgnorePattern(vaultDir: string, pattern: string): IgnoreConfig {
  const config = loadIgnore(vaultDir);
  if (!config.patterns.includes(pattern)) {
    config.patterns.push(pattern);
    saveIgnore(vaultDir, config);
  }
  return config;
}

export function removeIgnorePattern(vaultDir: string, pattern: string): IgnoreConfig {
  const config = loadIgnore(vaultDir);
  config.patterns = config.patterns.filter((p) => p !== pattern);
  saveIgnore(vaultDir, config);
  return config;
}

export function isIgnored(key: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return key.startsWith(pattern.slice(0, -1));
    }
    if (pattern.startsWith('*')) {
      return key.endsWith(pattern.slice(1));
    }
    return key === pattern;
  });
}

export function filterIgnored(
  env: Record<string, string>,
  patterns: string[]
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) => !isIgnored(key, patterns))
  );
}
