import { encrypt, decrypt, deriveKey, serializePayload, deserializePayload } from '../crypto';
import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export interface FieldEncryptionOptions {
  keys: string[];
  passphrase: string;
}

const ENCRYPTED_PREFIX = 'enc:';

export function isEncryptedValue(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

export async function encryptEnvFields(
  envMap: Record<string, string>,
  options: FieldEncryptionOptions
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...envMap };
  for (const key of options.keys) {
    if (key in result && !isEncryptedValue(result[key])) {
      const derived = await deriveKey(options.passphrase);
      const payload = await encrypt(result[key], derived.key);
      const serialized = serializePayload({ ...payload, salt: derived.salt });
      result[key] = `${ENCRYPTED_PREFIX}${serialized}`;
    }
  }
  return result;
}

export async function decryptEnvFields(
  envMap: Record<string, string>,
  passphrase: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...envMap };
  for (const key of Object.keys(result)) {
    if (isEncryptedValue(result[key])) {
      const raw = result[key].slice(ENCRYPTED_PREFIX.length);
      const payload = deserializePayload(raw);
      const derived = await deriveKey(passphrase, (payload as any).salt);
      result[key] = await decrypt(payload, derived.key);
    }
  }
  return result;
}

export async function encryptEnvFile(
  filePath: string,
  options: FieldEncryptionOptions
): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf8');
  const envMap = parseEnv(content);
  const encrypted = await encryptEnvFields(envMap, options);
  fs.writeFileSync(filePath, serializeEnv(encrypted), 'utf8');
}

export async function decryptEnvFile(
  filePath: string,
  passphrase: string
): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf8');
  const envMap = parseEnv(content);
  const decrypted = await decryptEnvFields(envMap, passphrase);
  fs.writeFileSync(filePath, serializeEnv(decrypted), 'utf8');
}
