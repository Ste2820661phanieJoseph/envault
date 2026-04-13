import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerTagCommand } from '../tag';
import * as tagsModule from '../../storage/tags';
import * as vaultModule from '../../storage/vault';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTagCommand(program);
  return program;
}

describe('tag command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-cmd-'));
    process.env.HOME = tmpDir;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('tag add fails when vault does not exist', async () => {
    jest.spyOn(vaultModule, 'vaultExists').mockReturnValue(false);
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'tag', 'add', 'proj1', 'v1.0'])
    ).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });

  it('tag add succeeds when vault exists', async () => {
    jest.spyOn(vaultModule, 'vaultExists').mockReturnValue(true);
    jest.spyOn(tagsModule, 'addTag').mockReturnValue({
      tag: 'v1.0',
      vaultHash: 'abc123',
      createdAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'alice',
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tag', 'add', 'proj1', 'v1.0', '--author', 'alice']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tag "v1.0" created'));
  });

  it('tag list shows no tags message', async () => {
    jest.spyOn(tagsModule, 'listTags').mockReturnValue([]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tag', 'list', 'proj1']);
    expect(consoleSpy).toHaveBeenCalledWith('No tags found.');
  });

  it('tag list shows tags', async () => {
    jest.spyOn(tagsModule, 'listTags').mockReturnValue([
      { tag: 'v1.0', vaultHash: 'abc', createdBy: 'alice', createdAt: '2024-01-01T00:00:00.000Z' },
    ]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tag', 'list', 'proj1']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.0'));
  });

  it('tag remove succeeds', async () => {
    jest.spyOn(tagsModule, 'removeTag').mockReturnValue(true);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tag', 'remove', 'proj1', 'v1.0']);
    expect(consoleSpy).toHaveBeenCalledWith('Tag "v1.0" removed.');
  });

  it('tag show prints entry', async () => {
    jest.spyOn(tagsModule, 'findTag').mockReturnValue({
      tag: 'v1.0',
      vaultHash: 'abc',
      createdBy: 'alice',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tag', 'show', 'proj1', 'v1.0']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1.0'));
  });
});
