import { Boss, CollectibleType, Enemy, ItemType, MazeData, Projectile } from '../types';
import {
  GRAVITY,
  MAX_FALL_SPEED,
  PLAYER_SPEED,
  PLAYER_FAST_SPEED,
  MAZE_PLAYER_SPEED,
  MAZE_PLAYER_FAST_SPEED,
  FLYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_FRICTION,
  JUMP_FORCE,
  JUMP_CUT_MULTIPLIER,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  PLAYER_INVINCIBILITY_DURATION,
  ENEMY_SPEED,
  FLYER_PATROL_RANGE,
  ENEMY_JUMP_FORCE,
  ENEMY_JUMP_COOLDOWN,
  LAUNCH_FORCE,
  LAUNCH_MAX_DISTANCE,
  GROUND_PATROL_RANGE,
  POWER_UP_DURATION,
  SUPER_THROW_EXPLOSION_RADIUS,
  COLLECTIBLE_POINTS,
  ENEMY_DEFEAT_POINTS,
  CHECKPOINT_POINTS,
  PLAYER_PROJECTILE_SPEED,
  PLAYER_PROJECTILE_WIDTH,
  PLAYER_PROJECTILE_HEIGHT,
  PLAYER_SHOOT_COOLDOWN,
  PLAYER_RAPID_SHOOT_COOLDOWN,
  BOSS_PROJECTILE_SPEED,
  BOSS_PROJECTILE_WIDTH,
  BOSS_PROJECTILE_HEIGHT,
  PHASER_SPEED,
  BOMBER_ATTACK_COOLDOWN,
  BOMB_WIDTH,
  BOMB_HEIGHT,
  BOMB_INITIAL_VY,
  BOMB_MAX_HORIZONTAL_SPEED,
  BOMB_AIM_SPREAD,
  MAX_JUMPS,
  EGG_PROJECTILE_WIDTH,
  EGG_PROJECTILE_HEIGHT,
  FIREBALL_SPEED,
  FIREBALL_WIDTH,
  FIREBALL_HEIGHT,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLLECTIBLE_TYPES,
  MAZE_PICKUP_MARGIN,
} from '../constants';
import {
  World,
  emit,
  getNextId,
  isZeroG,
  spawnParticles,
  spawnShockwave,
  spawnFloatingText,
  triggerShake,
  addScore,
  advanceLevel,
  cameraFor,
} from './world';
import { HEADINGS, cellAt, cellCenter, isOpen } from './mazeGrid';

/** The simulation advances in fixed 60 Hz steps, independent of the display refresh rate. */
export const STEP_MS = 1000 / 60;
const DT = 1;

type Rect = { x: number; y: number; width: number; height: number };

export const areRectsColliding = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Hurtbox collision with slight padding so damage only triggers on true visual body contact. */
export const areHurtboxesColliding = (
  playerRect: Rect,
  hazardRect: Rect,
  playerPadX = 8,
  playerPadY = 6,
  hazardPadX = 6,
  hazardPadY = 6
): boolean => {
  const px1 = playerRect.x + playerPadX;
  const py1 = playerRect.y + playerPadY;
  const px2 = playerRect.x + playerRect.width - playerPadX;
  const py2 = playerRect.y + playerRect.height - playerPadY;

  const hx1 = hazardRect.x + hazardPadX;
  const hy1 = hazardRect.y + hazardPadY;
  const hx2 = hazardRect.x + hazardRect.width - hazardPadX;
  const hy2 = hazardRect.y + hazardRect.height - hazardPadY;

  return px1 < hx2 && px2 > hx1 && py1 < hy2 && py2 > hy1;
};

const sound = (w: World, name: string) => emit(w, { type: 'sound', name });

/** Height of Debh's shoulder above her feet, and how far the gamepad reaches from it (game pixels). */
const SHOULDER_HEIGHT = 78;
const MUZZLE_REACH = 40;

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** Remember where everything was, so the renderer can interpolate between two fixed steps. */
function rememberPrev(w: World): void {
  const keep = (o: { x: number; y: number; prevX?: number; prevY?: number }) => {
    o.prevX = o.x;
    o.prevY = o.y;
  };
  keep(w.player);
  for (const e of w.enemies) keep(e);
  for (const p of w.projectiles) keep(p);
  for (const p of w.playerProjectiles) keep(p);
  for (const b of w.bosses) keep(b);
  w.prevCameraX = w.cameraX;
  w.prevCameraY = w.cameraY;
}

export function step(w: World): void {
  w.elapsed += STEP_MS;
  if (w.damageFlash > 0) w.damageFlash = Math.max(0, w.damageFlash - STEP_MS);
  if (w.isGodMode) w.stats.tainted = true; // a run played with the cheat on earns no trophies

  rememberPrev(w);
  processActions(w);

  if (w.status === 'level-cleared') {
    stepLevelCleared(w);
    return;
  }
  if (w.status !== 'playing') return;

  w.hitThisStep = false;
  const zeroG = isZeroG(w);

  // 1. Level timer
  if (w.timeRemaining !== null) {
    w.timeRemaining -= STEP_MS / 1000;
    if (w.timeRemaining <= 0) {
      w.timeRemaining = 0;
      triggerGameOver(w);
      return;
    }
  }

  updatePlayerTimers(w);
  updatePlayerShooting(w);
  updatePlayerMovement(w, zeroG);
  if (w.status !== 'playing') return;

  updateCamera(w);
  updateFx(w, zeroG);
  for (const b of w.bosses) updateBoss(w, b);
  updateProjectiles(w, zeroG);
  updateEnemies(w, zeroG);
  if (w.status !== 'playing') return;

  checkPlayerDamage(w);
  if (w.status !== 'playing') return;

  updatePlayerProjectileHits(w);
  if (w.status !== 'playing') return;

  updateCheckpoints(w);
  updateItems(w);
  updateGoal(w);
}

// ---------------------------------------------------------------------------
// Actions queued by the input layer (processed at the start of the step)
// ---------------------------------------------------------------------------

function processActions(w: World): void {
  const actions = w.actions;
  w.actions = [];
  for (const a of actions) {
    if (w.status !== 'playing') continue;
    if (a === 'jump') doJump(w);
    else if (a === 'jumpRelease') doJumpRelease(w);
    else if (a === 'capture') doCaptureOrLaunch(w);
  }
}

function doJump(w: World): void {
  if (isZeroG(w)) return;
  const p = w.player;
  if (p.isOnGround || p.coyoteTimer > 0) {
    sound(w, 'jump');
    spawnParticles(w, p.x + p.width / 2, p.y + p.height, '#00e5ff', 8);
    spawnShockwave(w, p.x + p.width / 2, p.y + p.height, '#00e5ff', 48, 3);
    p.vy = JUMP_FORCE;
    p.isOnGround = false;
    p.coyoteTimer = 0;
    p.jumpCount = 1;
    p.jumpBufferTimer = 0;
  } else if (p.jumpCount < MAX_JUMPS) {
    sound(w, 'doubleJump');
    spawnParticles(w, p.x + p.width / 2, p.y + p.height, '#ffea00', 12);
    spawnShockwave(w, p.x + p.width / 2, p.y + p.height, '#ffea00', 64, 3.5);
    p.vy = JUMP_FORCE * 0.94;
    p.jumpCount += 1;
    p.jumpBufferTimer = 0;
  } else {
    // Buffer the jump if pressed slightly before landing
    p.jumpBufferTimer = JUMP_BUFFER_MS;
  }
}

