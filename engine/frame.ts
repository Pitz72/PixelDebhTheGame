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
} from '../types';
import { World, WorldStatus, Shockwave, FloatingText, isZeroG } from './world';
import { collectiblesLeft } from './step';

/**
 * Immutable-ish picture of the world handed to the renderer. Moving entities are copied so that
 * memoised React components see a new reference every step.
 */
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
  /** Gravity-free level or arena: the character floats instead of running. */
  zeroG: boolean;

  player: Player;
  enemies: Enemy[];
  items: Item[];
  platforms: Platform[];
  checkpoints: Checkpoint[];
  goal: Goal | null;
  boss: Boss | null;
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
    zeroG: isZeroG(w),

    player: { ...w.player },
    enemies: w.enemies.map(e => ({ ...e })),
    items: [...w.items],
    platforms: w.platforms,
    checkpoints: w.checkpoints.map(c => ({ ...c })),
    goal: w.goal,
    boss: w.boss ? { ...w.boss } : null,
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
