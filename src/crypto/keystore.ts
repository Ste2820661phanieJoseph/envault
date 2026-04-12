import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { encrypt, decrypt, EncryptedPayload } from './encryption';

const KEYSTORE_DIR = path.join(os.homedir(), '.envault');
const KEYSTORE_FILE = path.join(KEYSTORE_DIR, 'keystore.json');

export interface KeystoreEntry {
  project: string;
  encryptedKey: EncryptedPayload;
}

function ensureKeystoreDir(): void {
  if (!fs.existsSync(KEYSTORE_DIR)) {
    fs.mkdirSync(KEYSTORE_DIR, { recursive: true, mode: 0o700 });
  }
}

function loadKeystore(): KeystoreEntry[] {
  ensureKeystoreDir();
  if (!fs.existsSync(KEYSTORE_FILE)) return [];
  const raw = fs.readFileSync(KEYSTORE_FILE, 'utf8');
  return JSON.parse(raw) as KeystoreEntry[];
}

function saveKeystore(entries: KeystoreEntry[]): void {
  ensureKeystoreDir();
  fs.writeFileSync(KEYSTORE_FILE, JSON.stringify(entries, null, 2), { mode: 0o600 });
}

export function storeProjectKey(project: string, secretKey: string, masterPassword: string): void {
  const entries = loadKeystore().filter((e) => e.project !== project);
  entries.push({ project, encryptedKey: encrypt(secretKey, masterPassword) });
  saveKeystore(entries);
}

export function retrieveProjectKey(project: string, masterPassword: string): string {
  const entries = loadKeystore();
  const entry = entries.find((e) => e.project === project);
  if (!entry) throw new Error(`No key found for project: ${project}`);
  return decrypt(entry.encryptedKey, masterPassword);
}

export function listProjects(): string[] {
  return loadKeystore().map((e) => e.project);
}

export function removeProjectKey(project: string): void {
  const entries = loadKeystore().filter((e) => e.project !== project);
  saveKeystore(entries);
}
