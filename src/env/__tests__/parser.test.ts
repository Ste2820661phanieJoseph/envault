import { parseEnv, serializeEnv } from '../parser';

describe('parseEnv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnv('FOO=bar\nBAZ=qux\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const result = parseEnv('# This is a comment\nKEY=value\n');
    expect(result).toEqual({ KEY: 'value' });
  });

  it('ignores blank lines', () => {
    const result = parseEnv('\nKEY=value\n\n');
    expect(result).toEqual({ KEY: 'value' });
  });

  it('strips double quotes from values', () => {
    const result = parseEnv('KEY="hello world"\n');
    expect(result).toEqual({ KEY: 'hello world' });
  });

  it('strips single quotes from values', () => {
    const result = parseEnv("KEY='hello world'\n");
    expect(result).toEqual({ KEY: 'hello world' });
  });

  it('handles empty values', () => {
    const result = parseEnv('KEY=\n');
    expect(result).toEqual({ KEY: '' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnv('KEY=base64==\n');
    expect(result).toEqual({ KEY: 'base64==' });
  });

  it('trims whitespace around keys and values', () => {
    const result = parseEnv('  KEY  =  value  \n');
    expect(result).toEqual({ KEY: 'value' });
  });
});

describe('serializeEnv', () => {
  it('serializes a simple record', () => {
    const output = serializeEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const output = serializeEnv({ KEY: 'hello world' });
    expect(output).toContain('KEY="hello world"');
  });

  it('quotes empty values', () => {
    const output = serializeEnv({ KEY: '' });
    expect(output).toContain('KEY=""');
  });

  it('round-trips through parse and serialize', () => {
    const original = { API_KEY: 'abc123', DB_URL: 'postgres://localhost/db' };
    const serialized = serializeEnv(original);
    const parsed = parseEnv(serialized);
    expect(parsed).toEqual(original);
  });

  it('ends with a newline when non-empty', () => {
    const output = serializeEnv({ KEY: 'value' });
    expect(output.endsWith('\n')).toBe(true);
  });

  it('returns empty string for empty record', () => {
    const output = serializeEnv({});
    expect(output).toBe('');
  });
});
