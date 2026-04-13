import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../storage/vault';
import { isLocked } from '../storage/lock';
import { getLatestEntry } from '../storage/history';
import { parseEnv } from '../env/parser';
import { decrypt } from '../crypto/encryption';
import { retrieveProjectKey } from '../crypto/keystore';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show the current vault status and diff against local .env')
    .option('-e, --env <path>', 'Path to local .env file', '.env')
    .action(async (options) => {
      const cwd = process.cwd();
      const projectId = path.basename(cwd);

      if (!vaultExists(projectId)) {
        console.log('No vault found for this project. Run `envault init` first.');
        return;
      }

      const locked = isLocked(projectId);
      console.log(`Vault status: ${locked ? '🔒 Locked' : '🔓 Unlocked'}`);

      const latest = getLatestEntry(projectId);
      if (latest) {
        console.log(`Last synced: ${new Date(latest.timestamp).toLocaleString()} by ${latest.author}`);
      } else {
        console.log('Last synced: Never');
      }

      const localEnvPath = path.resolve(cwd, options.env);
      if (!fs.existsSync(localEnvPath)) {
        console.log(`Local env file not found at: ${localEnvPath}`);
        return;
      }

      try {
        const key = await retrieveProjectKey(projectId);
        if (!key) {
          console.log('No encryption key found. Cannot compare with vault.');
          return;
        }

        const vaultPath = getVaultPath(projectId);
        const encryptedData = fs.readFileSync(vaultPath, 'utf-8');
        const decrypted = await decrypt(encryptedData, key);
        const vaultEnv = parseEnv(decrypted);

        const localRaw = fs.readFileSync(localEnvPath, 'utf-8');
        const localEnv = parseEnv(localRaw);

        const vaultKeys = new Set(Object.keys(vaultEnv));
        const localKeys = new Set(Object.keys(localEnv));

        const added = [...localKeys].filter(k => !vaultKeys.has(k));
        const removed = [...vaultKeys].filter(k => !localKeys.has(k));
        const changed = [...localKeys].filter(k => vaultKeys.has(k) && localEnv[k] !== vaultEnv[k]);

        if (added.length === 0 && removed.length === 0 && changed.length === 0) {
          console.log('✅ Local .env is in sync with vault.');
        } else {
          console.log('⚠️  Differences detected:');
          added.forEach(k => console.log(`  + ${k} (local only)`));
          removed.forEach(k => console.log(`  - ${k} (vault only)`));
          changed.forEach(k => console.log(`  ~ ${k} (modified)`));
        }
      } catch (err) {
        console.error('Failed to read vault:', (err as Error).message);
      }
    });
}
