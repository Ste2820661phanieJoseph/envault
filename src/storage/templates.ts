import * as fs from 'fs';
import * as path from 'path';

export interface EnvTemplate {
  name: string;
  description?: string;
  keys: TemplateKey[];
  createdAt: string;
}

export interface TemplateKey {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

export interface TemplatesStore {
  templates: Record<string, EnvTemplate>;
}

const TEMPLATES_FILE = 'templates.json';

export function getTemplatesPath(vaultDir: string): string {
  return path.join(vaultDir, TEMPLATES_FILE);
}

export function loadTemplates(vaultDir: string): TemplatesStore {
  const filePath = getTemplatesPath(vaultDir);
  if (!fs.existsSync(filePath)) {
    return { templates: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as TemplatesStore;
}

export function saveTemplates(vaultDir: string, store: TemplatesStore): void {
  const filePath = getTemplatesPath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function addTemplate(vaultDir: string, template: EnvTemplate): void {
  const store = loadTemplates(vaultDir);
  store.templates[template.name] = template;
  saveTemplates(vaultDir, store);
}

export function removeTemplate(vaultDir: string, name: string): boolean {
  const store = loadTemplates(vaultDir);
  if (!store.templates[name]) return false;
  delete store.templates[name];
  saveTemplates(vaultDir, store);
  return true;
}

export function getTemplate(vaultDir: string, name: string): EnvTemplate | undefined {
  const store = loadTemplates(vaultDir);
  return store.templates[name];
}

export function listTemplates(vaultDir: string): EnvTemplate[] {
  const store = loadTemplates(vaultDir);
  return Object.values(store.templates);
}

export function applyTemplate(template: EnvTemplate): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of template.keys) {
    result[key.key] = key.defaultValue ?? '';
  }
  return result;
}
