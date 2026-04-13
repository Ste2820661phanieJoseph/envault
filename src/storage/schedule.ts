import * as fs from 'fs';
import * as path from 'path';

export interface ScheduleEntry {
  id: string;
  projectId: string;
  cron: string;
  action: 'push' | 'pull' | 'backup';
  profile?: string;
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
}

export interface ScheduleStore {
  entries: ScheduleEntry[];
}

export function getSchedulePath(vaultDir: string): string {
  return path.join(vaultDir, 'schedule.json');
}

export function loadSchedule(vaultDir: string): ScheduleStore {
  const filePath = getSchedulePath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ScheduleStore;
}

export function saveSchedule(vaultDir: string, store: ScheduleStore): void {
  const filePath = getSchedulePath(vaultDir);
  fs.mkdirSync(vaultDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addSchedule(
  vaultDir: string,
  entry: Omit<ScheduleEntry, 'id' | 'createdAt'>
): ScheduleEntry {
  const store = loadSchedule(vaultDir);
  const newEntry: ScheduleEntry = {
    ...entry,
    id: `sched_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(newEntry);
  saveSchedule(vaultDir, store);
  return newEntry;
}

export function removeSchedule(vaultDir: string, id: string): boolean {
  const store = loadSchedule(vaultDir);
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  if (store.entries.length === before) return false;
  saveSchedule(vaultDir, store);
  return true;
}

export function updateLastRun(vaultDir: string, id: string): boolean {
  const store = loadSchedule(vaultDir);
  const entry = store.entries.find((e) => e.id === id);
  if (!entry) return false;
  entry.lastRun = new Date().toISOString();
  saveSchedule(vaultDir, store);
  return true;
}

export function listSchedules(vaultDir: string): ScheduleEntry[] {
  return loadSchedule(vaultDir).entries;
}