function doJumpRelease(w: World): void {
  // Variable jump height: release early to cut upward velocity
  if (!isZeroG(w) && w.player.vy < -8) {
    w.player.vy *= JUMP_CUT_MULTIPLIER;
  }
}

function doCaptureOrLaunch(w: World): void {
  if (w.bosses.length > 0) return;
  const p = w.player;
  const zeroG = isZeroG(w);

  if (p.capturedEnemyId !== null) {
    sound(w, 'launch');
    const isSuper = p.activePowerUp === 'super-throw';
    spawnShockwave(
      w,
      p.x + p.width / 2,
      p.y + p.height / 2,
      isSuper ? '#ff6d00' : '#00e5ff',
      isSuper ? 95 : 65,
      isSuper ? 4.5 : 3
    );
    if (isSuper) triggerShake(w, 6);
    p.throwAnim = 260;
    const held = w.enemies.find(en => en.id === p.capturedEnemyId);
    if (held) {
      held.state = 'launched';
      held.vx = p.direction === 'right' ? LAUNCH_FORCE : -LAUNCH_FORCE;
      held.vy = zeroG ? 0 : -6;
      held.isSuperLaunched = isSuper;
      held.launchTravel = 0;
      held.onGround = false;
    }
    if (isSuper) {
      p.activePowerUp = null;
      p.powerUpTimer = 0;
    }
    p.capturedEnemyId = null;
    return;
  }

  const captureRange = {
    x: p.x - 28,
    y: p.y - 16,
    width: p.width + 56,
    height: p.height + 32,
  };
  const nearby = w.enemies.find(
    en => (en.state === 'active' || en.state === 'stunned') && areRectsColliding(captureRange, en)
  );
  if (nearby) {
    sound(w, 'capture');
    const cx = nearby.x + nearby.width / 2;
    const cy = nearby.y + nearby.height / 2;
    spawnParticles(w, cx, cy, '#d500f9', 14);
    spawnShockwave(w, cx, cy, '#d500f9', 70, 3.5);
    spawnFloatingText(w, cx, nearby.y - 8, 'CAPTURED!', '#e040fb', 0.9);
    nearby.state = 'captured';
    nearby.stunTimer = 0;
    p.capturedEnemyId = nearby.id;
  }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

function updatePlayerTimers(w: World): void {
  const p = w.player;
  if (p.shootCooldown > 0) p.shootCooldown = Math.max(0, p.shootCooldown - STEP_MS);
  if ((p.shootAnim ?? 0) > 0) p.shootAnim = Math.max(0, (p.shootAnim ?? 0) - STEP_MS);
  if ((p.throwAnim ?? 0) > 0) p.throwAnim = Math.max(0, (p.throwAnim ?? 0) - STEP_MS);
  if ((p.hurtAnim ?? 0) > 0) p.hurtAnim = Math.max(0, (p.hurtAnim ?? 0) - STEP_MS);
  if (p.coyoteTimer > 0) p.coyoteTimer = Math.max(0, p.coyoteTimer - STEP_MS);
  if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - STEP_MS);
  if (p.isInvincible) {
    p.invincibilityTimer -= STEP_MS;
    if (p.invincibilityTimer <= 0) p.isInvincible = false;
  }
  if (p.powerUpTimer > 0) {
    p.powerUpTimer -= STEP_MS;
    if (p.powerUpTimer <= 0 && p.activePowerUp === 'speed-boost') {
      p.activePowerUp = null;
    }
  }

  // Speed-boost neon trail particles
  w.trailTick += DT;
  if (p.activePowerUp === 'speed-boost' && Math.abs(p.vx) > 1 && w.trailTick > 1.8) {
    w.trailTick = 0;
    spawnParticles(w, p.x + p.width / 2, p.y + p.height - 10, '#ffea00', 2);
  }
}

function updatePlayerShooting(w: World): void {
  const p = w.player;
  const canShoot = w.bosses.length > 0 || Boolean(w.levels[w.currentLevelIndex]?.isZeroG);
  if (!w.input.shoot || !canShoot || p.shootCooldown > 0) return;

  sound(w, 'playerShoot');
  const speed = PLAYER_PROJECTILE_SPEED;
  let vx = p.direction === 'right' ? speed : -speed;
  let vy = 0;

  const { up, down, left, right } = w.input;
  if (up && !down) vy = -speed;
  else if (down && !up) vy = speed;

  if (left && !right) vx = -speed;
  else if (right && !left) vx = speed;

  if ((up || down) && !left && !right) vx = 0;

  if (vx !== 0 && vy !== 0) {
    const inv = 1 / Math.sqrt(2);
    vx *= inv;
    vy *= inv;
  }

  // the last boss alone is fought with rapid fire; against several at once the normal rhythm holds
  const rapid = w.bosses.length === 1 && w.bosses[0].type === 'shadowHead';
  p.shootCooldown = rapid ? PLAYER_RAPID_SHOOT_COOLDOWN : PLAYER_SHOOT_COOLDOWN;
  const mag = Math.hypot(vx, vy) || 1;
  p.aimX = vx / mag;
  p.aimY = vy / mag;
  p.shootAnim = p.shootCooldown * 0.9 + 140;

  // Shots leave from the gamepad she holds out: shoulder height, a bit along the aim direction.
  const muzzleX = p.x + p.width / 2 + (p.aimX ?? 1) * MUZZLE_REACH * w.playerScale;
  const muzzleY = p.y + p.height - SHOULDER_HEIGHT * w.playerScale + (p.aimY ?? 0) * MUZZLE_REACH * w.playerScale;
  const spawnX = muzzleX - PLAYER_PROJECTILE_WIDTH / 2;
  const spawnY = muzzleY - PLAYER_PROJECTILE_HEIGHT / 2;
  spawnParticles(w, spawnX + 10, spawnY + 10, '#00e5ff', 3);

  w.playerProjectiles.push({
    id: getNextId(w),
    x: spawnX,
    y: spawnY,
    width: PLAYER_PROJECTILE_WIDTH,
    height: PLAYER_PROJECTILE_HEIGHT,
    vx,
    vy,
  });
}

/** Labyrinth movement: the player goes exactly where the keys point, at a constant speed. */
function updateMazeMovement(w: World): void {
  const p = w.player;
  const { left, right, up, down } = w.input;
  const speed = p.activePowerUp === 'speed-boost' ? MAZE_PLAYER_FAST_SPEED : MAZE_PLAYER_SPEED;
  let dx = (right ? 1 : 0) - (left ? 1 : 0);
  let dy = (down ? 1 : 0) - (up ? 1 : 0);
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  p.vx = dx * speed;
  p.vy = dy * speed;
  if (dx < 0) p.direction = 'left';
  else if (dx > 0) p.direction = 'right';
  moveInZeroG(w);
}

