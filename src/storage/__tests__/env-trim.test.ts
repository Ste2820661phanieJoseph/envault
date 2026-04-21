import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { trimEnvMap, trimEnvFile, writeTrimmedEnv } from '../env-trim';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-trim-'));
}

describe('trimEnvMap', () => {
  it('trims values by default', () => {
    const result = trimEnvMap({ KEY: '  hello  ', OTHER: '\tworld\t' });
    expect(result).toEqual({ KEY: 'hello', OTHER: 'world' });
  });

  it('does not trim keys by default', () => {
    const result = trimEnvMap({ ' KEY ': 'value' });
    expect(result).toEqual({ ' KEY ': 'value' });
  });

  it('trims keys when trimKeys is true', () => {
    const result = trimEnvMap({ ' KEY ': '  value  ' }, { trimKeys: true });
    expect(result).toEqual({ KEY: 'value' });
  });

  it('skips value trimming when trimValues is false', () => {
    const result = trimEnvMap({ KEY: '  value  ' }, { trimValues: false });
    expect(result).toEqual({ KEY: '  value  ' });
  });

  it('handles empty map', () => {
    expect(trimEnvMap({})).toEqual({});
  });

  it('handles values with no whitespace', () => {
    const result = trimEnvMap({ KEY: 'clean' });
    expect(result).toEqual({ KEY: 'clean' });
  });
});

describe('trimEnvFile', () => {
  it('reads and trims values from file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=  bar  \nBAZ=  qux\n', 'utf-8');
    const result = trimEnvFile(file);
    expect(result.FOO).toBe('bar');
    expect(result.BAZ).toBe('qux');
  });
});

describe('writeTrimmedEnv', () => {
  it('writes trimmed env to output file', () => {
    const dir = makeTmpDir();
    const input = path.join(dir, '.env');
    const output = path.join(dir, '.env.trimmed');
    fs.writeFileSync(input, 'KEY=  value  \nNAME=  world  \n', 'utf-8');
    writeTrimmedEnv(input, output);
    const content = fs.readFileSync(output, 'utf-8');
    expect(content).toContain('KEY=value');
    expect(content).toContain('NAME=world');
  });

  it('can write to same file as input', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'A=  1  \nB=  2  \n', 'utf-8');
    writeTrimmedEnv(file, file);
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');
  });
});
