import type { BossType, ItemType } from '../types';

/** How one level was cleared (kept so trophies can ask "without losing a life", "with time to spare"). */
export interface LevelClear {
  /** Times she was hit in this level (a shield that absorbs the blow counts). */
  hits: number;
  /** Lives lost in this level. */
  livesLost: number;
  /** Lives lost since the start of the run, up to and including this level. */
  livesLostSoFar: number;
  /** Seconds left on the clock, null when the level has no clock. */
  timeLeft: number | null;
}

/**
 * What happened during one run (one LOOP), counted by the engine and read by the trophies. Plain numbers
 * and lists only, so it can be saved, compared and built by hand in tests.
 */
export interface RunStats {
  /** Collectibles picked up (power-ups are not counted). */
  collected: number;
  /** Every kind of item picked up so far, power-ups included (each kind once). */
  itemTypes: ItemType[];
  enemiesDefeated: number;
  /** Launched enemies that took a second one with them. */
  doubleKos: number;
  /** The most enemies one Super Throw blast has felled. */
  bestBlast: number;
  /** The longest chain of defeats (see COMBO_WINDOW_MS). */
  bestCombo: number;
  /** Blows the shield absorbed. */
  shieldBlocks: number;
  hits: number;
  livesLost: number;
  /** The kinds of boss that have fallen. */
  bossesDefeated: BossType[];
  /** The same counters, for the level being played (reset when a level loads). */
  levelHits: number;
  levelLivesLost: number;
  /** Level index -> how it was cleared. */
  clears: Record<number, LevelClear>;
  /** Set when a cheat (god mode) was used: nothing from this run counts for trophies. */
  tainted: boolean;
}

export const createStats = (): RunStats => ({
  collected: 0,
  itemTypes: [],
  enemiesDefeated: 0,
  doubleKos: 0,
  bestBlast: 0,
  bestCombo: 0,
  shieldBlocks: 0,
  hits: 0,
  livesLost: 0,
  bossesDefeated: [],
  levelHits: 0,
  levelLivesLost: 0,
  clears: {},
  tainted: false,
});