/** Axis-separated AABB collision for the zero-G levels (no sticky walls). */
function moveInZeroG(w: World): void {
  const p = w.player;
  p.x += p.vx * DT;
  if (p.x < 0) p.x = 0;
  if (p.x + p.width > w.levelWidth) p.x = w.levelWidth - p.width;

  for (const plat of w.platforms) {
    if (areRectsColliding(p, plat)) {
      if (p.vx > 0) p.x = plat.x - p.width;
      else if (p.vx < 0) p.x = plat.x + plat.width;
      p.vx = 0;
    }
  }

  p.y += p.vy * DT;
  if (p.y < 0) p.y = 0;
  if (p.y + p.height > w.levelHeight) p.y = w.levelHeight - p.height;

  for (const plat of w.platforms) {
    if (areRectsColliding(p, plat)) {
      if (p.vy > 0) p.y = plat.y - p.height;
      else if (p.vy < 0) p.y = plat.y + plat.height;
      p.vy = 0;
    }
  }
}

function updatePlayerMovement(w: World, zeroG: boolean): void {
  if (w.maze) {
    updateMazeMovement(w);
    return;
  }
  const p = w.player;
  const { left, right, up, down } = w.input;
  const maxSpeed = p.activePowerUp === 'speed-boost' ? PLAYER_FAST_SPEED : PLAYER_SPEED;

  if (left && !right) {
    p.vx = Math.max(-maxSpeed, p.vx - PLAYER_ACCEL * DT);
    p.direction = 'left';
  } else if (right && !left) {
    p.vx = Math.min(maxSpeed, p.vx + PLAYER_ACCEL * DT);
    p.direction = 'right';
  } else {
    p.vx *= Math.pow(PLAYER_FRICTION, DT);
    if (Math.abs(p.vx) < 0.15) p.vx = 0;
  }

  const prevPlayerY = p.y;
  const wasOnGround = p.isOnGround;

  if (zeroG) {
    if (up && !down) p.vy = -maxSpeed;
    else if (down && !up) p.vy = maxSpeed;
    else p.vy *= Math.pow(PLAYER_FRICTION, DT);
  } else {
    p.vy = Math.min(MAX_FALL_SPEED, p.vy + GRAVITY * DT);
  }

  if (zeroG) {
    moveInZeroG(w);
    return;
  }

  // Standard platformer physics
  p.x += p.vx * DT;
  if (p.x < 0) p.x = 0;
  if (p.x + p.width > w.levelWidth) p.x = w.levelWidth - p.width;

  p.y += p.vy * DT;
  p.isOnGround = false;

  for (const plat of w.platforms) {
    const horizontallyAligned = p.x + p.width > plat.x + 4 && p.x < plat.x + plat.width - 4;
    if (!horizontallyAligned) continue;

    // Landing on top of platform
    if (p.vy >= 0 && prevPlayerY + p.height <= plat.y + 14 && p.y + p.height >= plat.y) {
      if (!wasOnGround && p.vy > 10) {
        spawnParticles(w, p.x + p.width / 2, plat.y, '#84ffff', 4);
      }
      p.y = plat.y - p.height;
      p.vy = 0;
      p.isOnGround = true;
      p.jumpCount = 0;
      p.coyoteTimer = COYOTE_TIME_MS;

      // Execute buffered jump immediately on landing
      if (p.jumpBufferTimer > 0) {
        sound(w, 'jump');
        spawnParticles(w, p.x + p.width / 2, p.y + p.height, '#00e5ff', 8);
        spawnShockwave(w, p.x + p.width / 2, p.y + p.height, '#00e5ff', 48, 3);
        p.vy = JUMP_FORCE;
        p.isOnGround = false;
        p.coyoteTimer = 0;
        p.jumpCount = 1;
        p.jumpBufferTimer = 0;
      }
    }
    // Hitting platform from below (head bump + enemy stun shockwave)
    else if (p.vy < 0 && prevPlayerY >= plat.y + plat.height - 12 && p.y < plat.y + plat.height) {
      p.y = plat.y + plat.height;
      p.vy = 0;
      sound(w, 'hit');
      const bumpX = p.x + p.width / 2;
      spawnParticles(w, bumpX, p.y, '#00e5ff', 8);
      spawnShockwave(w, bumpX, plat.y, '#00e5ff', 175, 4);
      triggerShake(w, 4);

      for (const en of w.enemies) {
        const enemyCenterX = en.x + en.width / 2;
        if (
          en.state === 'active' &&
          Math.abs(en.y + en.height - plat.y) < 14 &&
          en.x + en.width > plat.x &&
          en.x < plat.x + plat.width &&
          Math.abs(enemyCenterX - bumpX) <= 180
        ) {
          en.state = 'stunned';
          en.stunTimer = 3500;
          en.vx = 0;
          spawnFloatingText(w, enemyCenterX, en.y - 10, 'STUNNED!', '#ffea00', 0.95);
        }
      }
    }
  }

  // Start coyote time if the player just walked off a ledge without jumping
  if (wasOnGround && !p.isOnGround && p.vy >= 0) {
    p.coyoteTimer = COYOTE_TIME_MS;
  }

  // Pit fall (uses the real level height)
  if (p.y > w.levelHeight + 60) {
    fallIntoPit(w);
  }
}

// ---------------------------------------------------------------------------
// Damage / lives
// ---------------------------------------------------------------------------

function triggerGameOver(w: World): void {
  sound(w, 'gameOver');
  w.status = 'gameover';
  emit(w, { type: 'gameOver', score: w.score });
}

/** Hands a held enemy back to the world (at its spawn point) when the player is hit or falls. */
function releaseCapturedEnemy(w: World): void {
  const p = w.player;
  if (p.capturedEnemyId === null) return;
  const held = w.enemies.find(en => en.id === p.capturedEnemyId);
  if (held) {
    held.state = 'active';
    held.x = held.prevX = held.originalX;
    held.y = held.prevY = held.originalY;
    held.vx = (held.direction === 'left' ? -1 : 1) * ENEMY_SPEED * w.difficultyMultiplier;
    held.vy = 0;
    held.onGround = false;
  }
  p.capturedEnemyId = null;
}

function respawnPlayer(w: World): void {
  emit(w, { type: 'jingle', name: 'respawn' });
  // Mutate in place so nobody keeps a stale reference to the old player object.
  Object.assign(w.player, {
    x: w.respawnPoint.x,
    y: w.respawnPoint.y,
    prevX: w.respawnPoint.x, // a teleport must not be interpolated
    prevY: w.respawnPoint.y,
    vx: 0,
    vy: 0,
    isInvincible: true,
    invincibilityTimer: PLAYER_INVINCIBILITY_DURATION,
    capturedEnemyId: null,
    jumpCount: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
  });
}

function loseLife(w: World): void {
  w.stats.livesLost += 1;
  w.stats.levelLivesLost += 1;
  w.lives -= 1;
  if (w.lives <= 0) {
    triggerGameOver(w);
  } else {
    respawnPlayer(w);
  }
}

