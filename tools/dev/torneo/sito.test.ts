/**
 * The game's real tournament client (services/tournamentApi.ts) against the site's ISOLATED test runtime, the
 * contract of docs/TORNEO-API.md in the site's project checked from this side. The tests run in order and
 * leave the runtime empty (the last one deletes the copy).
 *
 *   TORNEO_PROVA_STATO=<the JSON printed by prepara.php apri> [TORNEO_PROVA_URL=http://127.0.0.1:8125/api/torneo.php] \
 *     npx vitest run --config tools/dev/torneo/vitest.config.ts
 *
 * The tournament must be open with no games in it and its minimum version at most this game's (`prepara.php apri`).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';

const statoFile = process.env.TORNEO_PROVA_STATO;
if (!statoFile) throw new Error('TORNEO_PROVA_STATO: the file with what prepara.php printed');
const site = JSON.parse(readFileSync(statoFile, 'utf-8')) as { id: number; chiave: string; versione_minima: string };
const BASE = process.env.TORNEO_PROVA_URL || 'http://127.0.0.1:8125/api/torneo.php';

const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

// the address is read when the module loads: set it first
vi.stubEnv('VITE_PIXELDEBH_TORNEO_URL', BASE);
vi.stubEnv('VITE_PIXELDEBH_TORNEO_CHIAVE', site.chiave);
const api = await import('../../../services/tournamentApi');
const tour = await import('../../../services/tournament');
const i18n = await import('../../../services/i18n');

const now = () => Math.floor(Date.now() / 1000);
const game = (over: Record<string, unknown> = {}) => ({
  score: 48000, level: 6, loop: 1, seconds: 1200, difficulty: 'normal', continued: false, practice: false, cheats: false, endedAt: now(), ...over,
});
const board = async () =>
  (await (await fetch(`${BASE}?azione=classifica`)).json()) as { classifica: { sigla: string; punteggio: number; livello: number; giro: number }[] };

beforeAll(() => {
  i18n.setLanguage('it');
  tour.enableTournament('DEB');
});

describe('the game against the site (isolated runtime)', () => {
  it('reads the open tournament, and the site clock', async () => {
    expect(api.TOURNAMENT_URL).toBe(BASE);
    await api.startupCheck();
    const s = api.getStatus();
    expect(s?.info).toMatchObject({ id: site.id, state: 'aperto', difficulty: 'normal' });
    expect(Math.abs(s!.offset)).toBeLessThanOrEqual(2);
  });

  it('sends a game that counts: recorded, first place, in the site words', async () => {
    const out = await api.reportGame(game());
    expect(out).toMatchObject({ kind: 'ok', better: true, position: 1, best: 48000 });
    expect(api.getNotice()?.text).toBe('Punteggio registrato: sei al posto 1.');
  });

  it('a lower one: the record stays (and in English, our sentence)', async () => {
    expect(await api.reportGame(game({ score: 30000 }))).toMatchObject({ kind: 'ok', better: false, best: 48000 });
    i18n.setLanguage('en');
    expect((await api.reportGame(game({ score: 31000 })))?.message).toBe('Tournament: your record stays at 48,000 points.');
    i18n.setLanguage('it');
  });

  it('a PC clock two hours ahead: fixed with the site clock, accepted; without the fix, refused', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 2 * 3600 * 1000);
    await api.refreshStatus();
    expect(api.getStatus()!.offset).toBeLessThan(-7000);
    expect(await api.reportGame(game({ score: 52000 }))).toMatchObject({ kind: 'ok', better: true, best: 52000 });
    const raw = await api.sendEntry(api.makeEntry(game({ score: 53000 }), api.getStatus()!.info!)!, 0);
    expect(raw).toMatchObject({ kind: 'refused', code: 'chiuso' });
    vi.useRealTimers();
    await api.refreshStatus();
  });

  it('refuses what does not count, with its codes (the game would not even send these)', async () => {
    const info = api.getStatus()!.info!;
    const send = (over: Record<string, unknown>, version?: string) => api.sendEntry(api.makeEntry(game(over), info, version)!);
    expect(await send({ difficulty: 'hard' })).toMatchObject({ kind: 'refused', code: 'regole' });
    expect(await send({ continued: true })).toMatchObject({ kind: 'refused', code: 'regole' });
    expect(await send({ practice: true })).toMatchObject({ kind: 'refused', code: 'regole' });
    expect(await send({ cheats: true })).toMatchObject({ kind: 'refused', code: 'regole' });
    expect(await send({ level: 14, loop: 3, seconds: 30, score: 900000 })).toMatchObject({ kind: 'refused', code: 'numeri' });
    expect(await send({ score: 9_000_000, seconds: 60 })).toMatchObject({ kind: 'refused', code: 'numeri' });
    if (site.versione_minima) expect(await send({}, '0.0.1')).toMatchObject({ kind: 'refused', code: 'versione' });
  });

  it('a wrong key: refused for the signature', async () => {
    vi.stubEnv('VITE_PIXELDEBH_TORNEO_CHIAVE', 'f'.repeat(64));
    const out = await api.sendEntry(api.makeEntry(game(), api.getStatus()!.info!)!);
    vi.stubEnv('VITE_PIXELDEBH_TORNEO_CHIAVE', site.chiave);
    expect(out).toMatchObject({ kind: 'refused', code: 'firma' });
  });

  it('a result put aside goes at the next start', async () => {
    api.queueEntry(api.makeEntry(game({ score: 61000, level: 9 }), api.getStatus()!.info!)!);
    await api.startupCheck();
    expect(api.loadQueue()).toHaveLength(0);
    expect(api.getNotice()?.text).toBe('Punteggio registrato: sei al posto 1.');
  });

  it('the public leaderboard shows DEB with the best score', async () => {
    expect((await board()).classifica[0]).toMatchObject({ sigla: 'DEB', punteggio: 61000, livello: 9, giro: 1 });
  });

  it('deleting my data: the site forgets this copy, the switch goes off', async () => {
    const out = await api.deleteMyData();
    expect(out).toMatchObject({ ok: true, message: 'Fatto: il sito non ha più nessun dato di questa copia del gioco.' });
    expect(tour.getTournament()).toMatchObject({ enabled: false, copy: '' });
    expect((await board()).classifica).toHaveLength(0);
  });
});
