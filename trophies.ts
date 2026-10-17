import type { LevelData, BossType } from './types';
import type { RunStats } from './engine/stats';
import { COLLECTIBLE_TYPES, COMBO_MAX_MULT, COMBO_STEP } from './constants';

/**
 * The trophies: what they are and when they are earned. Pure data and predicates, no storage and no
 * DOM, so tests can feed them stats built by hand. `services/trophyService.ts` keeps the save file and
 * watches the running game; the screens only draw what is here.
 */

export type TrophyTier = 'normal' | 'rare' | 'hard' | 'complete';

/** Counted over every run, saved with the trophies. */
export interface TrophyTotals {
  collected: number;
  enemies: number;
}

export interface TrophySave {
  /** Trophy id -> when it was earned (ms since 1970). */
  unlocked: Record<string, number>;
  totals: TrophyTotals;
}

export interface TrophyContext {
  /** The current run (one LOOP). */
  stats: RunStats;
  /** Lifetime numbers, this run's included. */
  totals: TrophyTotals;
  score: number;
  loopCount: number;
  levels: LevelData[];
  unlocked: ReadonlySet<string>;
}

export interface TrophyDef {
  /** The id also names its texts in locales/: `trophy.<id>.name` and `trophy.<id>.desc`. */
  id: string;
  tier: TrophyTier;
  check: (c: TrophyContext) => boolean;
}

/** Where the numbers of the trophies come from: each is a plain constant, to be tuned by playing. */
export const TROPHY_SHELF_ITEMS = 100;
export const TROPHY_HUNTER_ENEMIES = 100;
export const TROPHY_BLAST_ENEMIES = 4;
export const TROPHY_BOWLING_KOS = 5;
/** The longest chain that gives the top multiplier. */
export const TROPHY_COMBO = COMBO_STEP * (COMBO_MAX_MULT - 1);
export const TROPHY_SCORE = 100_000;
export const TROPHY_MAZE_SECONDS_LEFT = 360;
export const TROPHY_LOOP = 3;

export const TIERS: readonly TrophyTier[] = ['normal', 'rare', 'hard', 'complete'];

/** The numbers that the texts of some trophies mention (`{n}`), so text and condition cannot drift apart. */
export const TROPHY_NUMBER: Record<string, number> = {
  shelf: TROPHY_SHELF_ITEMS,
  hunter: TROPHY_HUNTER_ENEMIES,
  'super-blast': TROPHY_BLAST_ENEMIES,
  'full-set': COLLECTIBLE_TYPES.length,
  bowling: TROPHY_BOWLING_KOS,
  combo: COMBO_MAX_MULT,
  'high-score': TROPHY_SCORE,
  'maze-sprint': TROPHY_MAZE_SECONDS_LEFT / 60,
  'third-loop': TROPHY_LOOP,
};

const bossLevel = (levels: LevelData[], type: BossType): number => levels.findIndex(l => l.boss?.type === type);
const mazeLevel = (levels: LevelData[]): number => levels.findIndex(l => Boolean(l.maze));
const lastLevel = (levels: LevelData[]): number => levels.length - 1;
const isBossLevel = (l: LevelData): boolean => Boolean(l.boss) || (l.bosses?.length ?? 0) > 0;

const beat = (c: TrophyContext, type: BossType) => c.stats.bossesDefeated.includes(type);

export const TROPHIES: TrophyDef[] = [
  // --- normali ------------------------------------------------------------------
  {
    id: 'first-steps',
    tier: 'normal',
    check: c => c.stats.clears[0] !== undefined,
  },
  {
    id: 'shelf',
    tier: 'normal',
    check: c => c.totals.collected >= TROPHY_SHELF_ITEMS,
  },
  {
    id: 'hunter',
    tier: 'normal',
    check: c => c.totals.enemies >= TROPHY_HUNTER_ENEMIES,
  },
  {
    id: 'double-ko',
    tier: 'normal',
    check: c => c.stats.doubleKos >= 1,
  },
  {
    id: 'shield-up',
    tier: 'normal',
    check: c => c.stats.shieldBlocks >= 1,
  },
  {
    id: 'frog-down',
    tier: 'normal',
    check: c => beat(c, 'frog'),
  },

  // --- rari ---------------------------------------------------------------------
  {
    id: 'egg-hunt',
    tier: 'rare',
    check: c => beat(c, 'chickenEye'),
  },
  {
    id: 'lights-on',
    tier: 'rare',
    check: c => beat(c, 'shadowHead'),
  },
  {
    id: 'super-blast',
    tier: 'rare',
    check: c => c.stats.bestBlast >= TROPHY_BLAST_ENEMIES,
  },
  {
    id: 'full-set',
    tier: 'rare',
    check: c => COLLECTIBLE_TYPES.every(t => c.stats.itemTypes.includes(t)),
  },
  {
    id: 'bowling',
    tier: 'rare',
    check: c => c.stats.doubleKos >= TROPHY_BOWLING_KOS,
  },
  {
    id: 'combo',
    tier: 'rare',
    check: c => c.stats.bestCombo >= TROPHY_COMBO,
  },
  {
    id: 'high-score',
    tier: 'rare',
    check: c => c.score >= TROPHY_SCORE,
  },
  {
    id: 'maze-out',
    tier: 'rare',
    check: c => c.stats.clears[mazeLevel(c.levels)] !== undefined,
  },

  // --- difficili ----------------------------------------------------------------
  {
    id: 'untouchable',
    tier: 'hard',
    check: c => c.levels.some((l, i) => isBossLevel(l) && c.stats.clears[i]?.hits === 0),
  },
  {
    id: 'clean-world',
    tier: 'hard',
    check: c => c.stats.clears[bossLevel(c.levels, 'frog')]?.livesLostSoFar === 0,
  },
  {
    id: 'maze-sprint',
    tier: 'hard',
    check: c => (c.stats.clears[mazeLevel(c.levels)]?.timeLeft ?? -1) >= TROPHY_MAZE_SECONDS_LEFT,
  },
  {
    id: 'vault-flawless',
    tier: 'hard',
    check: c => c.stats.clears[lastLevel(c.levels)]?.livesLost === 0,
  },
  {
    id: 'third-loop',
    tier: 'hard',
    check: c => c.loopCount >= TROPHY_LOOP,
  },

  // --- completamento ------------------------------------------------------------
  {
    id: 'the-end',
    tier: 'complete',
    check: c => c.stats.clears[lastLevel(c.levels)] !== undefined,
  },
  {
    id: 'again',
    tier: 'complete',
    check: c => c.loopCount >= 2,
  },
  {
    id: 'all-trophies',
    tier: 'complete',
    check: c => TROPHIES.every(t => t.id === 'all-trophies' || c.unlocked.has(t.id)),
  },
];

export const emptySave = (): TrophySave => ({ unlocked: {}, totals: { collected: 0, enemies: 0 } });

/**
 * The trophies that this moment earns and the save does not have yet, in the order of the list.
 * Does not touch the save: the caller records them. "Il Collezionista" sees the others earned in this
 * very check.
 */
export function earnedNow(
  unlocked: ReadonlySet<string>,
  ctx: Omit<TrophyContext, 'unlocked'>
): TrophyDef[] {
  const have = new Set(unlocked);
  const out: TrophyDef[] = [];
  let found = true;
  while (found) {
    found = false;
    for (const t of TROPHIES) {
      if (have.has(t.id) || !t.check({ ...ctx, unlocked: have })) continue;
      have.add(t.id);
      out.push(t);
      found = true;
    }
  }
  return out;
}
