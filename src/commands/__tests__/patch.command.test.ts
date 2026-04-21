import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerPatchCommand } from '../patch';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-patch-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPatchCommand(program);
  return program;
}

describe('patch command', () => {
  let dir: string;
  let envFile: string;

  beforeEach(() => {
    dir = makeTmpDir();
    envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n', 'utf-8');
  });

  it('patch set updates a key', () => {
    const program = buildProgram();
    program.parse(['patch', 'set', envFile, 'FOO', 'newval'], { from: 'user' });
    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).toContain('FOO=newval');
  });

  it('patch set adds a new key', () => {
    const program = buildProgram();
    program.parse(['patch', 'set', envFile, 'NEW_KEY', '123'], { from: 'user' });
    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).toContain('NEW_KEY=123');
  });

  it('patch delete removes a key', () => {
    const program = buildProgram();
    program.parse(['patch', 'delete', envFile, 'BAZ'], { from: 'user' });
    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).not.toContain('BAZ');
  });

  it('patch rename renames a key', () => {
    const program = buildProgram();
    program.parse(['patch', 'rename', envFile, 'FOO', 'FOO_RENAMED'], { from: 'user' });
    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).not.toContain('FOO=');
    expect(content).toContain('FOO_RENAMED=bar');
  });

  it('patch apply applies a JSON patch file', () => {
    const patchFile = path.join(dir, 'patch.json');
    fs.writeFileSync(
      patchFile,
      JSON.stringify([
        { op: 'set', key: 'FOO', value: 'patched' },
        { op: 'delete', key: 'BAZ' },
      ]),
      'utf-8'
    );
    const program = buildProgram();
    program.parse(['patch', 'apply', envFile, patchFile], { from: 'user' });
    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content).toContain('FOO=patched');
    expect(content).not.toContain('BAZ');
  });

  it('patch apply exits if patch file missing', () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['patch', 'apply', envFile, '/nonexistent/patch.json'], { from: 'user' })
    ).toThrow();
    mockExit.mockRestore();
  });
});
