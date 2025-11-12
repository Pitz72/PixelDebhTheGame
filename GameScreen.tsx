import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player as PlayerType, Enemy as EnemyType, Item, Platform as PlatformType, GameState, ItemType, LevelData, Boss, Projectile, PlayerProjectile } from './types';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Platform from './components/Platform';
import Hud from './components/Hud';
import Background from './components/Background';
import CyclopsFrogBoss from './components/FrogBoss';
import { ItemSprite, PlayerProjectileSprite, CDROMSprite } from './services/assetService';
import * as soundService from './services/soundService';
import { levels } from './levels';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_FAST_SPEED, JUMP_FORCE, PLAYER_INVINCIBILITY_DURATION,
  ENEMY_SPEED, FLYER_SPEED, FLYER_VERTICAL_SPEED, FLYER_PATROL_RANGE, ENEMY_JUMP_FORCE, ENEMY_JUMP_COOLDOWN, LAUNCH_FORCE, POWER_UP_DURATION, SUPER_THROW_EXPLOSION_RADIUS,
  COLLECTIBLE_POINTS, ENEMY_DEFEAT_POINTS, INITIAL_LIVES, EXTRA_LIFE_SCORE_START, EXTRA_LIFE_SCORE_MULTIPLIER, PLAYER_WIDTH, PLAYER_HEIGHT, BOSS_INITIAL_VX, BOSS_INITIAL_VY, PLAYER_PROJECTILE_SPEED, PLAYER_PROJECTILE_WIDTH, PLAYER_PROJECTILE_HEIGHT, PLAYER_SHOOT_COOLDOWN, BOSS_PROJECTILE_SPEED, BOSS_PROJECTILE_WIDTH, BOSS_PROJECTILE_HEIGHT
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
  onGameOver: () => void;
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
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [playerProjectiles, setPlayerProjectiles] = useState<PlayerProjectile[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [nextExtraLifeScore, setNextExtraLifeScore] = useState(EXTRA_LIFE_SCORE_START);
  const [cameraX, setCameraX] = useState(0);
  const [levelWidth, setLevelWidth] = useState(GAME_WIDTH);

  const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>('playing');
  const cameraXRef = useRef(0);
  
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
      const bossX = levelData.boss ? levelData.boss.x + levelData.boss.width : 0;
      return Math.max(GAME_WIDTH, ...allX, bossX);
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
    setItems(levelData.items.map((c, i) => ({ id: i, ...c })));
    
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
        });
        setEnemies([]); // No initial enemies in boss room
    } else {
        setEnemies(levelData.enemies.map((e, i) => ({
          id: i, ...e, vx: e.type === 'flyer' ? FLYER_SPEED : ENEMY_SPEED, vy: e.type === 'flyer' ? FLYER_VERTICAL_SPEED : 0,
          direction: 'right', state: 'active', jumpCooldown: ENEMY_JUMP_COOLDOWN,
        })));
    }

    gameStateRef.current = 'playing';
    setGameState('playing');
  }, [onCompleted, setGameState]);

  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  useEffect(() => {
    soundService.playJingle('levelStart');
  }, [currentLevelIndex]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed[key] = true;
      
      if(e.code === 'ShiftLeft' && gameStateRef.current === 'playing' && boss) {
          setPlayer(p => {
              if (p.shootCooldown <= 0) {
                  soundService.playSound('playerShoot');
                  const projectileSpeed = PLAYER_PROJECTILE_SPEED;
                  setPlayerProjectiles(prev => [
                      ...prev,
                      {
                          id: Date.now(),
                          x: p.x + p.width / 2,
                          y: p.y + p.height / 2,
                          width: PLAYER_PROJECTILE_WIDTH,
                          height: PLAYER_PROJECTILE_HEIGHT,
                          vx: p.direction === 'right' ? projectileSpeed : -projectileSpeed,
                          vy: 0,
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
  }, [keysPressed, enemies, boss]);

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing' || !player.width) {
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

    // 1. Update Player
    const currentSpeed = nextPlayer.activePowerUp === 'speed-boost' ? PLAYER_FAST_SPEED : PLAYER_SPEED;
    if (keysPressed['a'] || keysPressed['arrowleft']) { nextPlayer.vx = -currentSpeed; nextPlayer.direction = 'left'; } 
    else if (keysPressed['d'] || keysPressed['arrowright']) { nextPlayer.vx = currentSpeed; nextPlayer.direction = 'right'; } 
    else { nextPlayer.vx = 0; }
    if ((keysPressed['w'] || keysPressed['arrowup'] || keysPressed[' ']) && nextPlayer.isOnGround) { 
        nextPlayer.vy = JUMP_FORCE; 
        nextPlayer.isOnGround = false;
        soundService.playSound('jump');
    }
    
    nextPlayer.vy += GRAVITY;
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

    // 2. Player-Platform Collision
    platforms.forEach(platform => {
      if (player.y + player.height <= platform.y && nextPlayer.y + nextPlayer.height >= platform.y && nextPlayer.x + nextPlayer.width > platform.x && nextPlayer.x < platform.x + platform.width) {
        nextPlayer.y = platform.y - nextPlayer.height;
        nextPlayer.vy = 0;
        nextPlayer.isOnGround = true;
      }
      if (player.y >= platform.y + platform.height && nextPlayer.y < platform.y + platform.height && nextPlayer.x + nextPlayer.width > platform.x && nextPlayer.x < platform.x + platform.width) {
        nextPlayer.vy = 0;
        nextPlayer.y = platform.y + platform.height;
      }
    });

    if (nextPlayer.y > GAME_HEIGHT) {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 200);
        soundService.playSound('damage');
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
            soundService.playSound('gameOver');
            gameStateRef.current = 'gameover';
            onGameOver();
        } else {
            soundService.playJingle('respawn');
            nextPlayer = { ...player, ...levels[currentLevelIndex].playerStart, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null };
        }
    }

    // A. Update Boss
    if (boss && boss.hp > 0) {
        setBoss(prevBoss => {
            if (!prevBoss) return null;
            let nextBoss = {...prevBoss, isThrowing: false};

            // Movement
            nextBoss.x += nextBoss.vx;
            nextBoss.y += nextBoss.vy;

            // Boundary checks and direction change
            if (nextBoss.x <= 0 || nextBoss.x + nextBoss.width >= GAME_WIDTH) {
                nextBoss.vx *= -1;
            }
            if (nextBoss.y <= 50 || nextBoss.y + nextBoss.height >= GAME_HEIGHT - 200) {
                nextBoss.vy *= -1;
            }
            if (Math.random() < 0.005) nextBoss.vx *= -1;
            if (Math.random() < 0.01) nextBoss.vy *= -1;

            if (nextBoss.isHit) {
                nextBoss.hitTimer -= deltaTime;
                if (nextBoss.hitTimer <= 0) nextBoss.isHit = false;
            }

            // Attack
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
                    }
                ]);
            }
            return nextBoss;
        });
    }

    // B. Update Projectiles
    setProjectiles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, })).filter(p => p.y < GAME_HEIGHT && p.y > -50 && p.x > -50 && p.x < levelWidth + 50));
    setPlayerProjectiles(prev => prev.map(p => ({...p, x: p.x + p.vx})).filter(p => p.x > -50 && p.x < levelWidth + 50));


    // 3. Update Enemies (non-boss levels)
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

            if (enemy.state === 'active') {
                 if (enemy.type === 'flyer') {
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
            
            if (enemy.type !== 'flyer' || enemy.state !== 'active') {
                platforms.forEach(platform => { if (enemy.y + enemy.height > platform.y && enemy.y + enemy.height < platform.y + 30 && enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width && enemy.vy >= 0) { enemy.y = platform.y - enemy.height; enemy.vy = 0; } });
            }
            
            if (enemy.state === 'launched') {
                 newEnemies.forEach((otherEnemy, otherIndex) => {
                    if (index !== otherIndex && otherEnemy.state === 'active' && areRectsColliding(enemy, otherEnemy)) {
                        soundService.playSound('hit');
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

    // 4. Player & Projectile Collisions
    if (!nextPlayer.isInvincible) {
        let tookDamage = false;
        if (boss) {
             projectiles.forEach(proj => { if (areRectsColliding(nextPlayer, proj)) {
                tookDamage = true;
                setProjectiles(prev => prev.filter(p => p.id !== proj.id));
            }});
        } else {
             enemies.forEach(enemy => { if (enemy.state === 'active' && areRectsColliding(nextPlayer, enemy)) tookDamage = true; });
        }
       
        if (tookDamage) {
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 200);
            if (nextPlayer.hasShield) {
                soundService.playSound('hit');
                nextPlayer.hasShield = false;
                nextPlayer.isInvincible = true;
                nextPlayer.invincibilityTimer = 500;
            } else {
                soundService.playSound('damage');
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                    soundService.playSound('gameOver');
                    gameStateRef.current = 'gameover';
                    onGameOver();
                } else {
                    soundService.playJingle('respawn');
                    nextPlayer = { ...player, ...levels[currentLevelIndex].playerStart, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null };
                }
            }
        }
    }

    if (boss && boss.hp > 0) {
        setPlayerProjectiles(prev => prev.filter(p => {
            if(areRectsColliding(p, boss)) {
                soundService.playSound('bossHit');
                updateScore(ENEMY_DEFEAT_POINTS / 2);
                setBoss(prevBoss => {
                    if (!prevBoss) return null;
                     const newHp = prevBoss.hp - 1;
                     if (newHp <= 0) {
                        soundService.playSound('bossDefeat');
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

    setItems(prev => {
        const remaining = prev.filter(item => {
            if (areRectsColliding(nextPlayer, item)) {
                switch(item.type) {
                    case 'joystick': case 'floppy': case 'cartridge':
                        if (boss) return true; // Don't collect in boss fight
                        updateScore(COLLECTIBLE_POINTS);
                        soundService.playSound('collect');
                        return false;
                    case 'shield':
                        nextPlayer.hasShield = true; soundService.playSound('powerup'); return false;
                    case 'speed-boost':
                        nextPlayer.activePowerUp = 'speed-boost'; nextPlayer.powerUpTimer = POWER_UP_DURATION; soundService.playSound('powerup'); return false;
                    case 'super-throw':
                        nextPlayer.activePowerUp = 'super-throw'; soundService.playSound('powerup'); return false;
                }
            }
            return true;
        });

        if (boss) return remaining;

        const collectiblesLeft = remaining.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;
        if (collectiblesLeft === 0 && prev.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length > 0) {
            soundService.playSound('levelClear');
            gameStateRef.current = 'level-cleared';
            setGameState('level-cleared');
            setTimeout(() => {
                if (currentLevelIndex + 1 >= levels.length) { onCompleted(); } 
                else { setCurrentLevelIndex(i => i + 1); }
            }, 2000);
        }
        return remaining;
    });

    setPlayer(nextPlayer);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [items, currentLevelIndex, enemies, keysPressed, platforms, player, onGameOver, onCompleted, setGameState, updateScore, levelWidth, lives, boss, projectiles]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameLoop]);

  const collectiblesLeft = items.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      {damageFlash && <div className="absolute inset-0 bg-red-600 bg-opacity-40 z-50 pointer-events-none"></div>}
      
      <Background cameraX={cameraX} />
      <Hud score={score} lives={lives} level={currentLevelIndex + 1} collectiblesLeft={collectiblesLeft} activePowerUp={player.activePowerUp} boss={boss} />

      <div
        className="absolute top-0 left-0"
        style={{ willChange: 'transform', transform: `translateX(-${cameraX}px)`}}
      >
        {platforms.map((p, i) => <Platform key={i} platform={p} />)}
        {items.map(c => (
          <div key={c.id} style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height }}>
            <ItemSprite type={c.type} />
          </div>
        ))}
        {player.width && <Player player={player} />}
        {enemies.map(e => <Enemy key={e.id} enemy={e} />)}
        {boss && <CyclopsFrogBoss boss={boss} />}
        {projectiles.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height }}>
                <CDROMSprite />
            </div>
        ))}
        {playerProjectiles.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height }}>
                <PlayerProjectileSprite />
            </div>
        ))}
      </div>

      {gameStateRef.current === 'level-cleared' && (
         <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-20">
            <h2 className="text-7xl text-yellow-400 animate-pulse" style={{textShadow: '3px 3px #000'}}>{boss && boss.hp <= 0 ? "BOSS DEFEATED!" : "LEVEL CLEARED!"}</h2>
         </div>
      )}
    </div>
  );
};

export default GameScreen;