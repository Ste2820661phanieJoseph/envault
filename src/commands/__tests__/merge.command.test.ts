import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerMergeCommand } from '../merge';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-merge-cmd-'));
}

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

describe('merge command', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  function writeEnv(name: string, content: string) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content);
    return p;
  }

  it('merges without conflicts and writes output', async () => {
    const base = writeEnv('base.env', 'A=1\nB=2\n');
    const ours = writeEnv('ours.env', 'A=mine\nB=2\n');
    const theirs = writeEnv('theirs.env', 'A=1\nB=theirs\n');
    const out = path.join(dir, 'out.env');

    const program = buildProgram();
    await program.parseAsync(['merge', base, ours, theirs, '-o', out], { from: 'user' });

    expect(fs.existsSync(out)).toBe(true);
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('A=mine');
    expect(content).toContain('B=theirs');
  });

  it('resolves conflicts using ours strategy', async () => {
    const base = writeEnv('base.env', 'X=base\n');
    const ours = writeEnv('ours.env', 'X=ours-val\n');
    const theirs = writeEnv('theirs.env', 'X=theirs-val\n');
    const out = path.join(dir, 'out.env');

    const program = buildProgram();
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await program.parseAsync(['merge', base, ours, theirs, '--strategy', 'ours', '-o', out], { from: 'user' });
    spy.mockRestore();

    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('X=ours-val');
  });

  it('resolves conflicts using theirs strategy', async () => {
    const base = writeEnv('base.env', 'X=base\n');
    const ours = writeEnv('ours.env', 'X=ours-val\n');
    const theirs = writeEnv('theirs.env', 'X=theirs-val\n');
    const out = path.join(dir, 'out.env');

    const program = buildProgram();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await program.parseAsync(['merge', base, ours, theirs, '--strategy', 'theirs', '-o', out], { from: 'user' });

    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('X=theirs-val');
  });

  it('exits with error when base file missing', async () => {
    const ours = writeEnv('ours.env', 'A=1\n');
    const theirs = writeEnv('theirs.env', 'A=2\n');
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      program.parseAsync(['merge', '/no/base.env', ours, theirs], { from: 'user' })
    ).rejects.toThrow();
    mockExit.mockRestore();
  });
});
