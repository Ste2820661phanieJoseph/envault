import { encrypt, decrypt, deriveKey } from '../encryption';
import * as crypto from 'crypto';

describe('deriveKey', () => {
  it('derives a 32-byte key from a password and salt', () => {
    const salt = crypto.randomBytes(32);
    const key = deriveKey('my-password', salt);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('produces the same key for the same inputs', () => {
    const salt = crypto.randomBytes(32);
    const key1 = deriveKey('password', salt);
    const key2 = deriveKey('password', salt);
    expect(key1.equals(key2)).toBe(true);
  });
});

describe('encrypt / decrypt', () => {
  const password = 'super-secret-master-password';
  const plaintext = 'DB_HOST=localhost\nDB_PASS=secret123';

  it('encrypts and decrypts plaintext correctly', () => {
    const payload = encrypt(plaintext, password);
    const result = decrypt(payload, password);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertext on each call', () => {
    const p1 = encrypt(plaintext, password);
    const p2 = encrypt(plaintext, password);
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
  });

  it('throws when decrypting with wrong password', () => {
    const payload = encrypt(plaintext, password);
    expect(() => decrypt(payload, 'wrong-password')).toThrow();
  });

  it('throws when ciphertext is tampered', () => {
    const payload = encrypt(plaintext, password);
    payload.ciphertext = payload.ciphertext.replace(/^../, 'ff');
    expect(() => decrypt(payload, password)).toThrow();
  });
});
