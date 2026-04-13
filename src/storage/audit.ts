import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  action: 'push' | 'pull' | 'rotate' | 'init' | 'lock' | 'unlock';
  projectId: string;
  user: string;
  details?: string;
}

const AUDIT_DIR = path.join(os.homedir(), '.envault', 'audit');

export function getAuditPath(projectId: string): string {
  return path.join(AUDIT_DIR, `${projectId}.audit.json`);
}

export function ensureAuditDir(): void {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

export function loadAuditLog(projectId: string): AuditEntry[] {
  ensureAuditDir();
  const auditPath = getAuditPath(projectId);
  if (!fs.existsSync(auditPath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(auditPath, 'utf-8');
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

export function appendAuditLog(projectId: string, entry: Omit<AuditEntry, 'timestamp' | 'user'>): void {
  ensureAuditDir();
  const entries = loadAuditLog(projectId);
  const newEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    user: os.userInfo().username,
  };
  entries.push(newEntry);
  fs.writeFileSync(getAuditPath(projectId), JSON.stringify(entries, null, 2), 'utf-8');
}

export function clearAuditLog(projectId: string): void {
  const auditPath = getAuditPath(projectId);
  if (fs.existsSync(auditPath)) {
    fs.unlinkSync(auditPath);
  }
}

export function getRecentEntries(projectId: string, limit: number = 10): AuditEntry[] {
  const entries = loadAuditLog(projectId);
  return entries.slice(-limit);
}
