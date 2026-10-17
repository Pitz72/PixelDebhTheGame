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
  LevelData,
  MazeData,
  Difficulty,
} from '../types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INITIAL_LIVES,
  DIFFICULTY,
  EXTRA_LIFE_SCORE_START,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_LEGACY_HEIGHT,
  MAZE_PLAYER_SCALE,
  MAZE_PLAYER_WIDTH,
  MAZE_PLAYER_HEIGHT,
  MAZE_LOOP_ENEMY_SHARE,
  MAZE_LOOP_TIME_CUT,
  BOSS_INITIAL_VX,
  BOSS_INITIAL_VY,
  FLYER_SPEED,
  FLYER_VERTICAL_SPEED,
  ENEMY_SPEED,
  ENEMY_JUMP_COOLDOWN,
  BOMBER_ATTACK_COOLDOWN,
  MAX_PARTICLES,
} from '../constants';
import { levels as defaultLevels } from '../levels';
import { Rng } from './rng';
import { InputState, Action, emptyInput } from './input';
import { RunStats, createStats } from './stats';

export interface Shockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  strokeWidth: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  scale: number;
}

export type WorldStatus = 'playing' | 'level-cleared' | 'completed' | 'gameover';

/** Things the host (UI / audio layer) must react to. The engine itself never touches DOM or Web Audio. */
export type EngineEvent =
  | { type: 'sound'; name: string }
  | { type: 'jingle'; name: 'levelStart' | 'respawn' | 'extraLife' }
  | { type: 'music'; theme: string }
  | { type: 'level'; index: number }
  | { type: 'gameOver'; score: number }
  | { type: 'completed'; score: number; lives: number };

export interface World {
  levels: LevelData[];
  status: WorldStatus;
  currentLevelIndex: number;
  loopCount: number;
  /** How fast the enemies and bosses are: the LOOP and the chosen difficulty together. */
  difficultyMultiplier: number;
  difficulty: Difficulty;
  /** A game started from the level select: no leaderboard, no trophies. */
  practice: boolean;

  score: number;
  lives: number;
  nextExtraLifeScore: number;
  /** Lives the player had before a boss granted temporary extra lives (restored when the boss falls). */
  livesBeforeBoss: number | null;

  player: Player;
  respawnPoint: { x: number; y: number };
  enemies: Enemy[];
  items: Item[];
  platforms: Platform[];
  checkpoints: Checkpoint[];
  goal: Goal | null;
  /** The first boss of the level, or null: kept for the single-boss fights; `bosses` has them all. */
  boss: Boss | null;
  /** Every boss on the level (one, or three in the final stage). */
  bosses: Boss[];
  projectiles: Projectile[];
  playerProjectiles: PlayerProjectile[];
  particles: Particle[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];

  screenShake: number;
  trailTick: number;
  cameraX: number;
  cameraY: number;
  prevCameraX: number;
  prevCameraY: number;
  levelWidth: number;
  levelHeight: number;
  /** The grid of a labyrinth level, null in every other level. */
  maze: MazeData | null;
  /** Camera zoom on the player: 1 shows the whole screen, more shows less of the map. */
  zoom: number;
  /** How big Debh is drawn (1 = normal); the labyrinth uses a smaller one with a smaller body. */
  playerScale: number;
  /** Increments every time a level is (re)loaded, so renderers know when to rebuild static content. */
  levelSerial: number;

  isGodMode: boolean;
  timeRemaining: number | null;
  /** Milliseconds of red damage flash left. */
  damageFlash: number;
  /** Milliseconds before the next level / completion event fires. */
  transitionTimer: number;
  bossDeathTick: number;
  /** Guards against losing two lives in one step. */
  hitThisStep: boolean;

  input: InputState;
  actions: Action[];
  events: EngineEvent[];
  rng: Rng;
  nextId: number;
  elapsed: number;
  /** What happened during this run, for the trophies (see stats.ts). */
  stats: RunStats;
}

export interface CreateWorldOptions {
  loopCount?: number;
  difficulty?: Difficulty;
  practice?: boolean;
  /** What the run has counted so far (a game that continues a saved one). */
  stats?: RunStats;
  score?: number;
  lives?: number;
  levelIndex?: number;
  levels?: LevelData[];
  rng?: Rng;
}

