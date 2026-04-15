import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerPlaceholderCommand } from '../placeholder';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ph-cmd-'));
}

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPlaceholderCommand(program);
  return program;
}

/**
 * Creates a temporary .env file with the given content and returns
 * both the directory and file paths for cleanup after the test.
 */
function makeTmpEnvFile(content: string): { dir: string; file: string } {
  const dir = makeTmpDir();
  const file = path.join(dir, '.env');
  fs.writeFileSync(file, content);
  return { dir, file };
}

describe('placeholder check command', () => {
  it('reports no placeholders when all values are real', () => {
    const { dir, file } = makeTmpEnvFile('HOST=localhost\nPORT=3000\n');
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
    buildProgram().parse(['placeholder', 'check', file], { from: 'user' });
    expect(logs.some((l) => l.includes('No placeholders'))).toBe(true);
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true });
  });

  it('lists placeholder keys', () => {
    const { dir, file } = makeTmpEnvFile('API_KEY=<YOUR_API_KEY>\nHOST=localhost\n');
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
    buildProgram().parse(['placeholder', 'check', file], { from: 'user' });
    expect(logs.some((l) => l.includes('API_KEY'))).toBe(true);
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true });
  });

  it('exits with error for missing file', () => {
    const errors: string[] = [];
    jest.spyOn(console, 'error').mockImplementation((m) => errors.push(m));
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['placeholder', 'check', '/nonexistent/.env'], { from: 'user' })
    ).toThrow('exit');
    expect(errors.some((e) => e.includes('not found'))).toBe(true);
    jest.restoreAllMocks();
    mockExit.mockRestore();
  });
});

describe('placeholder fill command', () => {
  it('fills placeholder values from --values option', async () => {
    const { dir, file } = makeTmpEnvFile('API_KEY=<YOUR_API_KEY>\nHOST=localhost\n');
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
    await buildProgram().parseAsync(
      ['placeholder', 'fill', file, '--values', 'API_KEY=real-secret'],
      { from: 'user' }
    );
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('API_KEY=real-secret');
    expect(logs.some((l) => l.includes('Filled'))).toBe(true);
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true });
  });
});
