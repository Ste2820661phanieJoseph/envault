import * as fs from 'fs';
import * as path from 'path';

export interface AliasMap {
  [alias: string]: string; // alias -> profile name
}

export function getAliasesPath(vaultDir: string): string {
  return path.join(vaultDir, 'aliases.json');
}

export function loadAliases(vaultDir: string): AliasMap {
  const filePath = getAliasesPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(vaultDir: string, aliases: AliasMap): void {
  const filePath = getAliasesPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2), 'utf-8');
}

export function addAlias(
  vaultDir: string,
  alias: string,
  profileName: string
): AliasMap {
  const aliases = loadAliases(vaultDir);
  aliases[alias] = profileName;
  saveAliases(vaultDir, aliases);
  return aliases;
}

export function removeAlias(vaultDir: string, alias: string): AliasMap {
  const aliases = loadAliases(vaultDir);
  if (!(alias in aliases)) {
    throw new Error(`Alias "${alias}" does not exist.`);
  }
  delete aliases[alias];
  saveAliases(vaultDir, aliases);
  return aliases;
}

export function resolveAlias(
  vaultDir: string,
  aliasOrProfile: string
): string {
  const aliases = loadAliases(vaultDir);
  return aliases[aliasOrProfile] ?? aliasOrProfile;
}

export function listAliases(vaultDir: string): AliasMap {
  return loadAliases(vaultDir);
}
