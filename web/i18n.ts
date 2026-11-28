import { en } from './messages/en.js';
import { memoirEn } from './messages/memoir-en.js';
import { es } from './messages/es.js';
import { memoirEs } from './messages/memoir-es.js';
export type Language = 'en' | 'es';
export const LANGUAGE_STORAGE_KEY = 'gordoshex.language';
export const resources = {
  en: { ...en, ...memoirEn },
  es: { ...es, ...memoirEs },
};
let language: Language = 'en';
export const currentLanguage = (): Language => language;
export function preferredLanguage(
  stored: string | null,
  preferences: readonly string[],
): Language {
  if (stored === 'en' || stored === 'es') return stored;
  for (const preference of preferences) {
    const base = preference.toLowerCase().split('-')[0];
    if (base === 'en' || base === 'es') return base;
  }
  return 'en';
}
export function setLanguage(next: Language): void {
  language = next;
}
export function initializeLanguage(
  preferences: readonly string[],
  storage?: Pick<Storage, 'getItem'>,
): void {
  let stored: string | null = null;
  try {
    stored = storage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
  } catch {
    /* Storage may be unavailable. */
  }
  setLanguage(preferredLanguage(stored, preferences));
}
export function persistLanguage(
  next: Language,
  storage?: Pick<Storage, 'setItem'>,
): void {
  setLanguage(next);
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, next);
  } catch {
    /* Language still works without persistence. */
  }
}
export function hasTranslation(key: string): boolean {
  return Object.hasOwn(resources[language], key);
}
export function t(key: string): string {
  const messages: Readonly<Record<string, string>> = resources[language];
  return messages[key] ?? messages['memoir.message-unavailable'] ?? '—';
}
// Resolve application-owned markers once; later switches update existing text/attribute nodes.
// Keeping form and SVG nodes in place preserves listeners, values, focus and camera state.
const texts: { node: Text; key: string }[] = [];
const attributes: { node: Element; name: string; key: string }[] = [];
export const mark = (key: string): string => `@@${key}@@`;
export function bindTranslations(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
    nodes: Text[] = [];
  while (walker.nextNode())
    if (walker.currentNode instanceof Text) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parts = node.data.split(/@@([\w.-]+)@@/g);
    if (parts.length === 1) continue;
    const fragment = document.createDocumentFragment();
    for (const [index, part] of parts.entries()) {
      const child = document.createTextNode(index % 2 ? t(part) : part);
      if (index % 2) texts.push({ node: child, key: part });
      fragment.append(child);
    }
    node.replaceWith(fragment);
  }
  for (const node of [root, ...root.querySelectorAll('*')])
    for (const attribute of [...node.attributes]) {
      const match = /^@@([\w.-]+)@@$/.exec(attribute.value),
        key = match?.[1];
      if (key) {
        attributes.push({ node, name: attribute.name, key });
        node.setAttribute(attribute.name, t(key));
      }
    }
}
export function refreshTranslations(): void {
  document.documentElement.lang = language;
  document.title = t('app.title');
  for (const { node, key } of texts) if (node.isConnected) node.data = t(key);
  for (const { node, name, key } of attributes)
    if (node.isConnected) node.setAttribute(name, t(key));
}
