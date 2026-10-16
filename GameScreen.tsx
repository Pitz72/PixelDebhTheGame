import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Player as PlayerType,
  Enemy as EnemyType,
  Item,
  Platform as PlatformType,
  GameState,
  LevelData,
  Boss,
  Projectile,
  PlayerProjectile,
  Goal,
  Particle,
  Checkpoint,
} from './types';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Platform from './components/Platform';
import Hud from './components/Hud';
import Background from './components/Background';
import CyclopsFrogBoss from './components/FrogBoss';
import ChickenEyeBoss from './components/ChickenEyeBoss';
import ShadowHeadBoss from './components/ShadowHeadBoss';
import {
  ItemSprite,
  PlayerProjectileSprite,
  CDROMSprite,
  BombSprite,
  GoalSprite,
  EggSprite,
  FireballSprite,
  CheckpointSprite,
} from './services/assetService';
import * as soundService from './services/soundService';
import { levels } from './levels';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  MAX_FALL_SPEED,
  PLAYER_SPEED,
  PLAYER_FAST_SPEED,
  PLAYER_ACCEL,
  PLAYER_FRICTION,
  JUMP_FORCE,
  JUMP_CUT_MULTIPLIER,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  PLAYER_INVINCIBILITY_DURATION,
  ENEMY_SPEED,
  FLYER_SPEED,
  FLYER_VERTICAL_SPEED,
  FLYER_PATROL_RANGE,
  ENEMY_JUMP_FORCE,
  ENEMY_JUMP_COOLDOWN,
  LAUNCH_FORCE,
  POWER_UP_DURATION,
  SUPER_THROW_EXPLOSION_RADIUS,
  COLLECTIBLE_POINTS,
  ENEMY_DEFEAT_POINTS,
  CHECKPOINT_POINTS,
  INITIAL_LIVES,
  EXTRA_LIFE_SCORE_START,
  EXTRA_LIFE_SCORE_MULTIPLIER,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  BOSS_INITIAL_VX,
  BOSS_INITIAL_VY,
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
  BOMB_HORIZONTAL_SPEED_MULTIPLIER,
  MAX_JUMPS,
  EGG_PROJECTILE_WIDTH,
  EGG_PROJECTILE_HEIGHT,
  FIREBALL_SPEED,
  FIREBALL_WIDTH,
  FIREBALL_HEIGHT,
  MAX_PARTICLES,
} from './constants';

interface Shockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  strokeWidth: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  scale: number;
}