function hurtEffects(w: World): void {
  const p = w.player;
  sound(w, 'damage');
  triggerShake(w, 15);
  spawnParticles(w, p.x + p.width / 2, p.y + p.height / 2, '#ff1744', 28);
  spawnShockwave(w, p.x + p.width / 2, p.y + p.height / 2, '#ff1744', 130, 5);
  spawnFloatingText(w, p.x + p.width / 2, p.y - 12, 'OUCH!', '#ff1744', 1.2);
}

/** A hit from an enemy or projectile. At most one damage event is processed per step. */
export function damagePlayer(w: World): void {
  if (w.hitThisStep) return;
  w.hitThisStep = true;
  const p = w.player;
  w.damageFlash = 200;

  if (w.isGodMode) {
    sound(w, 'hit');
    p.isInvincible = true;
    p.invincibilityTimer = Math.max(p.invincibilityTimer, 600);
    return;
  }

  w.stats.hits += 1;
  w.stats.levelHits += 1;

  if (p.hasShield) {
    w.stats.shieldBlocks += 1;
    sound(w, 'hit');
    p.hasShield = false;
    p.isInvincible = true;
    p.invincibilityTimer = 900;
    triggerShake(w, 8);
    spawnParticles(w, p.x + p.width / 2, p.y + p.height / 2, '#00e5ff', 18);
    spawnShockwave(w, p.x + p.width / 2, p.y + p.height / 2, '#00e5ff', 110, 4);
    spawnFloatingText(w, p.x + p.width / 2, p.y - 10, 'SHIELD GUARD!', '#00e5ff', 1.05);
    return;
  }

  hurtEffects(w);
  p.hurtAnim = 420;
  releaseCapturedEnemy(w);
  loseLife(w);
}

/** Falling out of the level always costs a life (the shield cannot save you) except in god mode. */
export function fallIntoPit(w: World): void {
  if (w.hitThisStep) return;
  w.hitThisStep = true;
  w.damageFlash = 200;
  releaseCapturedEnemy(w);

  if (w.isGodMode) {
    sound(w, 'hit');
    respawnPlayer(w);
    return;
  }

  w.stats.hits += 1;
  w.stats.levelHits += 1;
  hurtEffects(w);
  w.player.hurtAnim = 420;
  loseLife(w);
}

function checkPlayerDamage(w: World): void {
  const p = w.player;
  if (p.isInvincible) return;
  let hit = false;
  const k = w.playerScale; // a smaller Debh keeps the same proportion of forgiveness

  w.projectiles = w.projectiles.filter(proj => {
    if (areHurtboxesColliding(p, proj, 8 * k, 6 * k, 4, 4)) {
      hit = true;
      return false;
    }
    return true;
  });

  if (!hit && w.bosses.length === 0) {
    for (const en of w.enemies) {
      if (en.state === 'active' && areHurtboxesColliding(p, en, 9 * k, 7 * k, 7, 6)) {
        hit = true;
        break;
      }
    }
  }

  if (hit) damagePlayer(w);
}

// ---------------------------------------------------------------------------
// Camera & effects
// ---------------------------------------------------------------------------

function updateCamera(w: World): void {
  const p = w.player;
  const target = cameraFor(w, p.x + p.width / 2, p.y + p.height / 2);
  w.cameraX += (target.x - w.cameraX) * Math.min(1, 0.14 * DT);
  w.cameraY += (target.y - w.cameraY) * Math.min(1, 0.14 * DT);
}

function updateFx(w: World, zeroG: boolean): void {
  if (w.screenShake > 0) w.screenShake = Math.max(0, w.screenShake - 0.85 * DT);

  for (const pt of w.particles) {
    pt.x += pt.vx * DT;
    pt.y += pt.vy * DT;
    pt.vy += zeroG ? 0 : 0.38 * DT;
    pt.life -= 0.024 * DT;
  }
  w.particles = w.particles.filter(pt => pt.life > 0);

  for (const sw of w.shockwaves) {
    sw.radius += (sw.maxRadius - sw.radius) * 0.2 * DT;
    sw.life -= 0.048 * DT;
  }
  w.shockwaves = w.shockwaves.filter(sw => sw.life > 0);

  for (const ft of w.floatingTexts) {
    ft.y += ft.vy * DT;
    ft.life -= 0.022 * DT;
  }
  w.floatingTexts = w.floatingTexts.filter(ft => ft.life > 0);
}

/** Runs while the "stage cleared" banner is up: effects keep playing, bosses blow up in sequence. */
function stepLevelCleared(w: World): void {
  const zeroG = isZeroG(w);
  updateCamera(w);
  updateFx(w, zeroG);

  const fallen = w.bosses.filter(b => b.hp <= 0);
  if (fallen.length > 0) {
    w.bossDeathTick += 1;
    if (w.bossDeathTick % 9 === 0) {
      // the fallen bosses blow up in turn
      const b = fallen[Math.floor(w.bossDeathTick / 9) % fallen.length];
      const x = b.x + w.rng() * b.width;
      const y = b.y + w.rng() * b.height;
      sound(w, 'hit');
      triggerShake(w, 7);
      spawnParticles(w, x, y, w.rng() < 0.5 ? '#ffea00' : '#ff6d00', 14);
      spawnShockwave(w, x, y, '#ff6d00', 90, 4);
    }
  }

  w.transitionTimer -= STEP_MS;
  if (w.transitionTimer <= 0) advanceLevel(w);
}

// ---------------------------------------------------------------------------
// Boss AI
// ---------------------------------------------------------------------------

