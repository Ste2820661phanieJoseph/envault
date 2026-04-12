import * as fs from 'fs';
import * as readline from 'readline';
import { retrieveProjectKey } from '../crypto/keystore';
import { getVaultPath, ensureVaultDir } from '../storage/vault';
import { encrypt } from '../crypto/encryption';

export interface PushOptions {
  projectName: string;
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

export async function pushCommand(options: PushOptions): Promise<void> {
  const { projectName, envFile = '.env' } = options;

  if (!fs.existsSync(envFile)) {
    throw new Error(`Env file not found: ${envFile}`);
  }

  const passphrase = await prompt('Master passphrase: ');
  const vaultKey = await retrieveProjectKey(projectName, passphrase);

  const envContent = fs.readFileSync(envFile, 'utf-8');
  const encrypted = await encrypt(envContent, vaultKey);

  await ensureVaultDir(projectName);
  const vaultPath = getVaultPath(projectName);
  fs.writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2), 'utf-8');

  console.log(`✔ Pushed ${envFile} to vault for project "${projectName}".`);
}
