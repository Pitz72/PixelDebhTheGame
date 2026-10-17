import type { World } from '../engine';
import { TROPHIES, TrophyDef, TrophySave, earnedNow, emptySave } from '../trophies';
import * as storage from './storage';

export const TROPHY_KEY = 'pixelDebhTrophies';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

/** Reads the save defensively: anything odd is dropped, never an exception. */
export function parseSave(json: string | null): TrophySave {
  const save = emptySave();
  if (!json) return save;
  try {
    const raw = JSON.parse(json) as { unlocked?: unknown; totals?: { collected?: unknown; enemies?: unknown } };
    if (raw && typeof raw.unlocked === 'object' && raw.unlocked !== null) {
      for (const t of TROPHIES) {
        const when = (raw.unlocked as Record<string, unknown>)[t.id];
        if (typeof when === 'number' && Number.isFinite(when)) save.unlocked[t.id] = when;
      }
    }
    save.totals.collected = num(raw?.totals?.collected);
    save.totals.enemies = num(raw?.totals?.enemies);
  } catch (error) {
    console.error('Could not read the trophies:', error);
  }
  return save;
}

export function loadTrophies(): TrophySave {
  return parseSave(storage.getItem(TROPHY_KEY));
}

export function saveTrophies(save: TrophySave): void {
  storage.setItem(TROPHY_KEY, JSON.stringify(save));
}

/** How many trophies are earned, out of how many. */
export function trophyProgress(save: TrophySave = loadTrophies()): { earned: number; total: number } {
  return { earned: TROPHIES.filter(t => save.unlocked[t.id] !== undefined).length, total: TROPHIES.length };
}

export interface TrophyTracker {
  /** Looks at the world; call it after the simulation steps and before the events are dispatched. */
  update(): void;
  /** Writes the lifetime counters down (the trophies themselves are saved the moment they are earned). */
  flush(): void;
  /** The current save, for the probes. */
  save(): TrophySave;
}

/**
 * Follows one world (one LOOP): adds what it counts to the lifetime totals, awards the trophies the
 * numbers now earn and tells `onUnlock`. A run played with the cheat on earns nothing.
 */
export function createTrophyTracker(w: World, onUnlock: (t: TrophyDef) => void): TrophyTracker {
  const save = loadTrophies();
  const seen = { collected: 0, enemies: 0 };
  let dirty = false;
  let lastStatus = w.status;

  const flush = () => {
    if (!dirty) return;
    dirty = false;
    saveTrophies(save);
  };

  const update = () => {
    const s = w.stats;
    if (s.tainted) return;

    const dCollected = s.collected - seen.collected;
    const dEnemies = s.enemiesDefeated - seen.enemies;
    if (dCollected > 0 || dEnemies > 0) {
      save.totals.collected += dCollected;
      save.totals.enemies += dEnemies;
      seen.collected = s.collected;
      seen.enemies = s.enemiesDefeated;
      dirty = true;
    }

    const earned = earnedNow(new Set(Object.keys(save.unlocked)), {
      stats: s,
      totals: save.totals,
      score: w.score,
      loopCount: w.loopCount,
      levels: w.levels,
    });
    if (earned.length > 0) {
      const now = Date.now();
      for (const t of earned) save.unlocked[t.id] = now;
      dirty = true;
      flush();
      for (const t of earned) onUnlock(t);
    }

    // a level cleared, a game over: a good moment to write the counters down
    if (w.status !== lastStatus) {
      lastStatus = w.status;
      flush();
    }
  };

  return { update, flush, save: () => save };
}
