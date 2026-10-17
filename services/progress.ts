/**
 * The progress of the player, saved in `save.json` (or localStorage in a browser):
 *  - `run`: the game in progress, as it stood at the start of the level she was in. "Continue" in the title
 *    menu takes it up again (score, lives, LOOP, difficulty and everything the trophies have counted so far).
 *    It is cleared by a game over and by finishing a LOOP; leaving from the pause menu keeps it.
 *  - `highestLevel`: the furthest level reached in a real game, which the level select opens (a practice game
 *    from the level select does not move it).
 * Reads are defensive: a damaged save gives an empty progress, never an exception.
 */
import * as storage from './storage';
import { createStats, type RunStats } from '../engine/stats';
import type { Difficulty } from '../types';
import { levels } from '../levels';

export const PROGRESS_KEY = 'pixelDebhProgress';

export interface SavedRun {
  levelIndex: number;
  score: number;
  lives: number;
  loopCount: number;
  difficulty: Difficulty;
  stats: RunStats;
}

export interface Progress {
  highestLevel: number;
  run: SavedRun | null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const int = (v: unknown, min: number, max: number, fallback: number): number =>
  isNum(v) ? Math.max(min, Math.min(max, Math.floor(v))) : fallback;
const isDifficulty = (v: unknown): v is Difficulty => v === 'easy' || v === 'normal' || v === 'hard';

/** A saved RunStats, repaired: every field has the right type or its zero. */
export function parseStats(raw: unknown): RunStats {
  const out = createStats();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const count = (v: unknown) => int(v, 0, 1e9, 0);
  out.collected = count(r.collected);
  out.enemiesDefeated = count(r.enemiesDefeated);
  out.doubleKos = count(r.doubleKos);
  out.bestBlast = count(r.bestBlast);
  out.bestCombo = count(r.bestCombo);
  out.shieldBlocks = count(r.shieldBlocks);
  out.hits = count(r.hits);
  out.livesLost = count(r.livesLost);
  out.levelHits = count(r.levelHits);
  out.levelLivesLost = count(r.levelLivesLost);
  out.tainted = r.tainted === true;
  if (Array.isArray(r.itemTypes)) out.itemTypes = r.itemTypes.filter((x): x is RunStats['itemTypes'][number] => typeof x === 'string');
  if (Array.isArray(r.bossesDefeated)) {
    out.bossesDefeated = r.bossesDefeated.filter(
      (x): x is RunStats['bossesDefeated'][number] => x === 'frog' || x === 'chickenEye' || x === 'shadowHead'
    );
  }
  if (r.clears && typeof r.clears === 'object') {
    for (const [key, value] of Object.entries(r.clears as Record<string, unknown>)) {
      const index = Number(key);
      const c = value as Record<string, unknown> | null;
      if (!Number.isInteger(index) || index < 0 || !c || typeof c !== 'object') continue;
      out.clears[index] = {
        hits: count(c.hits),
        livesLost: count(c.livesLost),
        livesLostSoFar: count(c.livesLostSoFar),
        timeLeft: isNum(c.timeLeft) ? c.timeLeft : null,
      };
    }
  }
  return out;
}

/** Reads a saved progress. `levelCount` bounds the level numbers. */
export function parseProgress(json: string | null, levelCount: number): Progress {
  const empty: Progress = { highestLevel: 0, run: null };
  if (!json) return empty;
  try {
    const raw = JSON.parse(json) as { highestLevel?: unknown; run?: unknown };
    const top = levelCount - 1;
    const out: Progress = { highestLevel: int(raw.highestLevel, 0, top, 0), run: null };
    const r = raw.run as Record<string, unknown> | null | undefined;
    if (r && typeof r === 'object' && isNum(r.levelIndex)) {
      out.run = {
        levelIndex: int(r.levelIndex, 0, top, 0),
        score: int(r.score, 0, 1e12, 0),
        lives: int(r.lives, 1, 99, 3),
        loopCount: int(r.loopCount, 1, 999, 1),
        difficulty: isDifficulty(r.difficulty) ? r.difficulty : 'normal',
        stats: parseStats(r.stats),
      };
      out.highestLevel = Math.max(out.highestLevel, out.run.levelIndex);
    }
    return out;
  } catch (error) {
    console.error('Could not read the progress:', error);
    return empty;
  }
}

/** How many levels the game has. */
export const levelCount = (): number => levels.length;

export function loadProgress(count: number = levelCount()): Progress {
  return parseProgress(storage.getItem(PROGRESS_KEY), count);
}

function store(p: Progress): void {
  storage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

/** The game in progress, as it stood when the level began. */
export function saveRun(run: SavedRun, count: number = levelCount()): void {
  const p = loadProgress(count);
  store({ highestLevel: Math.max(p.highestLevel, run.levelIndex), run });
}

/** A game over or a finished LOOP: nothing to continue. */
export function clearRun(count: number = levelCount()): void {
  const p = loadProgress(count);
  if (p.run) store({ highestLevel: p.highestLevel, run: null });
}

/** A level reached in a real game (the level select opens up to the furthest one). */
export function noteLevelReached(index: number, count: number = levelCount()): void {
  const p = loadProgress(count);
  if (index > p.highestLevel) store({ highestLevel: Math.min(index, count - 1), run: p.run });
}
