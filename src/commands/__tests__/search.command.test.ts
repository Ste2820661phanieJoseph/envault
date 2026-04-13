import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerSearchCommand } from '../search';
import * as searchModule from '../../storage/search';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program;
}

describe('search command', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let searchSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    searchSpy = jest.spyOn(searchModule, 'searchVaultDir');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('errors when no pattern provided', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(() => program.parseAsync(['node', 'test', 'search'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('--key or --value'));
    exitSpy.mockRestore();
  });

  it('reports no matches', async () => {
    searchSpy.mockReturnValue([]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', '--key', 'MISSING']);
    expect(consoleSpy).toHaveBeenCalledWith('No matches found.');
  });

  it('displays matches with profile label', async () => {
    searchSpy.mockReturnValue([
      { key: 'DB_HOST', value: 'localhost', profile: 'development' },
    ]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', '--key', 'DB_HOST']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[development] DB_HOST=localhost'));
  });

  it('passes caseSensitive flag to searchVaultDir', async () => {
    searchSpy.mockReturnValue([]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', '--key', 'api', '--case-sensitive']);
    expect(searchSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ caseSensitive: true }));
  });

  it('passes both key and value patterns', async () => {
    searchSpy.mockReturnValue([]);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'search', '--key', 'DB', '--value', 'prod']);
    expect(searchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ keyPattern: 'DB', valuePattern: 'prod' })
    );
  });
});
