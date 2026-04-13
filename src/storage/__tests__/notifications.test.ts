import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getNotificationsPath,
  loadNotifications,
  addNotification,
  markAsRead,
  clearNotifications,
  getUnreadNotifications,
} from '../notifications';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-notify-'));
}

describe('notifications storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no file exists', () => {
    const store = loadNotifications(tmpDir);
    expect(store.notifications).toEqual([]);
  });

  it('getNotificationsPath returns correct path', () => {
    const p = getNotificationsPath(tmpDir);
    expect(p).toBe(path.join(tmpDir, 'notifications.json'));
  });

  it('addNotification creates and persists a notification', () => {
    const entry = addNotification(tmpDir, {
      type: 'push',
      message: 'Vault updated',
      project: 'my-app',
      actor: 'alice',
    });
    expect(entry.id).toBeTruthy();
    expect(entry.read).toBe(false);
    expect(entry.type).toBe('push');

    const store = loadNotifications(tmpDir);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].message).toBe('Vault updated');
  });

  it('markAsRead marks a notification as read', () => {
    const entry = addNotification(tmpDir, {
      type: 'rotate',
      message: 'Key rotated',
      project: 'my-app',
      actor: 'bob',
    });
    const success = markAsRead(tmpDir, entry.id);
    expect(success).toBe(true);
    const store = loadNotifications(tmpDir);
    expect(store.notifications[0].read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    const success = markAsRead(tmpDir, 'nonexistent-id');
    expect(success).toBe(false);
  });

  it('getUnreadNotifications returns only unread', () => {
    const e1 = addNotification(tmpDir, { type: 'push', message: 'A', project: 'p', actor: 'u' });
    addNotification(tmpDir, { type: 'pull', message: 'B', project: 'p', actor: 'u' });
    markAsRead(tmpDir, e1.id);
    const unread = getUnreadNotifications(tmpDir);
    expect(unread).toHaveLength(1);
    expect(unread[0].message).toBe('B');
  });

  it('clearNotifications removes all entries', () => {
    addNotification(tmpDir, { type: 'lock', message: 'Locked', project: 'p', actor: 'u' });
    clearNotifications(tmpDir);
    const store = loadNotifications(tmpDir);
    expect(store.notifications).toHaveLength(0);
  });
});