const emptyPlayer = (): Player => ({
  x: 0,
  y: 0,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  direction: 'right',
  isOnGround: false,
  jumpCount: 0,
  coyoteTimer: 0,
  jumpBufferTimer: 0,
  isInvincible: false,
  invincibilityTimer: 0,
  capturedEnemyId: null,
  hasShield: false,
  activePowerUp: null,
  powerUpTimer: 0,
  shootCooldown: 0,
  shootAnim: 0,
  aimX: 1,
  aimY: 0,
  throwAnim: 0,
  hurtAnim: 0,
});

export const nextExtraLifeFor = (score: number): number => {
  let n = EXTRA_LIFE_SCORE_START;
  while (n <= score) n *= 2;
  return n;
};

export function createWorld(opts: CreateWorldOptions = {}): World {
  const loopCount = opts.loopCount ?? 1;
  const score = opts.score ?? 0;
  const difficulty = opts.difficulty ?? 'normal';
  const stats = opts.stats ?? createStats();
  if (opts.practice) stats.tainted = true; // practice earns no trophies
  const w: World = {
    levels: opts.levels ?? defaultLevels,
    status: 'playing',
    currentLevelIndex: 0,
    loopCount,
    difficultyMultiplier: (1 + (loopCount - 1) * 0.2) * DIFFICULTY[difficulty].speed,
    difficulty,
    practice: Boolean(opts.practice),
    score,
    lives: opts.lives ?? DIFFICULTY[difficulty].lives,
    nextExtraLifeScore: nextExtraLifeFor(score),
    livesBeforeBoss: null,
    player: emptyPlayer(),
    respawnPoint: { x: 100, y: 100 },
    enemies: [],
    items: [],
    platforms: [],
    checkpoints: [],
    goal: null,
    boss: null,
    bosses: [],
    projectiles: [],
    playerProjectiles: [],
    particles: [],
    shockwaves: [],
    floatingTexts: [],
    screenShake: 0,
    trailTick: 0,
    cameraX: 0,
    cameraY: 0,
    prevCameraX: 0,
    prevCameraY: 0,
    levelWidth: GAME_WIDTH,
    levelHeight: GAME_HEIGHT,
    maze: null,
    zoom: 1,
    playerScale: 1,
    levelSerial: 0,
    isGodMode: false,
    timeRemaining: null,
    damageFlash: 0,
    transitionTimer: 0,
    bossDeathTick: 0,
    hitThisStep: false,
    input: emptyInput(),
    actions: [],
    events: [],
    rng: opts.rng ?? Math.random,
    nextId: 1,
    elapsed: 0,
    stats,
  };
  loadLevel(w, opts.levelIndex ?? 0);
  return w;
}

export const getNextId = (w: World): number => ++w.nextId;

export const emit = (w: World, e: EngineEvent): void => {
  w.events.push(e);
};

/**
 * Where the camera goes to keep the point (cx, cy) in the middle of the view. The result is the
 * top-left corner of the screen-sized area the renderer draws; with a zoom the renderer then
 * magnifies the middle of that area, so the corner can lie outside the level.
 */
export function cameraFor(w: World, cx: number, cy: number): { x: number; y: number } {
  const viewW = GAME_WIDTH / w.zoom;
  const viewH = GAME_HEIGHT / w.zoom;
  const x = Math.max(0, Math.min(cx - viewW / 2, w.levelWidth - viewW));
  const y = Math.max(0, Math.min(cy - viewH / 2, w.levelHeight - viewH));
  return { x: x - (GAME_WIDTH - viewW) / 2, y: y - (GAME_HEIGHT - viewH) / 2 };
}

export const isZeroG = (w: World): boolean =>
  w.bosses.some(b => b.type === 'shadowHead') || Boolean(w.levels[w.currentLevelIndex]?.isZeroG);

// ---------------------------------------------------------------------------
// Visual effect spawners (still part of the simulation so they stay deterministic)
// ---------------------------------------------------------------------------

export function spawnParticles(w: World, x: number, y: number, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = w.rng() * Math.PI * 2;
    const speed = 1.5 + w.rng() * 6.5;
    w.particles.push({
      id: getNextId(w),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color,
      size: w.rng() * 6 + 3,
    });
  }
  if (w.particles.length > MAX_PARTICLES) {
    w.particles.splice(0, w.particles.length - MAX_PARTICLES);
  }
}

export function spawnShockwave(
  w: World,
  x: number,
  y: number,
  color: string,
  maxRadius = 90,
  strokeWidth = 4
): void {
  w.shockwaves.push({
    id: getNextId(w),
    x,
    y,
    radius: 8,
    maxRadius,
    color,
    life: 1.0,
    strokeWidth,
  });
  if (w.shockwaves.length > 18) w.shockwaves.splice(0, w.shockwaves.length - 18);
}

