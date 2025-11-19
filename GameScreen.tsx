
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player as PlayerType, Enemy as EnemyType, Item, Platform as PlatformType, GameState, ItemType, LevelData, Boss, Projectile, PlayerProjectile, Goal, Particle } from './types';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Platform from './components/Platform';
import Hud from './components/Hud';
import Background from './components/Background';
import CyclopsFrogBoss from './components/FrogBoss';
import ChickenEyeBoss from './components/ChickenEyeBoss';
import ShadowHeadBoss from './components/ShadowHeadBoss';
import { ItemSprite, PlayerProjectileSprite, CDROMSprite, BombSprite, GoalSprite, EggSprite, FireballSprite } from './services/assetService';
import * as soundService from './services/soundService';
import * as aiService from './services/aiService';
import { levels } from './levels';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_FAST_SPEED, JUMP_FORCE, PLAYER_INVINCIBILITY_DURATION,
  ENEMY_SPEED, FLYER_SPEED, FLYER_VERTICAL_SPEED, FLYER_PATROL_RANGE, ENEMY_JUMP_FORCE, ENEMY_JUMP_COOLDOWN, LAUNCH_FORCE, POWER_UP_DURATION, SUPER_THROW_EXPLOSION_RADIUS,
  COLLECTIBLE_POINTS, ENEMY_DEFEAT_POINTS, INITIAL_LIVES, EXTRA_LIFE_SCORE_START, EXTRA_LIFE_SCORE_MULTIPLIER, PLAYER_WIDTH, PLAYER_HEIGHT, BOSS_INITIAL_VX, BOSS_INITIAL_VY, PLAYER_PROJECTILE_SPEED, PLAYER_PROJECTILE_WIDTH, PLAYER_PROJECTILE_HEIGHT, PLAYER_SHOOT_COOLDOWN, BOSS_PROJECTILE_SPEED, BOSS_PROJECTILE_WIDTH, BOSS_PROJECTILE_HEIGHT, PHASER_SPEED, BOMBER_ATTACK_COOLDOWN, BOMB_WIDTH, BOMB_HEIGHT, BOMB_INITIAL_VY, BOMB_HORIZONTAL_SPEED_MULTIPLIER, MAX_JUMPS, EGG_PROJECTILE_WIDTH, EGG_PROJECTILE_HEIGHT, FIREBALL_SPEED, FIREBALL_WIDTH, FIREBALL_HEIGHT
} from './constants';

const areRectsColliding = (rect1: {x: number, y: number, width: number, height: number}, rect2: {x: number, y: number, width: number, height: number}) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

