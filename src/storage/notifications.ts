import * as fs from 'fs';
import * as path from 'path';

export interface NotificationEntry {
  id: string;
  type: 'push' | 'pull' | 'rotate' | 'share' | 'lock' | 'unlock';
  message: string;
  project: string;
  actor: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationStore {
  notifications: NotificationEntry[];
}

export function getNotificationsPath(vaultDir: string): string {
  return path.join(vaultDir, 'notifications.json');
}

export function loadNotifications(vaultDir: string): NotificationStore {
  const filePath = getNotificationsPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { notifications: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as NotificationStore;
}

export function saveNotifications(vaultDir: string, store: NotificationStore): void {
  const filePath = getNotificationsPath(vaultDir);
  fs.mkdirSync(vaultDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addNotification(
  vaultDir: string,
  entry: Omit<NotificationEntry, 'id' | 'timestamp' | 'read'>
): NotificationEntry {
  const store = loadNotifications(vaultDir);
  const newEntry: NotificationEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  store.notifications.push(newEntry);
  saveNotifications(vaultDir, store);
  return newEntry;
}

export function markAsRead(vaultDir: string, id: string): boolean {
  const store = loadNotifications(vaultDir);
  const entry = store.notifications.find((n) => n.id === id);
  if (!entry) return false;
  entry.read = true;
  saveNotifications(vaultDir, store);
  return true;
}

export function clearNotifications(vaultDir: string): void {
  saveNotifications(vaultDir, { notifications: [] });
}

export function getUnreadNotifications(vaultDir: string): NotificationEntry[] {
  const store = loadNotifications(vaultDir);
  return store.notifications.filter((n) => !n.read);
}
