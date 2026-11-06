import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  LAST_INITIALS_KEY,
  PRIVACY_URL,
  TOURNAMENT_KEY,
  defaultTournament,
  disableTournament,
  enableTournament,
  getTournament,
  newCopyCode,
  parseTournament,
  proposedInitials,
  resetTournamentCache,
  tournamentAvailable,
  validCopy,
} from '../services/tournament';
import { addHighscore } from '../services/highscoreService';
import { HIGHSCORE_KEY } from '../constants';
import { rowsFor } from '../components/OptionsScreen';
import { defaultSettings } from '../services/settings';
import { it as italian } from '../locales/it';
import { en } from '../locales/en';
import * as storage from '../services/storage';

// the tests run without a browser: a plain in-memory localStorage
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

const KEY_VAR = 'VITE_PIXELDEBH_TORNEO_CHIAVE';

beforeEach(() => {
  memory.clear();
  resetTournamentCache();
});
afterEach(() => vi.unstubAllEnvs());

describe('the code of the copy', () => {
  it('is 16 random bytes written as 32 lowercase hex characters', () => {
    const fixed = newCopyCode(b => b.map((_, i) => (i * 17 + 5) & 0xff));
    expect(fixed).toBe('05162738495a6b7c8d9eafc0d1e2f304');
    const a = newCopyCode();
    const b = newCopyCode();
    expect(validCopy(a)).toBe(true);
    expect(validCopy(b)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('is made the first time the switch goes on, and kept after that (also when it goes off and on again)', () => {
    expect(getTournament().copy).toBe('');
    expect(enableTournament('DEB', 1762431834)).toBe(true);
    const first = getTournament().copy;
    expect(validCopy(first)).toBe(true);
    disableTournament();
    expect(getTournament()).toMatchObject({ enabled: false, copy: first, initials: 'DEB' });
    enableTournament('SIM', 1762431900);
    expect(getTournament()).toMatchObject({ enabled: true, copy: first, initials: 'SIM', consentAt: 1762431900 });
  });

  it('is saved with the rest (save.json in the app) and read back after a restart', () => {
    enableTournament('DEB', 1762431834);
    const saved = getTournament();
    resetTournamentCache();
    expect(JSON.parse(storage.getItem(TOURNAMENT_KEY)!)).toEqual(saved);
    expect(getTournament()).toEqual(saved);
  });
});

describe('the switch', () => {
  it('is off until the player turns it on', () => {
    expect(getTournament()).toEqual(defaultTournament());
    expect(getTournament().enabled).toBe(false);
  });

  it('only takes three letters A-Z', () => {
    for (const bad of ['', 'DE', 'DEBH', 'deb', 'D3B', 'DÈB', 'D B']) {
      expect(enableTournament(bad), bad).toBe(false);
    }
    expect(getTournament().enabled).toBe(false);
    expect(storage.getItem(TOURNAMENT_KEY)).toBeNull();
  });

  it('reads a saved value defensively: anything odd means off', () => {
    const good = { enabled: true, initials: 'DEB', copy: '9f86d081884c7d659a2feaa0c55ad015', consentAt: 1762431834 };
    expect(parseTournament(JSON.stringify(good))).toEqual(good);
    expect(parseTournament(null)).toEqual(defaultTournament());
    expect(parseTournament('{not json')).toEqual(defaultTournament());
    // on without a code, without initials or without the yes is not on
    expect(parseTournament(JSON.stringify({ ...good, copy: 'XYZ' })).enabled).toBe(false);
    expect(parseTournament(JSON.stringify({ ...good, copy: good.copy.toUpperCase() })).enabled).toBe(false);
    expect(parseTournament(JSON.stringify({ ...good, initials: 'de' })).enabled).toBe(false);
    expect(parseTournament(JSON.stringify({ ...good, consentAt: 0 })).enabled).toBe(false);
    expect(parseTournament(JSON.stringify({ ...good, enabled: 'yes' })).enabled).toBe(false);
  });
});

describe('the initials it proposes', () => {
  it('are the tournament ones, else the last written in the high scores, else the best entry, else AAA', () => {
    expect(proposedInitials()).toBe('AAA');
    memory.set(HIGHSCORE_KEY, JSON.stringify([{ name: 'AAA', score: 0 }, { name: 'ZOE', score: 500 }, { name: 'MAX', score: 900 }]));
    expect(proposedInitials()).toBe('MAX');
    addHighscore('LUC', 100);
    expect(memory.get(LAST_INITIALS_KEY)).toBe('LUC');
    expect(proposedInitials()).toBe('LUC');
    enableTournament('DEB');
    expect(proposedInitials()).toBe('DEB');
  });

  it('survive a broken high-score table', () => {
    memory.set(HIGHSCORE_KEY, '{oops');
    expect(proposedInitials()).toBe('AAA');
  });
});

describe('a build without the tournament key', () => {
  const gameRows = () =>
    rowsFor('game', defaultSettings(), 'it', () => undefined, { state: getTournament(), openConsent: () => undefined }).map(r => r.id);

  it('has no switch at all (development builds; the key is a GitHub secret given to the release build)', () => {
    vi.stubEnv(KEY_VAR, '');
    expect(tournamentAvailable()).toBe(false);
    expect(gameRows()).toEqual(['difficulty', 'guide']);
  });

  it('with the key, shows the switch and the link to the privacy notice in the GAME tab', () => {
    vi.stubEnv(KEY_VAR, 'una-chiave-di-prova');
    expect(tournamentAvailable()).toBe(true);
    expect(gameRows()).toEqual(['difficulty', 'guide', 'tournament', 'tournamentPrivacy']);
  });

  it('asks before turning on, and turns off at once', () => {
    vi.stubEnv(KEY_VAR, 'una-chiave-di-prova');
    let asked = 0;
    const row = (state = getTournament()) =>
      rowsFor('game', defaultSettings(), 'it', () => undefined, { state, openConsent: () => asked++ }).find(r => r.id === 'tournament');
    const off = row();
    if (off?.kind !== 'toggle') throw new Error('no switch');
    off.set(true);
    expect(asked).toBe(1);
    expect(getTournament().enabled).toBe(false); // only the consent screen turns it on
    enableTournament('DEB');
    const on = row();
    if (on?.kind !== 'toggle') throw new Error('no switch');
    expect(on.value).toBe(true);
    expect(on.help).toContain('DEB');
    on.set(false);
    expect(getTournament().enabled).toBe(false);
    expect(asked).toBe(1);
  });
});

describe('the texts', () => {
  it('name the switch as the plan says, in both languages', () => {
    expect(italian['options.game.tournament']).toBe('PARTECIPA AI TORNEI DI PIXELDEBH');
    expect(en['options.game.tournament']).toBe('TAKE PART IN PIXELDEBH TOURNAMENTS');
    expect(italian['tournament.age']).toBe('HO ALMENO 14 ANNI');
    expect(en['tournament.age']).toBe('I AM AT LEAST 14');
  });

  it('point to the privacy notice of the site', () => {
    expect(PRIVACY_URL).toBe('https://www.pixeldebh.it/privacy');
  });

  it('never put the key in the repository', () => {
    // the key comes from the environment at build time; no file of the game may hold a value for it
    for (const file of ['services/tournament.ts', 'vite-env.d.ts', 'vite.config.ts', '.github/workflows/release.yml']) {
      const src = readFileSync(file, 'utf-8');
      expect(src, file).not.toMatch(/VITE_PIXELDEBH_TORNEO_CHIAVE\s*[:=]\s*['"][^'"]+['"]/);
    }
  });
});
