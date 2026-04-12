import { Command } from 'commander';
import * as lockModule from '../../storage/lock';
import { registerLockCommands } from '../lock';

let program: Command;

beforeEach(() => {
  program = new Command();
  program.exitOverride();
  registerLockCommands(program);
  jest.restoreAllMocks();
});

describe('lock status command', () => {
  it('should report locked status', async () => {
    jest.spyOn(lockModule, 'isLocked').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'lock', 'status', 'my-project']);
    expect(lockModule.isLocked).toHaveBeenCalledWith('my-project');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('currently locked'));
  });

  it('should report unlocked status', async () => {
    jest.spyOn(lockModule, 'isLocked').mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'lock', 'status', 'my-project']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not locked'));
  });
});

describe('lock acquire command', () => {
  it('should report success when lock is acquired', () => {
    jest.spyOn(lockModule, 'acquireLock').mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'lock', 'acquire', 'my-project']);
    expect(lockModule.acquireLock).toHaveBeenCalledWith('my-project');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lock acquired'));
  });

  it('should exit with error when lock cannot be acquired', () => {
    jest.spyOn(lockModule, 'acquireLock').mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => program.parse(['node', 'envault', 'lock', 'acquire', 'my-project'])).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('lock release command', () => {
  it('should release an existing lock', () => {
    jest.spyOn(lockModule, 'isLocked').mockReturnValue(true);
    const releaseSpy = jest.spyOn(lockModule, 'releaseLock').mockImplementation();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'lock', 'release', 'my-project']);
    expect(releaseSpy).toHaveBeenCalledWith('my-project');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lock released'));
  });

  it('should warn if no lock exists to release', () => {
    jest.spyOn(lockModule, 'isLocked').mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    program.parse(['node', 'envault', 'lock', 'release', 'my-project']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No active lock'));
  });
});
