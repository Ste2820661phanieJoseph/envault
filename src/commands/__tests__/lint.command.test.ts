import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerLintCommand } from '../lint';
import * as lintModule from '../../storage/lint';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lint-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerLintCommand(program);
  return program;
}

describe('lint command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('reports no issues when lint passes', async () => {
    const envFile = path.join(tmpDir, 'test.env');
    fs.writeFileSync(envFile, 'API_KEY=abc123\nDEBUG=false\n');
    jest.spyOn(lintModule, 'lintEnvFile').mockReturnValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['lint', envFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('✔ No issues found.');
  });

  it('prints warnings and does not exit on warning-only issues', async () => {
    const envFile = path.join(tmpDir, 'test.env');
    fs.writeFileSync(envFile, 'api_key=secret\n');
    jest.spyOn(lintModule, 'lintEnvFile').mockReturnValue([
      { key: 'api_key', message: 'Key should be uppercase', severity: 'warning' }
    ]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['lint', envFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('api_key'));
  });

  it('exits with code 1 on error severity issues', async () => {
    const envFile = path.join(tmpDir, 'test.env');
    fs.writeFileSync(envFile, '=NOKEY\n');
    jest.spyOn(lintModule, 'lintEnvFile').mockReturnValue([
      { key: '', message: 'Missing key name', severity: 'error' }
    ]);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['lint', envFile], { from: 'user' });
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('errors when file does not exist', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['lint', '/nonexistent/path.env'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
