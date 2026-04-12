import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pushCommand } from '../push';
import { pullCommand } from '../pull';
import * as keystore from '../../crypto/keystore';
import * as vault from '../../storage/vault';
import * as encryption from '../../crypto/encryption';

jest.mock('readline', () => ({
  createInterface: () => ({
    question: (_q: string, cb: (a: string) => void) => cb('testpassphrase123'),
    close: jest.fn(),
  }),
}));

jest.mock('../../crypto/keystore');
jest.mock('../../storage/vault');
jest.mock('../../crypto/encryption');

const mockRetrieveProjectKey = keystore.retrieveProjectKey as jest.MockedFunction<typeof keystore.retrieveProjectKey>;
const mockVaultExists = vault.vaultExists as jest.MockedFunction<typeof vault.vaultExists>;
const mockGetVaultPath = vault.getVaultPath as jest.MockedFunction<typeof vault.getVaultPath>;
const mockEnsureVaultDir = vault.ensureVaultDir as jest.MockedFunction<typeof vault.ensureVaultDir>;
const mockEncrypt = encryption.encrypt as jest.MockedFunction<typeof encryption.encrypt>;
const mockDecrypt = encryption.decrypt as jest.MockedFunction<typeof encryption.decrypt>;

describe('push command', () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
    envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value\n');
    mockRetrieveProjectKey.mockResolvedValue('fakevaultkey');
    mockEnsureVaultDir.mockResolvedValue(undefined);
    mockGetVaultPath.mockReturnValue(path.join(tmpDir, 'vault.json'));
    mockEncrypt.mockResolvedValue({ iv: 'iv', ciphertext: 'ct', salt: 'salt', tag: 'tag' } as any);
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true }));

  it('encrypts and writes vault file', async () => {
    await pushCommand({ projectName: 'myproject', envFile });
    const written = JSON.parse(fs.readFileSync(path.join(tmpDir, 'vault.json'), 'utf-8'));
    expect(written.ciphertext).toBe('ct');
  });

  it('throws if env file does not exist', async () => {
    await expect(pushCommand({ projectName: 'myproject', envFile: '/no/such/.env' })).rejects.toThrow('Env file not found');
  });
});

describe('pull command', () => {
  let tmpDir: string;
  let vaultFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pull-'));
    vaultFile = path.join(tmpDir, 'vault.json');
    fs.writeFileSync(vaultFile, JSON.stringify({ iv: 'iv', ciphertext: 'ct', salt: 'salt', tag: 'tag' }));
    mockVaultExists.mockReturnValue(true);
    mockGetVaultPath.mockReturnValue(vaultFile);
    mockRetrieveProjectKey.mockResolvedValue('fakevaultkey');
    mockDecrypt.mockResolvedValue('KEY=value\n');
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true }));

  it('decrypts vault and writes env file', async () => {
    const envFile = path.join(tmpDir, '.env');
    await pullCommand({ projectName: 'myproject', envFile, force: true });
    expect(fs.readFileSync(envFile, 'utf-8')).toBe('KEY=value\n');
  });

  it('throws if vault does not exist', async () => {
    mockVaultExists.mockReturnValue(false);
    await expect(pullCommand({ projectName: 'ghost', envFile: '.env', force: true })).rejects.toThrow('No vault found');
  });
});