function updateBoss(w: World, b: Boss): void {
  if (b.hp <= 0) return;
  const p = w.player;
  const mult = w.difficultyMultiplier;
  b.isThrowing = false;

  if (b.type === 'frog') {
    const a = b.arena ?? { left: 20, right: w.levelWidth - 20, top: 50, bottom: w.levelHeight - 180 };
    b.x += b.vx * DT;
    b.y += b.vy * DT;
    if (b.x <= a.left || b.x + b.width >= a.right) b.vx *= -1;
    if (b.y <= a.top || b.y + b.height >= a.bottom) b.vy *= -1;
    if (w.rng() < 0.005 * DT) b.vx *= -1;
    if (w.rng() < 0.01 * DT) b.vy *= -1;

    b.attackCooldown -= STEP_MS;
    if (b.attackCooldown <= 0) {
      b.attackCooldown = 1800 + w.rng() * 1200;
      b.isThrowing = true;
      sound(w, 'bossShoot');
      const dx = p.x + p.width / 2 - (b.x + b.width / 2);
      const dy = p.y + p.height / 2 - (b.y + b.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      spawnShockwave(w, b.x + b.width / 2, b.y + b.height / 2, '#66bb6a', 60, 3);
      w.projectiles.push({
        id: getNextId(w),
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
        width: BOSS_PROJECTILE_WIDTH,
        height: BOSS_PROJECTILE_HEIGHT,
        vx: (dx / dist) * BOSS_PROJECTILE_SPEED * mult,
        vy: (dy / dist) * BOSS_PROJECTILE_SPEED * mult,
        isBomb: false,
      });
    }
  } else if (b.type === 'chickenEye') {
    b.movementTimer += STEP_MS * 0.0012;
    const t = b.movementTimer;
    const a = b.arena;
    if (a) {
      // sweeps its own patch of the arena: across it, and up and down
      const midX = (a.left + a.right - b.width) / 2;
      const midY = (a.top + a.bottom - b.height) / 2;
      b.x = midX + Math.sin(t) * Math.min(650, (a.right - a.left - b.width) / 2);
      b.y = midY + Math.sin(2 * t) * Math.min(180, (a.bottom - a.top - b.height) / 2);
    } else {
      b.x = (w.levelWidth - b.width) / 2 + Math.sin(t) * Math.min(650, w.levelWidth * 0.28);
      b.y = w.levelHeight / 2 - 220 + Math.sin(2 * t) * 180;
    }

    b.attackCooldown -= STEP_MS;
    if (b.attackCooldown <= 0) {
      b.attackCooldown = 2600 + w.rng() * 900;
      sound(w, 'bossShoot');
      const dx = p.x + p.width / 2 - (b.x + b.width / 2);
      const dy = p.y + p.height / 2 - (b.y + b.height / 2);
      const baseAngle = Math.atan2(dy, dx);
      spawnShockwave(w, b.x + b.width / 2, b.y + b.height / 2, '#ff7043', 75, 3.5);
      for (let i = -1.5; i <= 1.5; i += 1) {
        const angle = baseAngle + i * 0.2;
        w.projectiles.push({
          id: getNextId(w),
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
          width: EGG_PROJECTILE_WIDTH,
          height: EGG_PROJECTILE_HEIGHT,
          vx: Math.cos(angle) * BOSS_PROJECTILE_SPEED * 1.2 * mult,
          vy: Math.sin(angle) * BOSS_PROJECTILE_SPEED * 1.2 * mult,
          isBomb: false,
          isEgg: true,
        });
      }
    }
  } else if (b.type === 'shadowHead') {
    if (!b.visibilityState) b.visibilityState = 'hidden';
    if (b.opacity === undefined) b.opacity = 0;
    if (b.teleportTimer === undefined) b.teleportTimer = 0;

    const fadeSpeed = 0.025 * DT;
    if (b.visibilityState === 'hidden') {
      b.opacity = 0;
      b.teleportTimer -= STEP_MS;
      if (b.teleportTimer <= 0) {
        const a = b.arena ?? { left: 120, right: w.levelWidth - 120, top: 100, bottom: w.levelHeight - 120 };
        b.x = a.left + w.rng() * (a.right - a.left - b.width);
        b.y = a.top + w.rng() * (a.bottom - a.top - b.height);
        b.prevX = b.x;
        b.prevY = b.y;
        b.visibilityState = 'fadingIn';
        sound(w, 'powerup');
        spawnShockwave(w, b.x + b.width / 2, b.y + b.height / 2, '#ff1744', 90, 3);
      }
    } else if (b.visibilityState === 'fadingIn') {
      b.opacity += fadeSpeed;
      if (b.opacity >= 1) {
        b.opacity = 1;
        b.visibilityState = 'visible';
        b.attackCooldown = 450;
        b.teleportTimer = 3000;
      }
    } else if (b.visibilityState === 'visible') {
      b.teleportTimer -= STEP_MS;
      if (b.teleportTimer <= 0) b.visibilityState = 'fadingOut';
      b.attackCooldown -= STEP_MS;
      if (b.attackCooldown <= 0) {
        b.attackCooldown = 220;
        sound(w, 'bossShoot');
        const dx = p.x + p.width / 2 - (b.x + b.width / 2);
        const dy = p.y + p.height / 2 - (b.y + b.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        w.projectiles.push({
          id: getNextId(w),
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
          width: FIREBALL_WIDTH,
          height: FIREBALL_HEIGHT,
          vx: (dx / dist) * FIREBALL_SPEED * mult,
          vy: (dy / dist) * FIREBALL_SPEED * mult,
          isFireball: true,
        });
      }
    } else if (b.visibilityState === 'fadingOut') {
      b.opacity -= fadeSpeed;
      if (b.opacity <= 0) {
        b.opacity = 0;
        b.visibilityState = 'hidden';
        b.teleportTimer = 1800;
      }
    }
  }

  if (b.isHit) {
    b.hitTimer -= STEP_MS;
    if (b.hitTimer <= 0) b.isHit = false;
  }
}

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------

/**
 * Ballistic aim for Bomby's mortar. Solves the flight time for the bomb to come back down to the
 * player's height (the old fixed `dx * 0.09` made it land at 2.6x the distance and sail over the
 * player's head), then leads the target by its current horizontal speed.
 */
export function aimBomb(w: World, spawnX: number, spawnY: number): { vx: number; vy: number } {
  const p = w.player;
  const mult = w.difficultyMultiplier;
  const vy0 = BOMB_INITIAL_VY * mult;
  const g = GRAVITY;
  const bombCx = spawnX + BOMB_WIDTH / 2;
  const bombCy = spawnY + BOMB_HEIGHT / 2;
  const dy = p.y + p.height / 2 - bombCy;

  // y(n) = n*vy0 + g*n*(n-1)/2  ->  solve y(n) = dy for the descending root
  const b = vy0 - g / 2;
  const disc = b * b + 2 * g * dy;
  let n = disc >= 0 ? (-b + Math.sqrt(disc)) / g : -vy0 / g;
  n = Math.max(6, n);

  const targetX = p.x + p.width / 2 + p.vx * n * 0.8;
  let vx = (targetX - bombCx) / n;
  vx *= 1 + (w.rng() - 0.5) * BOMB_AIM_SPREAD;
  const maxV = BOMB_MAX_HORIZONTAL_SPEED * mult;
  vx = Math.max(-maxV, Math.min(maxV, vx));
  return { vx, vy: vy0 };
}

function updateProjectiles(w: World, zeroG: boolean): void {
  w.projectiles = w.projectiles.filter((proj: Projectile) => {
    proj.x += proj.vx * DT;
    proj.y += proj.vy * DT;
    proj.age = (proj.age ?? 0) + 1;
    if (proj.isBomb && !zeroG) proj.vy += GRAVITY * DT;

    if (
      proj.x < -100 ||
      proj.x > w.levelWidth + 100 ||
      proj.y < -100 ||
      proj.y > w.levelHeight + 100
    ) {
      return false;
    }
    if (zeroG) {
      for (const plat of w.platforms) {
        if (areRectsColliding(proj, plat)) {
          spawnParticles(w, proj.x, proj.y, '#ff9100', 4);
          return false;
        }
      }
    } else if (proj.isBomb && proj.vy > 0 && proj.age > 6) {
      // Bombs burst when they come down onto a platform
      for (const plat of w.platforms) {
        if (areRectsColliding(proj, plat)) {
          sound(w, 'hit');
          spawnParticles(w, proj.x + proj.width / 2, plat.y, '#ff9100', 10);
          spawnShockwave(w, proj.x + proj.width / 2, plat.y, '#ff9100', 60, 3);
          return false;
        }
      }
    }
    return true;
  });

  w.playerProjectiles = w.playerProjectiles.filter(proj => {
    proj.x += proj.vx * DT;
    proj.y += proj.vy * DT;
    if (
      proj.x < -100 ||
      proj.x > w.levelWidth + 100 ||
      proj.y < -100 ||
      proj.y > w.levelHeight + 100
    ) {
      return false;
    }
    if (zeroG) {
      for (const plat of w.platforms) {
        if (areRectsColliding(proj, plat)) {
          spawnParticles(w, proj.x, proj.y, '#00e5ff', 4);
          return false;
        }
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

const isWalker = (e: Enemy) => e.type === 'base' || e.type === 'jumper';

/**
 * Labyrinth walkers follow the corridors: at the middle of every cell they carry on straight
 * most of the time, otherwise turn into a side corridor, and they turn back only at a dead end.
 */
function steerInMaze(w: World, e: Enemy, speed: number): void {
  const m = w.maze as MazeData;
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;
  const { c, r } = cellAt(m, cx, cy);
  const idx = r * m.cols + c;
  const mid = cellCenter(m, c, r);
  let dir = e.mazeDir ?? -1;

  const atMiddle = Math.abs(cx - mid.x) <= speed && Math.abs(cy - mid.y) <= speed;
  if (dir < 0 || (atMiddle && e.mazeCell !== idx)) {
    e.x = mid.x - e.width / 2; // line up with the corridor again
    e.y = mid.y - e.height / 2;
    e.mazeCell = idx;
    const back = dir < 0 ? -1 : (dir + 2) % 4;
    const ways: number[] = [];
    for (let d = 0; d < 4; d++) if (d !== back && isOpen(m, c, r, d)) ways.push(d);
    if (ways.length === 0) dir = back >= 0 ? back : 0; // dead end: turn round
    else if (dir >= 0 && ways.includes(dir) && w.rng() < 0.65) dir = e.mazeDir as number; // carry on
    else dir = ways[Math.floor(w.rng() * ways.length)];
    e.mazeDir = dir;
  }
  e.vx = HEADINGS[dir].dx * speed;
  e.vy = HEADINGS[dir].dy * speed;
  if (e.vx !== 0) e.direction = e.vx > 0 ? 'right' : 'left';
}

function walkingVx(e: Enemy, mult: number): number {
  return (e.direction === 'left' ? -1 : 1) * ENEMY_SPEED * mult;
}

function updateEnemies(w: World, zeroG: boolean): void {
  const p = w.player;
  const mult = w.difficultyMultiplier;

  for (let i = 0; i < w.enemies.length; i++) {
    const enemy = w.enemies[i];
    if (enemy.state === 'defeated') continue;

    if (enemy.state === 'captured') {
      if (p.capturedEnemyId === enemy.id) {
        enemy.x = p.x + (p.direction === 'right' ? p.width - 22 : -enemy.width + 22);
        enemy.y = p.y + 4;
        enemy.direction = p.direction;
      } else {
        enemy.state = 'active';
      }
      continue;
    }

    if (enemy.state === 'stunned') {
      enemy.stunTimer = (enemy.stunTimer ?? 0) - STEP_MS;
      if (enemy.stunTimer <= 0) {
        enemy.state = 'active';
        // Only walkers resume walking; Bomby stays put (the old code made every enemy type walk).
        enemy.vx = isWalker(enemy) ? walkingVx(enemy, mult) : 0;
      }
      continue;
    }

    if (enemy.state === 'active') {
      // Optimisation: only run AI for enemies reasonably close to the player
      const distX = Math.abs(enemy.x - p.x);
      const distY = Math.abs(enemy.y - p.y);
      if (distX > 2200 || distY > 1800) continue;

      if (w.maze && (enemy.type === 'base' || enemy.type === 'jumper' || enemy.type === 'flyer')) {
        steerInMaze(w, enemy, (enemy.type === 'flyer' ? FLYER_SPEED : ENEMY_SPEED) * mult);
      } else if (enemy.type === 'phaser') {
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.vx = (dx / dist) * PHASER_SPEED * mult;
        enemy.vy = (dy / dist) * PHASER_SPEED * mult;
        enemy.direction = enemy.vx >= 0 ? 'right' : 'left';
      } else if (enemy.type === 'bomber') {
        enemy.vx = 0;
        enemy.attackCooldown = (enemy.attackCooldown ?? BOMBER_ATTACK_COOLDOWN) - STEP_MS;
        enemy.direction = p.x >= enemy.x ? 'right' : 'left';
        if (enemy.attackCooldown <= 0 && distX < 1100) {
          enemy.attackCooldown = BOMBER_ATTACK_COOLDOWN + w.rng() * 900;
          sound(w, 'bomberShoot');
          const spawnX = enemy.x + enemy.width / 2;
          const spawnY = enemy.y;
          let vx: number;
          let vy: number;
          if (zeroG) {
            const dx = p.x + p.width / 2 - spawnX;
            const dy = p.y + p.height / 2 - spawnY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            vx = (dx / dist) * 7 * mult;
            vy = (dy / dist) * 7 * mult;
          } else {
            ({ vx, vy } = aimBomb(w, spawnX, spawnY));
          }
          w.projectiles.push({
            id: getNextId(w),
            x: spawnX,
            y: spawnY,
            width: BOMB_WIDTH,
            height: BOMB_HEIGHT,
            vx,
            vy,
            isBomb: true,
            age: 0,
          });
        }
      } else if (enemy.type === 'flyer') {
        if (enemy.x < enemy.originalX - 220) {
          enemy.vx = Math.abs(enemy.vx);
          enemy.direction = 'right';
        } else if (enemy.x > enemy.originalX + 220) {
          enemy.vx = -Math.abs(enemy.vx);
          enemy.direction = 'left';
        }
        if (enemy.y < enemy.originalY - FLYER_PATROL_RANGE) {
          enemy.vy = Math.abs(enemy.vy);
        } else if (enemy.y > enemy.originalY + FLYER_PATROL_RANGE) {
          enemy.vy = -Math.abs(enemy.vy);
        }
      } else if (!zeroG) {
        // Ground walkers (Globby / Hoppy)
        enemy.vy = Math.min(MAX_FALL_SPEED, enemy.vy + GRAVITY * DT);

        // `onGround` comes from last step's landing. The old code tested `vy === 0` *after* adding
        // gravity, which is never true: enemies never turned at ledges and Hoppy never jumped.
        if (enemy.onGround) {
          const facingRight = enemy.direction === 'right';
          const lookAheadX = facingRight ? enemy.x + enemy.width + 4 : enemy.x - 4;
          let groundAhead = false;
          for (const plat of w.platforms) {
            if (
              lookAheadX >= plat.x &&
              lookAheadX <= plat.x + plat.width &&
              enemy.y + enemy.height + 6 >= plat.y &&
              enemy.y + enemy.height <= plat.y + 18
            ) {
              groundAhead = true;
              break;
            }
          }
          const drift = enemy.x - enemy.originalX;
          const tooFar = facingRight ? drift > GROUND_PATROL_RANGE : drift < -GROUND_PATROL_RANGE;
          if (!groundAhead || tooFar) {
            enemy.direction = facingRight ? 'left' : 'right';
          }
          enemy.vx = walkingVx(enemy, mult);

          if (enemy.type === 'jumper') {
            enemy.jumpCooldown = (enemy.jumpCooldown ?? ENEMY_JUMP_COOLDOWN) - STEP_MS;
            if (enemy.jumpCooldown <= 0) {
              enemy.vy = ENEMY_JUMP_FORCE;
              enemy.onGround = false;
              enemy.jumpCooldown = ENEMY_JUMP_COOLDOWN + w.rng() * 900;
            }
          }
        } else if (enemy.type === 'jumper') {
          enemy.jumpCooldown = (enemy.jumpCooldown ?? ENEMY_JUMP_COOLDOWN) - STEP_MS;
        }
      }
    } else if (enemy.state === 'launched' && !zeroG) {
      enemy.vy = Math.min(MAX_FALL_SPEED, enemy.vy + GRAVITY * 0.6 * DT);
      if (w.rng() < 0.45) {
        spawnParticles(
          w,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.isSuperLaunched ? '#ff6d00' : '#00e5ff',
          1
        );
      }
    }

    // --- Integration ---
    if (enemy.state === 'launched') {
      if (stepLaunchedEnemy(w, enemy, i)) continue;
    } else {
      enemy.x += enemy.vx * DT;
      enemy.y += enemy.vy * DT;
    }

    // Keep patrolling enemies within level bounds
    if (enemy.state === 'active') {
      if (enemy.x < 0) {
        enemy.x = 0;
        enemy.vx = Math.abs(enemy.vx);
        enemy.direction = 'right';
      } else if (enemy.x + enemy.width > w.levelWidth) {
        enemy.x = w.levelWidth - enemy.width;
        enemy.vx = -Math.abs(enemy.vx);
        enemy.direction = 'left';
      }
    }

    // Platform landing for ground / launched enemies
    if (enemy.type !== 'flyer' && enemy.type !== 'phaser' && !zeroG) {
      enemy.onGround = false;
      for (const plat of w.platforms) {
        if (
          enemy.vy >= 0 &&
          enemy.y + enemy.height >= plat.y &&
          enemy.y + enemy.height <= plat.y + 28 &&
          enemy.x + enemy.width > plat.x &&
          enemy.x < plat.x + plat.width
        ) {
          enemy.y = plat.y - enemy.height;
          enemy.vy = 0;
          enemy.onGround = true;
        }
      }
    }

    if (
      enemy.state === 'launched' &&
      (enemy.y > w.levelHeight + 100 || enemy.x < -200 || enemy.x > w.levelWidth + 200)
    ) {
      enemy.state = 'defeated';
    }
  }
}

/**
 * Launched enemies are projectiles: move them in two sub-steps (38 px/step is close to an
 * enemy's own width, so a single step could skip straight through a target) and pop them
 * after a maximum distance instead of letting them cross the whole level.
 * Returns true when the enemy is gone (hit something or ran out of range).
 */
function stepLaunchedEnemy(w: World, enemy: Enemy, index: number): boolean {
  const SUB = 2;
  for (let s = 0; s < SUB; s++) {
    const dx = (enemy.vx * DT) / SUB;
    const dy = (enemy.vy * DT) / SUB;
    enemy.x += dx;
    enemy.y += dy;
    enemy.launchTravel = (enemy.launchTravel ?? 0) + Math.abs(dx);
    if (w.maze && w.platforms.some(plat => areRectsColliding(enemy, plat))) {
      enemy.state = 'defeated';
      spawnParticles(w, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#00e5ff', 10);
      spawnShockwave(w, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#00e5ff', 50, 2.5);
      return true;
    }
    if (resolveLaunchedHit(w, enemy, index)) return true;
  }

  if ((enemy.launchTravel ?? 0) > LAUNCH_MAX_DISTANCE) {
    enemy.state = 'defeated';
    spawnParticles(w, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#00e5ff', 10);
    spawnShockwave(w, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#00e5ff', 50, 2.5);
    return true;
  }
  return false;
}

/** Returns true when the launched enemy hit something and is now defeated. */
function resolveLaunchedHit(w: World, enemy: Enemy, index: number): boolean {
  for (let j = 0; j < w.enemies.length; j++) {
    if (j === index) continue;
    const other = w.enemies[j];
    if (!((other.state === 'active' || other.state === 'stunned') && areRectsColliding(enemy, other))) {
      continue;
    }

    sound(w, 'hit');
    const hitX = (enemy.x + other.x) / 2 + 25;
    const hitY = (enemy.y + other.y) / 2 + 25;

    if (enemy.isSuperLaunched) {
      triggerShake(w, 16);
      spawnParticles(w, hitX, hitY, '#ffea00', 36);
      spawnShockwave(w, hitX, hitY, '#ffea00', SUPER_THROW_EXPLOSION_RADIUS, 6);
      spawnShockwave(w, hitX, hitY, '#ff3d00', SUPER_THROW_EXPLOSION_RADIUS * 0.72, 4);
      let defeatedCount = 1;
      enemy.state = 'defeated';
      for (const target of w.enemies) {
        const dist = Math.hypot(target.x - other.x, target.y - other.y);
        if ((target.state === 'active' || target.state === 'stunned') && dist <= SUPER_THROW_EXPLOSION_RADIUS) {
          target.state = 'defeated';
          defeatedCount++;
          spawnParticles(w, target.x + 25, target.y + 25, '#ff3d00', 12);
        }
      }
      w.stats.enemiesDefeated += defeatedCount;
      w.stats.bestBlast = Math.max(w.stats.bestBlast, defeatedCount);
      const pts = ENEMY_DEFEAT_POINTS * defeatedCount;
      addScore(w, pts);
      spawnFloatingText(w, hitX, hitY - 16, `SUPER BLAST! +${pts}`, '#ffea00', 1.3);
    } else {
      triggerShake(w, 7);
      spawnParticles(w, hitX, hitY, '#ff1744', 20);
      spawnShockwave(w, hitX, hitY, '#ff1744', 95, 4);
      enemy.state = 'defeated';
      other.state = 'defeated';
      w.stats.enemiesDefeated += 2;
      w.stats.doubleKos += 1;
      const pts = ENEMY_DEFEAT_POINTS * 2;
      addScore(w, pts);
      spawnFloatingText(w, hitX, hitY - 12, `DOUBLE K.O.! +${pts}`, '#00e5ff', 1.15);
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Player shots -> boss / enemies
// ---------------------------------------------------------------------------

function defeatBoss(w: World, b: Boss): void {
  b.hp = 0;
  b.hitTimer = 3000;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  const last = w.bosses.every(x => x.hp <= 0);
  sound(w, 'bossDefeat');
  triggerShake(w, 24);
  spawnParticles(w, bx, by, '#00e676', 60);
  spawnParticles(w, bx, by, '#ffea00', 40);
  spawnShockwave(w, bx, by, '#00e5ff', 320, 7);
  spawnShockwave(w, bx, by, '#ffea00', 220, 5);
  addScore(w, ENEMY_DEFEAT_POINTS * 20);
  spawnFloatingText(w, bx, by - 30, `BOSS DEFEATED! +${ENEMY_DEFEAT_POINTS * 20}`, '#ffea00', 1.45);
  if (!w.stats.bossesDefeated.includes(b.type)) w.stats.bossesDefeated.push(b.type);
  if (!last) return; // the others fight on
  noteLevelClear(w);
  w.projectiles = [];
  w.playerProjectiles = [];
  w.status = 'level-cleared';
  w.transitionTimer = 2600;
  w.bossDeathTick = 0;
}

function updatePlayerProjectileHits(w: World): void {
  const canShoot = w.bosses.length > 0 || Boolean(w.levels[w.currentLevelIndex]?.isZeroG);
  if (!canShoot || w.playerProjectiles.length === 0) return;

  w.playerProjectiles = w.playerProjectiles.filter(proj => {
    if (w.status !== 'playing') return false;
    // a shot meets the first boss it touches (a hidden shadow head lets it through)
    const boss = w.bosses.find(
      bs => bs.hp > 0 && !(bs.type === 'shadowHead' && (bs.opacity || 0) < 0.45) && areRectsColliding(proj, bs)
    );

    if (boss) {
      sound(w, 'bossHit');
      const hitX = proj.x + proj.width / 2;
      const hitY = proj.y + proj.height / 2;
      triggerShake(w, 4);
      spawnParticles(w, hitX, hitY, '#00e676', 10);
      spawnShockwave(w, hitX, hitY, '#00e676', 65, 3);
      addScore(w, ENEMY_DEFEAT_POINTS / 2);
      spawnFloatingText(w, hitX, hitY - 12, `+${ENEMY_DEFEAT_POINTS / 2}`, '#00e676', 0.95);
      boss.hp -= 1;
      boss.isHit = true;
      boss.hitTimer = 180;
      if (boss.hp <= 0) defeatBoss(w, boss);
      return false;
    }

    if (w.bosses.length === 0) {
      for (const en of w.enemies) {
        if ((en.state === 'active' || en.state === 'stunned') && areRectsColliding(proj, en)) {
          en.state = 'defeated';
          w.stats.enemiesDefeated += 1;
          const ex = en.x + en.width / 2;
          const ey = en.y + en.height / 2;
          sound(w, 'hit');
          triggerShake(w, 4);
          spawnParticles(w, ex, ey, '#00e5ff', 16);
          spawnShockwave(w, ex, ey, '#00e5ff', 75, 3.5);
          addScore(w, ENEMY_DEFEAT_POINTS);
          spawnFloatingText(w, ex, ey - 10, `+${ENEMY_DEFEAT_POINTS}`, '#00e5ff', 1.0);
          return false;
        }
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Checkpoints, items, goal
// ---------------------------------------------------------------------------

function updateCheckpoints(w: World): void {
  const p = w.player;
  for (const cp of w.checkpoints) {
    if (!cp.activated && areRectsColliding(p, cp)) {
      cp.activated = true;
      w.respawnPoint = { x: cp.x, y: cp.y + cp.height - p.height - 4 };
      const cx = cp.x + cp.width / 2;
      const cy = cp.y + 20;
      sound(w, 'checkpoint');
      spawnParticles(w, cx, cy, '#00e676', 22);
      spawnShockwave(w, cx, cy, '#00e676', 110, 4);
      addScore(w, CHECKPOINT_POINTS);
      spawnFloatingText(w, cx, cp.y - 12, `CHECKPOINT! +${CHECKPOINT_POINTS}`, '#00e676', 1.15);
    }
  }
}

/** What touches items and the exit: in the labyrinth her small footprint is widened a little. */
function pickupRect(w: World): Rect {
  const p = w.player;
  if (!w.maze) return p;
  const m = MAZE_PICKUP_MARGIN;
  return { x: p.x - m, y: p.y - m, width: p.width + m * 2, height: p.height + m * 2 };
}

function updateItems(w: World): void {
  const p = w.player;
  if (w.bosses.length > 0) return;
  const reach = pickupRect(w);
  w.items = w.items.filter(item => {
    if (!areRectsColliding(reach, item)) return true;
    const ix = item.x + item.width / 2;
    const iy = item.y + item.height / 2;
    addScore(w, COLLECTIBLE_POINTS);
    if (isCollectible(item.type)) w.stats.collected += 1;
    if (!w.stats.itemTypes.includes(item.type)) w.stats.itemTypes.push(item.type);
    sound(w, 'collect');
    spawnParticles(w, ix, iy, '#ffea00', 12);
    spawnShockwave(w, ix, iy, '#ffea00', 55, 3);

    if (item.type === 'shield') {
      p.hasShield = true;
      sound(w, 'powerup');
      spawnFloatingText(w, ix, item.y - 10, 'SHIELD ACTIVE!', '#00e5ff', 1.15);
    } else if (item.type === 'speed-boost') {
      p.activePowerUp = 'speed-boost';
      p.powerUpTimer = POWER_UP_DURATION;
      sound(w, 'powerup');
      spawnFloatingText(w, ix, item.y - 10, 'TURBO SPEED!', '#ffea00', 1.15);
    } else if (item.type === 'super-throw') {
      p.activePowerUp = 'super-throw';
      p.powerUpTimer = 0;
      sound(w, 'powerup');
      spawnFloatingText(w, ix, item.y - 10, 'SUPER THROW!', '#ff6d00', 1.15);
    } else {
      spawnFloatingText(w, ix, item.y - 8, `+${COLLECTIBLE_POINTS}`, '#ffea00', 1.0);
    }
    return false;
  });
}

/** Collectibles open the exit; power-ups are optional. */
export const isCollectible = (type: ItemType): type is CollectibleType =>
  (COLLECTIBLE_TYPES as ItemType[]).includes(type);

export function collectiblesLeft(w: World): number {
  if (w.maze) return w.items.length; // in the labyrinth every item has to be picked up
  return w.items.filter(item => isCollectible(item.type)).length;
}

function updateGoal(w: World): void {
  if (!w.goal || w.bosses.length > 0 || w.status !== 'playing') return;
  if (collectiblesLeft(w) !== 0 || !areRectsColliding(pickupRect(w), w.goal)) return;

  const gx = w.goal.x + w.goal.width / 2;
  const gy = w.goal.y + w.goal.height / 2;
  sound(w, 'levelClear');
  spawnParticles(w, gx, gy, '#00e5ff', 45);
  spawnShockwave(w, gx, gy, '#00e5ff', 240, 6);
  noteLevelClear(w);
  w.status = 'level-cleared';
  w.transitionTimer = 2000;
}

/** Writes down how the level was cleared (for the trophies). */
function noteLevelClear(w: World): void {
  const s = w.stats;
  s.clears[w.currentLevelIndex] = {
    hits: s.levelHits,
    livesLost: s.levelLivesLost,
    livesLostSoFar: s.livesLost,
    timeLeft: w.timeRemaining,
  };
}
