import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getAuditPath,
  loadAuditLog,
  appendAuditLog,
  clearAuditLog,
  getRecentEntries,
  AuditEntry,
} from '../audit';

const AUDIT_DIR = path.join(os.homedir(), '.envault', 'audit');

describe('audit log', () => {
  const projectId = 'test-audit-project';

  afterEach(() => {
    clearAuditLog(projectId);
  });

  test('getAuditPath returns correct path', () => {
    const p = getAuditPath(projectId);
    expect(p).toContain(projectId);
    expect(p).toEndWith('.audit.json');
  });

  test('loadAuditLog returns empty array when no log exists', () => {
    const entries = loadAuditLog(projectId);
    expect(entries).toEqual([]);
  });

  test('appendAuditLog adds an entry with timestamp and user', () => {
    appendAuditLog(projectId, { action: 'push', projectId, details: 'initial push' });
    const entries = loadAuditLog(projectId);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('push');
    expect(entries[0].projectId).toBe(projectId);
    expect(entries[0].timestamp).toBeDefined();
    expect(entries[0].user).toBeDefined();
    expect(entries[0].details).toBe('initial push');
  });

  test('appendAuditLog accumulates multiple entries', () => {
    appendAuditLog(projectId, { action: 'push', projectId });
    appendAuditLog(projectId, { action: 'pull', projectId });
    appendAuditLog(projectId, { action: 'rotate', projectId });
    const entries = loadAuditLog(projectId);
    expect(entries).toHaveLength(3);
  });

  test('getRecentEntries returns limited entries', () => {
    for (let i = 0; i < 15; i++) {
      appendAuditLog(projectId, { action: 'pull', projectId, details: `pull ${i}` });
    }
    const recent = getRecentEntries(projectId, 5);
    expect(recent).toHaveLength(5);
    expect(recent[recent.length - 1].details).toBe('pull 14');
  });

  test('clearAuditLog removes the audit file', () => {
    appendAuditLog(projectId, { action: 'init', projectId });
    clearAuditLog(projectId);
    const entries = loadAuditLog(projectId);
    expect(entries).toEqual([]);
  });
});
