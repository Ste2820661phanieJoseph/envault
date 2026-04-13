import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getRemotePath,
  loadRemoteConfig,
  saveRemoteConfig,
  addRemote,
  removeRemote,
  getRemote,
  listRemotes,
  updateLastSynced,
} from '../remote';

describe('remote storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-remote-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when file does not exist', () => {
    const store = loadRemoteConfig(tmpDir);
    expect(store).toEqual({ remotes: {} });
  });

  it('saves and loads remote config', () => {
    saveRemoteConfig({ remotes: { origin: { url: 'https://vault.example.com', projectId: 'proj-1' } } }, tmpDir);
    const store = loadRemoteConfig(tmpDir);
    expect(store.remotes['origin']).toBeDefined();
    expect(store.remotes['origin'].url).toBe('https://vault.example.com');
  });

  it('adds a remote', () => {
    addRemote('origin', { url: 'https://vault.example.com', projectId: 'proj-1' }, tmpDir);
    const config = getRemote('origin', tmpDir);
    expect(config).toBeDefined();
    expect(config!.projectId).toBe('proj-1');
  });

  it('returns undefined for non-existent remote', () => {
    expect(getRemote('missing', tmpDir)).toBeUndefined();
  });

  it('removes an existing remote', () => {
    addRemote('origin', { url: 'https://vault.example.com', projectId: 'proj-1' }, tmpDir);
    const result = removeRemote('origin', tmpDir);
    expect(result).toBe(true);
    expect(getRemote('origin', tmpDir)).toBeUndefined();
  });

  it('returns false when removing non-existent remote', () => {
    expect(removeRemote('ghost', tmpDir)).toBe(false);
  });

  it('lists all remotes', () => {
    addRemote('origin', { url: 'https://a.example.com', projectId: 'p1' }, tmpDir);
    addRemote('backup', { url: 'https://b.example.com', projectId: 'p2' }, tmpDir);
    const remotes = listRemotes(tmpDir);
    expect(remotes).toHaveLength(2);
    expect(remotes.map(r => r.name)).toContain('origin');
    expect(remotes.map(r => r.name)).toContain('backup');
  });

  it('updates lastSynced timestamp', () => {
    addRemote('origin', { url: 'https://vault.example.com', projectId: 'proj-1' }, tmpDir);
    updateLastSynced('origin', tmpDir);
    const config = getRemote('origin', tmpDir);
    expect(config!.lastSynced).toBeDefined();
    expect(new Date(config!.lastSynced!).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('getRemotePath returns correct path', () => {
    expect(getRemotePath(tmpDir)).toBe(path.join(tmpDir, '.envault-remote.json'));
  });
});
