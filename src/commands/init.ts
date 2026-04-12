import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { storeProjectKey } from '../crypto/keystore';
import { ensureVaultDir, getVaultPath } from '../storage/vault';
import { encrypt } from '../crypto/encryption';

export interface InitOptions {
  projectName?: string;
  envFile?: string;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const projectName = options.projectName || await prompt('Project name: ');
  if (!projectName) {
    throw new Error('Project name is required.');
  }

  const passphrase = await prompt('Master passphrase (used to encrypt your vault key): ');
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters.');
  }

  // Generate a random vault key
  const { randomBytes } = await import('crypto');
  const vaultKey = randomBytes(32).toString('hex');

  await storeProjectKey(projectName, vaultKey, passphrase);
  await ensureVaultDir(projectName);

  const envFilePath = options.envFile || '.env';
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf-8');
    const encrypted = await encrypt(envContent, vaultKey);
    const vaultPath = getVaultPath(projectName);
    fs.writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2), 'utf-8');
    console.log(`✔ Imported ${envFilePath} into vault for project "${projectName}".`);
  } else {
    console.log(`✔ Vault initialized for project "${projectName}". No .env file found to import.`);
  }

  console.log('Run `envault push` to sync or `envault pull` to restore your .env.');
}
