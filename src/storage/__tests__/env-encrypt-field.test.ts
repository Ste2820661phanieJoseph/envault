import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  isEncryptedValue,
  encryptEnvFields,
  decryptEnvFields,
  encryptEnvFile,
  decryptEnvFile,
} from '../env-encrypt-field';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-encrypt-field-'));
}

describe('isEncryptedValue', () => {
  it('returns true for enc: prefixed values', () => {
    expect(isEncryptedValue('enc:abc123')).toBe(true);
  });

  it('returns false for plain values', () => {
    expect(isEncryptedValue('plaintext')).toBe(false);
  });
});

describe('encryptEnvFields / decryptEnvFields', () => {
  const passphrase = 'test-passphrase-123';

  it('encrypts specified keys and prefixes them with enc:', async () => {
    const envMap = { API_KEY: 'secret', NAME: 'alice' };
    const result = await encryptEnvFields(envMap, { keys: ['API_KEY'], passphrase });
    expect(result['NAME']).toBe('alice');
    expect(result['API_KEY']).toMatch(/^enc:/);
  });

  it('does not double-encrypt already encrypted values', async () => {
    const envMap = { API_KEY: 'secret' };
    const once = await encryptEnvFields(envMap, { keys: ['API_KEY'], passphrase });
    const twice = await encryptEnvFields(once, { keys: ['API_KEY'], passphrase });
    expect(twice['API_KEY']).toBe(once['API_KEY']);
  });

  it('round-trips: encrypt then decrypt returns original value', async () => {
    const envMap = { DB_PASS: 'supersecret', HOST: 'localhost' };
    const encrypted = await encryptEnvFields(envMap, { keys: ['DB_PASS'], passphrase });
    const decrypted = await decryptEnvFields(encrypted, passphrase);
    expect(decrypted['DB_PASS']).toBe('supersecret');
    expect(decrypted['HOST']).toBe('localhost');
  });

  it('leaves non-encrypted fields unchanged during decryption', async () => {
    const envMap = { PLAIN: 'value' };
    const decrypted = await decryptEnvFields(envMap, passphrase);
    expect(decrypted['PLAIN']).toBe('value');
  });
});

describe('encryptEnvFile / decryptEnvFile', () => {
  const passphrase = 'file-passphrase';

  it('encrypts and decrypts field values in a file', async () => {
    const tmpDir = makeTmpDir();
    const filePath = path.join(tmpDir, '.env');
    fs.writeFileSync(filePath, 'TOKEN=mytoken\nAPP=myapp\n', 'utf8');

    await encryptEnvFile(filePath, { keys: ['TOKEN'], passphrase });
    const afterEncrypt = fs.readFileSync(filePath, 'utf8');
    expect(afterEncrypt).toContain('enc:');
    expect(afterEncrypt).toContain('APP=myapp');

    await decryptEnvFile(filePath, passphrase);
    const afterDecrypt = fs.readFileSync(filePath, 'utf8');
    expect(afterDecrypt).toContain('TOKEN=mytoken');
    expect(afterDecrypt).toContain('APP=myapp');
  });
});
