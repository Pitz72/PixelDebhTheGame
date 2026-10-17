import { describe, it, expect, beforeEach } from 'vitest';
import { levels } from '../levels';
import { createWorld, createStats, step, mulberry32 } from '../engine';
import type { World, RunStats } from '../engine';
import type { LevelData } from '../types';
import { COLLECTIBLE_TYPES } from '../constants';
import {
  TROPHIES,
  TIERS,
  TROPHY_NUMBER,
  TROPHY_BLAST_ENEMIES,
  TROPHY_BOWLING_KOS,
  TROPHY_HUNTER_ENEMIES,
  TROPHY_LOOP,
  TROPHY_MAZE_SECONDS_LEFT,
  TROPHY_SCORE,
  TROPHY_SHELF_ITEMS,
  earnedNow,
  emptySave,
  type TrophyTier,
} from '../trophies';
import { createTrophyTracker, parseSave, trophyProgress, TROPHY_KEY } from '../services/trophyService';
import * as storage from '../services/storage';
import { trophyDescription, trophyName } from '../services/trophyText';
import { setLanguage } from '../services/i18n';
import { it as italian } from '../locales/it';
import { en } from '../locales/en';
import type { TextKey } from '../locales/it';

// the tests run without a browser: a plain in-memory localStorage for the save
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

const idx = {
  frog: levels.findIndex(l => l.boss?.type === 'frog'),
  chicken: levels.findIndex(l => l.boss?.type === 'chickenEye'),
  shadow: levels.findIndex(l => l.boss?.type === 'shadowHead'),
  maze: levels.findIndex(l => l.maze),
  last: levels.length - 1,
};

/** What the trophies see, with a run built by hand. */
const ctx = (over: Partial<{ stats: Partial<RunStats>; totals: { collected: number; enemies: number }; score: number; loopCount: number }> = {}) => ({
  stats: { ...createStats(), ...over.stats },
  totals: over.totals ?? { collected: 0, enemies: 0 },
  score: over.score ?? 0,
  loopCount: over.loopCount ?? 1,
  levels,
});

const earned = (c: ReturnType<typeof ctx>, have: string[] = []) => earnedNow(new Set(have), c).map(t => t.id);

const clear = (hits = 0, livesLost = 0, livesLostSoFar = livesLost, timeLeft: number | null = null) => ({ hits, livesLost, livesLostSoFar, timeLeft });

describe('the list of trophies', () => {
  it('has at least fifteen, each with its own name and description in both languages', () => {
    expect(TROPHIES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(TROPHIES.map(t => t.id)).size).toBe(TROPHIES.length);
    for (const [language, table] of [['it', italian], ['en', en]] as const) {
      const text = (id: string, part: 'name' | 'desc') => (table as Record<string, string>)[`trophy.${id}.${part}`];
      expect(new Set(TROPHIES.map(t => text(t.id, 'name'))).size, language).toBe(TROPHIES.length);
      for (const t of TROPHIES) {
        expect(text(t.id, 'name')?.length, `${language} ${t.id} name`).toBeGreaterThan(2);
        expect(text(t.id, 'desc')?.length, `${language} ${t.id} description`).toBeGreaterThan(8);
      }
    }
  });

  it('mentions in a text only the numbers the condition has (the {n} holes match TROPHY_NUMBER)', () => {
    for (const table of [italian, en] as Record<string, string>[]) {
      for (const t of TROPHIES) {
        const hole = table[`trophy.${t.id}.desc`].includes('{n}');
        expect(hole, t.id).toBe(TROPHY_NUMBER[t.id] !== undefined);
      }
    }
  });

  it('writes the names and descriptions in the language chosen', () => {
    const shelf = TROPHIES.find(t => t.id === 'shelf')!;
    setLanguage('it');
    expect(trophyName(shelf)).toBe('Primo Scaffale');
    expect(trophyDescription(shelf)).toBe('Raccogli 100 oggetti da collezione.');
    setLanguage('en');
    expect(trophyName(shelf)).toBe('First Shelf');
    expect(trophyDescription(shelf)).toBe('Collect 100 items.');
    expect(trophyDescription(TROPHIES.find(t => t.id === 'high-score')!)).toBe('Reach 100,000 points in one game.');
    setLanguage('it');
    expect(trophyDescription(TROPHIES.find(t => t.id === 'high-score')!)).toContain('100.000');
    const check: TextKey = 'trophy.title';
    expect(italian[check]).toBe('TROFEI');
  });

  it('has normal, rare, hard and completion ones', () => {
    const tiers = new Set<TrophyTier>(TROPHIES.map(t => t.tier));
    expect([...tiers].sort()).toEqual([...TIERS].sort());
    expect(TROPHIES.filter(t => t.tier === 'normal').length).toBeGreaterThanOrEqual(3);
    expect(TROPHIES.filter(t => t.tier === 'hard').length).toBeGreaterThanOrEqual(3);
  });

  it('earns nothing from a run that has done nothing', () => {
    expect(earned(ctx())).toEqual([]);
  });

  it('finds the levels the conditions are about', () => {
    for (const [name, i] of Object.entries(idx)) expect(i, name).toBeGreaterThanOrEqual(0);
    expect(idx.last).toBe(levels.length - 1);
    expect(levels[idx.last].bosses).toHaveLength(3);
  });
});

