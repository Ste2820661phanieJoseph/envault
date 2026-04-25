import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  envMapToJson,
  envMapToYaml,
  envMapToExport,
  envMapToDotenv,
  jsonToEnvMap,
} from '../env-convert';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-convert-'));
}

describe('envMapToJson', () => {
  it('serializes to pretty JSON', () => {
    const result = envMapToJson({ FOO: 'bar', BAZ: '123' });
    const parsed = JSON.parse(result);
    expect(parsed.FOO).toBe('bar');
    expect(parsed.BAZ).toBe('123');
  });
});

describe('envMapToYaml', () => {
  it('serializes to YAML key-value pairs', () => {
    const result = envMapToYaml({ FOO: 'bar', BAZ: 'hello world' });
    expect(result).toContain('FOO: "bar"');
    expect(result).toContain('BAZ: "hello world"');
  });

  it('escapes double quotes in values', () => {
    const result = envMapToYaml({ KEY: 'say "hi"' });
    expect(result).toContain('KEY: "say \\"hi\\""');
  });
});

describe('envMapToExport', () => {
  it('generates export statements', () => {
    const result = envMapToExport({ FOO: 'bar' });
    expect(result).toContain('export FOO="bar"');
  });
});

describe('envMapToDotenv', () => {
  it('generates dotenv format', () => {
    const result = envMapToDotenv({ FOO: 'bar', BAZ: '1' });
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=1');
  });
});

describe('jsonToEnvMap', () => {
  it('parses flat JSON to env map', () => {
    const json = JSON.stringify({ FOO: 'bar', NUM: 42 });
    const result = jsonToEnvMap(json);
    expect(result.FOO).toBe('bar');
    expect(result.NUM).toBe('42');
  });

  it('throws on non-object JSON', () => {
    expect(() => jsonToEnvMap('["a","b"]')).toThrow();
    expect(() => jsonToEnvMap('"string"')).toThrow();
  });
});