export function spawnFloatingText(
  w: World,
  x: number,
  y: number,
  text: string,
  color = '#ffea00',
  scale = 1
): void {
  w.floatingTexts.push({
    id: getNextId(w),
    x,
    y,
    vy: -2.2,
    text,
    color,
    life: 1.0,
    scale,
  });
  if (w.floatingTexts.length > 16) w.floatingTexts.splice(0, w.floatingTexts.length - 16);
}

export function triggerShake(w: World, intensity: number): void {
  w.screenShake = Math.max(w.screenShake, intensity);
}

export function addScore(w: World, points: number): void {
  w.score += points;
  if (w.score >= w.nextExtraLifeScore) {
    if (w.lives < INITIAL_LIVES) {
      w.lives += 1;
      emit(w, { type: 'jingle', name: 'extraLife' });
    }
    w.nextExtraLifeScore *= 2;
  }
}

// ---------------------------------------------------------------------------
// Level loading
// ---------------------------------------------------------------------------

/** From the second LOOP the labyrinth fills up: a fifth more walkers for each extra lap, from the reserve. */
export function loopEnemies(level: LevelData, loopCount: number): LevelData['enemies'] {
  const reserve = level.loopEnemies ?? [];
  const extra = Math.round(level.enemies.length * MAZE_LOOP_ENEMY_SHARE * Math.max(0, loopCount - 1));
  return reserve.slice(0, Math.min(extra, reserve.length));
}

/** ...and a minute less on the clock for each extra lap, but never less than the floor the level sets. */
export function loopTimeLimit(level: LevelData, loopCount: number): number | null {
  if (level.timeLimit === undefined) return null;
  const cut = level.timeLimit - MAZE_LOOP_TIME_CUT * Math.max(0, loopCount - 1);
  return Math.min(level.timeLimit, Math.max(level.timeFloor ?? 0, cut));
}