describe('each trophy', () => {
  it('first-steps: level 1 cleared', () => {
    expect(earned(ctx({ stats: { clears: { 0: clear() } } }))).toContain('first-steps');
  });

  it('shelf and hunter: the lifetime counters, not only this run', () => {
    expect(earned(ctx({ totals: { collected: TROPHY_SHELF_ITEMS - 1, enemies: 0 } }))).not.toContain('shelf');
    expect(earned(ctx({ totals: { collected: TROPHY_SHELF_ITEMS, enemies: 0 } }))).toContain('shelf');
    expect(earned(ctx({ totals: { collected: 0, enemies: TROPHY_HUNTER_ENEMIES - 1 } }))).not.toContain('hunter');
    expect(earned(ctx({ totals: { collected: 0, enemies: TROPHY_HUNTER_ENEMIES } }))).toContain('hunter');
  });

  it('double-ko, shield-up and super-blast', () => {
    expect(earned(ctx({ stats: { doubleKos: 1 } }))).toContain('double-ko');
    expect(earned(ctx({ stats: { shieldBlocks: 1 } }))).toContain('shield-up');
    expect(earned(ctx({ stats: { bestBlast: TROPHY_BLAST_ENEMIES - 1 } }))).not.toContain('super-blast');
    expect(earned(ctx({ stats: { bestBlast: TROPHY_BLAST_ENEMIES } }))).toContain('super-blast');
  });

  it('one trophy for each boss', () => {
    expect(earned(ctx({ stats: { bossesDefeated: ['frog'] } }))).toEqual(['frog-down']);
    expect(earned(ctx({ stats: { bossesDefeated: ['chickenEye'] } }))).toEqual(['egg-hunt']);
    expect(earned(ctx({ stats: { bossesDefeated: ['shadowHead'] } }))).toEqual(['lights-on']);
  });

  it('full-set needs all the collectibles', () => {
    expect(earned(ctx({ stats: { itemTypes: COLLECTIBLE_TYPES.slice(1) } }))).not.toContain('full-set');
    expect(earned(ctx({ stats: { itemTypes: [...COLLECTIBLE_TYPES] } }))).toContain('full-set');
    // power-ups do not count towards the set
    expect(earned(ctx({ stats: { itemTypes: ['shield', 'speed-boost', 'super-throw'] } }))).not.toContain('full-set');
  });

  it('bowling: several double K.O.s in one run', () => {
    expect(earned(ctx({ stats: { doubleKos: TROPHY_BOWLING_KOS - 1 } }))).not.toContain('bowling');
    expect(earned(ctx({ stats: { doubleKos: TROPHY_BOWLING_KOS } }))).toContain('bowling');
  });

  it('high-score counts the score of the run', () => {
    expect(earned(ctx({ score: TROPHY_SCORE - 1 }))).not.toContain('high-score');
    expect(earned(ctx({ score: TROPHY_SCORE }))).toContain('high-score');
  });

  it('maze-out and maze-sprint (time left on the clock)', () => {
    const slow = ctx({ stats: { clears: { [idx.maze]: clear(0, 0, 0, TROPHY_MAZE_SECONDS_LEFT - 1) } } });
    expect(earned(slow)).toContain('maze-out');
    expect(earned(slow)).not.toContain('maze-sprint');
    const fast = ctx({ stats: { clears: { [idx.maze]: clear(0, 0, 0, TROPHY_MAZE_SECONDS_LEFT) } } });
    expect(earned(fast)).toContain('maze-sprint');
  });

  it('untouchable: a boss level cleared without a hit, any boss level', () => {
    expect(earned(ctx({ stats: { clears: { [idx.frog]: clear(1) } } }))).not.toContain('untouchable');
    expect(earned(ctx({ stats: { clears: { [idx.frog]: clear(0) } } }))).toContain('untouchable');
    expect(earned(ctx({ stats: { clears: { [idx.shadow]: clear(0) } } }))).toContain('untouchable');
    // a clean ordinary level is not a boss
    expect(earned(ctx({ stats: { clears: { 1: clear(0) } } }))).not.toContain('untouchable');
    // the final stage counts too
    expect(earned(ctx({ stats: { clears: { [idx.last]: clear(0) } } }))).toContain('untouchable');
  });

  it('clean-world: no life lost up to the first boss', () => {
    expect(earned(ctx({ stats: { clears: { [idx.frog]: clear(3, 0, 1) } } }))).not.toContain('clean-world');
    expect(earned(ctx({ stats: { clears: { [idx.frog]: clear(3, 0, 0) } } }))).toContain('clean-world');
  });

  it('vault-flawless and the-end: the final stage', () => {
    const lost = ctx({ stats: { clears: { [idx.last]: clear(4, 1, 1) } } });
    expect(earned(lost)).toContain('the-end');
    expect(earned(lost)).not.toContain('vault-flawless');
    expect(earned(ctx({ stats: { clears: { [idx.last]: clear(4, 0, 2) } } }))).toContain('vault-flawless');
  });

  it('again and third-loop follow the LOOP', () => {
    expect(earned(ctx({ loopCount: 1 }))).toEqual([]);
    expect(earned(ctx({ loopCount: 2 }))).toEqual(['again']);
    expect(earned(ctx({ loopCount: TROPHY_LOOP })).sort()).toEqual(['again', 'third-loop']);
  });

  it('all-trophies comes with the last of the others, in the same check', () => {
    const others = TROPHIES.filter(t => t.id !== 'all-trophies').map(t => t.id);
    expect(earned(ctx(), others.slice(1))).not.toContain('all-trophies'); // one missing and nothing earned now
    const c = ctx({ stats: { clears: { 0: clear() } } });
    expect(earned(c, others.filter(id => id !== 'first-steps'))).toEqual(['first-steps', 'all-trophies']);
    expect(earned(c, others)).toEqual(['all-trophies']);
  });

  it('does not give again what is already earned', () => {
    const c = ctx({ stats: { clears: { 0: clear() }, doubleKos: 2 } });
    expect(earned(c, ['first-steps'])).toEqual(['double-ko']);
  });
});

