import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  acquireLock,
  releaseLock,
  isLocked,
  withLock,
  getLockPath,
  LockInfo,
} from '../lock';

const LOCK_DIR = path.join(os.homedir(), '.envault', 'locks');
const TEST_PROJECT = 'test-project-lock';

beforeEach(() => {
  releaseLock(TEST_PROJECT);
});

afterEach(() => {
  releaseLock(TEST_PROJECT);
});

describe('acquireLock', () => {
  it('should acquire a lock when none exists', () => {
    const result = acquireLock(TEST_PROJECT);
    expect(result).toBe(true);
    expect(fs.existsSync(getLockPath(TEST_PROJECT))).toBe(true);
  });

  it('should fail to acquire a lock when one is already held', () => {
    acquireLock(TEST_PROJECT);
    const result = acquireLock(TEST_PROJECT);
    expect(result).toBe(false);
  });

  it('should acquire a lock over a stale one', () => {
    const staleLock: LockInfo = { pid: 99999, timestamp: Date.now() - 60_000, project: TEST_PROJECT };
    fs.mkdirSync(LOCK_DIR, { recursive: true });
    fs.writeFileSync(getLockPath(TEST_PROJECT), JSON.stringify(staleLock));
    const result = acquireLock(TEST_PROJECT);
    expect(result).toBe(true);
  });
});

describe('releaseLock', () => {
  it('should remove the lock file', () => {
    acquireLock(TEST_PROJECT);
    releaseLock(TEST_PROJECT);
    expect(fs.existsSync(getLockPath(TEST_PROJECT))).toBe(false);
  });

  it('should not throw if no lock exists', () => {
    expect(() => releaseLock(TEST_PROJECT)).not.toThrow();
  });
});

describe('isLocked', () => {
  it('should return false when no lock exists', () => {
    expect(isLocked(TEST_PROJECT)).toBe(false);
  });

  it('should return true when a valid lock exists', () => {
    acquireLock(TEST_PROJECT);
    expect(isLocked(TEST_PROJECT)).toBe(true);
  });
});

describe('withLock', () => {
  it('should execute the function and release the lock', () => {
    const result = withLock(TEST_PROJECT, () => 42);
    expect(result).toBe(42);
    expect(isLocked(TEST_PROJECT)).toBe(false);
  });

  it('should release the lock even if the function throws', () => {
    expect(() => withLock(TEST_PROJECT, () => { throw new Error('fail'); })).toThrow('fail');
    expect(isLocked(TEST_PROJECT)).toBe(false);
  });

  it('should throw if the project is already locked', () => {
    acquireLock(TEST_PROJECT);
    expect(() => withLock(TEST_PROJECT, () => {})).toThrow(/locked by another envault process/);
  });
});
