import * as fs from 'fs';
import * as path from 'path';

export interface CommentedEnvMap {
  [key: string]: { value: string; comment?: string };
}

export function parseEnvWithComments(content: string): CommentedEnvMap {
  const result: CommentedEnvMap = {};
  const lines = content.split('\n');
  let pendingComment: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes('=')) {
      pendingComment = undefined;
      continue;
    }
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = { value, comment: pendingComment };
    pendingComment = undefined;
  }
  return result;
}

export function serializeEnvWithComments(map: CommentedEnvMap): string {
  return Object.entries(map)
    .map(([key, { value, comment }]) => {
      const commentLine = comment ? `# ${comment}\n` : '';
      return `${commentLine}${key}=${value}`;
    })
    .join('\n') + '\n';
}

export function addComment(map: CommentedEnvMap, key: string, comment: string): CommentedEnvMap {
  if (!map[key]) throw new Error(`Key "${key}" not found`);
  return { ...map, [key]: { ...map[key], comment } };
}

export function removeComment(map: CommentedEnvMap, key: string): CommentedEnvMap {
  if (!map[key]) throw new Error(`Key "${key}" not found`);
  const { comment: _, ...rest } = map[key];
  return { ...map, [key]: rest };
}

export async function readEnvWithComments(filePath: string): Promise<CommentedEnvMap> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return parseEnvWithComments(content);
}

export async function writeEnvWithComments(filePath: string, map: CommentedEnvMap): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, serializeEnvWithComments(map), 'utf-8');
}
