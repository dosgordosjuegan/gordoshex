import type { SemanticMessage } from '../src/application.js';
import { en } from './messages/en.js';
export const t = (key: string): string => en[key] ?? key;
export function semantic(value: SemanticMessage): string {
  const args = Object.entries(value.arguments)
    .map(
      ([key, v]) => `${key}: ${typeof v === 'string' ? v : JSON.stringify(v)}`,
    )
    .join('; ');
  return `${t(value.code)}${args ? ` (${args})` : ''}`;
}
export const symbols: Readonly<Record<string, string>> = Object.freeze({
  observer: '◎',
  visible: '·',
  blocked: '×',
  'out-of-range': '−',
  'rule-invalid': '!',
  failed: '?',
  'invalid-query': '!',
  unsupported: '!',
  pending: '…',
});
