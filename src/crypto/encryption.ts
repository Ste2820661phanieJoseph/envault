import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100_000;

export interface EncryptedPayload {
  iv: string;
  salt: string;
  tag: string;
  ciphertext: string;
}

export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(plaintext: string, password: string): EncryptedPayload {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload, password: string): string {
  const salt = Buffer.from(payload.salt, 'hex');
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');
  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: invalid password or corrupted data');
  }
}

/**
 * Serializes an EncryptedPayload to a compact base64 string for storage or transport.
 * Format: <salt>:<iv>:<tag>:<ciphertext> (each hex-encoded, joined and base64-encoded).
 */
export function serializePayload(payload: EncryptedPayload): string {
  const raw = `${payload.salt}:${payload.iv}:${payload.tag}:${payload.ciphertext}`;
  return Buffer.from(raw, 'utf8').toString('base64');
}

/**
 * Deserializes a base64 string produced by {@link serializePayload} back into an EncryptedPayload.
 */
export function deserializePayload(serialized: string): EncryptedPayload {
  const raw = Buffer.from(serialized, 'base64').toString('utf8');
  const parts = raw.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid serialized payload format');
  }
  const [salt, iv, tag, ciphertext] = parts;
  return { salt, iv, tag, ciphertext };
}
