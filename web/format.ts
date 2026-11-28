import type { SemanticMessage } from '../src/application.js';
import { t, hasTranslation } from './i18n.js';
export { t } from './i18n.js';
export function semantic(value: SemanticMessage): string {
  if (value.code.startsWith('memoir44.')) {
    const template = t(value.code);
    if (!hasTranslation(value.code)) return t('memoir.message-unavailable');
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const arg = value.arguments[key];
      if (key === 'unitType' && typeof arg === 'string')
        return t(`memoir.unit.${arg}`);
      if (key === 'userCap' && arg === 'unlimited') return t('memoir.no-cap');
      if (typeof arg === 'boolean') return t(arg ? 'memoir.yes' : 'memoir.no');
      return Array.isArray(arg) ? arg.join(', ') : String(arg ?? '—');
    });
  }

  const args = Object.entries(value.arguments)
    .map(
      ([key, v]) =>
        `${t(`argument.${key}`)}: ${typeof v === 'boolean' ? t(v ? 'memoir.yes' : 'memoir.no') : typeof v === 'string' && hasTranslation(v) ? t(v) : typeof v === 'string' ? v : JSON.stringify(v)}`,
    )
    .join('; ');
  return `${t(value.code)}${args ? ` (${args})` : ''}`;
}
export const symbols: Readonly<Record<string, string>> = Object.freeze({
  observer: '◎',
  'requirements-met': '✓',
  visible: '·',
  blocked: '×',
  'out-of-range': '−',
  'rule-invalid': '!',
  failed: '?',
  'invalid-query': '!',
  unsupported: '!',
  pending: '…',
});
