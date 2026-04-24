import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  namespaceEnvMap,
  removeNamespaceFromEnvMap,
  filterByNamespace,
  namespaceEnvFile,
  writeNamespacedEnv,
} from '../env-namespace';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-namespace-'));
}

describe('namespaceEnvMap', () => {
  it('prefixes all keys with namespace and double underscore', () => {
    const result = namespaceEnvMap({ DB_HOST: 'localhost', PORT: '5432' }, 'app');
    expect(result).toEqual({ APP__DB_HOST: 'localhost', APP__PORT: '5432' });
  });

  it('uppercases the namespace', () => {
    const result = namespaceEnvMap({ KEY: 'val' }, 'myNs');
    expect(result).toHaveProperty('MYNS__KEY', 'val');
  });

  it('returns empty object for empty input', () => {
    expect(namespaceEnvMap({}, 'NS')).toEqual({});
  });
});

describe('removeNamespaceFromEnvMap', () => {
  it('strips matching namespace prefix', () => {
    const result = removeNamespaceFromEnvMap(
      { APP__DB_HOST: 'localhost', APP__PORT: '5432' },
      'app'
    );
    expect(result).toEqual({ DB_HOST: 'localhost', PORT: '5432' });
  });

  it('drops keys that do not match the namespace', () => {
    const result = removeNamespaceFromEnvMap(
      { APP__KEY: 'a', OTHER__KEY: 'b', NOPREFIX: 'c' },
      'app'
    );
    expect(result).toEqual({ KEY: 'a' });
  });

  it('returns empty for no matching keys', () => {
    expect(removeNamespaceFromEnvMap({ X: '1' }, 'NS')).toEqual({});
  });
});

describe('filterByNamespace', () => {
  it('returns only keys belonging to the namespace, with prefix intact', () => {
    const result = filterByNamespace(
      { APP__A: '1', OTHER__B: '2', APP__C: '3' },
      'app'
    );
    expect(result).toEqual({ APP__A: '1', APP__C: '3' });
  });
});

describe('namespaceEnvFile', () => {
  it('reads a file and namespaces its keys', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n', 'utf-8');
    const result = namespaceEnvFile(file, 'svc');
    expect(result).toEqual({ SVC__FOO: 'bar', SVC__BAZ: 'qux' });
  });
});

describe('writeNamespacedEnv', () => {
  it('writes namespaced env to a file', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, '.env.out');
    writeNamespacedEnv(file, { HOST: 'localhost', PORT: '3000' }, 'web');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('WEB__HOST=localhost');
    expect(content).toContain('WEB__PORT=3000');
  });
});
