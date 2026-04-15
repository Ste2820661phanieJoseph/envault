import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerCopyCommand } from '../copy';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-copy-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerCopyCommand(program);
  return program;
}

describe('copy command', () => {
  let tmp: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmp = makeTmpDir();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('copies keys from source to destination', async () => {
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'FOO=bar\nBAZ=qux\n');
    const program = buildProgram();
    await program.parseAsync(['copy', src, dest], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Copied 2 key(s)'));
    expect(fs.existsSync(dest)).toBe(true);
  });

  it('skips existing keys without --overwrite', async () => {
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'FOO=new\n');
    fs.writeFileSync(dest, 'FOO=old\n');
    const program = buildProgram();
    await program.parseAsync(['copy', src, dest], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 key(s)'));
    expect(fs.readFileSync(dest, 'utf-8')).toContain('FOO=old');
  });

  it('overwrites with --overwrite flag', async () => {
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'FOO=new\n');
    fs.writeFileSync(dest, 'FOO=old\n');
    const program = buildProgram();
    await program.parseAsync(['copy', src, dest, '--overwrite'], { from: 'user' });
    expect(fs.readFileSync(dest, 'utf-8')).toContain('FOO=new');
  });

  it('copies only specified keys with --keys', async () => {
    const src = path.join(tmp, '.env.src');
    const dest = path.join(tmp, '.env.dest');
    fs.writeFileSync(src, 'A=1\nB=2\nC=3\n');
    const program = buildProgram();
    await program.parseAsync(['copy', src, dest, '--keys', 'A,C'], { from: 'user' });
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('C=3');
    expect(content).not.toContain('B=2');
  });

  it('exits with error if source not found', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['copy', '/no/such/.env', '/tmp/.env.dest'], { from: 'user' })
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
