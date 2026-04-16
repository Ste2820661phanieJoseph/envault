import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export type FieldType = 'random' | 'uuid' | 'alphanumeric' | 'numeric';

export interface GenerateField {
  key: string;
  type: FieldType;
  length?: number;
}

export function generateValue(type: FieldType, length = 32): string {
  switch (type) {
    case 'uuid': {
      const b = randomBytes(16);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = b.toString('hex');
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }
    case 'alphanumeric': {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from(randomBytes(length)).map(b => chars[b % chars.length]).join('');
    }
    case 'numeric': {
      return Array.from(randomBytes(length)).map(b => b % 10).join('');
    }
    case 'random':
    default:
      return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }
}

export function generateEnvMap(fields: GenerateField[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    result[field.key] = generateValue(field.type, field.length);
  }
  return result;
}

export function writeGeneratedEnv(filePath: string, map: Record<string, string>): void {
  const lines = Object.entries(map).map(([k, v]) => `${k}=${v}`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}
