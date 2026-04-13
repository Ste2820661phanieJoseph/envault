import * as fs from 'fs';
import * as path from 'path';

export interface TagEntry {
  tag: string;
  vaultHash: string;
  createdAt: string;
  createdBy: string;
}

export interface TagStore {
  tags: TagEntry[];
}

export function getTagsPath(projectId: string): string {
  const vaultDir = path.join(process.env.HOME || '~', '.envault', projectId);
  return path.join(vaultDir, 'tags.json');
}

export function loadTags(projectId: string): TagStore {
  const tagsPath = getTagsPath(projectId);
  if (!fs.existsSync(tagsPath)) {
    return { tags: [] };
  }
  const raw = fs.readFileSync(tagsPath, 'utf-8');
  return JSON.parse(raw) as TagStore;
}

export function saveTags(projectId: string, store: TagStore): void {
  const tagsPath = getTagsPath(projectId);
  fs.mkdirSync(path.dirname(tagsPath), { recursive: true });
  fs.writeFileSync(tagsPath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addTag(projectId: string, tag: string, vaultHash: string, createdBy: string): TagEntry {
  const store = loadTags(projectId);
  if (store.tags.find((t) => t.tag === tag)) {
    throw new Error(`Tag "${tag}" already exists for project "${projectId}"`);
  }
  const entry: TagEntry = {
    tag,
    vaultHash,
    createdAt: new Date().toISOString(),
    createdBy,
  };
  store.tags.push(entry);
  saveTags(projectId, store);
  return entry;
}

export function removeTag(projectId: string, tag: string): boolean {
  const store = loadTags(projectId);
  const before = store.tags.length;
  store.tags = store.tags.filter((t) => t.tag !== tag);
  if (store.tags.length === before) return false;
  saveTags(projectId, store);
  return true;
}

export function findTag(projectId: string, tag: string): TagEntry | undefined {
  const store = loadTags(projectId);
  return store.tags.find((t) => t.tag === tag);
}

export function listTags(projectId: string): TagEntry[] {
  return loadTags(projectId).tags;
}
