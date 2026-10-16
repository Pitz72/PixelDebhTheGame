/**
 * Persistent key/value storage with a synchronous API.
 *
 * - Desktop app: values live in `save.json` inside the app data directory (Tauri store plugin),
 *   so they survive a reset of the WebView profile.
 * - Browser: plain `localStorage`.
 *
 * `initStorage()` must be awaited once before the UI is rendered; after that reads are served
 * from memory and writes are persisted in the background.
 */
import { isTauri } from './platform';

const STORE_FILE = 'save.json';

interface StoreLike {
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  save(): Promise<void>;
}

const cache = new Map<string, string>();
let store: StoreLike | null = null;

export async function initStorage(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { load } = await import('@tauri-apps/plugin-store');
    const s = await load(STORE_FILE, { autoSave: false, defaults: {} });
    for (const [key, value] of await s.entries<unknown>()) {
      if (typeof value === 'string') cache.set(key, value);
    }
    store = s;
  } catch (error) {
    console.error('Save store unavailable, falling back to localStorage:', error);
  }
}

export function getItem(key: string): string | null {
  if (store) return cache.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  if (store) {
    cache.set(key, value);
    store
      .set(key, value)
      .then(() => store?.save())
      .catch(error => console.error(`Could not save "${key}":`, error));
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Could not save "${key}":`, error);
  }
}

export function removeItem(key: string): void {
  if (store) {
    cache.delete(key);
    store
      .delete(key)
      .then(() => store?.save())
      .catch(error => console.error(`Could not remove "${key}":`, error));
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
