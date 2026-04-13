import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerScheduleCommand } from '../schedule';
import * as scheduleStorage from '../../storage/schedule';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sched-cmd-'));
}

function buildProgram(vaultDir: string): Command {
  const program = new Command();
  program.exitOverride();
  jest.spyOn(require('../schedule'), 'getVaultDir').mockReturnValue(vaultDir);
  registerScheduleCommand(program);
  return program;
}

describe('schedule command', () => {
  let tmpDir: string;
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    jest.resetModules();
    jest.spyOn(require('../schedule'), 'getVaultDir').mockReturnValue(tmpDir);
    const p = new Command();
    p.exitOverride();
    registerScheduleCommand(p);
    program = p;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('adds a schedule and prints confirmation', () => {
    jest.spyOn(scheduleStorage, 'addSchedule').mockReturnValue({
      id: 'sched_123',
      projectId: 'myproj',
      cron: '0 * * * *',
      action: 'push',
      enabled: true,
      createdAt: new Date().toISOString(),
    });
    jest.spyOn(scheduleStorage, 'listSchedules').mockReturnValue([]);
    program.parse(['node', 'test', 'schedule', 'add',
      '--project', 'myproj',
      '--cron', '0 * * * *',
      '--action', 'push',
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('sched_123'));
  });

  it('lists schedules when entries exist', () => {
    jest.spyOn(scheduleStorage, 'listSchedules').mockReturnValue([
      {
        id: 'sched_abc',
        projectId: 'proj1',
        cron: '*/10 * * * *',
        action: 'pull',
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    program.parse(['node', 'test', 'schedule', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('sched_abc'));
  });

  it('prints message when no schedules exist', () => {
    jest.spyOn(scheduleStorage, 'listSchedules').mockReturnValue([]);
    program.parse(['node', 'test', 'schedule', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No schedules configured.');
  });

  it('removes a schedule successfully', () => {
    jest.spyOn(scheduleStorage, 'removeSchedule').mockReturnValue(true);
    program.parse(['node', 'test', 'schedule', 'remove', 'sched_123']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('removed'));
  });

  it('touches a schedule to update lastRun', () => {
    jest.spyOn(scheduleStorage, 'updateLastRun').mockReturnValue(true);
    program.parse(['node', 'test', 'schedule', 'touch', 'sched_123']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('lastRun'));
  });
});
