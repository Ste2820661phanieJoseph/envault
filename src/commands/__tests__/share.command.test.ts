import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sharingModule from '../../storage/sharing';
import { registerShareCommand } from '../share';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerShareCommand(program);
  return program;
}

describe('share command', () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;
  let listSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    addSpy = jest.spyOn(sharingModule, 'addShare').mockImplementation(() => {});
    removeSpy = jest.spyOn(sharingModule, 'removeShare').mockImplementation(() => {});
    listSpy = jest.spyOn(sharingModule, 'listShares').mockReturnValue([]);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('share add calls addShare with read permission by default', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'share', 'add', 'proj-1', 'alice@x.com']);
    expect(addSpy).toHaveBeenCalledTimes(1);
    const entry = addSpy.mock.calls[0][1];
    expect(entry.projectId).toBe('proj-1');
    expect(entry.sharedWith).toBe('alice@x.com');
    expect(entry.permissions).toBe('read');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Shared project'));
  });

  it('share add with --write sets write permission', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'share', 'add', 'proj-1', 'bob@x.com', '--write']);
    const entry = addSpy.mock.calls[0][1];
    expect(entry.permissions).toBe('write');
  });

  it('share add logs error on failure', async () => {
    addSpy.mockImplementation(() => { throw new Error('Already shared'); });
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'share', 'add', 'proj-1', 'alice@x.com'])
    ).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Already shared'));
    exitSpy.mockRestore();
  });

  it('share remove calls removeShare', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'share', 'remove', 'share-id-123']);
    expect(removeSpy).toHaveBeenCalledWith(expect.any(String), 'share-id-123');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('removed'));
  });

  it('share list prints no shares message when empty', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'share', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No shares found.');
  });

  it('share list prints share entries', async () => {
    listSpy.mockReturnValue([{
      id: 'abc',
      projectId: 'proj-x',
      sharedWith: 'dev@x.com',
      sharedBy: 'admin@x.com',
      createdAt: new Date().toISOString(),
      permissions: 'read',
    }]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'share', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('proj-x'));
  });
});
