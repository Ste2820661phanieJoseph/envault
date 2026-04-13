import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getHooksPath,
  loadHooks,
  saveHooks,
  addHook,
  removeHook,
  getHooksForEvent,
  toggleHook,
} from '../hooks';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-hooks-'));
}

describe('hooks storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty hooks when file does not exist', () => {
    const config = loadHooks(tmpDir);
    expect(config.hooks).toEqual([]);
  });

  it('saves and loads hooks config', () => {
    const config = { hooks: [{ event: 'pre-push' as const, command: 'npm test', enabled: true }] };
    saveHooks(tmpDir, config);
    const loaded = loadHooks(tmpDir);
    expect(loaded.hooks).toHaveLength(1);
    expect(loaded.hooks[0].command).toBe('npm test');
  });

  it('adds a hook', () => {
    addHook(tmpDir, 'post-push', 'echo pushed');
    const config = loadHooks(tmpDir);
    expect(config.hooks).toHaveLength(1);
    expect(config.hooks[0].event).toBe('post-push');
    expect(config.hooks[0].enabled).toBe(true);
  });

  it('does not add duplicate hooks', () => {
    addHook(tmpDir, 'pre-pull', 'echo before pull');
    addHook(tmpDir, 'pre-pull', 'echo before pull');
    const config = loadHooks(tmpDir);
    expect(config.hooks).toHaveLength(1);
  });

  it('removes a hook', () => {
    addHook(tmpDir, 'post-pull', 'echo done');
    removeHook(tmpDir, 'post-pull', 'echo done');
    const config = loadHooks(tmpDir);
    expect(config.hooks).toHaveLength(0);
  });

  it('returns only enabled hooks for event', () => {
    addHook(tmpDir, 'pre-push', 'lint');
    addHook(tmpDir, 'pre-push', 'test');
    toggleHook(tmpDir, 'pre-push', 'test', false);
    const hooks = getHooksForEvent(tmpDir, 'pre-push');
    expect(hooks).toHaveLength(1);
    expect(hooks[0].command).toBe('lint');
  });

  it('toggles hook enabled state', () => {
    addHook(tmpDir, 'post-push', 'notify');
    toggleHook(tmpDir, 'post-push', 'notify', false);
    const config = loadHooks(tmpDir);
    expect(config.hooks[0].enabled).toBe(false);
    toggleHook(tmpDir, 'post-push', 'notify', true);
    const updated = loadHooks(tmpDir);
    expect(updated.hooks[0].enabled).toBe(true);
  });

  it('getHooksPath returns correct path', () => {
    const p = getHooksPath(tmpDir);
    expect(p).toBe(path.join(tmpDir, 'hooks.json'));
  });
});
