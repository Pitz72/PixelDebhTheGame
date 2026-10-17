import { describe, it, expect, beforeEach } from 'vitest';
import { levels } from '../levels';
import { createWorld, createStats, step, mulberry32 } from '../engine';
import type { World, EngineEvent } from '../engine';
import { BOSS_2_HP, BOSS_INITIAL_HP, DIFFICULTY, ENEMY_SPEED, FINAL_BOSS_HP_SHARE, INITIAL_LIVES } from '../constants';
import { PROGRESS_KEY, clearRun, loadProgress, noteLevelReached, parseProgress, parseStats, saveRun, levelCount, type SavedRun } from '../services/progress';
import { addHighscore, getHighscores } from '../services/highscoreService';
import { defaultSettings, parseSettings } from '../services/settings';
import * as storage from '../services/storage';

// the tests run without a browser: a plain in-memory localStorage
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

const N = levels.length;
const bossLevel = (type: string) => levels.findIndex(l => l.boss?.type === type);
const drain = (w: World): EngineEvent[] => w.events.splice(0, w.events.length);

const sample = (over: Partial<SavedRun> = {}): SavedRun => ({
  levelIndex: 4,
  score: 12345,
  lives: 2,
  loopCount: 2,
  difficulty: 'hard',
  stats: { ...createStats(), collected: 33, doubleKos: 2, bossesDefeated: ['frog'], clears: { 0: { hits: 1, livesLost: 0, livesLostSoFar: 0, timeLeft: null } } },
  ...over,
});

describe('difficulty', () => {
  it('sets the lives she starts with, the speed of the enemies and the life of the bosses', () => {
    const lives = (d: 'easy' | 'normal' | 'hard') => createWorld({ difficulty: d, rng: mulberry32(1) }).lives;
    expect(lives('easy')).toBe(DIFFICULTY.easy.lives);
    expect(lives('normal')).toBe(INITIAL_LIVES);
    expect(lives('hard')).toBe(DIFFICULTY.hard.lives);
    expect(DIFFICULTY.easy.lives).toBeGreaterThan(INITIAL_LIVES);
    expect(DIFFICULTY.hard.lives).toBeLessThan(INITIAL_LIVES);

    const speed = (d: 'easy' | 'normal' | 'hard') => createWorld({ difficulty: d, rng: mulberry32(1) }).enemies.find(e => e.type === 'base')!.vx;
    expect(speed('normal')).toBeCloseTo(ENEMY_SPEED, 6);
    expect(speed('easy')).toBeCloseTo(ENEMY_SPEED * 0.8, 6);
    expect(speed('hard')).toBeCloseTo(ENEMY_SPEED * 1.2, 6);
  });

  it('scales the life of the bosses, and the bar with it, in their own levels and in the final stage', () => {
    const frog = bossLevel('frog');
    const hp = (d: 'easy' | 'normal' | 'hard', level: number) => createWorld({ levelIndex: level, difficulty: d, rng: mulberry32(1) }).bosses.map(b => [b.hp, b.maxHp]);
    expect(hp('normal', frog)).toEqual([[BOSS_INITIAL_HP, BOSS_INITIAL_HP]]);
    expect(hp('easy', frog)).toEqual([[Math.round(BOSS_INITIAL_HP * 0.75), Math.round(BOSS_INITIAL_HP * 0.75)]]);
    expect(hp('hard', frog)).toEqual([[Math.round(BOSS_INITIAL_HP * 1.25), Math.round(BOSS_INITIAL_HP * 1.25)]]);
    const last = N - 1;
    const normal = hp('normal', last).map(([h]) => h);
    expect(normal).toEqual([BOSS_INITIAL_HP, BOSS_2_HP, 54].map(full => Math.ceil(full * FINAL_BOSS_HP_SHARE)));
    expect(hp('hard', last).every(([h], i) => h > normal[i])).toBe(true);
    expect(hp('easy', last).every(([h], i) => h < normal[i])).toBe(true);
  });

  it('lends lives for the endurance boss from the life it really has', () => {
    const chicken = bossLevel('chickenEye');
    const w = createWorld({ levelIndex: chicken, difficulty: 'hard', rng: mulberry32(1) });
    expect(w.lives).toBe(Math.max(DIFFICULTY.hard.lives, Math.ceil(w.bosses[0].maxHp / 2)));
    expect(w.livesBeforeBoss).toBe(DIFFICULTY.hard.lives);
  });

  it('keeps the LOOP speed-up on top of the difficulty', () => {
    const w = createWorld({ loopCount: 3, difficulty: 'hard', rng: mulberry32(1) });
    expect(w.difficultyMultiplier).toBeCloseTo(1.4 * 1.2, 6);
  });

  it('is normal unless the game says otherwise, and is remembered in the settings', () => {
    expect(createWorld({ rng: mulberry32(1) }).difficulty).toBe('normal');
    expect(defaultSettings().difficulty).toBe('normal');
    expect(parseSettings('{"difficulty":"hard"}').difficulty).toBe('hard');
    expect(parseSettings('{"difficulty":"impossible"}').difficulty).toBe('normal');
  });

  it('is written next to a score in the leaderboard (normal is not marked)', () => {
    memory.clear();
    addHighscore('ZZZ', 999999, 'hard');
    addHighscore('YYY', 888888);
    const top = getHighscores();
    expect(top[0]).toMatchObject({ name: 'ZZZ', difficulty: 'hard' });
    expect(top[1]).toMatchObject({ name: 'YYY', difficulty: 'normal' });
  });
});

