import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { renameEnvFile } from '../storage/env-rename';
import { appendAuditLog } from '../storage/audit';

export function getVaultDir(): string {
  return path.resolve(process.cwd(), '.envault');
}

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <oldKey> <newKey>')
    .description('Rename an environment variable key in the vault or a target file')
    .option('-f, --file <path>', 'Target .env file (defaults to .env in current directory)')
    .option('--vault', 'Operate on the vault encrypted env file instead')
    .action(async (oldKey: string, newKey: string, opts: { file?: string; vault?: boolean }) => {
      try {
        let targetFile: string;

        if (opts.vault) {
          const vaultDir = getVaultDir();
          targetFile = path.join(vaultDir, 'env');
          if (!fs.existsSync(targetFile)) {
            console.error('No vault env file found. Run `envault init` first.');
            process.exit(1);
          }
        } else {
          targetFile = opts.file ? path.resolve(opts.file) : path.resolve(process.cwd(), '.env');
          if (!fs.existsSync(targetFile)) {
            console.error(`File not found: ${targetFile}`);
            process.exit(1);
          }
        }

        const result = await renameEnvFile(targetFile, oldKey, newKey);

        if (!result.success) {
          console.error(`Rename failed: ${result.message}`);
          process.exit(1);
        }

        console.log(result.message);

        const vaultDir = getVaultDir();
        if (fs.existsSync(vaultDir)) {
          await appendAuditLog(vaultDir, {
            action: 'rename',
            details: `Renamed key "${oldKey}" to "${newKey}" in ${targetFile}`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error('Error during rename:', err.message);
        process.exit(1);
      }
    });
}
