import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildDiffReport,
  saveDiffReport,
  loadDiffReport,
  formatDiffReport,
  getDiffReportPath
} from '../env-diff-report';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-diffreport-'));
}

describe('buildDiffReport', () => {
  it('detects added keys', () => {
    const report = buildDiffReport('proj', 'base', 'target', {}, { NEW_KEY: 'val' });
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].status).toBe('added');
    expect(report.entries[0].key).toBe('NEW_KEY');
    expect(report.entries[0].newValue).toBe('val');
  });

  it('detects removed keys', () => {
    const report = buildDiffReport('proj', 'base', 'target', { OLD_KEY: 'val' }, {});
    expect(report.entries[0].status).toBe('removed');
    expect(report.entries[0].oldValue).toBe('val');
  });

  it('detects changed keys', () => {
    const report = buildDiffReport('proj', 'base', 'target', { KEY: 'old' }, { KEY: 'new' });
    expect(report.entries[0].status).toBe('changed');
    expect(report.entries[0].oldValue).toBe('old');
    expect(report.entries[0].newValue).toBe('new');
  });

  it('detects unchanged keys', () => {
    const report = buildDiffReport('proj', 'base', 'target', { KEY: 'same' }, { KEY: 'same' });
    expect(report.entries[0].status).toBe('unchanged');
  });

  it('sets projectId, baseLabel, targetLabel, generatedAt', () => {
    const report = buildDiffReport('myproj', 'v1', 'v2', {}, {});
    expect(report.projectId).toBe('myproj');
    expect(report.baseLabel).toBe('v1');
    expect(report.targetLabel).toBe('v2');
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('saveDiffReport / loadDiffReport', () => {
  it('saves and loads a report', () => {
    const tmpDir = makeTmpDir();
    const report = buildDiffReport('proj1', 'base', 'target', { A: '1' }, { A: '2', B: '3' });
    saveDiffReport(tmpDir, 'proj1', report);
    const loaded = loadDiffReport(tmpDir, 'proj1');
    expect(loaded).not.toBeNull();
    expect(loaded!.projectId).toBe('proj1');
    expect(loaded!.entries).toHaveLength(2);
  });

  it('returns null if no report exists', () => {
    const tmpDir = makeTmpDir();
    expect(loadDiffReport(tmpDir, 'nonexistent')).toBeNull();
  });
});

describe('formatDiffReport', () => {
  it('includes added/removed/changed lines', () => {
    const report = buildDiffReport('proj', 'base', 'target', { OLD: 'x', SAME: 'y' }, { NEW: 'z', SAME: 'y' });
    const output = formatDiffReport(report);
    expect(output).toContain('+ NEW=z');
    expect(output).toContain('- OLD=x');
    expect(output).not.toContain('~ SAME');
  });

  it('includes header info', () => {
    const report = buildDiffReport('proj', 'alpha', 'beta', {}, {});
    const output = formatDiffReport(report);
    expect(output).toContain('alpha → beta');
    expect(output).toContain('proj');
  });
});
