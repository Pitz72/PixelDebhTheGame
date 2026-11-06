import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hmacSha256Hex, sha256 } from '../services/hmac';
import {
  QUEUE_KEY,
  QUEUE_MAX,
  TOURNAMENT_URL,
  deleteMyData,
  entryBody,
  flushQueue,
  getNotice,
  getStatus,
  loadQueue,
  makeEntry,
  parseInfo,
  queueEntry,
  reportGame,
  resetTournamentApi,
  sendEntry,
  setFetcher,
  startupCheck,
  versionAtLeast,
  whyNotCounted,
  type Entry,
  type GameResult,
  type TournamentInfo,
} from '../services/tournamentApi';
import { enableTournament, getTournament, resetTournamentCache } from '../services/tournament';
import { setLanguage } from '../services/i18n';

// the tests run without a browser: a plain in-memory localStorage
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

const KEY = 'chiave-di-prova-del-torneo';
const NOW = 1762431840;

const info = (over: Partial<TournamentInfo> = {}): TournamentInfo => ({
  id: 3,
  title: 'Il torneo di PixelDebh',
  starts: NOW - 3600,
  ends: NOW + 86400,
  state: 'aperto',
  minVersion: '',
  difficulty: 'normal',
  loop: true,
  continueAllowed: false,
  page: 'https://www.pixeldebh.it/gioco#torneo',
  ...over,
});

const game = (over: Partial<GameResult> = {}): GameResult => ({
  score: 123450,
  level: 9,
  loop: 1,
  seconds: 1834,
  difficulty: 'normal',
  continued: false,
  practice: false,
  cheats: false,
  endedAt: NOW - 6,
  ...over,
});

/** The site, played by the test: every request is written down and answered by `answer`. */
interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}
let calls: Call[] = [];
let answer: (call: Call) => { status: number; json?: unknown } | 'offline' = () => 'offline';
const statusOpen = (over: Record<string, unknown> = {}) => ({
  status: 200,
  json: {
    ok: true,
    ora: Math.floor(Date.now() / 1000),
    torneo: { id: 3, titolo: 'T', regole: '', inizia: NOW - 3600, finisce: 4102444800, stato: 'aperto', versione_minima: '', difficolta: 'normal', loop: true, continua: false, pagina: '', ...over },
  },
});

beforeEach(() => {
  memory.clear();
  resetTournamentCache();
  resetTournamentApi();
  setLanguage('it');
  vi.stubEnv('VITE_PIXELDEBH_TORNEO_CHIAVE', KEY);
  calls = [];
  answer = () => 'offline';
  setFetcher(async (url, init) => {
    const call: Call = { url, method: String(init.method), headers: (init.headers ?? {}) as Record<string, string>, body: init.body as string | undefined };
    calls.push(call);
    const a = answer(call);
    if (a === 'offline') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(a.json ?? {}), { status: a.status, headers: { 'Content-Type': 'application/json' } });
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  setFetcher(null);
});

describe('the signature', () => {
  it('is the standard HMAC-SHA256', () => {
    expect(hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
    // RFC 4231, case 2
    expect(hmacSha256Hex('Jefe', 'what do ya want for nothing?')).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });

  it('gives the same as Node (that is, as PHP hash_hmac) for any length of text and key, accents included', () => {
    for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 200, 1000]) {
      const text = 'x'.repeat(n);
      expect(Buffer.from(sha256(new TextEncoder().encode(text))).toString('hex')).toBe(createHash('sha256').update(text).digest('hex'));
    }
    for (const key of [KEY, 'k'.repeat(64), 'k'.repeat(100), 'chiave con àccenti €']) {
      const body = JSON.stringify({ sigla: 'DEB', nota: 'però è così' });
      expect(hmacSha256Hex(key, body)).toBe(createHmac('sha256', key).update(body).digest('hex'));
    }
  });

  it('goes in X-Pixeldebh-Firma over the body exactly as sent', async () => {
    enableTournament('DEB', NOW);
    answer = () => ({ status: 200, json: { ok: true, migliorato: true, migliore: 123450, posizione: 4, messaggio: 'Punteggio registrato: sei al posto 4.' } });
    const entry = makeEntry(game(), info(), '1.19.0')!;
    await sendEntry(entry, 0);
    expect(calls).toHaveLength(1);
    const c = calls[0];
    expect(c.url).toBe(`${TOURNAMENT_URL}?azione=invia`);
    expect(TOURNAMENT_URL).toBe('https://www.pixeldebh.it/api/torneo.php');
    expect(c.method).toBe('POST');
    expect(c.headers['Content-Type']).toBe('application/json');
    expect(c.headers['X-Pixeldebh-Firma']).toBe(createHmac('sha256', KEY).update(c.body!).digest('hex'));
  });
});