interface GameScreenProps {
  onGameOver: (score: number) => void;
  onCompleted: () => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, onCompleted, setGameState }) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [player, setPlayer] = useState<PlayerType>({} as PlayerType);
  const [enemies, setEnemies] = useState<EnemyType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [platforms, setPlatforms] = useState<PlatformType[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [playerProjectiles, setPlayerProjectiles] = useState<PlayerProjectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [nextExtraLifeScore, setNextExtraLifeScore] = useState(EXTRA_LIFE_SCORE_START);
  const [cameraX, setCameraX] = useState(0);
  const [levelWidth, setLevelWidth] = useState(GAME_WIDTH);
  const [isGodMode, setIsGodMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [oracleMessage, setOracleMessage] = useState<string | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>('playing');
  const cameraXRef = useRef(0);
  
  // Particle Helper
  const createParticles = (x: number, y: number, color: string, count: number) => {
    setParticles(prev => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: Math.random(),
                x,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color,
                size: Math.random() * 6 + 2
            });
        }
        return [...prev, ...newParticles];
    });
  };

  const updateScore = useCallback((pointsToAdd: number) => {
    setScore(prevScore => {
        const newScore = prevScore + pointsToAdd;
        if (newScore >= nextExtraLifeScore) {
            setLives(prevLives => {
                if (prevLives < INITIAL_LIVES) {
                    soundService.playJingle('extraLife');
                    return prevLives + 1;
                }
                return prevLives;
            });
            setNextExtraLifeScore(current => current * EXTRA_LIFE_SCORE_MULTIPLIER);
        }
        return newScore;
    });
  }, [nextExtraLifeScore]);

  const loadLevel = useCallback((levelIndex: number) => {
    const levelData = levels[levelIndex];
    if (!levelData) {
      gameStateRef.current = 'completed';
      onCompleted();
      return;
    }

    const calculateLevelWidth = (levelData: LevelData) => {
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
    setLevelWidth(calculateLevelWidth(levelData));
    setCameraX(0);
    cameraXRef.current = 0;

    setPlayer({
      ...levelData.playerStart,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      direction: 'right',
      isOnGround: false,
      jumpCount: 0,
      isInvincible: false,
      invincibilityTimer: 0,
      capturedEnemyId: null,
      hasShield: false,
      activePowerUp: null,
      powerUpTimer: 0,
      shootCooldown: 0,
    });

    setPlatforms(levelData.platforms);

    // Reset states for new level
    setBoss(null);
    setProjectiles([]);
    setPlayerProjectiles([]);
    setParticles([]);
    setItems(levelData.items.map((c, i) => ({ id: i, ...c })));
    setGoal(levelData.goal ? { id: 0, ...levelData.goal } : null);
    setOracleMessage(null);
    
    if (levelData.boss) {
        setBoss({
            ...levelData.boss,
            hp: levelData.boss.maxHp,
            vx: BOSS_INITIAL_VX,
            vy: BOSS_INITIAL_VY,
            attackCooldown: 3000,
            isHit: false,
            hitTimer: 0,
            isThrowing: false,
            movementTimer: 0,
            // ShadowHead initial state
            opacity: levelData.boss.type === 'shadowHead' ? 0 : 1,
            visibilityState: 'hidden',
            teleportTimer: 2000
        });
        setEnemies([]); // No initial enemies in boss room
    } else {
        setEnemies(levelData.enemies.map((e, i) => ({
          id: i, ...e, 
          vx: e.type === 'flyer' ? FLYER_SPEED : (e.type === 'bomber' || e.type === 'phaser' ? 0 : ENEMY_SPEED), 
          vy: e.type === 'flyer' ? FLYER_VERTICAL_SPEED : 0,
          direction: 'right', state: 'active', 
          jumpCooldown: e.type === 'jumper' ? ENEMY_JUMP_COOLDOWN : undefined, 
          attackCooldown: e.type === 'bomber' ? BOMBER_ATTACK_COOLDOWN : undefined,
          stunTimer: 0
        })));
    }

    gameStateRef.current = 'playing';
    setGameState('playing');
  }, [onCompleted, setGameState]);

  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  // Handle music based on level
  useEffect(() => {
    soundService.stopMusic();
    const levelData = levels[currentLevelIndex];
    if (!levelData) return;

    // No music for the final labyrinth level
    if (currentLevelIndex === levels.length - 1) {
      return;
    }
    
    // Play theme based on Level Data
    if (levelData.musicTheme) {
        soundService.playMusicLoop(levelData.musicTheme);
    } else if (levelData.boss) {
      soundService.playMusicLoop('bossTheme');
    } else {
      soundService.playMusicLoop('adventureTheme');
    }
  }, [currentLevelIndex]);

  useEffect(() => {
    soundService.playJingle('levelStart');
  }, [currentLevelIndex]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause Toggle
      if (e.key === 'Escape') {
          setIsPaused(prev => !prev);
          setOracleMessage(null); // Reset oracle on toggle
          return;
      }

      if (isPaused) return;

      const key = e.key.toLowerCase();
      keysPressed[key] = true;
      
      // Toggle God Mode with '0'
      if (e.key === '0') {
        setIsGodMode(prev => !prev);
      }
      
      // Jumping Logic (Including Double Jump)
      // DISABLE JUMP IF SHADOW HEAD BOSS (Zero G)
      const isZeroG = boss && boss.type === 'shadowHead';
      if (e.key === ' ' && gameStateRef.current === 'playing' && !isZeroG) {
          setPlayer(p => {
              if (p.isOnGround || p.jumpCount < MAX_JUMPS) {
                  soundService.playSound('jump');
                  createParticles(p.x + p.width / 2, p.y + p.height, '#FFF', 5);
                  return { 
                      ...p, 
                      vy: JUMP_FORCE, 
                      isOnGround: false, 
                      jumpCount: p.jumpCount + 1 
                  };
              }
              return p;
          });
      }
      
      if(e.code === 'ShiftLeft' && gameStateRef.current === 'playing' && boss) {
          setPlayer(p => {
              if (p.shootCooldown <= 0) {
                  soundService.playSound('playerShoot');
                  const projectileSpeed = PLAYER_PROJECTILE_SPEED;
                  let vx = p.direction === 'right' ? projectileSpeed : -projectileSpeed;
                  let vy = 0;

                  const up = keysPressed['w'] || keysPressed['arrowup'];
                  const down = keysPressed['s'] || keysPressed['arrowdown'];
                  const left = keysPressed['a'] || keysPressed['arrowleft'];
                  const right = keysPressed['d'] || keysPressed['arrowright'];
                  
                  // Determine vertical and horizontal velocity based on keys pressed
                  if (up && !down) vy = -projectileSpeed;
                  else if (down && !up) vy = projectileSpeed;

                  if (left && !right) vx = -projectileSpeed;
                  else if (right && !left) vx = projectileSpeed;

                  // Normalize diagonal speed
                  if (vx !== 0 && vy !== 0) {
                      const magnitude = Math.sqrt(2); // sqrt(1*1 + 1*1)
                      vx = (vx / magnitude);
                      vy = (vy / magnitude);
                  }

                  // If only up/down is pressed, horizontal velocity should be zero
                  if ((up || down) && !left && !right) {
                    vx = 0;
                  }

                  setPlayerProjectiles(prev => [
                      ...prev,
                      {
                          id: Date.now(),
                          x: p.x + p.width / 2,
                          y: p.y + p.height / 2,
                          width: PLAYER_PROJECTILE_WIDTH,
                          height: PLAYER_PROJECTILE_HEIGHT,
                          vx: vx,
                          vy: vy,
                      }
                  ]);
                  return {...p, shootCooldown: PLAYER_SHOOT_COOLDOWN};
              }
              return p;
          });
      }

      if ((key === 'c' || key === 'x') && gameStateRef.current === 'playing' && !boss) {
        setPlayer(p => {
          if (p.capturedEnemyId !== null) {
            soundService.playSound('launch');
            setEnemies(prevEnemies => prevEnemies.map(en =>
              en.id === p.capturedEnemyId
                ? { ...en, state: 'launched', vx: p.direction === 'right' ? LAUNCH_FORCE : -LAUNCH_FORCE, vy: -5 }
                : en
            ));
            let newPowerUp = p.activePowerUp;
            if(p.activePowerUp === 'super-throw') {
                newPowerUp = null; // Consume super-throw on use
            }
            return { ...p, capturedEnemyId: null, activePowerUp: newPowerUp };
          } else {
            const captureRange = { ...p, x: p.x - 20, width: p.width + 40 };
            const nearbyEnemy = enemies.find(en => en.state === 'active' && areRectsColliding(captureRange, en));
            if (nearbyEnemy) {
              soundService.playSound('capture');
              createParticles(nearbyEnemy.x + nearbyEnemy.width/2, nearbyEnemy.y + nearbyEnemy.height/2, '#9472ff', 10);
              setEnemies(prevEnemies => prevEnemies.map(en =>
                en.id === nearbyEnemy.id ? { ...en, state: 'captured' } : en
              ));
              return { ...p, capturedEnemyId: nearbyEnemy.id };
            }
          }
          return p;
        });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed, enemies, boss, isPaused]);

  // ORACLE INTERACTION
  const consultOracle = async () => {
      if (isOracleLoading) return;
      setIsOracleLoading(true);
      const levelName = levels[currentLevelIndex]?.name || "Unknown Region";
      const wisdom = await aiService.getOracleWisdom(levelName, lives, score);
      setOracleMessage(wisdom);
      setIsOracleLoading(false);
  };

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (isPaused || gameStateRef.current !== 'playing' || !player.width) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = timestamp - (lastTimeRef.current || timestamp);
    lastTimeRef.current = timestamp;

    if (deltaTime > 100) { 
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    
    const targetCameraX = player.x - GAME_WIDTH / 2;
    const clampedTarget = Math.max(0, Math.min(targetCameraX, levelWidth - GAME_WIDTH));
    cameraXRef.current += (clampedTarget - cameraXRef.current) * 0.1;
    setCameraX(cameraXRef.current);

    let nextPlayer = { ...player };
    const isZeroG = boss && boss.type === 'shadowHead';

    // 1. Update Particles
    setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + (isZeroG ? 0 : 0.5), // Zero G affects particles too? Maybe not, keeps them floaty
        life: p.life - 0.02
    })).filter(p => p.life > 0));

    // 2. Update Player
    const currentSpeed = nextPlayer.activePowerUp === 'speed-boost' ? PLAYER_FAST_SPEED : PLAYER_SPEED;
    if (keysPressed['a'] || keysPressed['arrowleft']) { nextPlayer.vx = -currentSpeed; nextPlayer.direction = 'left'; } 
    else if (keysPressed['d'] || keysPressed['arrowright']) { nextPlayer.vx = currentSpeed; nextPlayer.direction = 'right'; } 
    else { nextPlayer.vx = 0; }
    
    if (isZeroG) {
         // Zero-G Vertical Movement
         if (keysPressed['w'] || keysPressed['arrowup']) { nextPlayer.vy = -currentSpeed; }
         else if (keysPressed['s'] || keysPressed['arrowdown']) { nextPlayer.vy = currentSpeed; }
         else { nextPlayer.vy = 0; }
    } else {
         nextPlayer.vy += GRAVITY;
    }
    
    nextPlayer.x += nextPlayer.vx;
    nextPlayer.y += nextPlayer.vy;
    nextPlayer.isOnGround = false;

    if (nextPlayer.shootCooldown > 0) {
        nextPlayer.shootCooldown -= deltaTime;
    }
    if (nextPlayer.isInvincible) {
        nextPlayer.invincibilityTimer -= deltaTime;
        if (nextPlayer.invincibilityTimer <= 0) nextPlayer.isInvincible = false;
    }
    if (nextPlayer.powerUpTimer > 0) {
        nextPlayer.powerUpTimer -= deltaTime;
        if (nextPlayer.powerUpTimer <= 0) nextPlayer.activePowerUp = null;
    }

    if (nextPlayer.x < 0) nextPlayer.x = 0;
    if (nextPlayer.x + nextPlayer.width > levelWidth) nextPlayer.x = levelWidth - nextPlayer.width;
    if (isZeroG) {
         if (nextPlayer.y < 0) nextPlayer.y = 0;
         if (nextPlayer.y + nextPlayer.height > GAME_HEIGHT) nextPlayer.y = GAME_HEIGHT - nextPlayer.height;
    }

    // 3. Player-Platform Collision (Skip if Zero G)
    if (!isZeroG) {
        platforms.forEach(platform => {
          const isHorizontallyAligned = nextPlayer.x + nextPlayer.width > platform.x && nextPlayer.x < platform.x + platform.width;
          
          // Collision from top (landing)
          if (player.y + player.height <= platform.y && nextPlayer.y + nextPlayer.height >= platform.y && isHorizontallyAligned) {
            nextPlayer.y = platform.y - nextPlayer.height;
            nextPlayer.vy = 0;
            nextPlayer.isOnGround = true;
            nextPlayer.jumpCount = 0; // Reset double jump
          }
          
          // Collision from bottom (hitting head)
          if (player.y >= platform.y + platform.height && nextPlayer.y < platform.y + platform.height && isHorizontallyAligned) {
            nextPlayer.vy = 0;
            nextPlayer.y = platform.y + platform.height;
            soundService.playSound('hit');
            createParticles(nextPlayer.x + nextPlayer.width/2, nextPlayer.y, '#A8ADBD', 3);
    
            // Check for enemies on top of the platform to stun
            setEnemies(prevEnemies => prevEnemies.map(enemy => {
                if (
                    enemy.state === 'active' &&
                    Math.abs((enemy.y + enemy.height) - platform.y) < 5 &&
                    enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width &&
                    enemy.x + enemy.width > nextPlayer.x && enemy.x < nextPlayer.x + nextPlayer.width
                ) {
                    return { ...enemy, state: 'stunned', stunTimer: 3000, vx: 0 };
                }
                return enemy;
            }));
          }
        });
    }

    if (nextPlayer.y > GAME_HEIGHT && !isZeroG) {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 200);
        soundService.playSound('damage');
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
            soundService.playSound('gameOver');
            gameStateRef.current = 'gameover';
            onGameOver(score);
        } else {
            soundService.playJingle('respawn');
            nextPlayer = { ...player, ...levels[currentLevelIndex].playerStart, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null, jumpCount: 0 };
        }
    }

    // A. Update Boss
    if (boss && boss.hp > 0) {
        setBoss(prevBoss => {
            if (!prevBoss) return null;
            let nextBoss = {...prevBoss, isThrowing: false};

            if (nextBoss.type === 'frog') {
                // FROG BEHAVIOR (Random Float)
                nextBoss.x += nextBoss.vx;
                nextBoss.y += nextBoss.vy;

                if (nextBoss.x <= 0 || nextBoss.x + nextBoss.width >= GAME_WIDTH) {
                    nextBoss.vx *= -1;
                }
                if (nextBoss.y <= 50 || nextBoss.y + nextBoss.height >= GAME_HEIGHT - 200) {
                    nextBoss.vy *= -1;
                }
                if (Math.random() < 0.005) nextBoss.vx *= -1;
                if (Math.random() < 0.01) nextBoss.vy *= -1;

                 // Attack (Frog)
                nextBoss.attackCooldown -= deltaTime;
                if (nextBoss.attackCooldown <= 0) {
                    nextBoss.attackCooldown = 2000 + Math.random() * 1500;
                    nextBoss.isThrowing = true;
                    soundService.playSound('bossShoot');
                    
                    const dx = player.x - (nextBoss.x + nextBoss.width / 2);
                    const dy = player.y - (nextBoss.y + nextBoss.height / 2);
                    const distance = Math.sqrt(dx*dx + dy*dy) || 1;
                    const projectileSpeed = BOSS_PROJECTILE_SPEED;

                    setProjectiles(prev => [
                        ...prev,
                        {
                            id: Date.now(), x: nextBoss.x + nextBoss.width / 2, y: nextBoss.y + nextBoss.height / 2,
                            width: BOSS_PROJECTILE_WIDTH, height: BOSS_PROJECTILE_HEIGHT, 
                            vx: (dx / distance) * projectileSpeed, 
                            vy: (dy / distance) * projectileSpeed,
                            isBomb: false,
                        }
                    ]);
                }

            } else if (nextBoss.type === 'chickenEye') {
                // CHICKEN EYE BEHAVIOR (Figure-8)
                nextBoss.movementTimer += deltaTime * 0.001; // seconds
                
                // Figure-8 Logic: x = A * sin(t), y = B * sin(2t)
                const t = nextBoss.movementTimer;
                const centerX = (GAME_WIDTH - nextBoss.width) / 2;
                const centerY = (GAME_HEIGHT / 2) - 150;
                const amplitudeX = 400;
                const amplitudeY = 150;

                nextBoss.x = centerX + Math.sin(t) * amplitudeX;
                nextBoss.y = centerY + Math.sin(2 * t) * amplitudeY;

                 // Attack (Chicken - Burst Eggs)
                 nextBoss.attackCooldown -= deltaTime;
                 if (nextBoss.attackCooldown <= 0) {
                    nextBoss.attackCooldown = 3000 + Math.random() * 1000;
                    soundService.playSound('bossShoot');
                    
                    const dx = player.x - (nextBoss.x + nextBoss.width / 2);
                    const dy = player.y - (nextBoss.y + nextBoss.height / 2);
                    const distance = Math.sqrt(dx*dx + dy*dy) || 1;
                    const projectileSpeed = BOSS_PROJECTILE_SPEED * 1.2;

                    // Burst of 4 eggs with slightly different angles
                    const baseAngle = Math.atan2(dy, dx);
                    const spread = 0.2; // Radians spread

                    const newProjectiles = [];
                    for (let i = -1.5; i <= 1.5; i+=1) {
                        const angle = baseAngle + (i * spread);
                        newProjectiles.push({
                            id: Date.now() + i, 
                            x: nextBoss.x + nextBoss.width / 2, 
                            y: nextBoss.y + nextBoss.height / 2,
                            width: EGG_PROJECTILE_WIDTH, 
                            height: EGG_PROJECTILE_HEIGHT, 
                            vx: Math.cos(angle) * projectileSpeed, 
                            vy: Math.sin(angle) * projectileSpeed,
                            isBomb: false,
                            isEgg: true
                        });
                    }

                    setProjectiles(prev => [...prev, ...newProjectiles]);
                 }
            } else if (nextBoss.type === 'shadowHead') {
                // SHADOW HEAD BEHAVIOR
                // State Machine: hidden -> fadingIn -> visible -> fadingOut -> hidden
                if (!nextBoss.visibilityState) nextBoss.visibilityState = 'hidden';
                if (nextBoss.opacity === undefined) nextBoss.opacity = 0;
                if (nextBoss.teleportTimer === undefined) nextBoss.teleportTimer = 0;

                const fadeSpeed = 0.02;

                if (nextBoss.visibilityState === 'hidden') {
                    nextBoss.opacity = 0;
                    nextBoss.teleportTimer -= deltaTime;
                    if (nextBoss.teleportTimer <= 0) {
                        // Teleport
                        nextBoss.x = Math.random() * (GAME_WIDTH - nextBoss.width);
                        nextBoss.y = Math.random() * (GAME_HEIGHT - nextBoss.height - 100);
                        nextBoss.visibilityState = 'fadingIn';
                        soundService.playSound('powerup'); // Teleport sound
                    }
                } else if (nextBoss.visibilityState === 'fadingIn') {
                    nextBoss.opacity += fadeSpeed;
                    if (nextBoss.opacity >= 1) {
                        nextBoss.opacity = 1;
                        nextBoss.visibilityState = 'visible';
                        nextBoss.attackCooldown = 500; // Attack soon after appearing
                        nextBoss.teleportTimer = 3000; // Stay visible for 3 seconds
                    }
                } else if (nextBoss.visibilityState === 'visible') {
                    nextBoss.teleportTimer -= deltaTime;
                    if (nextBoss.teleportTimer <= 0) {
                         nextBoss.visibilityState = 'fadingOut';
                    }

                    // Rapid Fire Attack
                    nextBoss.attackCooldown -= deltaTime;
                    if (nextBoss.attackCooldown <= 0) {
                        nextBoss.attackCooldown = 200; // Very fast fire rate
                        soundService.playSound('bossShoot');
                        
                        const dx = player.x - (nextBoss.x + nextBoss.width / 2);
                        const dy = player.y - (nextBoss.y + nextBoss.height / 2);
                        const distance = Math.sqrt(dx*dx + dy*dy) || 1;
                        const projectileSpeed = FIREBALL_SPEED;

                        setProjectiles(prev => [
                            ...prev,
                            {
                                id: Date.now(), x: nextBoss.x + nextBoss.width / 2, y: nextBoss.y + nextBoss.height / 2,
                                width: FIREBALL_WIDTH, height: FIREBALL_HEIGHT, 
                                vx: (dx / distance) * projectileSpeed, 
                                vy: (dy / distance) * projectileSpeed,
                                isFireball: true,
                            }
                        ]);
                    }

                } else if (nextBoss.visibilityState === 'fadingOut') {
                    nextBoss.opacity -= fadeSpeed;
                    if (nextBoss.opacity <= 0) {
                        nextBoss.opacity = 0;
                        nextBoss.visibilityState = 'hidden';
                        nextBoss.teleportTimer = 2000; // Stay hidden for 2s
                    }
                }
            }

            if (nextBoss.isHit) {
                nextBoss.hitTimer -= deltaTime;
                if (nextBoss.hitTimer <= 0) nextBoss.isHit = false;
            }

            return nextBoss;
        });
    }

    // B. Update Projectiles
    setProjectiles(prev => prev.map(p => {
        let nextP = { ...p, x: p.x + p.vx, y: p.y + p.vy };
        if (p.isBomb) {
             nextP.vy += GRAVITY;
        }
        // Eggs and Fireballs fly straight
        return nextP;
    }).filter(p => p.y < GAME_HEIGHT && p.y > -50 && p.x > -50 && p.x < levelWidth + 50));
    
    setPlayerProjectiles(prev => prev.map(p => ({...p, x: p.x + p.vx, y: p.y + p.vy})).filter(p => p.x > -50 && p.x < levelWidth + 50 && p.y > -50 && p.y < GAME_HEIGHT + 50));


    // 4. Update Enemies (non-boss levels)
    setEnemies(prevEnemies => {
        let newEnemies = [...prevEnemies];
        const wasSuperThrow = player.activePowerUp === 'super-throw';

        newEnemies.forEach((enemy, index) => {
            if (enemy.state === 'defeated') return;
            if (enemy.state === 'captured') {
                if (nextPlayer.capturedEnemyId === enemy.id) {
                    enemy.x = nextPlayer.x + (nextPlayer.direction === 'right' ? nextPlayer.width : -enemy.width);
                    enemy.y = nextPlayer.y - 20;
                }
                return;
            }
            if (enemy.state === 'stunned') {
                enemy.stunTimer! -= deltaTime;
                if(enemy.stunTimer! <= 0) {
                    enemy.state = 'active';
                    enemy.vx = enemy.direction === 'right' ? ENEMY_SPEED : -ENEMY_SPEED;
                }
                return;
            }


            if (enemy.state === 'active') {
                if (enemy.type === 'phaser') {
                    const dx = nextPlayer.x - enemy.x;
                    const dy = nextPlayer.y - enemy.y;
                    const distance = Math.sqrt(dx*dx + dy*dy) || 1;
                    enemy.vx = (dx / distance) * PHASER_SPEED;
                    enemy.vy = (dy / distance) * PHASER_SPEED;
                } else if (enemy.type === 'bomber') {
                    enemy.attackCooldown! -= deltaTime;
                    if (enemy.attackCooldown! <= 0) {
                        enemy.attackCooldown = BOMBER_ATTACK_COOLDOWN + Math.random() * 1000;
                        soundService.playSound('bomberShoot');
                        const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
                        const bombVx = dx * BOMB_HORIZONTAL_SPEED_MULTIPLIER;
                        setProjectiles(prev => [...prev, {
                            id: Date.now(), x: enemy.x + enemy.width / 2, y: enemy.y,
                            width: BOMB_WIDTH, height: BOMB_HEIGHT, vx: bombVx, vy: BOMB_INITIAL_VY, isBomb: true,
                        }]);
                    }
                } else if (enemy.type === 'flyer') {
                    if (enemy.x < enemy.originalX - 200 || enemy.x > enemy.originalX + 200) { enemy.vx *= -1; enemy.direction = enemy.direction === 'left' ? 'right' : 'left'; }
                    if (enemy.y < enemy.originalY - FLYER_PATROL_RANGE || enemy.y > enemy.originalY + FLYER_PATROL_RANGE) { enemy.vy *= -1; }
                } else {
                    enemy.vy += GRAVITY;
                    const lookAheadX = enemy.direction === 'right' ? enemy.x + enemy.width : enemy.x - 1;
                    let groundAhead = false;
                    for (const platform of platforms) { if (lookAheadX >= platform.x && lookAheadX <= platform.x + platform.width && enemy.y + enemy.height + 1 >= platform.y && enemy.y + enemy.height <= platform.y + 10) { groundAhead = true; break; } }
                    if (!groundAhead) { enemy.vx *= -1; enemy.direction = enemy.direction === 'left' ? 'right' : 'left'; }
                    if (enemy.type === 'jumper') {
                        enemy.jumpCooldown! -= deltaTime;
                        let onGround = false;
                        platforms.forEach(platform => { if(areRectsColliding({...enemy, y: enemy.y + 1, height: 1}, platform)) onGround = true; });
                        if (enemy.jumpCooldown! <= 0 && onGround) { enemy.vy = ENEMY_JUMP_FORCE; enemy.jumpCooldown = ENEMY_JUMP_COOLDOWN + Math.random() * 1000; }
                    }
                }
            } else { enemy.vy += GRAVITY; }
            
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            
            if (enemy.type !== 'flyer' && enemy.type !== 'phaser' || enemy.state !== 'active') {
                platforms.forEach(platform => { if (enemy.y + enemy.height > platform.y && enemy.y + enemy.height < platform.y + 30 && enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width && enemy.vy >= 0) { enemy.y = platform.y - enemy.height; enemy.vy = 0; } });
            }
            
            if (enemy.state === 'launched') {
                 newEnemies.forEach((otherEnemy, otherIndex) => {
                    if (index !== otherIndex && otherEnemy.state === 'active' && areRectsColliding(enemy, otherEnemy)) {
                        soundService.playSound('hit');
                        createParticles((enemy.x + otherEnemy.x)/2, (enemy.y + otherEnemy.y)/2, '#FF0000', 15);
                        if(wasSuperThrow) {
                            let defeatedCount = 0;
                            newEnemies.forEach(e => {
                                const distance = Math.sqrt(Math.pow(e.x - otherEnemy.x, 2) + Math.pow(e.y - otherEnemy.y, 2));
                                if (e.state === 'active' && distance < SUPER_THROW_EXPLOSION_RADIUS) { e.state = 'defeated'; defeatedCount++; }
                            });
                             updateScore(ENEMY_DEFEAT_POINTS * defeatedCount);
                        } else {
                            enemy.state = 'defeated'; otherEnemy.state = 'defeated';
                            updateScore(ENEMY_DEFEAT_POINTS * 2);
                        }
                    }
                });
                if (enemy.y > GAME_HEIGHT) enemy.state = 'defeated';
            }
        });
        return newEnemies;
    });

    // 5. Player & Projectile Collisions
    if (!nextPlayer.isInvincible) {
        let tookDamage = false;
        
        projectiles.forEach(proj => { if (areRectsColliding(nextPlayer, proj)) {
            tookDamage = true;
            setProjectiles(prev => prev.filter(p => p.id !== proj.id));
        }});

        if (!boss) {
             enemies.forEach(enemy => { if (enemy.state === 'active' && areRectsColliding(nextPlayer, enemy)) tookDamage = true; });
        }
       
        if (tookDamage) {
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 200);
            
            if (isGodMode) {
                soundService.playSound('hit');
            } else {
                if (nextPlayer.hasShield) {
                    soundService.playSound('hit');
                    nextPlayer.hasShield = false;
                    nextPlayer.isInvincible = true;
                    nextPlayer.invincibilityTimer = 500;
                    createParticles(nextPlayer.x + nextPlayer.width/2, nextPlayer.y + nextPlayer.height/2, '#00ccff', 10);
                } else {
                    soundService.playSound('damage');
                    createParticles(nextPlayer.x + nextPlayer.width/2, nextPlayer.y + nextPlayer.height/2, '#FF0000', 20);
                    const newLives = lives - 1;
                    setLives(newLives);
                    if (newLives <= 0) {
                        soundService.playSound('gameOver');
                        gameStateRef.current = 'gameover';
                        onGameOver(score);
                    } else {
                        soundService.playJingle('respawn');
                        nextPlayer = { ...player, ...levels[currentLevelIndex].playerStart, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null, jumpCount: 0 };
                    }
                }
            }
        }
    }
    
    // 6. Player Projectiles & Boss Collision
    if (boss && boss.hp > 0) {
        setPlayerProjectiles(prev => prev.filter(p => {
            // For ShadowHead, collision only counts if opacity is high enough (visible)
            if (boss.type === 'shadowHead' && (boss.opacity || 0) < 0.5) return true;

            if(areRectsColliding(p, boss)) {
                soundService.playSound('bossHit');
                createParticles(p.x, p.y, '#00FF00', 5);
                updateScore(ENEMY_DEFEAT_POINTS / 2);
                setBoss(prevBoss => {
                    if (!prevBoss) return null;
                     const newHp = prevBoss.hp - 1;
                     if (newHp <= 0) {
                        soundService.playSound('bossDefeat');
                        createParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#00FF00', 50);
                        updateScore(ENEMY_DEFEAT_POINTS * 20);
                        gameStateRef.current = 'level-cleared';
                        setGameState('level-cleared');
                        setTimeout(() => {
                            if (currentLevelIndex + 1 >= levels.length) { onCompleted(); } 
                            else { setCurrentLevelIndex(i => i + 1); }
                        }, 3000);
                        return {...prevBoss, hp: 0, isHit: true, hitTimer: 3000};
                    }
                    return {...prevBoss, hp: newHp, isHit: true, hitTimer: 200};
                });
                return false;
            }
            return true;
        }));
    }
    
    // 7. Player & Item Collision
    const remainingItems = items.filter(item => {
        if (areRectsColliding(nextPlayer, item)) {
            switch(item.type) {
                case 'joystick': case 'floppy': case 'cartridge':
                    if (boss) return true; // Don't collect in boss fight
                    updateScore(COLLECTIBLE_POINTS);
                    soundService.playSound('collect');
                    createParticles(item.x + item.width/2, item.y + item.height/2, '#FFFF00', 5);
                    return false;
                case 'shield':
                    nextPlayer.hasShield = true; soundService.playSound('powerup'); 
                    createParticles(item.x + item.width/2, item.y + item.height/2, '#00ccff', 8);
                    return false;
                case 'speed-boost':
                    nextPlayer.activePowerUp = 'speed-boost'; nextPlayer.powerUpTimer = POWER_UP_DURATION; soundService.playSound('powerup'); 
                    createParticles(item.x + item.width/2, item.y + item.height/2, '#ffee00', 8);
                    return false;
                case 'super-throw':
                    nextPlayer.activePowerUp = 'super-throw'; soundService.playSound('powerup'); 
                    createParticles(item.x + item.width/2, item.y + item.height/2, '#ff8800', 8);
                    return false;
            }
        }
        return true;
    });
    setItems(remainingItems);

    // 8. Level Clear Check
    if (goal && !boss && gameStateRef.current === 'playing') {
        const collectiblesLeft = remainingItems.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;
        const totalCollectiblesInLevel = levels[currentLevelIndex].items.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;

        if (collectiblesLeft === 0 && totalCollectiblesInLevel > 0 && areRectsColliding(nextPlayer, goal)) {
            soundService.playSound('levelClear');
            createParticles(goal.x + goal.width/2, goal.y + goal.height/2, '#FFFFFF', 30);
            gameStateRef.current = 'level-cleared';
            setGameState('level-cleared');
            setTimeout(() => {
                if (currentLevelIndex + 1 >= levels.length) {
                    onCompleted();
                } else {
                    setCurrentLevelIndex(i => i + 1);
                }
            }, 2000);
        }
    }


    setPlayer(nextPlayer);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [items, currentLevelIndex, enemies, keysPressed, platforms, player, onGameOver, onCompleted, setGameState, updateScore, levelWidth, lives, boss, projectiles, isGodMode, score, goal, isPaused]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameLoop]);

  const collectiblesLeft = items.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;
  const levelName = levels[currentLevelIndex]?.name || `Level ${currentLevelIndex + 1}`;
  const isShadowHeadBoss = boss && boss.type === 'shadowHead';

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      {damageFlash && <div className="absolute inset-0 bg-red-600 bg-opacity-40 z-50 pointer-events-none"></div>}
      
      {/* Black Overlay for Boss 3 */}
      {isShadowHeadBoss ? (
          <div className="absolute inset-0 bg-black z-0"></div>
      ) : (
          <Background cameraX={cameraX} />
      )}
      
      <Hud score={score} lives={lives} level={currentLevelIndex + 1} levelName={levelName} collectiblesLeft={collectiblesLeft} activePowerUp={player.activePowerUp} boss={boss} isGodMode={isGodMode} />

      <div
        className="absolute top-0 left-0"
        style={{ willChange: 'transform', transform: `translateX(-${cameraX}px)`}}
      >
        {platforms.map((p, i) => <Platform key={i} platform={p} />)}
        {goal && (
            <div style={{ position: 'absolute', left: goal.x, top: goal.y, width: goal.width, height: goal.height, zIndex: 1 }}>
                <GoalSprite />
            </div>
        )}
        {items.map(c => (
          <div key={c.id} style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height }}>
            <ItemSprite type={c.type} />
          </div>
        ))}
        {player.width && <Player player={player} />}
        {enemies.map(e => <Enemy key={e.id} enemy={e} />)}
        
        {/* Render appropriate boss component based on type */}
        {boss && boss.type === 'frog' && <CyclopsFrogBoss boss={boss} />}
        {boss && boss.type === 'chickenEye' && <ChickenEyeBoss boss={boss} />}
        {boss && boss.type === 'shadowHead' && <ShadowHeadBoss boss={boss} />}


        {projectiles.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height }}>
                {p.isBomb ? <BombSprite /> : (p.isEgg ? <EggSprite /> : (p.isFireball ? <FireballSprite /> : <CDROMSprite />))}
            </div>
        ))}
        {playerProjectiles.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height }}>
                <PlayerProjectileSprite />
            </div>
        ))}
        {/* Render Particles */}
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
                    opacity: p.life,
                    pointerEvents: 'none'
                }}
            />
        ))}
      </div>

      {/* PAUSE MENU OVERLAY */}
      {isPaused && (
          <div className="absolute inset-0 bg-black bg-opacity-80 z-50 flex flex-col justify-center items-center text-white">
              <h2 className="text-6xl mb-8" style={{ fontFamily: "'Press Start 2P', cursive" }}>PAUSED</h2>
              
              <div className="bg-gray-800 p-8 border-4 border-white max-w-2xl w-full text-center mb-8">
                  <h3 className="text-2xl text-yellow-400 mb-4">ORACLE OF THE BITVERSE</h3>
                  
                  {!oracleMessage && !isOracleLoading && (
                      <button 
                        onClick={consultOracle}
                        className="bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 border-b-4 border-blue-800 active:border-b-0 active:mt-1"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                      >
                          CONSULT THE ORACLE (AI)
                      </button>
                  )}

                  {isOracleLoading && (
                      <p className="animate-pulse text-cyan-400">COMMUNING WITH THE ANCIENTS...</p>
                  )}

                  {oracleMessage && (
                      <div className="text-green-400 leading-relaxed text-xl typing-effect">
                          "{oracleMessage}"
                      </div>
                  )}
              </div>

              <p className="text-gray-400 animate-blink mt-8">PRESS ESC TO RESUME</p>
          </div>
      )}

      {gameStateRef.current === 'level-cleared' && (
         <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-20">
            <h2 className="text-7xl text-yellow-400 animate-pulse" style={{textShadow: '3px 3px #000'}}>{boss && boss.hp <= 0 ? "BOSS DEFEATED!" : "LEVEL CLEARED!"}</h2>
         </div>
      )}
    </div>
  );
};

export default GameScreen;
