import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getTagsPath,
  loadTags,
  addTag,
  removeTag,
  findTag,
  listTags,
} from '../tags';

describe('tags', () => {
  let tmpDir: string;
  const projectId = 'test-project';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tags-'));
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty tags when no file exists', () => {
    const store = loadTags(projectId);
    expect(store.tags).toEqual([]);
  });

  it('adds a tag successfully', () => {
    const entry = addTag(projectId, 'v1.0', 'abc123', 'alice');
    expect(entry.tag).toBe('v1.0');
    expect(entry.vaultHash).toBe('abc123');
    expect(entry.createdBy).toBe('alice');
    expect(entry.createdAt).toBeDefined();
  });

  it('throws when adding duplicate tag', () => {
    addTag(projectId, 'v1.0', 'abc123', 'alice');
    expect(() => addTag(projectId, 'v1.0', 'def456', 'bob')).toThrow(
      'Tag "v1.0" already exists'
    );
  });

  it('finds an existing tag', () => {
    addTag(projectId, 'v2.0', 'xyz789', 'bob');
    const found = findTag(projectId, 'v2.0');
    expect(found).toBeDefined();
    expect(found?.vaultHash).toBe('xyz789');
  });

  it('returns undefined for missing tag', () => {
    expect(findTag(projectId, 'nonexistent')).toBeUndefined();
  });

  it('removes an existing tag', () => {
    addTag(projectId, 'v3.0', 'hash1', 'carol');
    const removed = removeTag(projectId, 'v3.0');
    expect(removed).toBe(true);
    expect(findTag(projectId, 'v3.0')).toBeUndefined();
  });

  it('returns false when removing non-existent tag', () => {
    expect(removeTag(projectId, 'ghost')).toBe(false);
  });

  it('lists all tags', () => {
    addTag(projectId, 'v1.0', 'h1', 'alice');
    addTag(projectId, 'v2.0', 'h2', 'bob');
    const tags = listTags(projectId);
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.tag)).toContain('v1.0');
    expect(tags.map((t) => t.tag)).toContain('v2.0');
  });
});
