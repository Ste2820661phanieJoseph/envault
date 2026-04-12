import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt } from '../crypto/encryption';
import { retrieveProjectKey } from '../crypto/keystore';

export const VAULT_DIR = path.join(process.env.HOME || '~', '.envault', 'vaults');

export interface VaultEntry {
  projectId: string;
  encryptedData: string;
  iv: string;
  updatedAt: string;
}

export function ensureVaultDir(): void {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
}

export function getVaultPath(projectId: string): string {
  return path.join(VAULT_DIR, `${projectId}.vault.json`);
}

export async function writeVault(
  projectId: string,
  envContent: string,
  passphrase: string
): Promise<void> {
  ensureVaultDir();

  const key = await retrieveProjectKey(projectId, passphrase);
  if (!key) {
    throw new Error(`No key found for project: ${projectId}`);
  }

  const { encryptedData, iv } = await encrypt(envContent, key);

  const entry: VaultEntry = {
    projectId,
    encryptedData,
    iv,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(getVaultPath(projectId), JSON.stringify(entry, null, 2), 'utf-8');
}

export async function readVault(
  projectId: string,
  passphrase: string
): Promise<string> {
  const vaultPath = getVaultPath(projectId);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found for project: ${projectId}`);
  }

  const entry: VaultEntry = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));

  const key = await retrieveProjectKey(projectId, passphrase);
  if (!key) {
    throw new Error(`No key found for project: ${projectId}`);
  }

  return decrypt(entry.encryptedData, entry.iv, key);
}

export function vaultExists(projectId: string): boolean {
  return fs.existsSync(getVaultPath(projectId));
}