// --- the engine counts the right things ---------------------------------------------------

const FLOOR_Y = 1100;
const makeLevel = (over: Partial<LevelData> = {}): LevelData => ({
  name: 'test',
  musicTheme: 'adventure',
  levelWidth: 3000,
  levelHeight: 1200,
  playerStart: { x: 100, y: FLOOR_Y - 74 },
  platforms: [{ x: 0, y: FLOOR_Y, width: 3000, height: 40 }],
  items: [],
  enemies: [],
  ...over,
});
const enemy = (x: number, y: number) => ({ type: 'base' as const, x, y, width: 50, height: 50, originalX: x, originalY: y });
const world = (lvls: LevelData[], opts: { lives?: number; loopCount?: number } = {}): World =>
  createWorld({ levels: lvls, rng: mulberry32(7), ...opts });
const run = (w: World, n: number) => {
  for (let i = 0; i < n; i++) step(w);
};

describe('the engine counts', () => {
  it('items: collectibles apart from power-ups, and every kind once', () => {
    const w = world([
      makeLevel({
        items: [
          { type: 'joystick', x: 100, y: FLOOR_Y - 60, width: 40, height: 40 },
          { type: 'joystick', x: 100, y: FLOOR_Y - 60, width: 40, height: 40 },
          { type: 'shield', x: 100, y: FLOOR_Y - 60, width: 40, height: 40 },
        ],
      }),
    ]);
    run(w, 3);
    expect(w.stats.collected).toBe(2);
    expect(w.stats.itemTypes.sort()).toEqual(['joystick', 'shield']);
  });

  it('hits, shield blocks and lives lost', () => {
    const w = world([makeLevel()]);
    w.player.hasShield = true;
    w.projectiles.push({ id: 900, x: w.player.x, y: w.player.y, width: 38, height: 38, vx: 0, vy: 0 });
    step(w);
    expect(w.stats).toMatchObject({ hits: 1, shieldBlocks: 1, livesLost: 0, levelHits: 1 });
    run(w, 60); // the blow leaves her invincible for a moment
    w.player.isInvincible = false;
    w.projectiles.push({ id: 901, x: w.player.x, y: w.player.y, width: 38, height: 38, vx: 0, vy: 0 });
    step(w);
    expect(w.stats).toMatchObject({ hits: 2, shieldBlocks: 1, livesLost: 1, levelLivesLost: 1 });
  });

  it('a pit costs a life and counts as a hit', () => {
    const w = world([makeLevel()]);
    w.player.y = 1500;
    step(w);
    expect(w.stats).toMatchObject({ hits: 1, livesLost: 1 });
  });

  it('the cheat taints the run and its blows do not count', () => {
    const w = world([makeLevel()]);
    w.isGodMode = true;
    w.player.y = 1500;
    step(w);
    expect(w.stats.tainted).toBe(true);
    expect(w.stats.hits).toBe(0);
    expect(w.stats.livesLost).toBe(0);
  });

  it('a launched enemy that takes another with it is a double K.O.', () => {
    const w = world([makeLevel({ enemies: [enemy(200, FLOOR_Y - 50), enemy(700, FLOOR_Y - 50)] })]);
    const [a] = w.enemies;
    a.state = 'launched';
    a.vx = 38;
    a.vy = 0;
    a.launchTravel = 0;
    run(w, 30);
    expect(w.stats).toMatchObject({ doubleKos: 1, enemiesDefeated: 2 });
  });

  it('a Super Throw blast counts everyone it fells', () => {
    const w = world([
      makeLevel({ enemies: [enemy(200, FLOOR_Y - 50), enemy(700, FLOOR_Y - 50), enemy(740, FLOOR_Y - 50), enemy(780, FLOOR_Y - 50)] }),
    ]);
    const [a] = w.enemies;
    a.state = 'launched';
    a.isSuperLaunched = true;
    a.vx = 38;
    a.vy = 0;
    a.launchTravel = 0;
    run(w, 30);
    expect(w.stats.bestBlast).toBe(4);
    expect(w.stats.enemiesDefeated).toBe(4);
  });

  it('a shot that fells an enemy', () => {
    const w = world([
      makeLevel({ isZeroG: true, enemies: [enemy(600, FLOOR_Y - 50)] }),
    ]);
    const e = w.enemies[0];
    w.playerProjectiles.push({ id: 950, x: e.x + 10, y: e.y + 10, width: 24, height: 24, vx: 0, vy: 0 });
    step(w);
    expect(w.stats.enemiesDefeated).toBe(1);
  });

  it('a level cleared writes down how it went', () => {
    const w = world([makeLevel({ timeLimit: 100, goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } })]);
    w.player.x = 410;
    w.player.y = FLOOR_Y - 74;
    step(w);
    expect(w.status).toBe('level-cleared');
    expect(w.stats.clears[0]).toMatchObject({ hits: 0, livesLost: 0, livesLostSoFar: 0 });
    expect(w.stats.clears[0].timeLeft).toBeGreaterThan(99);
  });

  it('a boss that falls is remembered, and its level is cleared', () => {
    const w = world([makeLevel({ levelWidth: 2688, levelHeight: 1250, boss: { type: 'frog', x: 1100, y: 300, width: 320, height: 320, maxHp: 10 } })]);
    const b = w.boss!;
    b.hp = 1;
    w.playerProjectiles.push({ id: 950, x: b.x + b.width / 2, y: b.y + b.height / 2, width: 24, height: 24, vx: 0, vy: 0 });
    step(w);
    expect(w.stats.bossesDefeated).toEqual(['frog']);
    expect(w.stats.clears[0]).toBeDefined();
  });

  it('the counters of a level start again with the next one', () => {
    const w = world([makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } }), makeLevel()]);
    w.projectiles.push({ id: 900, x: w.player.x, y: w.player.y, width: 38, height: 38, vx: 0, vy: 0 });
    step(w);
    expect(w.stats.levelHits).toBe(1);
    w.player.x = 410;
    w.player.y = FLOOR_Y - 74;
    w.player.isInvincible = true;
    run(w, 200);
    expect(w.currentLevelIndex).toBe(1);
    expect(w.stats.levelHits).toBe(0);
    expect(w.stats.hits).toBe(1);
  });
});