describe('what is sent', () => {
  it('has the fields of the contract, all numbers whole, the three flags true to the game', () => {
    enableTournament('DEB', NOW);
    const entry = makeEntry(game({ seconds: 1834.9, score: 123450.6 }), info(), '1.19.0')!;
    const body = JSON.parse(entryBody(entry, 0, NOW));
    expect(Object.keys(body).sort()).toEqual(
      ['torneo', 'copia', 'sigla', 'punteggio', 'livello', 'loop', 'durata', 'versione', 'difficolta', 'continuata', 'pratica', 'trucchi', 'consenso', 'giocata', 'inviata'].sort()
    );
    expect(body).toMatchObject({
      torneo: 3,
      copia: getTournament().copy,
      sigla: 'DEB',
      punteggio: 123450,
      livello: 9,
      loop: 1,
      durata: 1834,
      versione: '1.19.0',
      difficolta: 'normal',
      continuata: false,
      pratica: false,
      trucchi: false,
      consenso: true,
      giocata: NOW - 6,
      inviata: NOW,
    });
    for (const k of ['punteggio', 'livello', 'loop', 'durata', 'giocata', 'inviata']) expect(Number.isInteger(body[k]), k).toBe(true);
  });

  it('fixes both times with the site clock (a PC clock an hour behind)', () => {
    enableTournament('DEB', NOW);
    const entry = makeEntry(game(), info(), '1.19.0')!;
    const body = JSON.parse(entryBody(entry, 3600, NOW - 3600));
    expect(body.inviata).toBe(NOW);
    expect(body.giocata).toBe(NOW - 6 + 3600);
  });

  it('needs a code and initials', () => {
    expect(makeEntry(game(), info())).toBeNull();
  });
});

describe('which games count', () => {
  it('a new game on normal, in an open tournament', () => {
    expect(whyNotCounted(game(), info(), '1.19.0')).toBeNull();
    expect(whyNotCounted(game({ loop: 3, level: 14 }), info(), '1.19.0')).toBeNull(); // the LOOP counts
  });

  it('not the others', () => {
    expect(whyNotCounted(game(), null, '1.19.0')).toBe('closed');
    expect(whyNotCounted(game(), info({ state: 'in_arrivo' }), '1.19.0')).toBe('closed');
    expect(whyNotCounted(game({ difficulty: 'hard' }), info(), '1.19.0')).toBe('difficulty');
    expect(whyNotCounted(game({ difficulty: 'easy' }), info(), '1.19.0')).toBe('difficulty');
    expect(whyNotCounted(game({ continued: true }), info(), '1.19.0')).toBe('continued');
    expect(whyNotCounted(game({ practice: true }), info(), '1.19.0')).toBe('practice');
    expect(whyNotCounted(game({ cheats: true }), info(), '1.19.0')).toBe('cheats');
    expect(whyNotCounted(game({ loop: 2 }), info({ loop: false }), '1.19.0')).toBe('loop');
    expect(whyNotCounted(game(), info({ minVersion: '1.20.0' }), '1.19.0')).toBe('version');
    expect(whyNotCounted(game({ score: 0 }), info(), '1.19.0')).toBe('empty');
  });

  it('compares versions number by number', () => {
    expect(versionAtLeast('1.19.0', '1.19.0')).toBe(true);
    expect(versionAtLeast('1.19.0', '1.18.2')).toBe(true);
    expect(versionAtLeast('1.18.10', '1.18.2')).toBe(true);
    expect(versionAtLeast('1.18.2', '1.19.0')).toBe(false);
    expect(versionAtLeast('2.0.0', '1.99.99')).toBe(true);
    expect(versionAtLeast('1.19.0', '')).toBe(true);
    expect(versionAtLeast('1.19', '')).toBe(false);
  });
});

