import * as fs from 'fs';
import * as readline from 'readline';
import { retrieveProjectKey } from '../crypto/keystore';
import { getVaultPath, vaultExists } from '../storage/vault';
import { decrypt } from '../crypto/encryption';
import { diffEnv } from '../storage/sync';
import { parseEnv } from '../env/parser';

export interface PullOptions {
  projectName: string;
  envFile?: string;
  force?: boolean;
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

export async function pullCommand(options: PullOptions): Promise<void> {
  const { projectName, envFile = '.env', force = false } = options;

  if (!vaultExists(projectName)) {
    throw new Error(`No vault found for project "${projectName}". Run \`envault init\` first.`);
  }

  const passphrase = await prompt('Master passphrase: ');
  const vaultKey = await retrieveProjectKey(projectName, passphrase);

  const vaultPath = getVaultPath(projectName);
  const encryptedData = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
  const decrypted = await decrypt(encryptedData, vaultKey);

  if (fs.existsSync(envFile) && !force) {
    const existing = fs.readFileSync(envFile, 'utf-8');
    const diff = diffEnv(parseEnv(existing), parseEnv(decrypted));
    if (diff.added.length || diff.modified.length || diff.removed.length) {
      console.log('Differences detected:');
      diff.added.forEach((k) => console.log(`  + ${k}`));
      diff.modified.forEach((k) => console.log(`  ~ ${k}`));
      diff.removed.forEach((k) => console.log(`  - ${k}`));
      const confirm = await prompt('Overwrite local .env? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        console.log('Pull cancelled.');
        return;
      }
    }
  }

  fs.writeFileSync(envFile, decrypted, 'utf-8');
  console.log(`✔ Pulled vault to ${envFile} for project "${projectName}".`);
}
