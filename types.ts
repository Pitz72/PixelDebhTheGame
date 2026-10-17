export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DynamicObject extends GameObject {
  vx: number;
  vy: number;
  /** Position at the start of the previous simulation step (used by the renderer to interpolate). */
  prevX?: number;
  prevY?: number;
}

export interface Player extends DynamicObject {
  direction: 'left' | 'right';
  isOnGround: boolean;
  jumpCount: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  isInvincible: boolean;
  invincibilityTimer: number;
  capturedEnemyId: number | null;
  hasShield: boolean;
  activePowerUp: ItemType | null;
  powerUpTimer: number;
  shootCooldown: number;
  // Animation cues for the renderer (milliseconds left, aim as a unit vector)
  shootAnim?: number;
  aimX?: number;
  aimY?: number;
  throwAnim?: number;
  hurtAnim?: number;
}

export type EnemyType = 'base' | 'jumper' | 'flyer' | 'bomber' | 'phaser';
export type EnemyState = 'active' | 'captured' | 'launched' | 'defeated' | 'stunned';

export interface Enemy extends DynamicObject {
  id: number;
  type: EnemyType;
  state: EnemyState;
  originalX: number;
  originalY: number;
  direction: 'left' | 'right';
  jumpCooldown?: number;
  stunTimer?: number;
  attackCooldown?: number;
  isSuperLaunched?: boolean;
  /** True when the last physics step left the enemy standing on a platform. */
  onGround?: boolean;
  /** Distance covered since being launched (px). */
  launchTravel?: number;
  /** Labyrinth only: heading along the corridors (0 east, 1 south, 2 west, 3 north). */
  mazeDir?: number;
  /** Labyrinth only: index of the cell where this enemy last chose a heading. */
  mazeCell?: number;
}

/** Things to collect: retro gaming gear (Debh is a retro-gaming collector), introduced a few at a time. */
export type CollectibleType =
  | 'joystick'
  | 'floppy'
  | 'cartridge'
  | 'cassette'
  | 'token'
  | 'atari2600'
  | 'amiga500'
  | 'crt'
  | 'cdrom'
  | 'nes'
  | 'sega';
export type PowerUpType = 'speed-boost' | 'shield' | 'super-throw';
export type ItemType = CollectibleType | PowerUpType;
export interface Item extends GameObject {
  id: number;
  type: ItemType;
}

export interface Platform extends GameObject {
  /** A wall of the labyrinth: drawn as a neon wall instead of a platform. */
  wall?: boolean;
}

export interface Goal extends GameObject {
  id: number;
}

export interface Checkpoint extends GameObject {
  id: number;
  activated: boolean;
}

export type BossType = 'frog' | 'chickenEye' | 'shadowHead';

export interface BossArena {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Boss extends DynamicObject {
  type: BossType;
  hp: number;
  maxHp: number;
  attackCooldown: number;
  isHit: boolean;
  hitTimer: number;
  isThrowing: boolean;
  movementTimer: number;
  /**
   * Where this boss moves, when several share one arena: its own patch of it. Without one, a boss
   * roams the whole level as before.
   */
  arena?: BossArena;

  // ShadowHead Specifics
  opacity?: number;
  visibilityState?: 'fadingIn' | 'visible' | 'fadingOut' | 'hidden';
  teleportTimer?: number;
}

export interface Projectile extends DynamicObject {
  id: number;
  /** Simulation steps since spawn. */
  age?: number;
  isBomb?: boolean;
  isEgg?: boolean;
  isFireball?: boolean;
}

export interface PlayerProjectile extends DynamicObject {
  id: number;
}

export interface EnemySpawnPoint {
  x: number;
  y: number;
  cooldown: number;
  timer: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

/**
 * The grid behind a labyrinth level. Cells are corridors `pitch - wall` wide separated by walls
 * `wall` thick; the outer wall is `wall` thick too, so the level is `wall + cols * pitch` wide.
 */
export interface MazeData {
  cols: number;
  rows: number;
  pitch: number;
  wall: number;
  /** openRight[r * cols + c]: no wall between cell (c, r) and (c + 1, r). */
  openRight: boolean[];
  /** openDown[r * cols + c]: no wall between cell (c, r) and (c, r + 1). */
  openDown: boolean[];
}

export type MusicTheme = 'adventure' | 'industrial' | 'ethereal' | 'boss';

export type BossSpec = Omit<Boss, 'hp' | 'attackCooldown' | 'isHit' | 'hitTimer' | 'vy' | 'isThrowing' | 'vx' | 'movementTimer'>;

export interface LevelData {
  name: string;
  /** Picks the colors of the level (and the music, unless musicTrack says otherwise). */
  musicTheme: MusicTheme;
  /** Name of the music track when it should differ from the theme (one per boss). */
  musicTrack?: string;
  isZeroG?: boolean;
  /**
   * A labyrinth: four-way movement without inertia, enemies that follow the corridors and
   * every item on the map has to be collected before the exit opens.
   */
  maze?: MazeData;
  /** Camera zoom on the player; 1 shows the whole screen, more shows less of the map. */
  zoom?: number;
  timeLimit?: number;
  levelWidth?: number;
  levelHeight?: number;
  platforms: Omit<Platform, 'id'>[];
  items: Omit<Item, 'id'>[];
  enemies: Omit<Enemy, 'id' | 'state' | 'vx' | 'vy' | 'direction' | 'jumpCooldown' | 'stunTimer' | 'attackCooldown' | 'isSuperLaunched' | 'onGround' | 'launchTravel'>[];
  checkpoints?: Omit<Checkpoint, 'id' | 'activated'>[];
  playerStart: { x: number; y: number };
  goal?: Omit<Goal, 'id'>;
  boss?: BossSpec;
  /** Several bosses at once, in one arena (the final stage). Use `boss` for a single one. */
  bosses?: BossSpec[];
  /** Labyrinth: walkers held in reserve, that join in from the second LOOP on (see `loopEnemies` in the engine). */
  loopEnemies?: LevelData['enemies'];
  /** Labyrinth: the least time the clock may show, however many LOOPs have been played. */
  timeFloor?: number;
  /** The player arrives with all her lives and a shield (before a big fight). */
  refill?: boolean;
  /** A set of its own for the background, when the colors of the theme are not enough. */
  backdrop?: 'vault';
  enemySpawns?: Omit<EnemySpawnPoint, 'timer'>[];
}

export type GameState = 'boot' | 'notice' | 'intro' | 'start' | 'playing' | 'level-cleared' | 'completed' | 'gameover' | 'highscore' | 'enter-highscore';

export interface HighscoreEntry {
  name: string;
  score: number;
}