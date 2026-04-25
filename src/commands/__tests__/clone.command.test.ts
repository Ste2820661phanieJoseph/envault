import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerCloneCommand } from '../clone';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-clone-cmd-'));
}

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

describe('clone command', () => {
  let dir: string;
  let src: string;
  let tgt: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    dir = makeTmpDir();
    src = path.join(dir, '.env.src');
    tgt = path.join(dir, '.env.tgt');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clones all keys from source to target', () => {
    fs.writeFileSync(src, 'FOO=1\nBAR=2\n');
    buildProgram().parse(['clone', src, tgt], { from: 'user' });
    const content = fs.readFileSync(tgt, 'utf-8');
    expect(content).toContain('FOO=1');
    expect(content).toContain('BAR=2');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cloned env'));
  });

  it('clones only specified keys', () => {
    fs.writeFileSync(src, 'FOO=1\nBAR=2\nBAZ=3\n');
    buildProgram().parse(['clone', src, tgt, '--keys', 'FOO,BAZ'], { from: 'user' });
    const content = fs.readFileSync(tgt, 'utf-8');
    expect(content).toContain('FOO=1');
    expect(content).toContain('BAZ=3');
    expect(content).not.toContain('BAR');
  });

  it('excludes specified keys', () => {
    fs.writeFileSync(src, 'FOO=1\nBAR=2\n');
    buildProgram().parse(['clone', src, tgt, '--exclude', 'BAR'], { from: 'user' });
    const content = fs.readFileSync(tgt, 'utf-8');
    expect(content).toContain('FOO=1');
    expect(content).not.toContain('BAR');
  });

  it('exits with error if source does not exist', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['clone', path.join(dir, 'missing.env'), tgt], { from: 'user' })
    ).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
