import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerEnvGroupCommand } from '../envgroup';
import { addEnvGroup, loadEnvGroups } from '../../storage/envgroups';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-envgroup-cmd-'));
}

function buildProgram(vaultDir: string): Command {
  const program = new Command();
  program.exitOverride();
  jest.spyOn(process, 'cwd').mockReturnValue(path.dirname(vaultDir));
  registerEnvGroupCommand(program);
  return program;
}

describe('envgroup command', () => {
  let tmpDir: string;
  let vaultDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    vaultDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('adds a group via CLI', () => {
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['group', 'add', 'db', 'DB_HOST', 'DB_PORT'], { from: 'user' });
    const store = loadEnvGroups(vaultDir);
    expect(store.groups['db']).toBeDefined();
    expect(store.groups['db'].keys).toContain('DB_HOST');
    spy.mockRestore();
  });

  it('lists groups via CLI', () => {
    addEnvGroup(vaultDir, 'auth', ['JWT_SECRET']);
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['group', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth'));
    spy.mockRestore();
  });

  it('shows a group via CLI', () => {
    addEnvGroup(vaultDir, 'smtp', ['SMTP_HOST'], 'Mail config');
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['group', 'show', 'smtp'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('smtp'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Mail config'));
    spy.mockRestore();
  });

  it('removes a group via CLI', () => {
    addEnvGroup(vaultDir, 'old', ['OLD_KEY']);
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['group', 'remove', 'old'], { from: 'user' });
    expect(loadEnvGroups(vaultDir).groups['old']).toBeUndefined();
    spy.mockRestore();
  });

  it('errors on removing nonexistent group', () => {
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    program.parse(['group', 'remove', 'ghost'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    spy.mockRestore();
  });

  it('updates a group via CLI', () => {
    addEnvGroup(vaultDir, 'cache', ['REDIS_URL']);
    const program = buildProgram(vaultDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['group', 'update', 'cache', 'REDIS_URL', 'REDIS_TTL'], { from: 'user' });
    const updated = loadEnvGroups(vaultDir).groups['cache'];
    expect(updated.keys).toContain('REDIS_TTL');
    spy.mockRestore();
  });
});
