import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { it as italian } from '../locales/it';
import { en } from '../locales/en';
import { LANGUAGES, systemLanguage, t, getLanguage, setLanguage } from '../services/i18n';
import { INTRO_VIDEO } from '../components/DebhIntroVideo';
import { DURATA_RUNTIME, REGIA_RUNTIME } from '../intro/LogoRuntime';
import { NERO_MS } from '../intro/RuntimeIntro';
import { GAP_MS } from '../components/BootIntros';

// the tests run without a browser: a plain in-memory localStorage for the saved language
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

describe('what the game shows at start', () => {
  it('has half a second of black before the Runtime logo and half a second between the intros', () => {
    expect(NERO_MS).toBe(500);
    expect(GAP_MS).toBe(500);
  });

  it('runs the Runtime logo for its own length, with the TV line not before its first second', () => {
    expect(DURATA_RUNTIME).toBeGreaterThan(5);
    expect(REGIA_RUNTIME.rigaDa).toBeGreaterThan(0.58); // the 0.58 s we skip are black in the logo's own timeline
  });

  it('ships the channel intro as a WebM file in public/', () => {
    expect(INTRO_VIDEO).toBe('/intro/pixeldebh-intro.webm');
    const file = `public${INTRO_VIDEO}`;
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(1_000_000);
    // a WebM (EBML) file begins with 1A 45 DF A3
    const head = readFileSync(file).subarray(0, 4);
    expect([...head]).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
  });

  it('begins with the intros, then the note on the AI, then the game intro', () => {
    const app = readFileSync('App.tsx', 'utf8');
    expect(app).toContain("useState<GameState>('boot')");
    expect(app).toMatch(/handleBootDone = useCallback\(\(\) => setGameState\('notice'\)/);
    expect(app).toMatch(/handleNoticeDone = useCallback\(\(\) => setGameState\('intro'\)/);
  });
});

describe('the credit line', () => {
  it('says By Simone Pizzi - Runtime Multimedia in both languages', () => {
    expect(italian['credit.by']).toBe('By Simone Pizzi - Runtime Multimedia');
    expect(en['credit.by']).toBe('By Simone Pizzi - Runtime Multimedia');
  });

  it('is on the title screens', () => {
    for (const file of ['components/PixelArcadeIntro.tsx', 'components/StartScreen.tsx', 'components/HighscoreScreen.tsx', 'components/AiNotice.tsx']) {
      const src = readFileSync(file, 'utf8');
      expect(src.includes('<CreditLine') || src.includes("t('credit.by')"), file).toBe(true);
    }
  });

  it('is in the installer data too', () => {
    const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    expect(conf.bundle.publisher).toBe('Simone Pizzi - Runtime Multimedia');
    expect(conf.bundle.copyright).toContain('Simone Pizzi - Runtime Multimedia');
  });
});

describe('the cast on the title screen', () => {
  it('shows Debh and every kind of enemy there is', () => {
    const screen = readFileSync('components/StartScreen.tsx', 'utf8');
    const types = readFileSync('types.ts', 'utf8');
    const union = /export type EnemyType = ([^;]+);/.exec(types)![1];
    const kinds = [...union.matchAll(/'(\w+)'/g)].map(m => m[1]);
    expect(kinds.length).toBeGreaterThanOrEqual(5);
    expect(screen).toContain("type: 'player'");
    for (const kind of kinds) expect(screen, `the parade lacks ${kind}`).toContain(`type: '${kind}'`);
  });
});

describe('the texts', () => {
  it('give every key in English as well as in Italian', () => {
    const keys = Object.keys(italian).sort();
    expect(Object.keys(en).sort()).toEqual(keys);
    for (const k of keys) {
      expect(italian[k as keyof typeof italian].length, `it ${k}`).toBeGreaterThan(1);
      expect(en[k as keyof typeof en].length, `en ${k}`).toBeGreaterThan(1);
    }
  });

  it('follow the system language until the player chooses', () => {
    expect(LANGUAGES).toEqual(['it', 'en']);
    expect(['it', 'en']).toContain(systemLanguage());
    expect(['it', 'en']).toContain(getLanguage());
  });

  it('switch language and fill the holes', () => {
    setLanguage('en');
    expect(t('notice.greeting')).toBe('Have fun.');
    setLanguage('it');
    expect(t('notice.greeting')).toBe('Buon divertimento.');
    expect(memory.get('pixelDebhLanguage')).toBe('it');
  });

  it('says in the note that the work is the author\'s and the AI was the tool', () => {
    for (const table of [italian, en]) {
      const text = [table['notice.p1'], table['notice.p2'], table['notice.p3']].join(' ');
      expect(text).toContain('Simone Pizzi');
      expect(text).toContain('Claude');
      expect(text).toContain('Lyria');
    }
  });
});
