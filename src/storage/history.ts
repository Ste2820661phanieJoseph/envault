import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath } from './vault';

export interface HistoryEntry {
  timestamp: string;
  action: 'push' | 'pull' | 'rotate';
  user: string;
  checksum: string;
}

export function getHistoryPath(projectId: string): string {
  const vaultPath = getVaultPath(projectId);
  return path.join(path.dirname(vaultPath), `${projectId}.history.json`);
}

export function loadHistory(projectId: string): HistoryEntry[] {
  const historyPath = getHistoryPath(projectId);
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(
  projectId: string,
  entry: Omit<HistoryEntry, 'timestamp'>
): HistoryEntry {
  const history = loadHistory(projectId);
  const newEntry: HistoryEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  history.push(newEntry);
  const historyPath = getHistoryPath(projectId);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  return newEntry;
}

export function clearHistory(projectId: string): void {
  const historyPath = getHistoryPath(projectId);
  if (fs.existsSync(historyPath)) {
    fs.unlinkSync(historyPath);
  }
}

export function getLatestEntry(projectId: string): HistoryEntry | null {
  const history = loadHistory(projectId);
  return history.length > 0 ? history[history.length - 1] : null;
}
