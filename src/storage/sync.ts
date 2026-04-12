import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt } from '../crypto/encryption';
import { retrieveProjectKey } from '../crypto/keystore';
import { getVaultPath, ensureVaultDir } from './vault';

export interface SyncOptions {
  projectId: string;
  envFilePath?: string;
}

export async function pushEnv(options: SyncOptions): Promise<void> {
  const { projectId, envFilePath = '.env' } = options;

  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Environment file not found: ${envFilePath}`);
  }

  const key = await retrieveProjectKey(projectId);
  if (!key) {
    throw new Error(`No encryption key found for project: ${projectId}. Run 'envault init' first.`);
  }

  const plaintext = fs.readFileSync(envFilePath, 'utf-8');
  const encrypted = await encrypt(plaintext, key);

  ensureVaultDir();
  const vaultPath = getVaultPath(projectId);
  fs.writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2), 'utf-8');
}

export async function pullEnv(options: SyncOptions): Promise<string> {
  const { projectId, envFilePath = '.env' } = options;

  const key = await retrieveProjectKey(projectId);
  if (!key) {
    throw new Error(`No encryption key found for project: ${projectId}. Run 'envault init' first.`);
  }

  const vaultPath = getVaultPath(projectId);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`No vault found for project: ${projectId}. Run 'envault push' first.`);
  }

  const raw = fs.readFileSync(vaultPath, 'utf-8');
  const encrypted = JSON.parse(raw);
  const plaintext = await decrypt(encrypted, key);

  fs.writeFileSync(envFilePath, plaintext, 'utf-8');
  return plaintext;
}

export function diffEnv(current: string, incoming: string): string[] {
  const currentLines = new Set(current.split('\n').filter(Boolean));
  const incomingLines = incoming.split('\n').filter(Boolean);
  return incomingLines.filter(line => !currentLines.has(line));
}