describe('the state of the tournament', () => {
  it('is read defensively', () => {
    const good = { id: 3, titolo: 'T', regole: '', inizia: 1, finisce: 2, stato: 'aperto', versione_minima: '1.19.0', difficolta: 'normal', loop: true, continua: false, pagina: 'p' };
    expect(parseInfo(good)).toMatchObject({ id: 3, starts: 1, ends: 2, state: 'aperto', minVersion: '1.19.0', loop: true, continueAllowed: false });
    expect(parseInfo(null)).toBeNull();
    expect(parseInfo({ ...good, id: '3' })).toBeNull();
    expect(parseInfo({ ...good, stato: 'boh' })).toBeNull();
  });

  it('is asked only with the switch on, and keeps the site clock', async () => {
    answer = () => statusOpen();
    await startupCheck();
    expect(calls).toHaveLength(0);
    enableTournament('DEB', NOW);
    answer = () => ({ ...statusOpen(), json: { ...statusOpen().json, ora: Math.floor(Date.now() / 1000) + 120 } });
    await startupCheck();
    expect(calls.map(c => `${c.method} ${c.url}`)).toEqual([`GET ${TOURNAMENT_URL}?azione=stato`]);
    expect(getStatus()?.info?.id).toBe(3);
    expect(getStatus()?.offset).toBeGreaterThanOrEqual(119);
    expect(getStatus()?.offset).toBeLessThanOrEqual(121);
  });

  it('is never asked in a build without the key', async () => {
    enableTournament('DEB', NOW);
    vi.stubEnv('VITE_PIXELDEBH_TORNEO_CHIAVE', '');
    await startupCheck();
    await reportGame(game());
    expect(calls).toHaveLength(0);
  });
});

describe('the answers of the site', () => {
  beforeEach(() => enableTournament('DEB', NOW));
  const entry = (): Entry => makeEntry(game(), info(), '1.19.0')!;

  it('a better score: its place, in the site words (Italian) or ours (English)', async () => {
    answer = () => ({ status: 200, json: { ok: true, migliorato: true, migliore: 123450, posizione: 4, messaggio: 'Punteggio registrato: sei al posto 4.' } });
    expect(await sendEntry(entry())).toMatchObject({ kind: 'ok', better: true, position: 4, message: 'Punteggio registrato: sei al posto 4.' });
    setLanguage('en');
    expect((await sendEntry(entry())).message).toBe('Tournament: score recorded, you are in position 4.');
  });

  it('not better: the record stays', async () => {
    setLanguage('en');
    answer = () => ({ status: 200, json: { ok: true, migliorato: false, migliore: 200000, posizione: 2, messaggio: '…' } });
    expect(await sendEntry(entry())).toMatchObject({ kind: 'ok', better: false, best: 200000, message: 'Tournament: your record stays at 200,000 points.' });
  });

  it('a refusal keeps its code; English comes from the code', async () => {
    setLanguage('en');
    for (const [http, code, text] of [
      [403, 'firma', 'update the game'],
      [409, 'versione', 'newer version'],
      [409, 'chiuso', 'is over'],
      [404, 'torneo', 'no longer open'],
      [400, 'numeri', 'did not accept'],
    ] as const) {
      answer = () => ({ status: http, json: { ok: false, errore: code, messaggio: 'in italiano' } });
      const out = await sendEntry(entry());
      expect(out.kind, code).toBe('refused');
      if (out.kind === 'refused') expect(out.code).toBe(code);
      expect(out.message, code).toContain(text);
    }
  });

  it('no network, too many requests, a site that cannot save: try again later', async () => {
    for (const a of ['offline', { status: 429 }, { status: 503, json: { ok: false, errore: 'servizio' } }] as const) {
      answer = () => a;
      expect((await sendEntry(entry())).kind).toBe('retry');
    }
  });
});

