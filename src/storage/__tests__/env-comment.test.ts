import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseEnvWithComments,
  serializeEnvWithComments,
  addComment,
  removeComment,
  readEnvWithComments,
  writeEnvWithComments,
} from '../env-comment';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-comment-'));
}

describe('parseEnvWithComments', () => {
  it('parses key=value with preceding comment', () => {
    const result = parseEnvWithComments('# my api key\nAPI_KEY=abc123\n');
    expect(result['API_KEY']).toEqual({ value: 'abc123', comment: 'my api key' });
  });

  it('parses key=value without comment', () => {
    const result = parseEnvWithComments('DB_URL=postgres://localhost\n');
    expect(result['DB_URL']).toEqual({ value: 'postgres://localhost', comment: undefined });
  });

  it('ignores blank lines between comment and key', () => {
    const result = parseEnvWithComments('# note\n\nFOO=bar\n');
    expect(result['FOO'].comment).toBeUndefined();
  });
});

describe('serializeEnvWithComments', () => {
  it('serializes with comments', () => {
    const map = { API_KEY: { value: 'abc', comment: 'the key' } };
    expect(serializeEnvWithComments(map)).toContain('# the key\nAPI_KEY=abc');
  });

  it('serializes without comments', () => {
    const map = { FOO: { value: 'bar' } };
    expect(serializeEnvWithComments(map)).toBe('FOO=bar\n');
  });
});

describe('addComment / removeComment', () => {
  it('adds a comment to existing key', () => {
    const map = { FOO: { value: 'bar' } };
    const updated = addComment(map, 'FOO', 'hello');
    expect(updated['FOO'].comment).toBe('hello');
  });

  it('throws if key not found on add', () => {
    expect(() => addComment({}, 'MISSING', 'x')).toThrow();
  });

  it('removes a comment', () => {
    const map = { FOO: { value: 'bar', comment: 'old' } };
    const updated = removeComment(map, 'FOO');
    expect(updated['FOO'].comment).toBeUndefined();
  });
});

describe('readEnvWithComments / writeEnvWithComments', () => {
  it('round-trips file with comments', async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    const map = { SECRET: { value: 'xyz', comment: 'important' } };
    await writeEnvWithComments(file, map);
    const loaded = await readEnvWithComments(file);
    expect(loaded['SECRET']).toEqual({ value: 'xyz', comment: 'important' });
  });
});
