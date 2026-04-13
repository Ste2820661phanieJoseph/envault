import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getHistoryPath,
  loadHistory,
  appendHistory,
  clearHistory,
  getLatestEntry,
} from '../history';
import * as vault from '../vault';

describe('history', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-history-test-'));
    jest.spyOn(vault, 'getVaultPath').mockImplementation((projectId: string) =>
      path.join(tmpDir, `${projectId}.vault.enc`)
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('returns empty array when no history file exists', () => {
    expect(loadHistory('test-project')).toEqual([]);
  });

  it('appends an entry and returns it with a timestamp', () => {
    const entry = appendHistory('test-project', {
      action: 'push',
      user: 'alice',
      checksum: 'abc123',
    });
    expect(entry.action).toBe('push');
    expect(entry.user).toBe('alice');
    expect(entry.checksum).toBe('abc123');
    expect(entry.timestamp).toBeDefined();
  });

  it('loads persisted history entries', () => {
    appendHistory('test-project', { action: 'push', user: 'alice', checksum: 'aaa' });
    appendHistory('test-project', { action: 'pull', user: 'bob', checksum: 'bbb' });
    const history = loadHistory('test-project');
    expect(history).toHaveLength(2);
    expect(history[0].action).toBe('push');
    expect(history[1].action).toBe('pull');
  });

  it('getLatestEntry returns the most recent entry', () => {
    appendHistory('test-project', { action: 'push', user: 'alice', checksum: 'aaa' });
    appendHistory('test-project', { action: 'rotate', user: 'alice', checksum: 'ccc' });
    const latest = getLatestEntry('test-project');
    expect(latest?.action).toBe('rotate');
    expect(latest?.checksum).toBe('ccc');
  });

  it('getLatestEntry returns null when history is empty', () => {
    expect(getLatestEntry('test-project')).toBeNull();
  });

  it('clearHistory removes the history file', () => {
    appendHistory('test-project', { action: 'push', user: 'alice', checksum: 'aaa' });
    clearHistory('test-project');
    const historyPath = getHistoryPath('test-project');
    expect(fs.existsSync(historyPath)).toBe(false);
  });
});
