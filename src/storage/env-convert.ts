import * as fs from 'fs';
import * as path from 'path';

export type ConvertFormat = 'dotenv' | 'json' | 'yaml' | 'export';

export function envMapToJson(envMap: Record<string, string>): string {
  return JSON.stringify(envMap, null, 2);
}

export function envMapToYaml(envMap: Record<string, string>): string {
  const lines = Object.entries(envMap).map(([k, v]) => `${k}: "${v.replace(/"/g, '\\"')}"`);
  return lines.join('\n') + '\n';
}

export function envMapToExport(envMap: Record<string, string>): string {
  const lines = Object.entries(envMap).map(([k, v]) => `export ${k}="${v.replace(/"/g, '\\"')}"`);
  return lines.join('\n') + '\n';
}

export function envMapToDotenv(envMap: Record<string, string>): string {
  const lines = Object.entries(envMap).map(([k, v]) => `${k}=${v}`);
  return lines.join('\n') + '\n';
}

export function jsonToEnvMap(content: string): Record<string, string> {
  const parsed = JSON.parse(content);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON must be a flat key-value object');
  }
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    result[k] = String(v);
  }
  return result;
}

export function convertEnvFile(
  inputPath: string,
  outputPath: string,
  fromFormat: ConvertFormat,
  toFormat: ConvertFormat
): void {
  const content = fs.readFileSync(inputPath, 'utf-8');
  let envMap: Record<string, string>;

  if (fromFormat === 'json') {
    envMap = jsonToEnvMap(content);
  } else if (fromFormat === 'dotenv' || fromFormat === 'export') {
    const { parseEnv } = require('../env/parser');
    envMap = parseEnv(content);
  } else {
    throw new Error(`Unsupported input format: ${fromFormat}`);
  }

  let output: string;
  if (toFormat === 'json') {
    output = envMapToJson(envMap);
  } else if (toFormat === 'yaml') {
    output = envMapToYaml(envMap);
  } else if (toFormat === 'export') {
    output = envMapToExport(envMap);
  } else {
    output = envMapToDotenv(envMap);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');
}
