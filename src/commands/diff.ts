import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../storage/vault';
import { retrieveProjectKey } from '../crypto/keystore';
import { decrypt } from '../crypto/encryption';
import { parseEnv } from '../env/parser';
import { diffEnv } from '../storage/sync';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Show differences between local .env and the encrypted vault')
    .option('-e, --env <file>', 'Path to local .env file', '.env')
    .option('-p, --project <name>', 'Project name', path.basename(process.cwd()))
    .action(async (options) => {
      try {
        const projectName: string = options.project;
        const envFile: string = options.env;

        if (!vaultExists(projectName)) {
          console.error(`No vault found for project "${projectName}". Run envault init first.`);
          process.exit(1);
        }

        if (!fs.existsSync(envFile)) {
          console.error(`Local env file not found: ${envFile}`);
          process.exit(1);
        }

        const key = await retrieveProjectKey(projectName);
        if (!key) {
          console.error('No encryption key found for this project.');
          process.exit(1);
        }

        const vaultPath = getVaultPath(projectName);
        const encryptedData = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
        const decrypted = await decrypt(encryptedData, key);
        const vaultEnv = parseEnv(decrypted);

        const localRaw = fs.readFileSync(envFile, 'utf-8');
        const localEnv = parseEnv(localRaw);

        const diff = diffEnv(vaultEnv, localEnv);

        const hasChanges =
          diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0;

        if (!hasChanges) {
          console.log('No differences found. Local .env matches the vault.');
          return;
        }

        if (diff.added.length > 0) {
          console.log('\n+ Added (in local, not in vault):');
          diff.added.forEach((key) => console.log(`  + ${key}=${localEnv[key]}`));
        }

        if (diff.removed.length > 0) {
          console.log('\n- Removed (in vault, not in local):');
          diff.removed.forEach((key) => console.log(`  - ${key}=${vaultEnv[key]}`));
        }

        if (diff.modified.length > 0) {
          console.log('\n~ Modified:');
          diff.modified.forEach((key) => {
            console.log(`  ~ ${key}`);
            console.log(`    vault: ${vaultEnv[key]}`);
            console.log(`    local: ${localEnv[key]}`);
          });
        }
      } catch (err) {
        console.error('Error computing diff:', (err as Error).message);
        process.exit(1);
      }
    });
}
