import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { retrieveProjectKey, storeProjectKey } from '../crypto/keystore';
import { encrypt, decrypt, deriveKey } from '../crypto/encryption';
import { getVaultPath, vaultExists } from '../storage/vault';
import { withLock } from '../storage/lock';

const prompt = require('prompts');

export function registerRotateCommand(program: Command): void {
  program
    .command('rotate')
    .description('Rotate the encryption key for the current project vault')
    .option('-p, --project <name>', 'Project name', path.basename(process.cwd()))
    .action(async (options) => {
      const projectName: string = options.project;

      if (!vaultExists(projectName)) {
        console.error(`No vault found for project "${projectName}". Run envault init first.`);
        process.exit(1);
      }

      const { oldPassphrase } = await prompt({
        type: 'password',
        name: 'oldPassphrase',
        message: 'Enter your current passphrase:',
      });

      const { newPassphrase } = await prompt({
        type: 'password',
        name: 'newPassphrase',
        message: 'Enter your new passphrase:',
      });

      const { confirmPassphrase } = await prompt({
        type: 'password',
        name: 'confirmPassphrase',
        message: 'Confirm your new passphrase:',
      });

      if (newPassphrase !== confirmPassphrase) {
        console.error('Passphrases do not match.');
        process.exit(1);
      }

      await withLock(projectName, async () => {
        try {
          const vaultPath = getVaultPath(projectName);
          const encryptedData = fs.readFileSync(vaultPath, 'utf-8');

          const oldKey = await deriveKey(oldPassphrase);
          const decrypted = await decrypt(encryptedData, oldKey);

          const newKey = await deriveKey(newPassphrase);
          const reEncrypted = await encrypt(decrypted, newKey);

          fs.writeFileSync(vaultPath, reEncrypted, 'utf-8');
          await storeProjectKey(projectName, newPassphrase);

          console.log(`Key rotated successfully for project "${projectName}".`);
        } catch (err) {
          console.error('Failed to rotate key. Check your current passphrase.');
          process.exit(1);
        }
      });
    });
}
