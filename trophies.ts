import type { LevelData, BossType } from './types';
import type { RunStats } from './engine/stats';
import { COLLECTIBLE_TYPES } from './constants';

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
  id: string;
  tier: TrophyTier;
  name: string;
  description: string;
  check: (c: TrophyContext) => boolean;
}

export const TIER_LABEL: Record<TrophyTier, string> = {
  normal: 'NORMALI',
  rare: 'RARI',
  hard: 'DIFFICILI',
  complete: 'COMPLETAMENTO',
};

/** Where the numbers of the trophies come from: each is a plain constant, to be tuned by playing. */
export const TROPHY_SHELF_ITEMS = 100;
export const TROPHY_HUNTER_ENEMIES = 100;
export const TROPHY_BLAST_ENEMIES = 4;
export const TROPHY_BOWLING_KOS = 5;
export const TROPHY_SCORE = 100_000;
export const TROPHY_MAZE_SECONDS_LEFT = 360;
export const TROPHY_LOOP = 3;

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
    name: 'Primi Passi',
    description: 'Completa il Livello 1.',
    check: c => c.stats.clears[0] !== undefined,
  },
  {
    id: 'shelf',
    tier: 'normal',
    name: 'Primo Scaffale',
    description: `Raccogli ${TROPHY_SHELF_ITEMS} oggetti da collezione.`,
    check: c => c.totals.collected >= TROPHY_SHELF_ITEMS,
  },
  {
    id: 'hunter',
    tier: 'normal',
    name: 'Cacciatrice di Nemici',
    description: `Sconfiggi ${TROPHY_HUNTER_ENEMIES} nemici.`,
    check: c => c.totals.enemies >= TROPHY_HUNTER_ENEMIES,
  },
  {
    id: 'double-ko',
    tier: 'normal',
    name: 'Doppio K.O.',
    description: 'Lancia un nemico contro un altro e abbattili entrambi.',
    check: c => c.stats.doubleKos >= 1,
  },
  {
    id: 'shield-up',
    tier: 'normal',
    name: 'Scudo Alzato',
    description: 'Fai assorbire un colpo allo scudo.',
    check: c => c.stats.shieldBlocks >= 1,
  },
  {
    id: 'frog-down',
    tier: 'normal',
    name: 'Rana a Lesso',
    description: 'Sconfiggi la Rana Ciclope.',
    check: c => beat(c, 'frog'),
  },

  // --- rari ---------------------------------------------------------------------
  {
    id: 'egg-hunt',
    tier: 'rare',
    name: "Frittata d'Occhio",
    description: 'Sconfiggi LeGallineNellOcchi.',
    check: c => beat(c, 'chickenEye'),
  },
  {
    id: 'lights-on',
    tier: 'rare',
    name: 'Luce nel Buio',
    description: 'Sconfiggi CapocciaNelBuio.',
    check: c => beat(c, 'shadowHead'),
  },
  {
    id: 'super-blast',
    tier: 'rare',
    name: 'Botto Grosso',
    description: `Abbatti ${TROPHY_BLAST_ENEMIES} nemici con un solo lancio super.`,
    check: c => c.stats.bestBlast >= TROPHY_BLAST_ENEMIES,
  },
  {
    id: 'full-set',
    tier: 'rare',
    name: 'Collezione Completa',
    description: `Raccogli tutti gli ${COLLECTIBLE_TYPES.length} tipi di oggetti retro in una partita.`,
    check: c => COLLECTIBLE_TYPES.every(t => c.stats.itemTypes.includes(t)),
  },
  {
    id: 'bowling',
    tier: 'rare',
    name: 'Re del Bowling',
    description: `Fai ${TROPHY_BOWLING_KOS} doppi K.O. in una partita.`,
    check: c => c.stats.doubleKos >= TROPHY_BOWLING_KOS,
  },
  {
    id: 'high-score',
    tier: 'rare',
    name: 'Centomila',
    description: `Raggiungi ${TROPHY_SCORE.toLocaleString('it-IT')} punti in una partita.`,
    check: c => c.score >= TROPHY_SCORE,
  },
  {
    id: 'maze-out',
    tier: 'rare',
    name: 'Fuori dal Labirinto',
    description: "Trova l'uscita del labirinto.",
    check: c => c.stats.clears[mazeLevel(c.levels)] !== undefined,
  },

  // --- difficili ----------------------------------------------------------------
  {
    id: 'untouchable',
    tier: 'hard',
    name: 'Intoccabile',
    description: 'Sconfiggi un boss senza essere mai colpita.',
    check: c => c.levels.some((l, i) => isBossLevel(l) && c.stats.clears[i]?.hits === 0),
  },
  {
    id: 'clean-world',
    tier: 'hard',
    name: 'Mondo Pulito',
    description: 'Arriva in fondo al primo mondo (fino alla Rana) senza perdere una vita.',
    check: c => c.stats.clears[bossLevel(c.levels, 'frog')]?.livesLostSoFar === 0,
  },
  {
    id: 'maze-sprint',
    tier: 'hard',
    name: 'Corsa nel Labirinto',
    description: `Esci dal labirinto con almeno ${TROPHY_MAZE_SECONDS_LEFT / 60} minuti ancora sul timer.`,
    check: c => (c.stats.clears[mazeLevel(c.levels)]?.timeLeft ?? -1) >= TROPHY_MAZE_SECONDS_LEFT,
  },
  {
    id: 'vault-flawless',
    tier: 'hard',
    name: 'Caveau Intatto',
    description: 'Vinci lo scontro finale senza perdere una vita.',
    check: c => c.stats.clears[lastLevel(c.levels)]?.livesLost === 0,
  },
  {
    id: 'third-loop',
    tier: 'hard',
    name: 'Terzo Giro',
    description: `Arriva al LOOP ${TROPHY_LOOP}.`,
    check: c => c.loopCount >= TROPHY_LOOP,
  },

  // --- completamento ------------------------------------------------------------
  {
    id: 'the-end',
    tier: 'complete',
    name: 'Fine della Corsa',
    description: 'Completa il gioco: sconfiggi i tre boss nel Caveau del Collezionista.',
    check: c => c.stats.clears[lastLevel(c.levels)] !== undefined,
  },
  {
    id: 'again',
    tier: 'complete',
    name: 'Ancora!',
    description: 'Inizia il LOOP 2.',
    check: c => c.loopCount >= 2,
  },
  {
    id: 'all-trophies',
    tier: 'complete',
    name: 'Il Collezionista',
    description: 'Sblocca tutti gli altri trofei.',
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