// --- saving and following a world ------------------------------------------------------------

describe('the save', () => {
  beforeEach(() => storage.removeItem(TROPHY_KEY));

  it('starts empty and survives garbage', () => {
    expect(parseSave(null)).toEqual(emptySave());
    expect(parseSave('not json')).toEqual(emptySave());
    expect(parseSave('{"unlocked":5,"totals":"x"}')).toEqual(emptySave());
    const odd = parseSave('{"unlocked":{"first-steps":123,"nope":1,"shelf":"x"},"totals":{"collected":-4,"enemies":7.9}}');
    expect(odd.unlocked).toEqual({ 'first-steps': 123 });
    expect(odd.totals).toEqual({ collected: 0, enemies: 7 });
  });

  it('counts the trophies earned', () => {
    expect(trophyProgress(emptySave())).toEqual({ earned: 0, total: TROPHIES.length });
    expect(trophyProgress({ unlocked: { 'first-steps': 1, shelf: 2 }, totals: { collected: 0, enemies: 0 } }).earned).toBe(2);
  });

  it('a tracker follows a world: earns a trophy once, saves it and adds the totals', () => {
    const w = world([
      makeLevel({ items: [{ type: 'joystick', x: 100, y: FLOOR_Y - 60, width: 40, height: 40 }], goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } }),
      makeLevel(),
    ]);
    const told: string[] = [];
    const tracker = createTrophyTracker(w, t => told.push(t.id));
    run(w, 3);
    tracker.update();
    w.player.x = 410;
    w.player.y = FLOOR_Y - 74;
    run(w, 2);
    tracker.update();
    tracker.update(); // idempotent
    expect(told).toEqual(['first-steps']);
    const stored = parseSave(storage.getItem(TROPHY_KEY));
    expect(Object.keys(stored.unlocked)).toEqual(['first-steps']);
    expect(stored.totals.collected).toBe(1);
  });

  it('a second world (the next LOOP) starts from what was saved', () => {
    const w1 = world([makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } }), makeLevel()]);
    const t1 = createTrophyTracker(w1, () => {});
    w1.player.x = 410;
    step(w1);
    t1.update();
    const told: string[] = [];
    const w2 = world([makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } }), makeLevel()], { loopCount: 2 });
    const t2 = createTrophyTracker(w2, t => told.push(t.id));
    t2.update();
    expect(told).toEqual(['again']); // first-steps was earned in the first world and is not told again
  });

  it('a tainted run earns nothing and adds nothing', () => {
    const w = world([makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } })]);
    w.isGodMode = true;
    const told: string[] = [];
    const tracker = createTrophyTracker(w, t => told.push(t.id));
    w.player.x = 410;
    step(w);
    tracker.update();
    tracker.flush();
    expect(told).toEqual([]);
    expect(storage.getItem(TROPHY_KEY)).toBeNull();
  });
});
