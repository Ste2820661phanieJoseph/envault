import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LOCK_DIR = path.join(os.homedir(), '.envault', 'locks');
const LOCK_TIMEOUT_MS = 30_000; // 30 seconds

export interface LockInfo {
  pid: number;
  timestamp: number;
  project: string;
}

export function getLockPath(projectId: string): string {
  return path.join(LOCK_DIR, `${projectId}.lock`);
}

export function acquireLock(projectId: string): boolean {
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }

  const lockPath = getLockPath(projectId);

  if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, 'utf-8');
    const info: LockInfo = JSON.parse(raw);
    const age = Date.now() - info.timestamp;

    if (age < LOCK_TIMEOUT_MS) {
      return false; // Lock is still valid
    }
    // Stale lock — remove it
    fs.unlinkSync(lockPath);
  }

  const lockInfo: LockInfo = {
    pid: process.pid,
    timestamp: Date.now(),
    project: projectId,
  };

  fs.writeFileSync(lockPath, JSON.stringify(lockInfo), { flag: 'wx' });
  return true;
}

export function releaseLock(projectId: string): void {
  const lockPath = getLockPath(projectId);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
  }
}

export function isLocked(projectId: string): boolean {
  const lockPath = getLockPath(projectId);
  if (!fs.existsSync(lockPath)) return false;

  const raw = fs.readFileSync(lockPath, 'utf-8');
  const info: LockInfo = JSON.parse(raw);
  return Date.now() - info.timestamp < LOCK_TIMEOUT_MS;
}

export function withLock<T>(projectId: string, fn: () => T): T {
  if (!acquireLock(projectId)) {
    throw new Error(`Project "${projectId}" is locked by another envault process.`);
  }
  try {
    return fn();
  } finally {
    releaseLock(projectId);
  }
}
