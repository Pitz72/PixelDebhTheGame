// Game dimensions (Viewport)
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// Player physics
export const PLAYER_WIDTH = 54;
export const PLAYER_HEIGHT = 90; // was 74: the new, bigger Debh. The width stays so levels play the same.
/** Level data gives playerStart.y for the original 74px body; spawns are shifted so the feet stay where they were. */
export const PLAYER_LEGACY_HEIGHT = 74;
export const PLAYER_SPEED = 9;
export const PLAYER_FAST_SPEED = 14;
export const PLAYER_ACCEL = 2.2;
export const PLAYER_FRICTION = 0.80;
export const JUMP_FORCE = -25;
export const JUMP_CUT_MULTIPLIER = 0.55;
export const GRAVITY = 1;
export const MAX_FALL_SPEED = 22;
export const MAX_JUMPS = 2; // Double jump enabled
export const COYOTE_TIME_MS = 140; // Grace period after leaving platform edge
export const JUMP_BUFFER_MS = 140; // Pre-land jump input buffer
export const PLAYER_INVINCIBILITY_DURATION = 3000; // in ms
export const PLAYER_SHOOT_COOLDOWN = 420; // in ms
export const PLAYER_RAPID_SHOOT_COOLDOWN = 80; // in ms for Boss 3

// Labyrinth (final level): crisp four-way movement, camera zoomed on the player
export const MAZE_PLAYER_SPEED = 9;
export const MAZE_PLAYER_FAST_SPEED = 14;
export const MAZE_ZOOM = 1.6;

// Player Projectile
export const PLAYER_PROJECTILE_WIDTH = 24;
export const PLAYER_PROJECTILE_HEIGHT = 24;
export const PLAYER_PROJECTILE_SPEED = 22;

// Power-up settings
export const POWER_UP_DURATION = 10000; // in ms
export const SUPER_THROW_EXPLOSION_RADIUS = 220;

// Enemy physics
export const ENEMY_SPEED = 2.2;
export const FLYER_SPEED = 3.2;
export const FLYER_VERTICAL_SPEED = 1.2;
export const FLYER_PATROL_RANGE = 65;
export const ENEMY_JUMP_FORCE = -20;
export const ENEMY_JUMP_COOLDOWN = 2000; // in ms
export const LAUNCH_FORCE = 38;
export const PHASER_SPEED = 1.8;
export const BOMBER_ATTACK_COOLDOWN = 2800; // in ms
export const GROUND_PATROL_RANGE = 320; // ground enemies turn back after this distance from their spawn point
export const LAUNCH_MAX_DISTANCE = 1000; // a launched enemy pops after travelling this far (px)

// Bomb Projectile
export const BOMB_WIDTH = 26;
export const BOMB_HEIGHT = 26;
export const BOMB_INITIAL_VY = -15;
export const BOMB_HORIZONTAL_SPEED_MULTIPLIER = 0.09; // legacy, no longer used (bombs are now aimed ballistically)
export const BOMB_MAX_HORIZONTAL_SPEED = 16;
export const BOMB_AIM_SPREAD = 0.12; // +/- 6% random error on the horizontal speed

// Boss settings
export const BOSS_INITIAL_HP = 30;
export const BOSS_INITIAL_VX = 3.2;
export const BOSS_INITIAL_VY = 1.4;
export const BOSS_PROJECTILE_WIDTH = 38;
export const BOSS_PROJECTILE_HEIGHT = 38;
export const BOSS_PROJECTILE_SPEED = 8.5;

// Boss 2 Specifics
export const BOSS_2_HP = 45;
export const EGG_PROJECTILE_WIDTH = 32;
export const EGG_PROJECTILE_HEIGHT = 42;

// Boss 3 Specifics (CapocciaNelBuio)
export const BOSS_3_HP = 54;
export const FIREBALL_WIDTH = 42;
export const FIREBALL_HEIGHT = 42;
export const FIREBALL_SPEED = 12;

// Scoring
export const COLLECTIBLE_POINTS = 100;
export const ENEMY_DEFEAT_POINTS = 500;
export const CHECKPOINT_POINTS = 250;
export const EXTRA_LIFE_SCORE_START = 20000;
export const EXTRA_LIFE_SCORE_MULTIPLIER = 2;

// Game settings
export const INITIAL_LIVES = 3;
export const MAX_PARTICLES = 360;

// Highscore settings
export const HIGHSCORE_KEY = 'pixelDebhHighscores';