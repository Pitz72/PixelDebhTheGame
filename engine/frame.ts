import {
  Player,
  Enemy,
  Item,
  Platform,
  Goal,
  Boss,
  Projectile,
  PlayerProjectile,
  Particle,
  Checkpoint,
  MusicTheme,
  Spring,
} from '../types';
import { World, WorldStatus, Shockwave, FloatingText, isZeroG } from './world';
import { collectiblesLeft, isCollectible } from './step';
import { comboMultiplier } from './world';
import { GUIDE_MAX_LEFT, GUIDE_MIN_DISTANCE } from '../constants';

/**
 * Immutable-ish picture of the world handed to the renderer. Moving entities are copied so that
 * memoised React components see a new reference every step.
 */
/** Which way the nearest collectible lies (unit vector) and how far (px). */
export interface Guide {
  dx: number;
  dy: number;
  dist: number;
}

export interface Frame {
  status: WorldStatus;
  levelIndex: number;
  levelName: string;
  theme: MusicTheme;
  loopCount: number;
  score: number;
  lives: number;
  isGodMode: boolean;
  timeRemaining: number | null;
  damageFlash: boolean;
  collectiblesLeft: number;
  /** The chain of defeats: how many, the multiplier it gives and how much of its window is left (ms). */
  combo: { count: number; mult: number; timer: number };
  /** When the last few collectibles are far away: which way the nearest one is. */
  guide: Guide | null;
  /** Gravity-free level or arena: free movement in every direction (she walks, she does not fly). */
  zeroG: boolean;
  /** How big Debh is drawn (1 = normal). */
  playerScale: number;
  /** A labyrinth: crisp movement, walls drawn as neon walls, no progress bar. */
  maze: boolean;
  /** Camera zoom on the player. */
  zoom: number;
  /** A set of its own for the background (the final stage's vault), or null. */
  backdrop: 'vault' | null;

  player: Player;
  enemies: Enemy[];
  items: Item[];
  platforms: Platform[];
  springs: Spring[];
  checkpoints: Checkpoint[];
  goal: Goal | null;
  boss: Boss | null;
  /** Every boss on the level (the same objects as `boss` when there is one). */
  bosses: Boss[];
  projectiles: Projectile[];
  playerProjectiles: PlayerProjectile[];
  particles: Particle[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];

  cameraX: number;
  cameraY: number;
  prevCameraX: number;
  prevCameraY: number;
  levelWidth: number;
  levelHeight: number;
  levelSerial: number;
  screenShake: number;
  /** Simulation time in ms (drives animations that should not depend on the display refresh). */
  time: number;
}

/** The nearest collectible, when only a few are left and it is far (so the player can find the last ones). */
export function guideFor(w: World): Guide | null {
  if (w.bosses.length > 0 || !w.goal || w.status !== 'playing') return null;
  const left = collectiblesLeft(w);
  if (left < 1 || left > GUIDE_MAX_LEFT) return null;
  const px = w.player.x + w.player.width / 2;
  const py = w.player.y + w.player.height / 2;
  let best: { dx: number; dy: number; dist: number } | null = null;
  for (const item of w.items) {
    if (!w.maze && !isCollectible(item.type)) continue; // in the labyrinth everything has to be picked up
    const dx = item.x + item.width / 2 - px;
    const dy = item.y + item.height / 2 - py;
    const dist = Math.hypot(dx, dy);
    if (!best || dist < best.dist) best = { dx, dy, dist };
  }
  if (!best || best.dist < GUIDE_MIN_DISTANCE) return null;
  return { dx: best.dx / best.dist, dy: best.dy / best.dist, dist: best.dist };
}

export function makeFrame(w: World): Frame {
  const level = w.levels[w.currentLevelIndex];
  return {
    status: w.status,
    levelIndex: w.currentLevelIndex,
    levelName: level?.name || `Level ${w.currentLevelIndex + 1}`,
    theme: level?.musicTheme || 'adventure',
    loopCount: w.loopCount,
    score: w.score,
    lives: w.lives,
    isGodMode: w.isGodMode,
    timeRemaining: w.timeRemaining,
    damageFlash: w.damageFlash > 0,
    collectiblesLeft: collectiblesLeft(w),
    combo: { count: w.combo.count, mult: comboMultiplier(w.combo.count), timer: w.combo.timer },
    guide: guideFor(w),
    zeroG: isZeroG(w),
    playerScale: w.playerScale,
    maze: w.maze !== null,
    zoom: w.zoom,
    backdrop: level?.backdrop ?? null,

    player: { ...w.player },
    enemies: w.enemies.map(e => ({ ...e })),
    items: [...w.items],
    platforms: w.platforms,
    springs: w.springs.map(s => ({ ...s })),
    checkpoints: w.checkpoints.map(c => ({ ...c })),
    goal: w.goal,
    boss: w.bosses[0] ? { ...w.bosses[0] } : null,
    bosses: w.bosses.map(b => ({ ...b })),
    projectiles: w.projectiles.map(p => ({ ...p })),
    playerProjectiles: w.playerProjectiles.map(p => ({ ...p })),
    particles: w.particles.map(p => ({ ...p })),
    shockwaves: w.shockwaves.map(s => ({ ...s })),
    floatingTexts: w.floatingTexts.map(t => ({ ...t })),

    cameraX: w.cameraX,
    cameraY: w.cameraY,
    prevCameraX: w.prevCameraX,
    prevCameraY: w.prevCameraY,
    levelWidth: w.levelWidth,
    levelHeight: w.levelHeight,
    levelSerial: w.levelSerial,
    screenShake: w.screenShake,
    time: w.elapsed,
  };
}
