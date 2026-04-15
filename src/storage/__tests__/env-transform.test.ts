import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  applyTransform,
  transformEnvFile,
  writeTransformedEnv,
  builtinTransforms,
} from '../env-transform';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-transform-'));
}

describe('applyTransform', () => {
  it('returns unchanged result when transform is identity', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = applyTransform(env, (k, v) => ({ key: k, value: v }));
    expect(result.transformed).toEqual(env);
    expect(result.changes).toHaveLength(0);
  });

  it('tracks value changes', () => {
    const env = { FOO: '  hello  ' };
    const result = applyTransform(env, builtinTransforms.trimValues);
    expect(result.transformed.FOO).toBe('hello');
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({ key: 'FOO', oldValue: '  hello  ', newValue: 'hello' });
  });

  it('tracks key renames', () => {
    const env = { foo: 'bar' };
    const result = applyTransform(env, builtinTransforms.uppercaseKeys);
    expect(result.transformed).toEqual({ FOO: 'bar' });
    expect(result.changes[0].newKey).toBe('FOO');
  });

  it('lowercaseKeys transform works', () => {
    const env = { FOO: 'val', BAR: 'baz' };
    const result = applyTransform(env, builtinTransforms.lowercaseKeys);
    expect(result.transformed).toEqual({ foo: 'val', bar: 'baz' });
  });
});

describe('transformEnvFile', () => {
  it('throws if file does not exist', () => {
    expect(() => transformEnvFile('/nonexistent/.env', builtinTransforms.trimValues)).toThrow(
      'File not found'
    );
  });

  it('reads and transforms an env file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'foo=  hello  \nbar=world\n', 'utf-8');
    const result = transformEnvFile(file, builtinTransforms.trimValues);
    expect(result.transformed.foo).toBe('hello');
    expect(result.transformed.bar).toBe('world');
  });
});

describe('writeTransformedEnv', () => {
  it('writes transformed content to file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\n', 'utf-8');
    const result = transformEnvFile(file, builtinTransforms.lowercaseKeys);
    writeTransformedEnv(file, result);
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('foo=bar');
  });
});
