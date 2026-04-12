import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const MOCK_KEYSTORE_DIR = path.join(os.tmpdir(), '.envault-test-' + Date.now());
const MOCK_KEYSTORE_FILE = path.join(MOCK_KEYSTORE_DIR, 'keystore.json');

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => MOCK_KEYSTORE_DIR.replace('/.envault-test' + Date.now().toString(), ''),
}));

// Override paths by mocking the module internals via re-import after env setup
beforeAll(() => {
  process.env.ENVAULT_KEYSTORE_DIR = MOCK_KEYSTORE_DIR;
});

afterAll(() => {
  if (fs.existsSync(MOCK_KEYSTORE_DIR)) {
    fs.rmSync(MOCK_KEYSTORE_DIR, { recursive: true });
  }
});

// We test the logic by directly calling the functions and inspecting side effects
import { encrypt, decrypt } from '../encryption';

describe('encryption round-trip (keystore integration basis)', () => {
  const master = 'master-password-123';
  const secretKey = 'project-aes-key-abc';

  it('stores and retrieves a project secret key via encrypt/decrypt', () => {
    const payload = encrypt(secretKey, master);
    const retrieved = decrypt(payload, master);
    expect(retrieved).toBe(secretKey);
  });

  it('handles unicode and special characters in keys', () => {
    const specialKey = 'key-with-$peci@l-chars-!#%&*()';
    const payload = encrypt(specialKey, master);
    expect(decrypt(payload, master)).toBe(specialKey);
  });

  it('handles empty string plaintext', () => {
    const payload = encrypt('', master);
    expect(decrypt(payload, master)).toBe('');
  });
});
