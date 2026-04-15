import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serializeEnv } from '../env/parser';

export type TransformFn = (key: string, value: string) => { key: string; value: string };

export type TransformType = 'uppercase-keys' | 'lowercase-keys' | 'prefix' | 'strip-prefix' | 'mask-values';

export interface TransformOptions {
  type: TransformType;
  prefix?: string;
  maskChar?: string;
}

export function applyTransform(
  envMap: Record<string, string>,
  options: TransformOptions
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(envMap)) {
    let newKey = key;
    let newValue = value;

    switch (options.type) {
      case 'uppercase-keys':
        newKey = key.toUpperCase();
        break;
      case 'lowercase-keys':
        newKey = key.toLowerCase();
        break;
      case 'prefix':
        if (options.prefix) {
          newKey = `${options.prefix}${key}`;
        }
        break;
      case 'strip-prefix':
        if (options.prefix && key.startsWith(options.prefix)) {
          newKey = key.slice(options.prefix.length);
        }
        break;
      case 'mask-values': {
        const char = options.maskChar ?? '*';
        newValue = value.length > 0 ? char.repeat(value.length) : '';
        break;
      }
    }

    result[newKey] = newValue;
  }

  return result;
}

export function transformEnvFile(
  filePath: string,
  options: TransformOptions
): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const envMap = parseEnv(raw);
  return applyTransform(envMap, options);
}

export function writeTransformedEnv(
  inputPath: string,
  outputPath: string,
  options: TransformOptions
): void {
  const transformed = transformEnvFile(inputPath, options);
  const serialized = serializeEnv(transformed);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, 'utf-8');
}
