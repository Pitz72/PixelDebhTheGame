/**
 * Language of the interface: Italian or English. The choice is saved with the other settings; until
 * the player makes one it follows the language of the system (Italian for Italian systems, English
 * for everything else). Texts live in `locales/`; `t(key)` gives one in the current language.
 */
import { useSyncExternalStore } from 'react';
import * as storage from './storage';
import { it, type TextKey } from '../locales/it';
import { en } from '../locales/en';

export type Language = 'it' | 'en';
export const LANGUAGES: Language[] = ['it', 'en'];
export const LANGUAGE_KEY = 'pixelDebhLanguage';

const tables: Record<Language, Record<TextKey, string>> = { it, en };

/** What the system would pick: Italian for an Italian system, English otherwise. */
export function systemLanguage(): Language {
  const nav = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : '';
  return nav.startsWith('it') ? 'it' : 'en';
}

let current: Language | null = null;
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  if (current === null) {
    const saved = storage.getItem(LANGUAGE_KEY);
    current = saved === 'it' || saved === 'en' ? saved : systemLanguage();
  }
  return current;
}

export function setLanguage(lang: Language): void {
  current = lang;
  storage.setItem(LANGUAGE_KEY, lang);
  for (const l of listeners) l();
}

/** A text in the current language; `{name}` holes are filled from `vars`. */
export function t(key: TextKey, vars?: Record<string, string | number>): string {
  const text = tables[getLanguage()][key] ?? it[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** For components: gives the language and re-renders when it changes. */
export function useLanguage(): Language {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLanguage,
    getLanguage
  );
}
