/**
 * Taking part in the tournaments of www.pixeldebh.it (the plan is `docs/TORNEO.md`; the contract between game and site is
 * `docs/TORNEO-API.md` in the site's project, and it wins if the two disagree).
 *
 * This file keeps the player's side of it, saved in `save.json`: the switch (off until the player turns it on, saying
 * they are at least 14), the three letters they play under, and the code of this copy of the game, 16 random bytes made
 * the first time the switch goes on and never shown. While the switch is off the game sends nothing.
 *
 * The switch only exists in a build that has the tournament key (`VITE_PIXELDEBH_TORNEO_CHIAVE`, a GitHub secret passed
 * to the release build; never in the repository): without it the game could not sign what it sends.
 */
import { useSyncExternalStore } from 'react';
import * as storage from './storage';
import { HIGHSCORE_KEY } from '../constants';

export const TOURNAMENT_KEY = 'pixelDebhTournament';
/** The initials last written in the game's own high-score table (to propose them for the tournament). */
export const LAST_INITIALS_KEY = 'pixelDebhLastInitials';
export const PRIVACY_URL = 'https://www.pixeldebh.it/privacy';

export interface TournamentState {
  /** The player said yes (and that they are at least 14): only then does the game talk to the site. */
  enabled: boolean;
  /** Three letters A-Z, or '' until the player chooses them. */
  initials: string;
  /** The code of this copy: 32 lowercase hex characters, or '' until the switch first goes on. */
  copy: string;
  /** When the player last said yes (Unix seconds), 0 if never. */
  consentAt: number;
}

export const defaultTournament = (): TournamentState => ({ enabled: false, initials: '', copy: '', consentAt: 0 });

export const validInitials = (s: unknown): s is string => typeof s === 'string' && /^[A-Z]{3}$/.test(s);
export const validCopy = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{32}$/.test(s);

/** A new code for this copy: 16 random bytes as 32 lowercase hex characters. */
export function newCopyCode(fill: (bytes: Uint8Array) => Uint8Array = b => crypto.getRandomValues(b)): string {
  const bytes = fill(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Reads the saved state defensively: anything odd falls back to "off", never an exception. */
export function parseTournament(json: string | null): TournamentState {
  const out = defaultTournament();
  if (!json) return out;
  try {
    const raw = JSON.parse(json) as Partial<Record<keyof TournamentState, unknown>>;
    if (validInitials(raw.initials)) out.initials = raw.initials;
    if (validCopy(raw.copy)) out.copy = raw.copy;
    if (typeof raw.consentAt === 'number' && Number.isInteger(raw.consentAt) && raw.consentAt > 0) out.consentAt = raw.consentAt;
    // on only with everything it needs: initials, a code and the yes
    out.enabled = raw.enabled === true && out.initials !== '' && out.copy !== '' && out.consentAt > 0;
  } catch (error) {
    console.error('Could not read the tournament settings:', error);
  }
  return out;
}

let current: TournamentState | null = null;
const listeners = new Set<() => void>();

export function getTournament(): TournamentState {
  if (current === null) current = parseTournament(storage.getItem(TOURNAMENT_KEY));
  return current;
}

function save(next: TournamentState): TournamentState {
  current = next;
  storage.setItem(TOURNAMENT_KEY, JSON.stringify(next));
  for (const l of listeners) l();
  return next;
}

/**
 * The player turned the switch on, saying they are at least 14, with these initials. The code of the copy is made
 * now if there is none yet, and kept after that. Returns false (and changes nothing) when the initials are not three
 * letters A-Z.
 */
export function enableTournament(initials: string, now: number = Math.floor(Date.now() / 1000)): boolean {
  if (!validInitials(initials)) return false;
  const was = getTournament();
  save({ enabled: true, initials, copy: was.copy || newCopyCode(), consentAt: now });
  return true;
}

/** The player turned the switch off: the game stops sending. Initials and code stay for the next time. */
export function disableTournament(): void {
  save({ ...getTournament(), enabled: false });
}

/**
 * After the site deleted this copy's data: the code goes (a new one is made the next time the switch goes on) and the
 * switch is off. The initials stay, to be proposed again.
 */
export function forgetCopy(): void {
  save({ ...getTournament(), enabled: false, copy: '', consentAt: 0 });
}

/** The initials to propose: the tournament's own, else the last ones written in the high scores, else the best entry's. */
export function proposedInitials(): string {
  const mine = getTournament().initials;
  if (validInitials(mine)) return mine;
  const last = storage.getItem(LAST_INITIALS_KEY);
  if (validInitials(last)) return last;
  try {
    const scores = JSON.parse(storage.getItem(HIGHSCORE_KEY) ?? '[]') as { name?: unknown; score?: unknown }[];
    const best = Array.isArray(scores)
      ? scores
          .filter(s => validInitials(s?.name) && typeof s.score === 'number' && s.score > 0)
          .sort((a, b) => (b.score as number) - (a.score as number))[0]
      : undefined;
    if (best) return best.name as string;
  } catch {
    // no table, or a broken one: fall through
  }
  return 'AAA';
}

/** The key the game signs with; '' in a build without it (a development build). */
export function tournamentKey(): string {
  const key = import.meta.env.VITE_PIXELDEBH_TORNEO_CHIAVE;
  return typeof key === 'string' ? key.trim() : '';
}

let preview = false;
/** For the dev page `/ui-sheet.html` only: shows the switch without a key (it still cannot send anything). */
export function previewTournament(): void {
  preview = true;
}

/** True when this build can take part: it has the key. Without it the switch is not shown at all. */
export function tournamentAvailable(): boolean {
  return preview || tournamentKey() !== '';
}

export function subscribeTournament(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** For components: the tournament state, redrawn when it changes. */
export function useTournament(): TournamentState {
  return useSyncExternalStore(subscribeTournament, getTournament, getTournament);
}

/** For the tests: forget the state read from storage. */
export function resetTournamentCache(): void {
  current = null;
}
