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
  isInvincible: boolean;
  invincibilityTimer: number;
  capturedEnemyId: number | null;
  hasShield: boolean;
  activePowerUp: ItemType | null;
  powerUpTimer: number;
  shootCooldown: number;
}

export type EnemyType = 'base' | 'jumper' | 'flyer';
export type EnemyState = 'active' | 'captured' | 'launched' | 'defeated';

export interface Enemy extends DynamicObject {
  id: number;
  type: EnemyType;
  state: EnemyState;
  originalX: number;
  originalY: number;
  direction: 'left' | 'right';
  jumpCooldown?: number;
}

export type ItemType = 'joystick' | 'floppy' | 'cartridge' | 'speed-boost' | 'shield' | 'super-throw';
export interface Item extends GameObject {
  id: number;
  type: ItemType;
}

export interface Platform extends GameObject {}

export interface Boss extends DynamicObject {
  hp: number;
  maxHp: number;
  attackCooldown: number;
  isHit: boolean;
  hitTimer: number;
  isHopping: boolean;
  isThrowing: boolean;
}

export interface Projectile extends DynamicObject {
  id: number;
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

export interface LevelData {
  platforms: Omit<Platform, 'id'>[];
  items: Omit<Item, 'id'>[];
  enemies: Omit<Enemy, 'id' | 'state' | 'vx' | 'vy' | 'direction' | 'jumpCooldown'>[];
  playerStart: { x: number; y: number };
  boss?: Omit<Boss, 'hp' | 'attackCooldown' | 'isHit' | 'hitTimer' | 'vy' | 'isHopping' | 'isThrowing'>;
  enemySpawns?: Omit<EnemySpawnPoint, 'timer'>[];
}

export type GameState = 'intro' | 'start' | 'playing' | 'level-cleared' | 'completed' | 'gameover';