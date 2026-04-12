import * as fs from 'fs';
import * as path from 'path';
import { writeVault, readVault, vaultExists, VAULT_DIR } from '../vault';
import { storeProjectKey } from '../../crypto/keystore';

const TEST_PROJECT_ID = 'test-vault-project';
const TEST_PASSPHRASE = 'super-secret-passphrase';
const TEST_ENV_CONTENT = 'API_KEY=abc123\nDB_URL=postgres://localhost/test\nDEBUG=true';

beforeAll(async () => {
  await storeProjectKey(TEST_PROJECT_ID, TEST_PASSPHRASE);
});

afterAll(() => {
  const vaultPath = path.join(VAULT_DIR, `${TEST_PROJECT_ID}.vault.json`);
  if (fs.existsSync(vaultPath)) {
    fs.unlinkSync(vaultPath);
  }
});

describe('vault', () => {
  it('should return false when vault does not exist', () => {
    expect(vaultExists('nonexistent-project')).toBe(false);
  });

  it('should write a vault file successfully', async () => {
    await writeVault(TEST_PROJECT_ID, TEST_ENV_CONTENT, TEST_PASSPHRASE);
    expect(vaultExists(TEST_PROJECT_ID)).toBe(true);
  });

  it('should read back the original env content from vault', async () => {
    const result = await readVault(TEST_PROJECT_ID, TEST_PASSPHRASE);
    expect(result).toBe(TEST_ENV_CONTENT);
  });

  it('should store valid JSON with expected fields', async () => {
    const vaultPath = path.join(VAULT_DIR, `${TEST_PROJECT_ID}.vault.json`);
    const raw = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
    expect(raw).toHaveProperty('projectId', TEST_PROJECT_ID);
    expect(raw).toHaveProperty('encryptedData');
    expect(raw).toHaveProperty('iv');
    expect(raw).toHaveProperty('updatedAt');
  });

  it('should throw when reading vault with wrong passphrase', async () => {
    await expect(readVault(TEST_PROJECT_ID, 'wrong-passphrase')).rejects.toThrow();
  });

  it('should throw when reading a non-existent vault', async () => {
    await expect(readVault('ghost-project', TEST_PASSPHRASE)).rejects.toThrow(
      'Vault not found for project: ghost-project'
    );
  });
});