describe('practice', () => {
  it('earns no trophies (the run is tainted) and says so', () => {
    const w = createWorld({ practice: true, levelIndex: 3, rng: mulberry32(1) });
    expect(w.practice).toBe(true);
    expect(w.stats.tainted).toBe(true);
    expect(createWorld({ rng: mulberry32(1) }).stats.tainted).toBe(false);
  });

  it('starts at the level asked', () => {
    const w = createWorld({ levelIndex: 6, rng: mulberry32(1) });
    expect(w.currentLevelIndex).toBe(6);
  });
});

describe('the level event', () => {
  it('tells the host every level that starts, with its index', () => {
    const w = createWorld({ levelIndex: 2, rng: mulberry32(1) });
    expect(drain(w).filter(e => e.type === 'level')).toEqual([{ type: 'level', index: 2 }]);
    step(w);
    expect(drain(w).filter(e => e.type === 'level')).toEqual([]);
  });
});

describe('the saved progress', () => {
  beforeEach(() => memory.clear());

  it('is empty when nothing was saved or what was saved is garbage', () => {
    expect(parseProgress(null, N)).toEqual({ highestLevel: 0, run: null });
    expect(parseProgress('nonsense', N)).toEqual({ highestLevel: 0, run: null });
    expect(parseProgress('{"highestLevel":"x","run":5}', N)).toEqual({ highestLevel: 0, run: null });
  });

  it('keeps a good save and brings bad numbers back in range', () => {
    const p = parseProgress(JSON.stringify({ highestLevel: 99, run: { levelIndex: 3, score: -5, lives: 0, loopCount: 0, difficulty: 'wow', stats: 7 } }), N);
    expect(p.highestLevel).toBe(N - 1);
    expect(p.run).toMatchObject({ levelIndex: 3, score: 0, lives: 1, loopCount: 1, difficulty: 'normal' });
    expect(p.run!.stats).toEqual(createStats());
  });

  it('puts the furthest level at least as far as the saved run', () => {
    const p = parseProgress(JSON.stringify({ highestLevel: 1, run: { levelIndex: 6, score: 1, lives: 3, loopCount: 1, difficulty: 'normal' } }), N);
    expect(p.highestLevel).toBe(6);
  });

  it('writes the stats of a run and reads them back whole', () => {
    const stats = sample().stats;
    expect(parseStats(JSON.parse(JSON.stringify(stats)))).toEqual(stats);
    expect(parseStats({ collected: 'many', clears: { x: {}, '-3': {}, '2': { hits: 1 } }, bossesDefeated: ['frog', 'dragon'] }).clears).toEqual({ 2: { hits: 1, livesLost: 0, livesLostSoFar: 0, timeLeft: null } });
    expect(parseStats({ bossesDefeated: ['frog', 'dragon'] }).bossesDefeated).toEqual(['frog']);
  });

  it('saves a run, reads it back with its stats, and the furthest level follows it', () => {
    saveRun(sample());
    const p = loadProgress();
    expect(p.run).toEqual(sample());
    expect(p.highestLevel).toBe(4);
    saveRun(sample({ levelIndex: 2 }));
    expect(loadProgress().highestLevel).toBe(4); // never goes back
  });

  it('clears the run (a game over) and keeps the furthest level', () => {
    saveRun(sample());
    clearRun();
    expect(loadProgress()).toEqual({ highestLevel: 4, run: null });
  });

  it('notes a level reached in a real game, and only goes forward', () => {
    noteLevelReached(5);
    expect(loadProgress().highestLevel).toBe(5);
    noteLevelReached(2);
    expect(loadProgress().highestLevel).toBe(5);
    noteLevelReached(999);
    expect(loadProgress().highestLevel).toBe(N - 1);
    expect(storage.getItem(PROGRESS_KEY)).not.toBeNull();
    expect(levelCount()).toBe(N);
  });

  it('continues a run: the world takes the lives, the loop, the difficulty and the stats it was saved with', () => {
    const saved = sample({ levelIndex: bossLevel('frog') });
    const w = createWorld({ levelIndex: saved.levelIndex, score: saved.score, lives: saved.lives, loopCount: saved.loopCount, difficulty: saved.difficulty, stats: saved.stats, rng: mulberry32(1) });
    expect(w.currentLevelIndex).toBe(saved.levelIndex);
    expect(w.score).toBe(12345);
    expect(w.lives).toBe(2);
    expect(w.loopCount).toBe(2);
    expect(w.difficulty).toBe('hard');
    expect(w.stats.collected).toBe(33);
    expect(w.stats.bossesDefeated).toEqual(['frog']);
    expect(w.stats.levelHits).toBe(0); // the level counters start again with the level
  });
});
