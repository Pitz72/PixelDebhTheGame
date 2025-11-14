// Game dimensions
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// Player physics
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 70;
export const PLAYER_SPEED = 8;
export const PLAYER_FAST_SPEED = 12;
export const JUMP_FORCE = -25;
export const GRAVITY = 1;
export const PLAYER_INVINCIBILITY_DURATION = 3000; // in ms
export const PLAYER_SHOOT_COOLDOWN = 500; // in ms

// Player Projectile
export const PLAYER_PROJECTILE_WIDTH = 20;
export const PLAYER_PROJECTILE_HEIGHT = 20;
export const PLAYER_PROJECTILE_SPEED = 20;


// Power-up settings
export const POWER_UP_DURATION = 8000; // in ms
export const SUPER_THROW_EXPLOSION_RADIUS = 150;

// Enemy physics
export const ENEMY_SPEED = 2;
export const FLYER_SPEED = 3;
export const FLYER_VERTICAL_SPEED = 1;
export const FLYER_PATROL_RANGE = 50;
export const ENEMY_JUMP_FORCE = -20;
export const ENEMY_JUMP_COOLDOWN = 2000; // in ms
export const LAUNCH_FORCE = 40;
export const PHASER_SPEED = 1.5;
export const BOMBER_ATTACK_COOLDOWN = 3000; // in ms

// Bomb Projectile
export const BOMB_WIDTH = 24;
export const BOMB_HEIGHT = 24;
export const BOMB_INITIAL_VY = -15;
export const BOMB_HORIZONTAL_SPEED_MULTIPLIER = 0.1;


// Boss settings
export const BOSS_INITIAL_HP = 30;
export const BOSS_INITIAL_VX = 3;
export const BOSS_INITIAL_VY = 1;
export const BOSS_PROJECTILE_WIDTH = 35;
export const BOSS_PROJECTILE_HEIGHT = 35;
export const BOSS_PROJECTILE_SPEED = 8;

// Scoring
export const COLLECTIBLE_POINTS = 100;
export const ENEMY_DEFEAT_POINTS = 500;
export const EXTRA_LIFE_SCORE_START = 20000;
export const EXTRA_LIFE_SCORE_MULTIPLIER = 2;


// Game settings
export const INITIAL_LIVES = 3;

// Highscore settings
export const HIGHSCORE_KEY = 'pixelDebhHighscores';