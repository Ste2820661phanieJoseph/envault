import * as fs from 'fs';
import * as path from 'path';

export interface DiffReportEntry {
  key: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface DiffReport {
  projectId: string;
  generatedAt: string;
  baseLabel: string;
  targetLabel: string;
  entries: DiffReportEntry[];
}

export function buildDiffReport(
  projectId: string,
  baseLabel: string,
  targetLabel: string,
  baseMap: Record<string, string>,
  targetMap: Record<string, string>
): DiffReport {
  const allKeys = new Set([...Object.keys(baseMap), ...Object.keys(targetMap)]);
  const entries: DiffReportEntry[] = [];
  const timestamp = new Date().toISOString();

  for (const key of allKeys) {
    const inBase = key in baseMap;
    const inTarget = key in targetMap;

    if (!inBase) {
      entries.push({ key, status: 'added', newValue: targetMap[key], timestamp });
    } else if (!inTarget) {
      entries.push({ key, status: 'removed', oldValue: baseMap[key], timestamp });
    } else if (baseMap[key] !== targetMap[key]) {
      entries.push({ key, status: 'changed', oldValue: baseMap[key], newValue: targetMap[key], timestamp });
    } else {
      entries.push({ key, status: 'unchanged', oldValue: baseMap[key], newValue: targetMap[key], timestamp });
    }
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  return { projectId, generatedAt: timestamp, baseLabel, targetLabel, entries };
}

export function getDiffReportPath(vaultDir: string, projectId: string): string {
  return path.join(vaultDir, projectId, 'diff-report.json');
}

export function saveDiffReport(vaultDir: string, projectId: string, report: DiffReport): void {
  const filePath = getDiffReportPath(vaultDir, projectId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
}

export function loadDiffReport(vaultDir: string, projectId: string): DiffReport | null {
  const filePath = getDiffReportPath(vaultDir, projectId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DiffReport;
}

export function formatDiffReport(report: DiffReport): string {
  const lines: string[] = [
    `Diff Report: ${report.baseLabel} → ${report.targetLabel}`,
    `Project: ${report.projectId}`,
    `Generated: ${report.generatedAt}`,
    ''
  ];
  for (const entry of report.entries) {
    if (entry.status === 'added') lines.push(`  + ${entry.key}=${entry.newValue}`);
    else if (entry.status === 'removed') lines.push(`  - ${entry.key}=${entry.oldValue}`);
    else if (entry.status === 'changed') lines.push(`  ~ ${entry.key}: "${entry.oldValue}" → "${entry.newValue}"`);
  }
  return lines.join('\n');
}
