
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DynamicObject extends GameObject {
  vx: number;
  vy: number;
}

export interface Player extends DynamicObject {
  direction: 'left' | 'right';
  isOnGround: boolean;
  jumpCount: number; // Added for double jump
  isInvincible: boolean;
  invincibilityTimer: number;
  capturedEnemyId: number | null;
  hasShield: boolean;
  activePowerUp: ItemType | null;
  powerUpTimer: number;
  shootCooldown: number;
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
}

export type ItemType = 'joystick' | 'floppy' | 'cartridge' | 'speed-boost' | 'shield' | 'super-throw';
export interface Item extends GameObject {
  id: number;
  type: ItemType;
}

export interface Platform extends GameObject {}

export interface Goal extends GameObject {
  id: number;
}

export type BossType = 'frog' | 'chickenEye' | 'shadowHead';

export interface Boss extends DynamicObject {
  type: BossType;
  hp: number;
  maxHp: number;
  attackCooldown: number;
  isHit: boolean;
  hitTimer: number;
  isThrowing: boolean;
  movementTimer: number; // Used for complex patterns (like figure-8)
  
  // ShadowHead Specifics
  opacity?: number;
  visibilityState?: 'fadingIn' | 'visible' | 'fadingOut' | 'hidden';
  teleportTimer?: number;
}

export interface Projectile extends DynamicObject {
  id: number;
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

// New Interface for Particles
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

export type MusicTheme = 'adventure' | 'industrial' | 'ethereal' | 'boss';

export interface LevelData {
  name: string;
  musicTheme: MusicTheme; // New property for music variety
  isZeroG?: boolean; // New property for Zero-G levels (like the labyrinth)
  platforms: Omit<Platform, 'id'>[];
  items: Omit<Item, 'id'>[];
  enemies: Omit<Enemy, 'id' | 'state' | 'vx' | 'vy' | 'direction' | 'jumpCooldown' | 'stunTimer' | 'attackCooldown'>[];
  playerStart: { x: number; y: number };
  goal?: Omit<Goal, 'id'>;
  boss?: Omit<Boss, 'hp' | 'attackCooldown' | 'isHit' | 'hitTimer' | 'vy' | 'isThrowing' | 'vx' | 'movementTimer'>;
  enemySpawns?: Omit<EnemySpawnPoint, 'timer'>[];
}

export type GameState = 'intro' | 'start' | 'playing' | 'level-cleared' | 'completed' | 'gameover' | 'highscore' | 'enter-highscore';

export interface HighscoreEntry {
  name: string;
  score: number;
}