const areRectsColliding = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Hurtbox collision with slight padding so damage only triggers on true visual body contact
const areHurtboxesColliding = (
  playerRect: { x: number; y: number; width: number; height: number },
  hazardRect: { x: number; y: number; width: number; height: number },
  playerPadX = 8,
  playerPadY = 6,
  hazardPadX = 6,
  hazardPadY = 6
) => {
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

let globalEntityId = 1;
const getNextId = () => ++globalEntityId;

interface GameScreenProps {
  onGameOver: (score: number) => void;
  onCompleted: () => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  loopCount: number;
}

const GameScreen: React.FC<GameScreenProps> = ({
  onGameOver,
  onCompleted,
  setGameState,
  loopCount,
}) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [player, setPlayer] = useState<PlayerType>({} as PlayerType);
  const [enemies, setEnemies] = useState<EnemyType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [platforms, setPlatforms] = useState<PlatformType[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [playerProjectiles, setPlayerProjectiles] = useState<PlayerProjectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });

  // Camera & Level Dimensions
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [levelWidth, setLevelWidth] = useState(GAME_WIDTH);
  const [levelHeight, setLevelHeight] = useState(GAME_HEIGHT);

  const [isGodMode, setIsGodMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Mutable Engine State Ref to avoid recreating RAF every frame and eliminate StrictMode double-updater bugs
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const stateRef = useRef({
    gameState: 'playing' as GameState,
    currentLevelIndex: 0,
    score: 0,
    lives: INITIAL_LIVES,
    nextExtraLifeScore: EXTRA_LIFE_SCORE_START,
    player: {} as PlayerType,
    respawnPoint: { x: 100, y: 100 },
    enemies: [] as EnemyType[],
    items: [] as Item[],
    platforms: [] as PlatformType[],
    checkpoints: [] as Checkpoint[],
    goal: null as Goal | null,
    boss: null as Boss | null,
    projectiles: [] as Projectile[],
    playerProjectiles: [] as PlayerProjectile[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    floatingTexts: [] as FloatingText[],
    screenShake: 0,
    trailTick: 0,
    cameraX: 0,
    cameraY: 0,
    levelWidth: GAME_WIDTH,
    levelHeight: GAME_HEIGHT,
    isGodMode: false,
    isPaused: false,
    timeRemaining: null as number | null,
  });

  const difficultyMultiplier = 1 + (loopCount - 1) * 0.2;

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    const created: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      created.push({
        id: getNextId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 6 + 3,
      });
    }
    s.particles = [...s.particles, ...created].slice(-MAX_PARTICLES);
  }, []);

  const spawnShockwave = useCallback(
    (x: number, y: number, color: string, maxRadius = 90, strokeWidth = 4) => {
      const s = stateRef.current;
      s.shockwaves = [
        ...s.shockwaves,
        {
          id: getNextId(),
          x,
          y,
          radius: 8,
          maxRadius,
          color,
          life: 1.0,
          strokeWidth,
        },
      ].slice(-18);
    },
    []
  );

  const spawnFloatingText = useCallback(
    (x: number, y: number, text: string, color = '#ffea00', scale = 1) => {
      const s = stateRef.current;
      s.floatingTexts = [
        ...s.floatingTexts,
        {
          id: getNextId(),
          x,
          y,
          vy: -2.2,
          text,
          color,
          life: 1.0,
          scale,
        },
      ].slice(-16);
    },
    []
  );

  const triggerShake = useCallback((intensity: number) => {
    const s = stateRef.current;
    s.screenShake = Math.max(s.screenShake, intensity);
  }, []);

  const addScore = useCallback((pointsToAdd: number) => {
    const s = stateRef.current;
    s.score += pointsToAdd;
    if (s.score >= s.nextExtraLifeScore) {
      if (s.lives < INITIAL_LIVES) {
        s.lives += 1;
        soundService.playJingle('extraLife');
      }
      s.nextExtraLifeScore *= EXTRA_LIFE_SCORE_MULTIPLIER;
    }
  }, []);

  const loadLevel = useCallback(
    (levelIndex: number) => {
      const levelData: LevelData | undefined = levels[levelIndex];
      const s = stateRef.current;

      if (!levelData) {
        s.gameState = 'completed';
        onCompleted();
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
        const bossX = levelData.boss ? levelData.boss.x + levelData.boss.width : 0;
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
        const bossY = levelData.boss ? levelData.boss.y + levelData.boss.height : 0;
        return Math.max(GAME_HEIGHT, ...allY, goalY, bossY);
      };

      const w = calcWidth();
      const h = calcHeight();

      s.currentLevelIndex = levelIndex;
      s.levelWidth = w;
      s.levelHeight = h;
      s.respawnPoint = { ...levelData.playerStart };

      const initCamX = Math.max(0, Math.min(levelData.playerStart.x - GAME_WIDTH / 2, w - GAME_WIDTH));
      const initCamY = Math.max(0, Math.min(levelData.playerStart.y - GAME_HEIGHT / 2, h - GAME_HEIGHT));
      s.cameraX = initCamX;
      s.cameraY = initCamY;

      s.player = {
        ...levelData.playerStart,
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
      };

      s.platforms = levelData.platforms;
      s.checkpoints = (levelData.checkpoints || []).map((cp, idx) => ({
        id: idx + 1,
        ...cp,
        activated: false,
      }));
      s.projectiles = [];
      s.playerProjectiles = [];
      s.particles = [];
      s.shockwaves = [];
      s.floatingTexts = [];
      s.screenShake = 0;
      s.items = levelData.items.map((c, i) => ({ id: i + 1, ...c }));
      s.goal = levelData.goal ? { id: 1, ...levelData.goal } : null;
      s.timeRemaining = levelData.timeLimit ?? null;

      if (levelData.boss) {
        s.boss = {
          ...levelData.boss,
          hp: levelData.boss.maxHp,
          vx: BOSS_INITIAL_VX * difficultyMultiplier,
          vy: BOSS_INITIAL_VY * difficultyMultiplier,
          attackCooldown: 2400,
          isHit: false,
          hitTimer: 0,
          isThrowing: false,
          movementTimer: 0,
          opacity: levelData.boss.type === 'shadowHead' ? 0 : 1,
          visibilityState: 'hidden',
          teleportTimer: 1600,
        };
        s.enemies = [];

        if (levelData.boss.type === 'chickenEye') {
          s.lives = Math.max(s.lives, Math.ceil(levelData.boss.maxHp / 2));
        }
      } else {
        s.boss = null;
        s.enemies = levelData.enemies.map((e, i) => ({
          id: i + 1,
          ...e,
          vx:
            (e.type === 'flyer'
              ? FLYER_SPEED
              : e.type === 'bomber' || e.type === 'phaser'
              ? 0
              : ENEMY_SPEED) * difficultyMultiplier,
          vy: (e.type === 'flyer' ? FLYER_VERTICAL_SPEED : 0) * difficultyMultiplier,
          direction: 'right',
          state: 'active',
          jumpCooldown: e.type === 'jumper' ? ENEMY_JUMP_COOLDOWN : undefined,
          attackCooldown: e.type === 'bomber' ? BOMBER_ATTACK_COOLDOWN : undefined,
          stunTimer: 0,
          isSuperLaunched: false,
        }));
      }

      s.gameState = 'playing';
      setGameState('playing');

      // Sync initial React state
      setLevelWidth(w);
      setLevelHeight(h);
      setCameraX(initCamX);
      setCameraY(initCamY);
      setPlayer({ ...s.player });
      setPlatforms(s.platforms);
      setCheckpoints([...s.checkpoints]);
      setItems([...s.items]);
      setEnemies(s.enemies.map(e => ({ ...e })));
      setBoss(s.boss ? { ...s.boss } : null);
      setGoal(s.goal);
      setProjectiles([]);
      setPlayerProjectiles([]);
      setParticles([]);
      setShockwaves([]);
      setFloatingTexts([]);
      setLives(s.lives);
      setTimeRemaining(s.timeRemaining);
    },
    [onCompleted, setGameState, difficultyMultiplier]
  );

  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  // Level Music & Start Jingle
  useEffect(() => {
    soundService.stopMusic();
    const levelData = levels[currentLevelIndex];
    if (!levelData) return;

    if (levelData.musicTheme) {
      soundService.playMusicLoop(levelData.musicTheme);
    } else if (levelData.boss) {
      soundService.playMusicLoop('bossTheme');
    } else {
      soundService.playMusicLoop('adventureTheme');
    }
    soundService.playJingle('levelStart');
  }, [currentLevelIndex]);

  // Keyboard Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (e.key === 'Escape') {
        s.isPaused = !s.isPaused;
        setIsPaused(s.isPaused);
        return;
      }

      const lowerKey = e.key.toLowerCase();

      // Developer Shortcuts
      if (e.key === '9') {
        soundService.playSound('powerup');
        setCurrentLevelIndex(10);
        return;
      }

      if (lowerKey === 'l') {
        soundService.playSound('powerup');
        if (s.currentLevelIndex + 1 >= levels.length) {
          onCompleted();
        } else {
          setCurrentLevelIndex(prev => prev + 1);
        }
        return;
      }

      if (e.key === '0') {
        s.isGodMode = !s.isGodMode;
        setIsGodMode(s.isGodMode);
      }

      if (s.isPaused) return;

      keysPressedRef.current[lowerKey] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysPressedRef.current['shift'] = true;
      }

      const isZeroG =
        (s.boss && s.boss.type === 'shadowHead') || levels[s.currentLevelIndex]?.isZeroG;

      // Jump Input (with Coyote Time & Jump Buffering)
      if (e.key === ' ' && s.gameState === 'playing' && !isZeroG) {
        e.preventDefault();
        const p = s.player;
        if (p.isOnGround || p.coyoteTimer > 0) {
          soundService.playSound('jump');
          spawnParticles(p.x + p.width / 2, p.y + p.height, '#00e5ff', 8);
          spawnShockwave(p.x + p.width / 2, p.y + p.height, '#00e5ff', 48, 3);
          p.vy = JUMP_FORCE;
          p.isOnGround = false;
          p.coyoteTimer = 0;
          p.jumpCount = 1;
          p.jumpBufferTimer = 0;
        } else if (p.jumpCount < MAX_JUMPS) {
          soundService.playSound('doubleJump');
          spawnParticles(p.x + p.width / 2, p.y + p.height, '#ffea00', 12);
          spawnShockwave(p.x + p.width / 2, p.y + p.height, '#ffea00', 64, 3.5);
          p.vy = JUMP_FORCE * 0.94;
          p.jumpCount += 1;
          p.jumpBufferTimer = 0;
        } else {
          // Buffer the jump if pressed slightly before landing
          p.jumpBufferTimer = JUMP_BUFFER_MS;
        }
      }

      // Capture / Launch Enemy (Supports both active AND stunned enemies!)
      if ((lowerKey === 'c' || lowerKey === 'x') && s.gameState === 'playing' && !s.boss) {
        const p = s.player;
        if (p.capturedEnemyId !== null) {
          soundService.playSound('launch');
          const isSuper = p.activePowerUp === 'super-throw';
          spawnShockwave(
            p.x + p.width / 2,
            p.y + p.height / 2,
            isSuper ? '#ff6d00' : '#00e5ff',
            isSuper ? 95 : 65,
            isSuper ? 4.5 : 3
          );
          if (isSuper) {
            triggerShake(6);
          }
          s.enemies = s.enemies.map(en =>
            en.id === p.capturedEnemyId
              ? {
                  ...en,
                  state: 'launched',
                  vx: p.direction === 'right' ? LAUNCH_FORCE : -LAUNCH_FORCE,
                  vy: isZeroG ? 0 : -6,
                  isSuperLaunched: isSuper,
                }
              : en
          );
          if (isSuper) {
            p.activePowerUp = null;
            p.powerUpTimer = 0;
          }
          p.capturedEnemyId = null;
        } else {
          const captureRange = {
            x: p.x - 28,
            y: p.y - 16,
            width: p.width + 56,
            height: p.height + 32,
          };
          const nearbyEnemy = s.enemies.find(
            en =>
              (en.state === 'active' || en.state === 'stunned') &&
              areRectsColliding(captureRange, en)
          );
          if (nearbyEnemy) {
            soundService.playSound('capture');
            const cx = nearbyEnemy.x + nearbyEnemy.width / 2;
            const cy = nearbyEnemy.y + nearbyEnemy.height / 2;
            spawnParticles(cx, cy, '#d500f9', 14);
            spawnShockwave(cx, cy, '#d500f9', 70, 3.5);
            spawnFloatingText(cx, nearbyEnemy.y - 8, 'CAPTURED!', '#e040fb', 0.9);
            s.enemies = s.enemies.map(en =>
              en.id === nearbyEnemy.id ? { ...en, state: 'captured', stunTimer: 0 } : en
            );
            p.capturedEnemyId = nearbyEnemy.id;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      keysPressedRef.current[lowerKey] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysPressedRef.current['shift'] = false;
      }

      // Variable Jump Height: release Space early to cut upward velocity
      if (e.key === ' ') {
        const s = stateRef.current;
        const isZeroG =
          (s.boss && s.boss.type === 'shadowHead') || levels[s.currentLevelIndex]?.isZeroG;
        if (!isZeroG && s.player.vy < -8) {
          s.player.vy *= JUMP_CUT_MULTIPLIER;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onCompleted, spawnFloatingText, spawnParticles, spawnShockwave, triggerShake]);

  // Helper to handle player damage/respawn cleanly (releasing any held enemy!)
  const handlePlayerDamage = useCallback(() => {
    const s = stateRef.current;
    const p = s.player;

    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 200);

    if (s.isGodMode) {
      soundService.playSound('hit');
      return;
    }

    if (p.hasShield) {
      soundService.playSound('hit');
      p.hasShield = false;
      p.isInvincible = true;
      p.invincibilityTimer = 900;
      triggerShake(8);
      spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#00e5ff', 18);
      spawnShockwave(p.x + p.width / 2, p.y + p.height / 2, '#00e5ff', 110, 4);
      spawnFloatingText(p.x + p.width / 2, p.y - 10, 'SHIELD GUARD!', '#00e5ff', 1.05);
      return;
    }

    soundService.playSound('damage');
    triggerShake(15);
    spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff1744', 28);
    spawnShockwave(p.x + p.width / 2, p.y + p.height / 2, '#ff1744', 130, 5);
    spawnFloatingText(p.x + p.width / 2, p.y - 12, 'OUCH!', '#ff1744', 1.2);

    // If holding a captured enemy, release it back to active state at its original position so it doesn't freeze in mid-air
    if (p.capturedEnemyId !== null) {
      const heldId = p.capturedEnemyId;
      s.enemies = s.enemies.map(en =>
        en.id === heldId
          ? {
              ...en,
              state: 'active',
              x: en.originalX,
              y: en.originalY,
              vx: ENEMY_SPEED * difficultyMultiplier,
              vy: 0,
            }
          : en
      );
      p.capturedEnemyId = null;
    }

    s.lives -= 1;
    if (s.lives <= 0) {
      soundService.playSound('gameOver');
      s.gameState = 'gameover';
      onGameOver(s.score);
    } else {
      soundService.playJingle('respawn');
      s.player = {
        ...p,
        x: s.respawnPoint.x,
        y: s.respawnPoint.y,
        vx: 0,
        vy: 0,
        isInvincible: true,
        invincibilityTimer: PLAYER_INVINCIBILITY_DURATION,
        capturedEnemyId: null,
        jumpCount: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
      };
    }
  }, [difficultyMultiplier, onGameOver, spawnFloatingText, spawnParticles, spawnShockwave, triggerShake]);

  // Single Stable RAF Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = (timestamp: number) => {
      const s = stateRef.current;

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const rawDelta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (s.isPaused || s.gameState !== 'playing' || !s.player.width) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Cap deltaTime to avoid huge jumps after tab switch
      const deltaTime = Math.min(rawDelta, 50);
      // Normalized timestep factor (1.0 at 60Hz = 16.667ms)
      const dt = deltaTime / 16.6667;
      s.trailTick += dt;

      // 1. Update Level Timer
      if (s.timeRemaining !== null) {
        s.timeRemaining -= deltaTime / 1000;
        if (s.timeRemaining <= 0) {
          s.timeRemaining = 0;
          soundService.playSound('gameOver');
          s.gameState = 'gameover';
          onGameOver(s.score);
          return;
        }
      }

      const p = s.player;
      const keys = keysPressedRef.current;
      const isZeroG =
        Boolean(s.boss && s.boss.type === 'shadowHead') ||
        Boolean(levels[s.currentLevelIndex]?.isZeroG);
      const canShoot = Boolean(s.boss) || Boolean(levels[s.currentLevelIndex]?.isZeroG);

      // 2. Timers on Player
      if (p.shootCooldown > 0) p.shootCooldown = Math.max(0, p.shootCooldown - deltaTime);
      if (p.coyoteTimer > 0) p.coyoteTimer = Math.max(0, p.coyoteTimer - deltaTime);
      if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - deltaTime);
      if (p.isInvincible) {
        p.invincibilityTimer -= deltaTime;
        if (p.invincibilityTimer <= 0) p.isInvincible = false;
      }
      if (p.powerUpTimer > 0) {
        p.powerUpTimer -= deltaTime;
        if (p.powerUpTimer <= 0 && p.activePowerUp === 'speed-boost') {
          p.activePowerUp = null;
        }
      }

      // Speed-boost neon trail particles
      if (p.activePowerUp === 'speed-boost' && Math.abs(p.vx) > 1 && s.trailTick > 1.8) {
        s.trailTick = 0;
        spawnParticles(p.x + p.width / 2, p.y + p.height - 10, '#ffea00', 2);
      }

      // 3. Continuous Hold-to-Shoot Logic
      if (keys['shift'] && canShoot && p.shootCooldown <= 0) {
        soundService.playSound('playerShoot');
        const projectileSpeed = PLAYER_PROJECTILE_SPEED;
        let vx = p.direction === 'right' ? projectileSpeed : -projectileSpeed;
        let vy = 0;

        const up = keys['w'] || keys['arrowup'];
        const down = keys['s'] || keys['arrowdown'];
        const left = keys['a'] || keys['arrowleft'];
        const right = keys['d'] || keys['arrowright'];

        if (up && !down) vy = -projectileSpeed;
        else if (down && !up) vy = projectileSpeed;

        if (left && !right) vx = -projectileSpeed;
        else if (right && !left) vx = projectileSpeed;

        if ((up || down) && !left && !right) {
          vx = 0;
        }

        if (vx !== 0 && vy !== 0) {
          const invMag = 1 / Math.sqrt(2);
          vx *= invMag;
          vy *= invMag;
        }

        const isRapidFire = s.boss && s.boss.type === 'shadowHead';
        p.shootCooldown = isRapidFire ? PLAYER_RAPID_SHOOT_COOLDOWN : PLAYER_SHOOT_COOLDOWN;

        const spawnX = p.x + p.width / 2 - PLAYER_PROJECTILE_WIDTH / 2;
        const spawnY = p.y + p.height / 2 - PLAYER_PROJECTILE_HEIGHT / 2;
        spawnParticles(spawnX + 10, spawnY + 10, '#00e5ff', 3);

        s.playerProjectiles.push({
          id: getNextId(),
          x: spawnX,
          y: spawnY,
          width: PLAYER_PROJECTILE_WIDTH,
          height: PLAYER_PROJECTILE_HEIGHT,
          vx,
          vy,
        });
      }

      // 4. Player Movement & Physics (Smooth Acceleration / Friction)
      const maxSpeed = p.activePowerUp === 'speed-boost' ? PLAYER_FAST_SPEED : PLAYER_SPEED;
      const moveLeft = keys['a'] || keys['arrowleft'];
      const moveRight = keys['d'] || keys['arrowright'];

      if (moveLeft && !moveRight) {
        p.vx = Math.max(-maxSpeed, p.vx - PLAYER_ACCEL * dt);
        p.direction = 'left';
      } else if (moveRight && !moveLeft) {
        p.vx = Math.min(maxSpeed, p.vx + PLAYER_ACCEL * dt);
        p.direction = 'right';
      } else {
        p.vx *= Math.pow(PLAYER_FRICTION, dt);
        if (Math.abs(p.vx) < 0.15) p.vx = 0;
      }

      const prevPlayerY = p.y;
      const wasOnGround = p.isOnGround;

      if (isZeroG) {
        const moveUp = keys['w'] || keys['arrowup'];
        const moveDown = keys['s'] || keys['arrowdown'];
        if (moveUp && !moveDown) p.vy = -maxSpeed;
        else if (moveDown && !moveUp) p.vy = maxSpeed;
        else p.vy *= Math.pow(PLAYER_FRICTION, dt);
      } else {
        p.vy = Math.min(MAX_FALL_SPEED, p.vy + GRAVITY * dt);
      }

      // 5. Player Movement & Platform Collision Resolution
      if (isZeroG) {
        // Axis-Separated AABB Collision for Zero-G Maze (Eliminates Sticky Walls!)
        p.x += p.vx * dt;
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > s.levelWidth) p.x = s.levelWidth - p.width;

        for (let i = 0; i < s.platforms.length; i++) {
          const plat = s.platforms[i];
          if (areRectsColliding(p, plat)) {
            if (p.vx > 0) p.x = plat.x - p.width;
            else if (p.vx < 0) p.x = plat.x + plat.width;
            p.vx = 0;
          }
        }

        p.y += p.vy * dt;
        if (p.y < 0) p.y = 0;
        if (p.y + p.height > s.levelHeight) p.y = s.levelHeight - p.height;

        for (let i = 0; i < s.platforms.length; i++) {
          const plat = s.platforms[i];
          if (areRectsColliding(p, plat)) {
            if (p.vy > 0) p.y = plat.y - p.height;
            else if (p.vy < 0) p.y = plat.y + plat.height;
            p.vy = 0;
          }
        }
      } else {
        // Standard Platformer Physics
        p.x += p.vx * dt;
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > s.levelWidth) p.x = s.levelWidth - p.width;

        p.y += p.vy * dt;
        p.isOnGround = false;

        for (let i = 0; i < s.platforms.length; i++) {
          const plat = s.platforms[i];
          const isHorizontallyAligned =
            p.x + p.width > plat.x + 4 && p.x < plat.x + plat.width - 4;

          if (!isHorizontallyAligned) continue;

          // Landing on top of platform
          if (
            p.vy >= 0 &&
            prevPlayerY + p.height <= plat.y + 14 &&
            p.y + p.height >= plat.y
          ) {
            if (!wasOnGround && p.vy > 10) {
              spawnParticles(p.x + p.width / 2, plat.y, '#84ffff', 4);
            }
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isOnGround = true;
            p.jumpCount = 0;
            p.coyoteTimer = COYOTE_TIME_MS;

            // Execute buffered jump immediately on landing!
            if (p.jumpBufferTimer > 0) {
              soundService.playSound('jump');
              spawnParticles(p.x + p.width / 2, p.y + p.height, '#00e5ff', 8);
              spawnShockwave(p.x + p.width / 2, p.y + p.height, '#00e5ff', 48, 3);
              p.vy = JUMP_FORCE;
              p.isOnGround = false;
              p.coyoteTimer = 0;
              p.jumpCount = 1;
              p.jumpBufferTimer = 0;
            }
          }
          // Hitting platform from below (head bump + enemy stun shockwave)
          else if (
            p.vy < 0 &&
            prevPlayerY >= plat.y + plat.height - 12 &&
            p.y < plat.y + plat.height
          ) {
            p.y = plat.y + plat.height;
            p.vy = 0;
            soundService.playSound('hit');
            const bumpX = p.x + p.width / 2;
            spawnParticles(bumpX, p.y, '#00e5ff', 8);
            spawnShockwave(bumpX, plat.y, '#00e5ff', 175, 4);
            triggerShake(4);

            // Stun any enemies standing on that platform within shockwave range
            s.enemies.forEach(en => {
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
                spawnFloatingText(enemyCenterX, en.y - 10, 'STUNNED!', '#ffea00', 0.95);
              }
            });
          }
        }

        // Start Coyote Time if player just walked off a ledge without jumping
        if (wasOnGround && !p.isOnGround && p.vy >= 0) {
          p.coyoteTimer = COYOTE_TIME_MS;
        }

        // Pit Fall Check (uses actual levelHeight instead of hardcoded GAME_HEIGHT!)
        if (p.y > s.levelHeight + 60) {
          handlePlayerDamage();
        }
      }

      // 6. Smooth Camera Tracking & Screen Shake Decay
      const targetCamX = p.x + p.width / 2 - GAME_WIDTH / 2;
      const clampedCamX = Math.max(0, Math.min(targetCamX, s.levelWidth - GAME_WIDTH));
      s.cameraX += (clampedCamX - s.cameraX) * Math.min(1, 0.14 * dt);

      const targetCamY = p.y + p.height / 2 - GAME_HEIGHT / 2;
      const clampedCamY = Math.max(0, Math.min(targetCamY, s.levelHeight - GAME_HEIGHT));
      s.cameraY += (clampedCamY - s.cameraY) * Math.min(1, 0.14 * dt);

      if (s.screenShake > 0) {
        s.screenShake = Math.max(0, s.screenShake - 0.85 * dt);
      }

      // 7. Update Particles, Shockwaves & Floating Texts
      s.particles = s.particles
        .map(pt => ({
          ...pt,
          x: pt.x + pt.vx * dt,
          y: pt.y + pt.vy * dt,
          vy: pt.vy + (isZeroG ? 0 : 0.38 * dt),
          life: pt.life - 0.024 * dt,
        }))
        .filter(pt => pt.life > 0);

      s.shockwaves = s.shockwaves
        .map(sw => ({
          ...sw,
          radius: sw.radius + (sw.maxRadius - sw.radius) * 0.2 * dt,
          life: sw.life - 0.048 * dt,
        }))
        .filter(sw => sw.life > 0);

      s.floatingTexts = s.floatingTexts
        .map(ft => ({
          ...ft,
          y: ft.y + ft.vy * dt,
          life: ft.life - 0.022 * dt,
        }))
        .filter(ft => ft.life > 0);

      // 8. Update Boss AI
      if (s.boss && s.boss.hp > 0) {
        const b = s.boss;
        b.isThrowing = false;

        if (b.type === 'frog') {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x <= 20 || b.x + b.width >= s.levelWidth - 20) b.vx *= -1;
          if (b.y <= 50 || b.y + b.height >= s.levelHeight - 180) b.vy *= -1;
          if (Math.random() < 0.005 * dt) b.vx *= -1;
          if (Math.random() < 0.01 * dt) b.vy *= -1;

          b.attackCooldown -= deltaTime;
          if (b.attackCooldown <= 0) {
            b.attackCooldown = 1800 + Math.random() * 1200;
            b.isThrowing = true;
            soundService.playSound('bossShoot');
            const dx = p.x + p.width / 2 - (b.x + b.width / 2);
            const dy = p.y + p.height / 2 - (b.y + b.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            spawnShockwave(b.x + b.width / 2, b.y + b.height / 2, '#66bb6a', 60, 3);
            s.projectiles.push({
              id: getNextId(),
              x: b.x + b.width / 2,
              y: b.y + b.height / 2,
              width: BOSS_PROJECTILE_WIDTH,
              height: BOSS_PROJECTILE_HEIGHT,
              vx: (dx / dist) * BOSS_PROJECTILE_SPEED * difficultyMultiplier,
              vy: (dy / dist) * BOSS_PROJECTILE_SPEED * difficultyMultiplier,
              isBomb: false,
            });
          }
        } else if (b.type === 'chickenEye') {
          b.movementTimer += deltaTime * 0.0012;
          const t = b.movementTimer;
          b.x = (s.levelWidth - b.width) / 2 + Math.sin(t) * Math.min(650, s.levelWidth * 0.28);
          b.y = s.levelHeight / 2 - 220 + Math.sin(2 * t) * 180;

          b.attackCooldown -= deltaTime;
          if (b.attackCooldown <= 0) {
            b.attackCooldown = 2600 + Math.random() * 900;
            soundService.playSound('bossShoot');
            const dx = p.x + p.width / 2 - (b.x + b.width / 2);
            const dy = p.y + p.height / 2 - (b.y + b.height / 2);
            const baseAngle = Math.atan2(dy, dx);
            spawnShockwave(b.x + b.width / 2, b.y + b.height / 2, '#ff7043', 75, 3.5);
            for (let i = -1.5; i <= 1.5; i += 1) {
              const angle = baseAngle + i * 0.2;
              s.projectiles.push({
                id: getNextId(),
                x: b.x + b.width / 2,
                y: b.y + b.height / 2,
                width: EGG_PROJECTILE_WIDTH,
                height: EGG_PROJECTILE_HEIGHT,
                vx: Math.cos(angle) * BOSS_PROJECTILE_SPEED * 1.2 * difficultyMultiplier,
                vy: Math.sin(angle) * BOSS_PROJECTILE_SPEED * 1.2 * difficultyMultiplier,
                isBomb: false,
                isEgg: true,
              });
            }
          }
        } else if (b.type === 'shadowHead') {
          if (!b.visibilityState) b.visibilityState = 'hidden';
          if (b.opacity === undefined) b.opacity = 0;
          if (b.teleportTimer === undefined) b.teleportTimer = 0;

          const fadeSpeed = 0.025 * dt;
          if (b.visibilityState === 'hidden') {
            b.opacity = 0;
            b.teleportTimer -= deltaTime;
            if (b.teleportTimer <= 0) {
              b.x = 120 + Math.random() * (s.levelWidth - b.width - 240);
              b.y = 100 + Math.random() * (s.levelHeight - b.height - 220);
              b.visibilityState = 'fadingIn';
              soundService.playSound('powerup');
              spawnShockwave(b.x + b.width / 2, b.y + b.height / 2, '#ff1744', 90, 3);
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
            b.teleportTimer -= deltaTime;
            if (b.teleportTimer <= 0) b.visibilityState = 'fadingOut';
            b.attackCooldown -= deltaTime;
            if (b.attackCooldown <= 0) {
              b.attackCooldown = 220;
              soundService.playSound('bossShoot');
              const dx = p.x + p.width / 2 - (b.x + b.width / 2);
              const dy = p.y + p.height / 2 - (b.y + b.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              s.projectiles.push({
                id: getNextId(),
                x: b.x + b.width / 2,
                y: b.y + b.height / 2,
                width: FIREBALL_WIDTH,
                height: FIREBALL_HEIGHT,
                vx: (dx / dist) * FIREBALL_SPEED * difficultyMultiplier,
                vy: (dy / dist) * FIREBALL_SPEED * difficultyMultiplier,
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
          b.hitTimer -= deltaTime;
          if (b.hitTimer <= 0) b.isHit = false;
        }
      }

      // 9. Update Enemy Projectiles (Uses levelHeight & collides with Zero-G maze walls!)
      s.projectiles = s.projectiles
        .map(proj => {
          const nextProj = {
            ...proj,
            x: proj.x + proj.vx * dt,
            y: proj.y + proj.vy * dt,
          };
          if (proj.isBomb && !isZeroG) {
            nextProj.vy += GRAVITY * dt;
          }
          return nextProj;
        })
        .filter(proj => {
          if (
            proj.x < -100 ||
            proj.x > s.levelWidth + 100 ||
            proj.y < -100 ||
            proj.y > s.levelHeight + 100
          ) {
            return false;
          }
          if (isZeroG && s.platforms.length > 0) {
            for (let i = 0; i < s.platforms.length; i++) {
              if (areRectsColliding(proj, s.platforms[i])) {
                spawnParticles(proj.x, proj.y, '#ff9100', 4);
                return false;
              }
            }
          }
          return true;
        });

      // 10. Update Player Projectiles (Uses levelHeight & collides with Zero-G maze walls!)
      s.playerProjectiles = s.playerProjectiles
        .map(proj => ({
          ...proj,
          x: proj.x + proj.vx * dt,
          y: proj.y + proj.vy * dt,
        }))
        .filter(proj => {
          if (
            proj.x < -100 ||
            proj.x > s.levelWidth + 100 ||
            proj.y < -100 ||
            proj.y > s.levelHeight + 100
          ) {
            return false;
          }
          if (isZeroG && s.platforms.length > 0) {
            for (let i = 0; i < s.platforms.length; i++) {
              if (areRectsColliding(proj, s.platforms[i])) {
                spawnParticles(proj.x, proj.y, '#00e5ff', 4);
                return false;
              }
            }
          }
          return true;
        });

      // 11. Update Enemies
      for (let i = 0; i < s.enemies.length; i++) {
        const enemy = s.enemies[i];
        if (enemy.state === 'defeated') continue;

        if (enemy.state === 'captured') {
          if (p.capturedEnemyId === enemy.id) {
            enemy.x = p.x + (p.direction === 'right' ? p.width - 6 : -enemy.width + 6);
            enemy.y = p.y - 12;
            enemy.direction = p.direction;
          } else {
            enemy.state = 'active';
          }
          continue;
        }

        if (enemy.state === 'stunned') {
          enemy.stunTimer = (enemy.stunTimer || 0) - deltaTime;
          if (enemy.stunTimer <= 0) {
            enemy.state = 'active';
            enemy.vx =
              (enemy.direction === 'right' ? ENEMY_SPEED : -ENEMY_SPEED) * difficultyMultiplier;
          }
          continue;
        }

        if (enemy.state === 'active') {
          // Optimize: Only run active AI for enemies within 2200px of the player
          const distToPlayerX = Math.abs(enemy.x - p.x);
          const distToPlayerY = Math.abs(enemy.y - p.y);
          if (distToPlayerX > 2200 || distToPlayerY > 1800) continue;

          if (enemy.type === 'phaser') {
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            enemy.vx = (dx / dist) * PHASER_SPEED * difficultyMultiplier;
            enemy.vy = (dy / dist) * PHASER_SPEED * difficultyMultiplier;
            enemy.direction = enemy.vx >= 0 ? 'right' : 'left';
          } else if (enemy.type === 'bomber') {
            enemy.attackCooldown = (enemy.attackCooldown || BOMBER_ATTACK_COOLDOWN) - deltaTime;
            enemy.direction = p.x >= enemy.x ? 'right' : 'left';
            if (enemy.attackCooldown <= 0 && distToPlayerX < 1100) {
              enemy.attackCooldown = BOMBER_ATTACK_COOLDOWN + Math.random() * 900;
              soundService.playSound('bomberShoot');
              const dx = p.x + p.width / 2 - (enemy.x + enemy.width / 2);
              const dy = p.y + p.height / 2 - (enemy.y + enemy.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              s.projectiles.push({
                id: getNextId(),
                x: enemy.x + enemy.width / 2,
                y: enemy.y,
                width: BOMB_WIDTH,
                height: BOMB_HEIGHT,
                vx: isZeroG
                  ? (dx / dist) * 7 * difficultyMultiplier
                  : dx * BOMB_HORIZONTAL_SPEED_MULTIPLIER * difficultyMultiplier,
                vy: isZeroG
                  ? (dy / dist) * 7 * difficultyMultiplier
                  : BOMB_INITIAL_VY * difficultyMultiplier,
                isBomb: true,
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
          } else {
            if (!isZeroG) {
              enemy.vy = Math.min(MAX_FALL_SPEED, enemy.vy + GRAVITY * dt);
            }
            const lookAheadX =
              enemy.direction === 'right' ? enemy.x + enemy.width + 4 : enemy.x - 4;
            let groundAhead = false;
            for (let k = 0; k < s.platforms.length; k++) {
              const plat = s.platforms[k];
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
            if (!groundAhead && !isZeroG && enemy.vy === 0) {
              enemy.vx *= -1;
              enemy.direction = enemy.direction === 'left' ? 'right' : 'left';
            }
            if (enemy.type === 'jumper') {
              enemy.jumpCooldown = (enemy.jumpCooldown || ENEMY_JUMP_COOLDOWN) - deltaTime;
              if (enemy.jumpCooldown <= 0 && enemy.vy === 0) {
                enemy.vy = ENEMY_JUMP_FORCE;
                enemy.jumpCooldown = ENEMY_JUMP_COOLDOWN + Math.random() * 900;
              }
            }
          }
        } else if (enemy.state === 'launched' && !isZeroG) {
          enemy.vy = Math.min(MAX_FALL_SPEED, enemy.vy + GRAVITY * 0.6 * dt);
          if (Math.random() < 0.45) {
            spawnParticles(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              enemy.isSuperLaunched ? '#ff6d00' : '#00e5ff',
              1
            );
          }
        }

        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        // Keep patrolling enemies within level bounds
        if (enemy.state === 'active') {
          if (enemy.x < 0) {
            enemy.x = 0;
            enemy.vx = Math.abs(enemy.vx);
            enemy.direction = 'right';
          } else if (enemy.x + enemy.width > s.levelWidth) {
            enemy.x = s.levelWidth - enemy.width;
            enemy.vx = -Math.abs(enemy.vx);
            enemy.direction = 'left';
          }
        }

        // Platform landing for ground/launched enemies
        if (
          (enemy.type !== 'flyer' && enemy.type !== 'phaser') &&
          enemy.state !== 'captured' &&
          !isZeroG
        ) {
          for (let k = 0; k < s.platforms.length; k++) {
            const plat = s.platforms[k];
            if (
              enemy.vy >= 0 &&
              enemy.y + enemy.height >= plat.y &&
              enemy.y + enemy.height <= plat.y + 28 &&
              enemy.x + enemy.width > plat.x &&
              enemy.x < plat.x + plat.width
            ) {
              enemy.y = plat.y - enemy.height;
              enemy.vy = 0;
            }
          }
        }

        // Launched Enemy Collisions (including working Super-Throw explosion!)
        if (enemy.state === 'launched') {
          for (let j = 0; j < s.enemies.length; j++) {
            if (i === j) continue;
            const other = s.enemies[j];
            if (
              (other.state === 'active' || other.state === 'stunned') &&
              areRectsColliding(enemy, other)
            ) {
              soundService.playSound('hit');
              const hitX = (enemy.x + other.x) / 2 + 25;
              const hitY = (enemy.y + other.y) / 2 + 25;

              if (enemy.isSuperLaunched) {
                triggerShake(16);
                spawnParticles(hitX, hitY, '#ffea00', 36);
                spawnShockwave(hitX, hitY, '#ffea00', SUPER_THROW_EXPLOSION_RADIUS, 6);
                spawnShockwave(hitX, hitY, '#ff3d00', SUPER_THROW_EXPLOSION_RADIUS * 0.72, 4);
                let defeatedCount = 1;
                enemy.state = 'defeated';
                s.enemies.forEach(target => {
                  const dist = Math.hypot(target.x - other.x, target.y - other.y);
                  if (
                    (target.state === 'active' || target.state === 'stunned') &&
                    dist <= SUPER_THROW_EXPLOSION_RADIUS
                  ) {
                    target.state = 'defeated';
                    defeatedCount++;
                    spawnParticles(target.x + 25, target.y + 25, '#ff3d00', 12);
                  }
                });
                const pts = ENEMY_DEFEAT_POINTS * defeatedCount;
                addScore(pts);
                spawnFloatingText(hitX, hitY - 16, `SUPER BLAST! +${pts}`, '#ffea00', 1.3);
              } else {
                triggerShake(7);
                spawnParticles(hitX, hitY, '#ff1744', 20);
                spawnShockwave(hitX, hitY, '#ff1744', 95, 4);
                enemy.state = 'defeated';
                other.state = 'defeated';
                const pts = ENEMY_DEFEAT_POINTS * 2;
                addScore(pts);
                spawnFloatingText(hitX, hitY - 12, `DOUBLE K.O.! +${pts}`, '#00e5ff', 1.15);
              }
              break;
            }
          }

          if (
            enemy.y > s.levelHeight + 100 ||
            enemy.x < -200 ||
            enemy.x > s.levelWidth + 200
          ) {
            enemy.state = 'defeated';
          }
        }
      }

      // 12. Player Damage Check (Uses fair visual hurtboxes so enemies never damage from dislocated air!)
      if (!p.isInvincible) {
        let hitByHazard = false;

        s.projectiles = s.projectiles.filter(proj => {
          if (areHurtboxesColliding(p, proj, 8, 6, 4, 4)) {
            hitByHazard = true;
            return false;
          }
          return true;
        });

        if (!hitByHazard && !s.boss) {
          for (let i = 0; i < s.enemies.length; i++) {
            const en = s.enemies[i];
            if (en.state === 'active' && areHurtboxesColliding(p, en, 9, 7, 7, 6)) {
              hitByHazard = true;
              break;
            }
          }
        }

        if (hitByHazard) {
          handlePlayerDamage();
        }
      }

      // 13. Player Projectiles -> Boss & Enemies
      if (canShoot && s.playerProjectiles.length > 0) {
        s.playerProjectiles = s.playerProjectiles.filter(proj => {
          // Check Boss Hit
          if (s.boss && s.boss.hp > 0) {
            if (s.boss.type === 'shadowHead' && (s.boss.opacity || 0) < 0.45) {
              return true;
            }
            if (areRectsColliding(proj, s.boss)) {
              soundService.playSound('bossHit');
              const hitX = proj.x + proj.width / 2;
              const hitY = proj.y + proj.height / 2;
              triggerShake(4);
              spawnParticles(hitX, hitY, '#00e676', 10);
              spawnShockwave(hitX, hitY, '#00e676', 65, 3);
              addScore(ENEMY_DEFEAT_POINTS / 2);
              spawnFloatingText(hitX, hitY - 12, `+${ENEMY_DEFEAT_POINTS / 2}`, '#00e676', 0.95);
              s.boss.hp -= 1;
              s.boss.isHit = true;
              s.boss.hitTimer = 180;

              if (s.boss.hp <= 0) {
                s.boss.hp = 0;
                s.boss.hitTimer = 3000;
                const bx = s.boss.x + s.boss.width / 2;
                const by = s.boss.y + s.boss.height / 2;
                soundService.playSound('bossDefeat');
                triggerShake(24);
                spawnParticles(bx, by, '#00e676', 60);
                spawnParticles(bx, by, '#ffea00', 40);
                spawnShockwave(bx, by, '#00e5ff', 320, 7);
                spawnShockwave(bx, by, '#ffea00', 220, 5);
                addScore(ENEMY_DEFEAT_POINTS * 20);
                spawnFloatingText(bx, by - 30, `BOSS DEFEATED! +${ENEMY_DEFEAT_POINTS * 20}`, '#ffea00', 1.45);
                s.gameState = 'level-cleared';
                setGameState('level-cleared');
                setTimeout(() => {
                  if (s.currentLevelIndex + 1 >= levels.length) {
                    onCompleted();
                  } else {
                    setCurrentLevelIndex(idx => idx + 1);
                  }
                }, 2600);
              }
              return false;
            }
          }

          // Check Enemy Hit (Zero-G Labyrinth)
          if (!s.boss) {
            for (let i = 0; i < s.enemies.length; i++) {
              const en = s.enemies[i];
              if (
                (en.state === 'active' || en.state === 'stunned') &&
                areRectsColliding(proj, en)
              ) {
                en.state = 'defeated';
                const ex = en.x + en.width / 2;
                const ey = en.y + en.height / 2;
                soundService.playSound('hit');
                triggerShake(4);
                spawnParticles(ex, ey, '#00e5ff', 16);
                spawnShockwave(ex, ey, '#00e5ff', 75, 3.5);
                addScore(ENEMY_DEFEAT_POINTS);
                spawnFloatingText(ex, ey - 10, `+${ENEMY_DEFEAT_POINTS}`, '#00e5ff', 1.0);
                return false;
              }
            }
          }

          return true;
        });
      }

      // 14. Checkpoints Activation
      for (let i = 0; i < s.checkpoints.length; i++) {
        const cp = s.checkpoints[i];
        if (!cp.activated && areRectsColliding(p, cp)) {
          cp.activated = true;
          s.respawnPoint = { x: cp.x, y: cp.y + cp.height - PLAYER_HEIGHT - 4 };
          const cx = cp.x + cp.width / 2;
          const cy = cp.y + 20;
          soundService.playSound('checkpoint');
          spawnParticles(cx, cy, '#00e676', 22);
          spawnShockwave(cx, cy, '#00e676', 110, 4);
          addScore(CHECKPOINT_POINTS);
          spawnFloatingText(cx, cp.y - 12, `CHECKPOINT! +${CHECKPOINT_POINTS}`, '#00e676', 1.15);
        }
      }

      // 15. Item & Power-Up Collection
      s.items = s.items.filter(item => {
        if (areRectsColliding(p, item)) {
          if (s.boss) return true;
          const ix = item.x + item.width / 2;
          const iy = item.y + item.height / 2;
          addScore(COLLECTIBLE_POINTS);
          soundService.playSound('collect');
          spawnParticles(ix, iy, '#ffea00', 12);
          spawnShockwave(ix, iy, '#ffea00', 55, 3);

          if (item.type === 'shield') {
            p.hasShield = true;
            soundService.playSound('powerup');
            spawnFloatingText(ix, item.y - 10, 'SHIELD ACTIVE!', '#00e5ff', 1.15);
          } else if (item.type === 'speed-boost') {
            p.activePowerUp = 'speed-boost';
            p.powerUpTimer = POWER_UP_DURATION;
            soundService.playSound('powerup');
            spawnFloatingText(ix, item.y - 10, 'TURBO SPEED!', '#ffea00', 1.15);
          } else if (item.type === 'super-throw') {
            p.activePowerUp = 'super-throw';
            p.powerUpTimer = 0;
            soundService.playSound('powerup');
            spawnFloatingText(ix, item.y - 10, 'SUPER THROW!', '#ff6d00', 1.15);
          } else {
            spawnFloatingText(ix, item.y - 8, `+${COLLECTIBLE_POINTS}`, '#ffea00', 1.0);
          }
          return false;
        }
        return true;
      });

      // 16. Goal Portal Check
      if (s.goal && !s.boss && s.gameState === 'playing') {
        const remainingCollectibles = s.items.filter(item =>
          ['joystick', 'floppy', 'cartridge'].includes(item.type)
        ).length;

        if (remainingCollectibles === 0 && areRectsColliding(p, s.goal)) {
          const gx = s.goal.x + s.goal.width / 2;
          const gy = s.goal.y + s.goal.height / 2;
          soundService.playSound('levelClear');
          spawnParticles(gx, gy, '#00e5ff', 45);
          spawnShockwave(gx, gy, '#00e5ff', 240, 6);

          if (s.currentLevelIndex === levels.length - 1) {
            s.gameState = 'completed';
            onCompleted();
          } else {
            s.gameState = 'level-cleared';
            setGameState('level-cleared');
            setTimeout(() => {
              if (s.currentLevelIndex + 1 >= levels.length) {
                onCompleted();
              } else {
                setCurrentLevelIndex(idx => idx + 1);
              }
            }, 2000);
          }
        }
      }

      // 17. Commit Frame Snapshot to React State (Fresh enemy object references prevent stale memo positions!)
      setScore(s.score);
      setLives(s.lives);
      setCameraX(s.cameraX);
      setCameraY(s.cameraY);
      if (s.screenShake > 0.2) {
        setShakeOffset({
          x: (Math.random() - 0.5) * s.screenShake * 1.8,
          y: (Math.random() - 0.5) * s.screenShake * 1.8,
        });
      } else {
        setShakeOffset({ x: 0, y: 0 });
      }
      setPlayer({ ...s.player });
      setEnemies(s.enemies.map(e => ({ ...e })));
      setItems([...s.items]);
      setCheckpoints([...s.checkpoints]);
      setBoss(s.boss ? { ...s.boss } : null);
      setProjectiles([...s.projectiles]);
      setPlayerProjectiles([...s.playerProjectiles]);
      setParticles([...s.particles]);
      setShockwaves([...s.shockwaves]);
      setFloatingTexts([...s.floatingTexts]);
      if (s.timeRemaining !== null) {
        setTimeRemaining(s.timeRemaining);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    gameLoopRef.current = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    addScore,
    difficultyMultiplier,
    handlePlayerDamage,
    onCompleted,
    onGameOver,
    setGameState,
    spawnFloatingText,
    spawnParticles,
    spawnShockwave,
    triggerShake,
  ]);

  const collectiblesLeft = items.filter(item =>
    ['joystick', 'floppy', 'cartridge'].includes(item.type)
  ).length;
  const currentLevelData = levels[currentLevelIndex];
  const levelName = currentLevelData?.name || `Level ${currentLevelIndex + 1}`;
  const currentTheme = currentLevelData?.musicTheme || 'adventure';
  const isShadowHeadBoss = boss && boss.type === 'shadowHead';

  // Viewport Frustum Culling Bounds (Only mount visible DOM elements +/- 450px margin!)
  const cullMinX = cameraX - 450;
  const cullMaxX = cameraX + GAME_WIDTH + 450;
  const cullMinY = cameraY - 450;
  const cullMaxY = cameraY + GAME_HEIGHT + 450;

  const isVisible = (obj: { x: number; y: number; width: number; height: number }) =>
    obj.x + obj.width >= cullMinX &&
    obj.x <= cullMaxX &&
    obj.y + obj.height >= cullMinY &&
    obj.y <= cullMaxY;

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#04010c]"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      {/* Subtle Arcade Bloom Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          boxShadow: 'inset 0 0 90px rgba(0, 0, 0, 0.55)',
        }}
      />

      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/45 z-50 pointer-events-none" />
      )}

      {isShadowHeadBoss ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #1a020c 0%, #040006 80%)',
          }}
        />
      ) : (
        <Background cameraX={cameraX} cameraY={cameraY} theme={currentTheme} />
      )}

      <Hud
        score={score}
        lives={lives}
        level={currentLevelIndex + 1}
        levelName={levelName}
        collectiblesLeft={collectiblesLeft}
        activePowerUp={player.activePowerUp}
        boss={boss}
        isGodMode={isGodMode}
        timeRemaining={timeRemaining}
        loopCount={loopCount}
        playerX={player.x}
        levelWidth={levelWidth}
      />

      <div
        className="absolute top-0 left-0"
        style={{
          willChange: 'transform',
          transform: `translate3d(${-cameraX + shakeOffset.x}px, ${-cameraY + shakeOffset.y}px, 0)`,
        }}
      >
        {/* Frustum-Culled Platforms */}
        {platforms.map((p, i) =>
          isVisible(p) ? <Platform key={i} platform={p} theme={currentTheme} /> : null
        )}

        {/* Frustum-Culled Checkpoints */}
        {checkpoints.map(cp =>
          isVisible(cp) ? (
            <div
              key={cp.id}
              style={{
                position: 'absolute',
                left: cp.x,
                top: cp.y,
                width: cp.width,
                height: cp.height,
                zIndex: 2,
              }}
            >
              <CheckpointSprite activated={cp.activated} />
            </div>
          ) : null
        )}

        {/* Goal Portal */}
        {goal && isVisible(goal) && (
          <div
            style={{
              position: 'absolute',
              left: goal.x,
              top: goal.y,
              width: goal.width,
              height: goal.height,
              zIndex: 3,
            }}
          >
            <GoalSprite unlocked={collectiblesLeft === 0} remaining={collectiblesLeft} />
          </div>
        )}

        {/* Frustum-Culled Items */}
        {items.map(c =>
          isVisible(c) ? (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                width: c.width,
                height: c.height,
                zIndex: 5,
              }}
            >
              <ItemSprite type={c.type} />
            </div>
          ) : null
        )}

        {/* Player */}
        {player.width && <Player player={player} />}

        {/* Frustum-Culled Enemies */}
        {enemies.map(e => (isVisible(e) ? <Enemy key={e.id} enemy={e} /> : null))}

        {/* Bosses */}
        {boss && boss.type === 'frog' && <CyclopsFrogBoss boss={boss} />}
        {boss && boss.type === 'chickenEye' && <ChickenEyeBoss boss={boss} />}
        {boss && boss.type === 'shadowHead' && <ShadowHeadBoss boss={boss} />}

        {/* Frustum-Culled Enemy Projectiles */}
        {projectiles.map(p =>
          isVisible(p) ? (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: p.width,
                height: p.height,
                zIndex: 12,
              }}
            >
              {p.isBomb ? (
                <BombSprite />
              ) : p.isEgg ? (
                <EggSprite />
              ) : p.isFireball ? (
                <FireballSprite />
              ) : (
                <CDROMSprite />
              )}
            </div>
          ) : null
        )}

        {/* Frustum-Culled Player Projectiles */}
        {playerProjectiles.map(p =>
          isVisible(p) ? (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: p.width,
                height: p.height,
                zIndex: 12,
              }}
            >
              <PlayerProjectileSprite />
            </div>
          ) : null
        )}

        {/* Expanding Vector Shockwave Rings */}
        {shockwaves.map(sw => (
          <div
            key={sw.id}
            style={{
              position: 'absolute',
              left: sw.x - sw.radius,
              top: sw.y - sw.radius,
              width: sw.radius * 2,
              height: sw.radius * 2,
              borderRadius: '50%',
              border: `${sw.strokeWidth}px solid ${sw.color}`,
              boxShadow: `0 0 18px ${sw.color}, inset 0 0 12px ${sw.color}`,
              opacity: sw.life,
              pointerEvents: 'none',
              zIndex: 14,
            }}
          />
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${p.color}`,
              opacity: p.life,
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        ))}

        {/* Floating Arcade Score & Status Popups */}
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: ft.x,
              top: ft.y,
              transform: `translate(-50%, -50%) scale(${ft.scale})`,
              color: ft.color,
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${ft.color}, 2px 2px 0px #090318`,
              opacity: ft.life,
              pointerEvents: 'none',
              zIndex: 18,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-[#050114]/85 backdrop-blur-sm z-50 flex flex-col justify-center items-center text-white">
          <h2
            className="text-7xl font-black tracking-widest text-cyan-300 mb-6"
            style={{ textShadow: '0 0 25px #00e5ff' }}
          >
            PAUSED
          </h2>
          <p className="text-2xl font-bold text-yellow-300 animate-blink mt-4">
            PREMI ESC PER CONTINUARE
          </p>
          <div className="mt-12 bg-white/5 border border-cyan-500/30 rounded-2xl px-8 py-4 text-sm text-gray-300 space-y-1 text-center">
            <p>
              DEBUG SHORTCUTS: <strong className="text-cyan-400">[L]</strong> Salta Livello •{' '}
              <strong className="text-cyan-400">[0]</strong> God Mode •{' '}
              <strong className="text-cyan-400">[9]</strong> Boss Finale
            </p>
          </div>
        </div>
      )}

      {/* Level Cleared Banner */}
      {stateRef.current.gameState === 'level-cleared' && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/60 backdrop-blur-xs z-40">
          <h2
            className="text-8xl font-black text-yellow-300 tracking-wider animate-pulse"
            style={{ textShadow: '0 0 35px #00e5ff, 4px 4px 0px #e8175d' }}
          >
            {boss && boss.hp <= 0 ? 'BOSS DEFEATED!' : 'STAGE CLEARED!'}
          </h2>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
