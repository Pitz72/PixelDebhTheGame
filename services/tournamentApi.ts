/**
 * How the game talks to the tournament of www.pixeldebh.it (the contract: `docs/TORNEO-API.md` in the site's project;
 * the plan: `docs/TORNEO.md` here). Nothing here runs unless the build has the tournament key and the player turned
 * the switch on (services/tournament.ts).
 *
 * - At start (title screen): `GET ?azione=stato`, for the notice on the title and for the site's clock; then whatever
 *   was put aside without a network is tried again, as long as its tournament is still open.
 * - At the end of a game (game over, score banked after a win, leaving from the pause menu), if the tournament is open
 *   and the game counts: `POST ?azione=invia`, signed. A game counts only on its normal difficulty, started with New
 *   Game (not Continue, not the level select), without the test cheats; the three flags go out with their true values.
 * - Options, "Delete my data": `POST ?azione=cancella`; then the code of the copy goes and the switch is off.
 *
 * Every POST carries `X-Pixeldebh-Firma`: HMAC-SHA256 of the body exactly as sent, with the key, in lowercase hex.
 */
import { useSyncExternalStore } from 'react';
import * as storage from './storage';
import { getLanguage, t } from './i18n';
import { hmacSha256Hex } from './hmac';
import { forgetCopy, getTournament, tournamentAvailable, tournamentKey, validCopy, validInitials } from './tournament';
import type { TextKey } from '../locales/it';

/** The site's address for the game; a test build may point it elsewhere (the site's development server). */
export const TOURNAMENT_URL: string = (() => {
  const custom = import.meta.env.VITE_PIXELDEBH_TORNEO_URL;
  return typeof custom === 'string' && custom.trim() !== '' ? custom.trim() : 'https://www.pixeldebh.it/api/torneo.php';
})();
export const QUEUE_KEY = 'pixelDebhTournamentQueue';
/** How many results wait for the network at most (the lowest go first). */
export const QUEUE_MAX = 10;
const TIMEOUT_MS = 10000;

export interface TournamentInfo {
  id: number;
  title: string;
  /** Unix seconds (UTC). */
  starts: number;
  ends: number;
  state: 'in_arrivo' | 'aperto' | 'chiuso';
  minVersion: string;
  difficulty: string;
  loop: boolean;
  continueAllowed: boolean;
  page: string;
}

export interface StatusSnapshot {
  /** The open or coming tournament, or null when there is none. */
  info: TournamentInfo | null;
  /** The site's clock minus this computer's, in seconds (to send the right times when the PC clock is off). */
  offset: number;
}

/** A game as the App knows it when it ends. */
export interface GameResult {
  score: number;
  /** The level reached, 1-14. */
  level: number;
  /** The LOOP as the HUD shows it: 1 is the first round. */
  loop: number;
  /** Seconds of play, pauses left out. */
  seconds: number;
  difficulty: string;
  /** Started from "Continue". */
  continued: boolean;
  /** Started from the level select. */
  practice: boolean;
  /** God mode, the developer keys or the test probe were used. */
  cheats: boolean;
  /** When it ended, Unix seconds by this computer's clock. */
  endedAt: number;
}

/** What goes to `?azione=invia`, without `inviata` (added, with the clock fixed, the moment it is sent). */
export interface Entry {
  torneo: number;
  copia: string;
  sigla: string;
  punteggio: number;
  livello: number;
  loop: number;
  durata: number;
  versione: string;
  difficolta: string;
  continuata: boolean;
  pratica: boolean;
  trucchi: boolean;
  consenso: true;
  /** By this computer's clock; fixed with the site's offset when sent. */
  giocata: number;
}

export type Outcome =
  | { kind: 'ok'; better: boolean; best: number; position: number; message: string }
  /** No network, too many requests, or the site could not save: try again later. */
  | { kind: 'retry'; message: string }
  /** The site said no: `code` is its `errore`. */
  | { kind: 'refused'; code: string; message: string };

export interface Notice {
  id: number;
  text: string;
  tone: 'good' | 'info' | 'bad';
}

/* ------------------------------------------------------------------ the state the screens show -- */

