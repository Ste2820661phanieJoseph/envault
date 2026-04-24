import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerDefaultsCommand } from '../defaults';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-defaults-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDefaultsCommand(program);
  return program;
}

describe('defaults apply command', () => {
  it('prints merged env to stdout when --write is not set', async () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const defaultsFile = path.join(dir, '.env.defaults');
    fs.writeFileSync(envFile, 'A=1\n', 'utf-8');
    fs.writeFileSync(defaultsFile, 'B=2\nC=3\n', 'utf-8');

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['defaults', 'apply', envFile, defaultsFile], { from: 'user' });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('A=1'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('B=2'));
    spy.mockRestore();
  });

  it('writes merged env to file when --write is set', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const defaultsFile = path.join(dir, '.env.defaults');
    fs.writeFileSync(envFile, 'A=1\n', 'utf-8');
    fs.writeFileSync(defaultsFile, 'B=2\n', 'utf-8');

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['defaults', 'apply', envFile, defaultsFile, '--write'], { from: 'user' });

    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).toContain('B=2');
    spy.mockRestore();
  });

  it('exits with error if defaults file not found', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'A=1\n', 'utf-8');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const program = buildProgram();
    expect(() =>
      program.parse(['defaults', 'apply', envFile, path.join(dir, 'missing.defaults')], { from: 'user' })
    ).toThrow();
    mockExit.mockRestore();
    spy.mockRestore();
  });
});

describe('defaults check command', () => {
  it('reports missing keys', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const defaultsFile = path.join(dir, '.env.defaults');
    fs.writeFileSync(envFile, 'A=1\n', 'utf-8');
    fs.writeFileSync(defaultsFile, 'A=x\nB=y\n', 'utf-8');

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['defaults', 'check', envFile, defaultsFile], { from: 'user' });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Missing'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('B'));
    spy.mockRestore();
  });

  it('reports all present when no keys are missing', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const defaultsFile = path.join(dir, '.env.defaults');
    fs.writeFileSync(envFile, 'A=1\nB=2\n', 'utf-8');
    fs.writeFileSync(defaultsFile, 'A=x\nB=y\n', 'utf-8');

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['defaults', 'check', envFile, defaultsFile], { from: 'user' });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('All default keys are present'));
    spy.mockRestore();
  });
});
