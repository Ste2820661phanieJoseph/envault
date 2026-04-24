import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerRequiredCommand } from '../required';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-req-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRequiredCommand(program);
  return program;
}

describe('required command', () => {
  let tmpDir: string;
  let envFile: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    envFile = path.join(tmpDir, '.env');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports all present when keys exist', () => {
    fs.writeFileSync(envFile, 'API_KEY=abc\nDB_URL=postgres://localhost\n');
    const program = buildProgram();
    program.parse(['required', 'API_KEY', 'DB_URL', '--file', envFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('All required keys are present.'));
  });

  it('reports missing keys', () => {
    fs.writeFileSync(envFile, 'API_KEY=abc\n');
    const program = buildProgram();
    program.parse(['required', 'API_KEY', 'MISSING_KEY', '--file', envFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MISSING_KEY'));
  });

  it('outputs JSON when --json flag is set', () => {
    fs.writeFileSync(envFile, 'FOO=bar\n');
    const program = buildProgram();
    program.parse(['required', 'FOO', '--file', envFile, '--json'], { from: 'user' });
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('allPresent', true);
    expect(parsed).toHaveProperty('present');
    expect(parsed).toHaveProperty('missing');
  });

  it('exits with code 1 in strict mode when keys are missing', () => {
    fs.writeFileSync(envFile, 'FOO=bar\n');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    program.parse(['required', 'MISSING', '--file', envFile, '--strict'], { from: 'user' });
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('does not exit in strict mode when all keys are present', () => {
    fs.writeFileSync(envFile, 'REQUIRED_KEY=value\n');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    program.parse(['required', 'REQUIRED_KEY', '--file', envFile, '--strict'], { from: 'user' });
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