let status: StatusSnapshot | null = null;
let notice: Notice | null = null;
let noticeId = 0;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getStatus = (): StatusSnapshot | null => status;
export const getNotice = (): Notice | null => notice;
/** For the title: the last answer of `?azione=stato` (null until one arrives). */
export const useTournamentStatus = (): StatusSnapshot | null => useSyncExternalStore(subscribe, getStatus, getStatus);
/** For the App: the last message about the tournament (shown for a few seconds). */
export const useTournamentNotice = (): Notice | null => useSyncExternalStore(subscribe, getNotice, getNotice);

export function showNotice(text: string, tone: Notice['tone']): void {
  notice = { id: ++noticeId, text, tone };
  emit();
}
export function clearNotice(id: number): void {
  if (notice?.id !== id) return;
  notice = null;
  emit();
}

/* ------------------------------------------------------------------------------- small helpers -- */

/** True when the game may talk to the site: a build with the key, and the switch on. */
export const active = (): boolean => tournamentAvailable() && getTournament().enabled;

const nowSeconds = () => Math.floor(Date.now() / 1000);
const int = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));

/** "1.19.0" >= "1.18.2"? A missing minimum is always met; a version written badly never is. */
export function versionAtLeast(version: string, minimum: string): boolean {
  const parse = (v: string) => (/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v) ? v.split('.').map(Number) : null);
  const v = parse(version);
  if (!v) return false;
  if (minimum.trim() === '') return true;
  const m = parse(minimum.trim());
  if (!m) return true; // the site checks it too; a minimum it wrote badly is its problem
  for (let i = 0; i < 3; i++) if (v[i] !== m[i]) return v[i] > m[i];
  return true;
}

export const gameVersion = (): string => (typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0');

/** Reads the `torneo` of `?azione=stato` defensively: null when it is not there or not usable. */
export function parseInfo(raw: unknown): TournamentInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null);
  const id = num(r.id);
  const starts = num(r.inizia);
  const ends = num(r.finisce);
  const state = r.stato === 'in_arrivo' || r.stato === 'aperto' || r.stato === 'chiuso' ? r.stato : null;
  if (id === null || starts === null || ends === null || state === null) return null;
  return {
    id,
    title: typeof r.titolo === 'string' ? r.titolo : '',
    starts,
    ends,
    state,
    minVersion: typeof r.versione_minima === 'string' ? r.versione_minima : '',
    difficulty: typeof r.difficolta === 'string' ? r.difficolta : 'normal',
    loop: r.loop !== false,
    continueAllowed: r.continua === true,
    page: typeof r.pagina === 'string' ? r.pagina : '',
  };
}

/** Why a game does not count for this tournament, or null when it does. */
export type NotCounted = 'closed' | 'version' | 'difficulty' | 'continued' | 'practice' | 'cheats' | 'loop' | 'empty';
export function whyNotCounted(game: GameResult, info: TournamentInfo | null, version: string = gameVersion()): NotCounted | null {
  if (!info || info.state !== 'aperto') return 'closed';
  if (game.practice) return 'practice';
  if (game.cheats) return 'cheats';
  if (game.continued && !info.continueAllowed) return 'continued';
  if (game.difficulty !== info.difficulty) return 'difficulty';
  if (game.loop > 1 && !info.loop) return 'loop';
  if (!versionAtLeast(version, info.minVersion)) return 'version';
  if (game.score <= 0 || game.seconds < 1) return 'empty';
  return null;
}

/** The body for `?azione=invia`, from a game that counts. Null when the copy has no code or initials. */
export function makeEntry(game: GameResult, info: TournamentInfo, version: string = gameVersion()): Entry | null {
  const me = getTournament();
  if (!validCopy(me.copy) || !validInitials(me.initials)) return null;
  return {
    torneo: info.id,
    copia: me.copy,
    sigla: me.initials,
    punteggio: int(game.score),
    livello: Math.min(14, Math.max(1, int(game.level))),
    loop: Math.max(1, int(game.loop)),
    durata: int(game.seconds),
    versione: version,
    difficolta: game.difficulty,
    continuata: game.continued,
    pratica: game.practice,
    trucchi: game.cheats,
    consenso: true,
    giocata: int(game.endedAt),
  };
}

/** The exact text that is sent and signed: the entry with both times fixed by the site's clock. */
export function entryBody(entry: Entry, offset: number, now: number = nowSeconds()): string {
  return JSON.stringify({ ...entry, giocata: int(entry.giocata + offset), inviata: int(now + offset) });
}