describe('a game that ends', () => {
  it('with the switch off sends nothing', async () => {
    answer = () => statusOpen();
    expect(await reportGame(game())).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('counts: asks the state, sends it signed, and says how it went', async () => {
    enableTournament('DEB', NOW);
    answer = c => (c.method === 'GET' ? statusOpen() : { status: 200, json: { ok: true, migliorato: true, migliore: 123450, posizione: 1, messaggio: 'Punteggio registrato: sei al posto 1.' } });
    const out = await reportGame(game({ endedAt: Math.floor(Date.now() / 1000) }));
    expect(out?.kind).toBe('ok');
    expect(calls.map(c => c.method)).toEqual(['GET', 'POST']);
    expect(JSON.parse(calls[1].body!)).toMatchObject({ torneo: 3, sigla: 'DEB', punteggio: 123450, consenso: true });
    expect(getNotice()?.text).toBe('Punteggio registrato: sei al posto 1.');
  });

  it('on hard, or taken up with Continue, is not sent and the player is told why', async () => {
    enableTournament('DEB', NOW);
    answer = () => statusOpen();
    await reportGame(game({ difficulty: 'hard' }));
    expect(getNotice()?.text).toContain('difficoltà normale');
    await reportGame(game({ continued: true }));
    expect(getNotice()?.text).toContain('CONTINUA');
    await reportGame(game({ practice: true }));
    await reportGame(game({ cheats: true }));
    expect(calls.every(c => c.method === 'GET')).toBe(true);
  });

  it('without a network is put aside, and goes at the next start while the tournament is open', async () => {
    enableTournament('DEB', NOW);
    answer = c => (c.method === 'GET' ? statusOpen() : 'offline');
    await startupCheck(); // the state arrives
    answer = () => 'offline';
    const out = await reportGame(game({ endedAt: Math.floor(Date.now() / 1000) }));
    expect(out?.kind).toBe('retry');
    expect(loadQueue()).toHaveLength(1);
    expect(getNotice()?.text).toContain('prossimo avvio');

    // next start, with the network back
    calls = [];
    answer = c => (c.method === 'GET' ? statusOpen() : { status: 200, json: { ok: true, migliorato: true, migliore: 123450, posizione: 2 } });
    await startupCheck();
    expect(calls.map(c => c.method)).toEqual(['GET', 'POST']);
    expect(loadQueue()).toHaveLength(0);
    expect(memory.has(QUEUE_KEY)).toBe(false);
  });

  it('put aside for a tournament that is over is thrown away, not sent', async () => {
    enableTournament('DEB', NOW);
    queueEntry(makeEntry(game(), info({ id: 2 }), '1.19.0')!);
    answer = () => statusOpen(); // tournament 3 is the open one now
    await startupCheck();
    expect(calls.map(c => c.method)).toEqual(['GET']);
    expect(loadQueue()).toHaveLength(0);
    queueEntry(makeEntry(game(), info(), '1.19.0')!);
    expect(await flushQueue(null)).toBeNull();
    expect(loadQueue()).toHaveLength(0);
  });

  it('the queue keeps the best ones when it is full', () => {
    enableTournament('DEB', NOW);
    for (let i = 1; i <= QUEUE_MAX + 3; i++) queueEntry(makeEntry(game({ score: i * 100 }), info(), '1.19.0')!);
    const kept = loadQueue();
    expect(kept).toHaveLength(QUEUE_MAX);
    expect(Math.min(...kept.map(e => e.punteggio))).toBe(400);
  });
});

describe('deleting my data', () => {
  it('asks the site (signed), then forgets the code and turns the switch off', async () => {
    enableTournament('DEB', NOW);
    const copy = getTournament().copy;
    queueEntry(makeEntry(game(), info(), '1.19.0')!);
    answer = () => ({ status: 200, json: { ok: true, cancellate: 2, messaggio: 'Fatto: il sito non ha più nessun dato di questa copia del gioco.' } });
    const out = await deleteMyData();
    expect(out.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${TOURNAMENT_URL}?azione=cancella`);
    expect(JSON.parse(calls[0].body!)).toEqual({ copia: copy });
    expect(calls[0].headers['X-Pixeldebh-Firma']).toBe(createHmac('sha256', KEY).update(calls[0].body!).digest('hex'));
    expect(getTournament()).toMatchObject({ enabled: false, copy: '', initials: 'DEB' });
    expect(loadQueue()).toHaveLength(0);
    // the next time the switch goes on, a new code
    enableTournament('DEB', NOW);
    expect(getTournament().copy).not.toBe(copy);
  });

  it('without a network changes nothing (the data would stay on the site with no way to reach it)', async () => {
    enableTournament('DEB', NOW);
    const before = getTournament();
    answer = () => 'offline';
    const out = await deleteMyData();
    expect(out.ok).toBe(false);
    expect(getTournament()).toEqual(before);
  });
});

describe('the app', () => {
  it('may talk to www.pixeldebh.it (Content-Security-Policy) and to nothing else new', () => {
    const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf-8'));
    const connect = (conf.app.security.csp as string).split(';').map(s => s.trim()).find(s => s.startsWith('connect-src'))!;
    expect(connect.split(/\s+/)).toEqual(['connect-src', "'self'", 'ipc:', 'http://ipc.localhost', 'https://www.pixeldebh.it']);
  });

  it('marks a game as cheated when the test probe or a developer key changed it', () => {
    const src = readFileSync('GameScreen.tsx', 'utf-8');
    for (const probe of ['load:', 'warp:', 'bossHp:']) {
      const at = src.indexOf(probe);
      expect(at, probe).toBeGreaterThan(0);
      expect(src.slice(at, at + 160), probe).toContain('cheatedRef.current = true');
    }
    expect(src).toMatch(/if \(e\.key === '9' \|\| k === 'l' \|\| e\.key === '0'\) cheatedRef\.current = true;/);
  });
});
