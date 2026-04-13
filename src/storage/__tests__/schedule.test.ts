import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addSchedule,
  removeSchedule,
  listSchedules,
  updateLastRun,
  loadSchedule,
  getSchedulePath,
} from '../schedule';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schedule-'));
}

describe('schedule storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty entries when no schedule file exists', () => {
    const result = listSchedules(tmpDir);
    expect(result).toEqual([]);
  });

  it('adds a schedule entry and persists it', () => {
    const entry = addSchedule(tmpDir, {
      projectId: 'proj1',
      cron: '0 * * * *',
      action: 'push',
      enabled: true,
    });
    expect(entry.id).toMatch(/^sched_/);
    expect(entry.createdAt).toBeDefined();
    const entries = listSchedules(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].cron).toBe('0 * * * *');
  });

  it('removes a schedule entry by id', () => {
    const entry = addSchedule(tmpDir, {
      projectId: 'proj1',
      cron: '0 0 * * *',
      action: 'backup',
      enabled: true,
    });
    const removed = removeSchedule(tmpDir, entry.id);
    expect(removed).toBe(true);
    expect(listSchedules(tmpDir)).toHaveLength(0);
  });

  it('returns false when removing a non-existent id', () => {
    const removed = removeSchedule(tmpDir, 'nonexistent');
    expect(removed).toBe(false);
  });

  it('updates lastRun for an existing entry', () => {
    const entry = addSchedule(tmpDir, {
      projectId: 'proj1',
      cron: '*/5 * * * *',
      action: 'pull',
      enabled: true,
    });
    const updated = updateLastRun(tmpDir, entry.id);
    expect(updated).toBe(true);
    const entries = listSchedules(tmpDir);
    expect(entries[0].lastRun).toBeDefined();
  });

  it('returns false when updating lastRun for non-existent id', () => {
    const result = updateLastRun(tmpDir, 'ghost_id');
    expect(result).toBe(false);
  });

  it('getSchedulePath returns correct path', () => {
    const p = getSchedulePath('/some/vault');
    expect(p).toBe('/some/vault/schedule.json');
  });
});