/* --------------------------------------------------------------------------------- the network -- */

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
let fetcher: Fetcher = (url, init) => fetch(url, init);
/** For the tests: answer the requests without a network. */
export function setFetcher(f: Fetcher | null): void {
  fetcher = f ?? ((url, init) => fetch(url, init));
}

/** One request; `null` when the site could not be reached at all. */
async function request(method: 'GET' | 'POST', action: string, body?: string): Promise<{ http: number; json: Record<string, unknown> } | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-Pixeldebh-Firma'] = hmacSha256Hex(tournamentKey(), body);
    }
    const res = await fetcher(`${TOURNAMENT_URL}?azione=${action}`, { method, headers, body, signal: controller?.signal, cache: 'no-store' });
    let json: Record<string, unknown> = {};
    try {
      const parsed: unknown = await res.json();
      if (parsed && typeof parsed === 'object') json = parsed as Record<string, unknown>;
    } catch {
      // not JSON (a proxy page, say): the status code still tells something
    }
    return { http: res.status, json };
  } catch (error) {
    console.warn('Tournament: the site could not be reached:', error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The site's sentence in Italian, or ours in the player's language (the site writes only Italian). */
function message(key: TextKey, site: unknown, vars?: Record<string, string | number>): string {
  if (getLanguage() === 'it' && typeof site === 'string' && site.trim() !== '' && site.length <= 240) return site.trim();
  return t(key, vars);
}

const REFUSED_TEXT: Record<string, TextKey> = {
  firma: 'tournament.err.firma',
  versione: 'tournament.err.versione',
  chiuso: 'tournament.err.chiuso',
  torneo: 'tournament.err.torneo',
  regole: 'tournament.err.regole',
  consenso: 'tournament.err.consenso',
  dati: 'tournament.err.dati',
  numeri: 'tournament.err.dati',
};

/** Asks the site whether there is a tournament. Keeps the last good answer when the site cannot be reached. */
export async function refreshStatus(): Promise<StatusSnapshot | null> {
  if (!active()) return status;
  const asked = nowSeconds();
  const r = await request('GET', 'stato');
  if (!r || r.http !== 200 || r.json.ok !== true) return status;
  const ora = typeof r.json.ora === 'number' && Number.isInteger(r.json.ora) ? r.json.ora : asked;
  status = { info: parseInfo(r.json.torneo), offset: ora - asked };
  emit();
  return status;
}

/** Sends one entry, signed. */
export async function sendEntry(entry: Entry, offset: number = status?.offset ?? 0): Promise<Outcome> {
  const r = await request('POST', 'invia', entryBody(entry, offset));
  if (!r || r.http === 429 || r.http >= 500 || r.json.errore === 'servizio') return { kind: 'retry', message: t('tournament.queued') };
  if (r.json.ok === true) {
    const position = typeof r.json.posizione === 'number' ? r.json.posizione : 0;
    const best = typeof r.json.migliore === 'number' ? r.json.migliore : entry.punteggio;
    const better = r.json.migliorato === true;
    const points = best.toLocaleString(getLanguage() === 'it' ? 'it-IT' : 'en-GB');
    return {
      kind: 'ok',
      better,
      best,
      position,
      message: better ? message('tournament.sent', r.json.messaggio, { pos: position }) : message('tournament.notBetter', r.json.messaggio, { points }),
    };
  }
  const code = typeof r.json.errore === 'string' ? r.json.errore : 'dati';
  return { kind: 'refused', code, message: message(REFUSED_TEXT[code] ?? 'tournament.err.dati', r.json.messaggio) };
}

/* ------------------------------------------------------------------- the results put aside -- */

const validEntry = (e: unknown): e is Entry => {
  if (!e || typeof e !== 'object') return false;
  const r = e as Record<string, unknown>;
  return (
    typeof r.torneo === 'number' && validCopy(r.copia) && validInitials(r.sigla) && typeof r.punteggio === 'number' &&
    typeof r.livello === 'number' && typeof r.loop === 'number' && typeof r.durata === 'number' && typeof r.versione === 'string' &&
    typeof r.difficolta === 'string' && typeof r.continuata === 'boolean' && typeof r.pratica === 'boolean' &&
    typeof r.trucchi === 'boolean' && r.consenso === true && typeof r.giocata === 'number'
  );
};

export function loadQueue(): Entry[] {
  try {
    const raw: unknown = JSON.parse(storage.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter(validEntry).slice(0, QUEUE_MAX) : [];
  } catch {
    return [];
  }
}

function saveQueue(entries: Entry[]): void {
  if (entries.length === 0) storage.removeItem(QUEUE_KEY);
  else storage.setItem(QUEUE_KEY, JSON.stringify(entries));
}

/** Puts a result aside for the next start; when the queue is full the lowest scores make room. */
export function queueEntry(entry: Entry): void {
  const all = [...loadQueue(), entry].sort((a, b) => b.punteggio - a.punteggio).slice(0, QUEUE_MAX);
  saveQueue(all);
}

/**
 * Tries again what was put aside: only the results of the tournament open now (the others are thrown away). Stops
 * at the first one that cannot reach the site, keeping it and the rest for later.
 */
export async function flushQueue(info: TournamentInfo | null = status?.info ?? null): Promise<Outcome | null> {
  let waiting = loadQueue();
  if (waiting.length === 0) return null;
  if (!info || info.state !== 'aperto') {
    saveQueue([]);
    return null;
  }
  waiting = waiting.filter(e => e.torneo === info.id && e.copia === getTournament().copy);
  let last: Outcome | null = null;
  while (waiting.length > 0) {
    const outcome = await sendEntry(waiting[0]);
    if (outcome.kind === 'retry') break;
    waiting = waiting.slice(1);
    last = outcome;
  }
  saveQueue(waiting);
  return last;
}

/* -------------------------------------------------------------------------- what the App calls -- */

let chain: Promise<unknown> = Promise.resolve();
/** One conversation with the site at a time (a game can end while the start-up check is still running). */
function serial<T>(job: () => Promise<T>): Promise<T> {
  const next = chain.then(job, job);
  chain = next.catch(() => undefined);
  return next;
}

const tone = (o: Outcome): Notice['tone'] => (o.kind === 'ok' ? 'good' : o.kind === 'retry' ? 'info' : 'bad');

/** At start (the title screen): the state of the tournament, then the results put aside. */
export function startupCheck(): Promise<void> {
  return serial(async () => {
    if (!active()) return;
    const snap = await refreshStatus();
    if (!snap) return; // no network: the queue waits for the next start
    const last = await flushQueue(snap.info);
    if (last) showNotice(last.message, tone(last));
  });
}

/** At the end of a game: sends it if the tournament is open and the game counts (or puts it aside without a network). */
export function reportGame(game: GameResult): Promise<Outcome | null> {
  return serial(async () => {
    if (!active()) return null;
    const snap = (await refreshStatus()) ?? status;
    const info = snap?.info ?? null;
    const why = whyNotCounted(game, info);
    if (why === 'difficulty') showNotice(t('tournament.not.difficulty'), 'info');
    else if (why === 'continued') showNotice(t('tournament.not.continued'), 'info');
    else if (why === 'version') showNotice(t('tournament.err.versione'), 'bad');
    if (why !== null || !info) return null;
    const entry = makeEntry(game, info);
    if (!entry) return null;
    const outcome = await sendEntry(entry, snap?.offset ?? 0);
    if (outcome.kind === 'retry') queueEntry(entry);
    if (outcome.kind === 'refused' && outcome.code === 'torneo') void refreshStatus();
    showNotice(outcome.message, tone(outcome));
    return outcome;
  });
}

/** Options, "Delete my data from the tournament": the site forgets this copy, then the code goes and the switch is off. */
export function deleteMyData(): Promise<{ ok: boolean; message: string }> {
  return serial(async () => {
    const copy = getTournament().copy;
    if (!tournamentAvailable() || !validCopy(copy)) return { ok: false, message: t('tournament.delete.none') };
    const r = await request('POST', 'cancella', JSON.stringify({ copia: copy }));
    if (!r) return { ok: false, message: t('tournament.delete.offline') };
    if (r.json.ok !== true) {
      const code = typeof r.json.errore === 'string' ? r.json.errore : 'dati';
      if (r.http === 429 || r.http >= 500) return { ok: false, message: t('tournament.delete.offline') };
      return { ok: false, message: message(REFUSED_TEXT[code] ?? 'tournament.err.dati', r.json.messaggio) };
    }
    forgetCopy();
    saveQueue([]);
    status = null;
    emit();
    return { ok: true, message: message('tournament.delete.done', r.json.messaggio) };
  });
}

/** For the tests: forget what this session knows. */
export function resetTournamentApi(): void {
  status = null;
  notice = null;
  chain = Promise.resolve();
  emit();
}
