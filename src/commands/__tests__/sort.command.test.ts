import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerSortCommand } from '../sort';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-cmd-'));
}

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSortCommand(program);
  return program;
}

describe('sort command', () => {
  it('prints sorted env to stdout when no output option given', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'ZEBRA=1\nAPPLE=2\nMANGO=3\n');

    const program = buildProgram();
    const output: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as any) = (chunk: string) => { output.push(chunk); return true; };
    program.parse(['sort', envFile], { from: 'user' });
    (process.stdout.write as any) = origWrite;

    const combined = output.join('');
    expect(combined.indexOf('APPLE')).toBeLessThan(combined.indexOf('ZEBRA'));
  });

  it('writes sorted file in place with --in-place flag', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'ZEBRA=1\nAPPLE=2\n');

    const program = buildProgram();
    program.parse(['sort', envFile, '--in-place'], { from: 'user' });

    const content = fs.readFileSync(envFile, 'utf-8');
    expect(content.indexOf('APPLE')).toBeLessThan(content.indexOf('ZEBRA'));
  });

  it('writes sorted file to --output path', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const outFile = path.join(dir, '.env.sorted');
    fs.writeFileSync(envFile, 'ZEBRA=1\nAPPLE=2\n');

    const program = buildProgram();
    program.parse(['sort', envFile, '--output', outFile], { from: 'user' });

    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content.indexOf('APPLE')).toBeLessThan(content.indexOf('ZEBRA'));
  });

  it('sorts descending with --order desc', () => {
    const dir = makeTmpDir();
    const envFile = path.join(dir, '.env');
    const outFile = path.join(dir, '.env.sorted');
    fs.writeFileSync(envFile, 'APPLE=1\nZEBRA=2\n');

    const program = buildProgram();
    program.parse(['sort', envFile, '--order', 'desc', '--output', outFile], { from: 'user' });

    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content.indexOf('ZEBRA')).toBeLessThan(content.indexOf('APPLE'));
  });
});
