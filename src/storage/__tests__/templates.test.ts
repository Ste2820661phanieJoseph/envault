import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addTemplate,
  removeTemplate,
  listTemplates,
  getTemplate,
  applyTemplate,
  loadTemplates,
  EnvTemplate,
} from '../templates';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-templates-test-'));
}

const sampleTemplate: EnvTemplate = {
  name: 'backend',
  description: 'Backend service template',
  keys: [
    { key: 'DATABASE_URL', required: true },
    { key: 'PORT', required: false, defaultValue: '3000' },
    { key: 'SECRET_KEY', required: true },
  ],
  createdAt: new Date().toISOString(),
};

describe('templates storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads empty store when file does not exist', () => {
    const store = loadTemplates(tmpDir);
    expect(store.templates).toEqual({});
  });

  it('adds and retrieves a template', () => {
    addTemplate(tmpDir, sampleTemplate);
    const retrieved = getTemplate(tmpDir, 'backend');
    expect(retrieved).toBeDefined();
    expect(retrieved?.keys).toHaveLength(3);
  });

  it('lists all templates', () => {
    addTemplate(tmpDir, sampleTemplate);
    addTemplate(tmpDir, { ...sampleTemplate, name: 'frontend', keys: [] });
    const all = listTemplates(tmpDir);
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.name)).toContain('backend');
    expect(all.map((t) => t.name)).toContain('frontend');
  });

  it('removes a template', () => {
    addTemplate(tmpDir, sampleTemplate);
    const removed = removeTemplate(tmpDir, 'backend');
    expect(removed).toBe(true);
    expect(getTemplate(tmpDir, 'backend')).toBeUndefined();
  });

  it('returns false when removing non-existent template', () => {
    const removed = removeTemplate(tmpDir, 'ghost');
    expect(removed).toBe(false);
  });

  it('applies template with default values', () => {
    const result = applyTemplate(sampleTemplate);
    expect(result['DATABASE_URL']).toBe('');
    expect(result['PORT']).toBe('3000');
    expect(result['SECRET_KEY']).toBe('');
  });

  it('overwrites existing template with same name', () => {
    addTemplate(tmpDir, sampleTemplate);
    addTemplate(tmpDir, { ...sampleTemplate, description: 'Updated' });
    const retrieved = getTemplate(tmpDir, 'backend');
    expect(retrieved?.description).toBe('Updated');
    expect(listTemplates(tmpDir)).toHaveLength(1);
  });
});