export function loadLevel(w: World, levelIndex: number): void {
  const levelData = w.levels[levelIndex];
  const specs = levelData?.bosses ?? (levelData?.boss ? [levelData.boss] : []);

  if (!levelData) {
    w.status = 'completed';
    emit(w, { type: 'completed', score: w.score, lives: w.lives });
    return;
  }

  const calcWidth = () => {
    if (levelData.levelWidth) return levelData.levelWidth;
    if (!levelData.platforms || levelData.platforms.length === 0) return GAME_WIDTH;
    const allX = [
      ...levelData.platforms.map(p => p.x + p.width),
      ...levelData.items.map(i => i.x + i.width),
      ...levelData.enemies.map(e => e.x + e.width),
    ];
    const goalX = levelData.goal ? levelData.goal.x + levelData.goal.width : 0;
    const bossX = Math.max(0, ...specs.map(b => b.x + b.width));
    return Math.max(GAME_WIDTH, ...allX, goalX, bossX);
  };

  const calcHeight = () => {
    if (levelData.levelHeight) return levelData.levelHeight;
    if (!levelData.platforms || levelData.platforms.length === 0) return GAME_HEIGHT;
    const allY = [
      ...levelData.platforms.map(p => p.y + p.height),
      ...levelData.items.map(i => i.y + i.height),
      ...levelData.enemies.map(e => e.y + e.height),
    ];
    const goalY = levelData.goal ? levelData.goal.y + levelData.goal.height : 0;
    const bossY = Math.max(0, ...specs.map(b => b.y + b.height));
    return Math.max(GAME_HEIGHT, ...allY, goalY, bossY);
  };

  const width = calcWidth();
  const height = calcHeight();

  w.currentLevelIndex = levelIndex;
  w.levelSerial += 1;
  w.levelWidth = width;
  w.levelHeight = height;
  w.maze = levelData.maze ?? null;
  w.zoom = levelData.zoom ?? 1;
  // playerStart is for the legacy body; the labyrinth swaps it for the smaller footprint, same centre
  let spawn = {
    x: levelData.playerStart.x,
    y: levelData.playerStart.y - (PLAYER_HEIGHT - PLAYER_LEGACY_HEIGHT),
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
  w.playerScale = 1;
  if (w.maze) {
    w.playerScale = MAZE_PLAYER_SCALE;
    spawn = {
      x: spawn.x + (PLAYER_WIDTH - MAZE_PLAYER_WIDTH) / 2,
      y: spawn.y + (PLAYER_HEIGHT - MAZE_PLAYER_HEIGHT) / 2,
      width: MAZE_PLAYER_WIDTH,
      height: MAZE_PLAYER_HEIGHT,
    };
  }
  w.respawnPoint = { x: spawn.x, y: spawn.y };
  const cam = cameraFor(w, levelData.playerStart.x, levelData.playerStart.y);
  w.cameraX = cam.x;
  w.cameraY = cam.y;
  w.prevCameraX = w.cameraX;
  w.prevCameraY = w.cameraY;

  w.player = { ...emptyPlayer(), x: spawn.x, y: spawn.y, width: spawn.width, height: spawn.height };
  if (levelData.refill) {
    // before a big fight: all her lives back, and a shield
    w.lives = Math.max(w.lives, INITIAL_LIVES);
    w.player.hasShield = true;
  }

  w.platforms = levelData.platforms;
  w.checkpoints = (levelData.checkpoints || []).map((cp, idx) => ({
    id: idx + 1,
    ...cp,
    activated: false,
  }));
  w.projectiles = [];
  w.playerProjectiles = [];
  w.particles = [];
  w.shockwaves = [];
  w.floatingTexts = [];
  w.screenShake = 0;
  w.damageFlash = 0;
  w.transitionTimer = 0;
  w.bossDeathTick = 0;
  w.hitThisStep = false;
  w.stats.levelHits = 0;
  w.stats.levelLivesLost = 0;
  w.items = levelData.items.map((c, i) => ({ id: i + 1, ...c }));
  w.goal = levelData.goal ? { id: 1, ...levelData.goal } : null;
  w.timeRemaining = loopTimeLimit(levelData, w.loopCount);
  w.input = emptyInput();
  w.actions = [];

  const mult = w.difficultyMultiplier;

  if (specs.length > 0) {
    const bossLife = (full: number) => Math.max(1, Math.round(full * DIFFICULTY[w.difficulty].boss));
    w.bosses = specs.map((spec, i) => ({
      ...spec,
      maxHp: bossLife(spec.maxHp),
      hp: bossLife(spec.maxHp),
      vx: BOSS_INITIAL_VX * mult,
      vy: BOSS_INITIAL_VY * mult,
      // bosses that share an arena do not all start in the same breath
      attackCooldown: 2400 + i * 700,
      isHit: false,
      hitTimer: 0,
      isThrowing: false,
      movementTimer: 0,
      opacity: spec.type === 'shadowHead' ? 0 : 1,
      visibilityState: 'hidden',
      teleportTimer: 1600 + i * 900,
    }));
    w.boss = w.bosses[0];
    w.enemies = [];

    if (levelData.boss?.type === 'chickenEye') {
      // Endurance fight: temporary extra lives, handed back when the boss falls (see advanceLevel).
      w.livesBeforeBoss = w.livesBeforeBoss ?? w.lives;
      w.lives = Math.max(w.lives, Math.ceil(bossLife(levelData.boss.maxHp) / 2));
    }
  } else {
    w.bosses = [];
    w.boss = null;
    w.enemies = [...levelData.enemies, ...loopEnemies(levelData, w.loopCount)].map((e, i) => ({
      id: i + 1,
      ...e,
      vx:
        (e.type === 'flyer'
          ? FLYER_SPEED
          : e.type === 'bomber' || e.type === 'phaser'
          ? 0
          : ENEMY_SPEED) * mult,
      vy: (e.type === 'flyer' ? FLYER_VERTICAL_SPEED : 0) * mult,
      direction: 'right',
      state: 'active',
      jumpCooldown: e.type === 'jumper' ? ENEMY_JUMP_COOLDOWN : undefined,
      attackCooldown: e.type === 'bomber' ? BOMBER_ATTACK_COOLDOWN : undefined,
      stunTimer: 0,
      isSuperLaunched: false,
      onGround: false,
      launchTravel: 0,
    }));
  }

  w.status = 'playing';
  emit(w, { type: 'music', theme: levelData.musicTrack || levelData.musicTheme || (specs.length > 0 ? 'boss' : 'adventure') });
  emit(w, { type: 'jingle', name: 'levelStart' });
  emit(w, { type: 'level', index: levelIndex });
}

/** Called when the level-cleared banner has run its course. */
export function advanceLevel(w: World): void {
  if (w.livesBeforeBoss !== null) {
    w.lives = Math.min(w.lives, w.livesBeforeBoss);
    w.livesBeforeBoss = null;
  }
  const next = w.currentLevelIndex + 1;
  if (next >= w.levels.length) {
    w.status = 'completed';
    emit(w, { type: 'completed', score: w.score, lives: w.lives });
  } else {
    loadLevel(w, next);
  }
}
