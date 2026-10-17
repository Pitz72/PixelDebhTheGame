/**
 * The player's settings (graphics, comfort, keys), saved with the rest in `save.json`. Audio keeps its own
 * keys in soundService (saved the moment a slider moves) and the language in i18n; the graphics quality keeps
 * the key it always had so a saved choice survives the update.
 *
 * `getSettings()` always gives a complete, valid object (a bad or missing saved value falls back to the
 * default); `updateSettings()` changes some fields, saves and tells the subscribers, so the game and the
 * options screen follow each other live.
 */
import { useSyncExternalStore } from 'react';
import * as storage from './storage';
import { t } from './i18n';
import type { Difficulty } from '../types';
import { CONTROLS, DEFAULT_BINDINGS, RESERVED_KEYS, defaultBindings, type Bindings, type Control } from '../engine/input';

export type ShakeLevel = 0 | 50 | 100;
export const SHAKE_LEVELS: readonly ShakeLevel[] = [0, 50, 100];

export type Quality = 'high' | 'low';

export interface Settings {
  /** The difficulty of the next game (a game in progress keeps its own). */
  difficulty: Difficulty;
  /** High: dynamic lights and bloom. Low: the light version. */
  quality: Quality;
  /** Let the game drop to Low quality by itself when it cannot hold the frame rate. */
  autoQuality: boolean;
  /** How much the screen shakes, in percent. */
  shake: ShakeLevel;
  /** The red flash when she is hurt and the white flash when a boss falls. */
  flashes: boolean;
  /** The very short freeze on a hit and the slow motion when a boss falls. */
  hitStop: boolean;
  /** Skip the intros' flashing TV and the long animations (also on when the system asks for less motion). */
  reduceMotion: boolean;
  bindings: Bindings;
}

export const SETTINGS_KEY = 'pixelDebhSettings';
/** Where the quality choice lived before there was a settings file (kept so a saved choice survives the update). */
export const LEGACY_QUALITY_KEY = 'pixelDebhQuality';

export const defaultSettings = (): Settings => ({
  difficulty: 'normal',
  quality: 'high',
  autoQuality: true,
  shake: 100,
  flashes: true,
  hitStop: true,
  reduceMotion: false,
  bindings: defaultBindings(),
});

/** Reads a saved settings value defensively: anything odd is dropped, never an exception. */
export function parseSettings(json: string | null, legacyQuality: string | null = null): Settings {
  const out = defaultSettings();
  if (legacyQuality === 'low' || legacyQuality === 'high') out.quality = legacyQuality;
  if (!json) return out;
  try {
    const raw = JSON.parse(json) as Partial<Record<keyof Settings, unknown>>;
    if (raw.quality === 'low' || raw.quality === 'high') out.quality = raw.quality;
    if (raw.difficulty === 'easy' || raw.difficulty === 'normal' || raw.difficulty === 'hard') out.difficulty = raw.difficulty;
    if (typeof raw.autoQuality === 'boolean') out.autoQuality = raw.autoQuality;
    if (raw.shake === 0 || raw.shake === 50 || raw.shake === 100) out.shake = raw.shake;
    if (typeof raw.flashes === 'boolean') out.flashes = raw.flashes;
    if (typeof raw.hitStop === 'boolean') out.hitStop = raw.hitStop;
    if (typeof raw.reduceMotion === 'boolean') out.reduceMotion = raw.reduceMotion;
    out.bindings = parseBindings(raw.bindings);
  } catch (error) {
    console.error('Could not read the settings:', error);
  }
  return out;
}

/** A saved bindings table, repaired: unknown controls and reserved keys dropped, a control left with no key gets its default back. */
export function parseBindings(raw: unknown): Bindings {
  const out = defaultBindings();
  if (!raw || typeof raw !== 'object') return out;
  for (const control of CONTROLS) {
    const keys = (raw as Record<string, unknown>)[control];
    if (!Array.isArray(keys)) continue;
    const clean = keys
      .filter((k): k is string => typeof k === 'string' && k.length > 0 && k.length <= 16 && !RESERVED_KEYS.includes(k))
      .slice(0, 2);
    out[control] = clean.length > 0 ? [...new Set(clean)] : [...DEFAULT_BINDINGS[control]];
  }
  return out;
}

/**
 * Gives `key` to `control` in the slot (0 or 1). A key never does two things: if another control had it, that
 * control gets the key `control` is giving up (a swap), or just loses it when there is none. Returns the new
 * table, or null when the key is reserved or taking it would leave another control with no key at all.
 */
export function bindKey(bindings: Bindings, control: Control, slot: 0 | 1, key: string): Bindings | null {
  if (RESERVED_KEYS.includes(key)) return null;
  const next: Bindings = defaultBindings();
  for (const c of CONTROLS) next[c] = [...bindings[c]];
  const previous: string | undefined = next[control][slot];
  for (const c of CONTROLS) {
    if (c === control || !next[c].includes(key)) continue;
    const mapped = previous !== undefined ? next[c].map(k => (k === key ? previous : k)) : next[c].filter(k => k !== key);
    const unique = [...new Set(mapped)];
    if (unique.length === 0) return null;
    next[c] = unique;
  }
  const mine = [...next[control]];
  mine[slot] = key;
  next[control] = [...new Set(mine.filter(k => k !== undefined && k !== ''))];
  return next;
}

/** Takes the key in `slot` away from `control`; a control keeps at least one key. */
export function clearKey(bindings: Bindings, control: Control, slot: 0 | 1): Bindings {
  const next: Bindings = defaultBindings();
  for (const c of CONTROLS) next[c] = [...bindings[c]];
  if (next[control].length > 1) next[control] = next[control].filter((_, i) => i !== slot);
  return next;
}

let current: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (current === null) current = parseSettings(storage.getItem(SETTINGS_KEY), storage.getItem(LEGACY_QUALITY_KEY));
  return current;
}

export function updateSettings(change: Partial<Settings>): Settings {
  current = { ...getSettings(), ...change };
  storage.setItem(SETTINGS_KEY, JSON.stringify(current));
  for (const l of listeners) l();
  return current;
}

export function resetBindings(): void {
  updateSettings({ bindings: defaultBindings() });
}

export function subscribeSettings(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** For components: the settings, redrawn when they change. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

/** True when motion should be reduced: the player asked for it, or the system did. */
export function reduceMotion(): boolean {
  if (getSettings().reduceMotion) return true;
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/** How a key is written on screen. */
export function keyLabel(key: string): string {
  const names: Record<string, string> = {
    ' ': t('key.space'),
    arrowleft: '←',
    arrowright: '→',
    arrowup: '↑',
    arrowdown: '↓',
    shift: 'SHIFT',
    control: 'CTRL',
    alt: 'ALT',
    enter: t('key.enter'),
    escape: 'ESC',
    backspace: t('key.backspace'),
    tab: 'TAB',
  };
  return names[key] ?? key.toUpperCase();
}
