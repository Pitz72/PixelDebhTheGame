import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player as PlayerType, Enemy as EnemyType, Item, Platform as PlatformType, GameState, ItemType } from './types';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Platform from './components/Platform';
import Hud from './components/Hud';
import { ItemSprite } from './services/assetService';
import * as soundService from './services/soundService';
import { levels } from './levels';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_FAST_SPEED, JUMP_FORCE, PLAYER_INVINCIBILITY_DURATION,
  ENEMY_SPEED, FLYER_SPEED, FLYER_VERTICAL_SPEED, FLYER_PATROL_RANGE, ENEMY_JUMP_FORCE, ENEMY_JUMP_COOLDOWN, LAUNCH_FORCE, POWER_UP_DURATION, SUPER_THROW_EXPLOSION_RADIUS,
  COLLECTIBLE_POINTS, ENEMY_DEFEAT_POINTS, INITIAL_LIVES
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

  const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>('playing');
  
  const loadLevel = useCallback((levelIndex: number) => {
    const levelData = levels[levelIndex];
    if (!levelData) {
      gameStateRef.current = 'completed';
      onCompleted();
      return;
    }

    setPlayer({
      ...levelData.playerStart,
      width: 50,
      height: 70,
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
    });

    setPlatforms(levelData.platforms);

    setEnemies(levelData.enemies.map((e, i) => ({
      id: i,
      ...e,
      vx: e.type === 'flyer' ? FLYER_SPEED : ENEMY_SPEED,
      vy: e.type === 'flyer' ? FLYER_VERTICAL_SPEED : 0,
      direction: 'right',
      state: 'active',
      jumpCooldown: ENEMY_JUMP_COOLDOWN,
    })));

    setItems(levelData.items.map((c, i) => ({
      id: i,
      ...c,
    })));
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, [onCompleted, setGameState]);

  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  // Play start sound on level load
  useEffect(() => {
    soundService.playJingle('levelStart');
  }, [currentLevelIndex]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true;
      if ((e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x') && gameStateRef.current === 'playing') {
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
  }, [keysPressed, enemies]);

  // Main Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing') {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = timestamp - (lastTimeRef.current || timestamp);
    lastTimeRef.current = timestamp;

    if (deltaTime > 100) { 
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    // Update Player
    setPlayer(p => {
      let newPlayer = { ...p };
      const currentSpeed = newPlayer.activePowerUp === 'speed-boost' ? PLAYER_FAST_SPEED : PLAYER_SPEED;
      if (keysPressed['a'] || keysPressed['arrowleft']) { newPlayer.vx = -currentSpeed; newPlayer.direction = 'left'; } 
      else if (keysPressed['d'] || keysPressed['arrowright']) { newPlayer.vx = currentSpeed; newPlayer.direction = 'right'; } 
      else { newPlayer.vx = 0; }
      if ((keysPressed['w'] || keysPressed['arrowup'] || keysPressed[' ']) && newPlayer.isOnGround) { 
        newPlayer.vy = JUMP_FORCE; 
        newPlayer.isOnGround = false;
        soundService.playSound('jump');
      }
      
      newPlayer.vy += GRAVITY;
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;
      newPlayer.isOnGround = false;

      if (newPlayer.isInvincible) {
        newPlayer.invincibilityTimer -= deltaTime;
        if (newPlayer.invincibilityTimer <= 0) newPlayer.isInvincible = false;
      }
      if (newPlayer.powerUpTimer > 0) {
        newPlayer.powerUpTimer -= deltaTime;
        if (newPlayer.powerUpTimer <= 0) {
            newPlayer.activePowerUp = null;
        }
      }

      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x + newPlayer.width > GAME_WIDTH) newPlayer.x = GAME_WIDTH - newPlayer.width;

      platforms.forEach(platform => {
        if (p.y + p.height <= platform.y && newPlayer.y + newPlayer.height >= platform.y && newPlayer.x + newPlayer.width > platform.x && newPlayer.x < platform.x + platform.width) {
          newPlayer.y = platform.y - newPlayer.height;
          newPlayer.vy = 0;
          newPlayer.isOnGround = true;
        }
        if (p.y >= platform.y + platform.height && newPlayer.y < platform.y + platform.height && newPlayer.x + newPlayer.width > platform.x && newPlayer.x < platform.x + platform.width) {
          newPlayer.vy = 0;
          newPlayer.y = platform.y + platform.height;
        }
      });
      if (newPlayer.y > GAME_HEIGHT) { // Player fell off screen
          soundService.playSound('damage');
          setLives(l => l - 1);
          if (lives - 1 <= 0) {
              soundService.playSound('gameOver');
              gameStateRef.current = 'gameover';
              onGameOver();
              return newPlayer;
          }
          soundService.playJingle('respawn');
          return { ...newPlayer, x: levels[currentLevelIndex].playerStart.x, y: levels[currentLevelIndex].playerStart.y, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null };
      }
      return newPlayer;
    });

    // Update Enemies
    setEnemies(prevEnemies => {
        let newEnemies = [...prevEnemies];
        const wasSuperThrow = player.activePowerUp === 'super-throw';

        newEnemies.forEach((enemy, index) => {
            if (enemy.state === 'defeated') return;
            if (enemy.state === 'captured') {
                setPlayer(p => {
                    if (p.capturedEnemyId === enemy.id) { enemy.x = p.x + (p.direction === 'right' ? p.width : -enemy.width); enemy.y = p.y - 20; }
                    return p;
                });
                return;
            }

            if (enemy.state === 'active') {
                 if (enemy.type === 'flyer') {
                    // Horizontal patrol
                    if (enemy.x < enemy.originalX - 200 || enemy.x > enemy.originalX + 200) {
                        enemy.vx *= -1;
                        enemy.direction = enemy.direction === 'left' ? 'right' : 'left';
                    }
                    // Vertical patrol
                    if (enemy.y < enemy.originalY - FLYER_PATROL_RANGE || enemy.y > enemy.originalY + FLYER_PATROL_RANGE) {
                        enemy.vy *= -1;
                    }
                } else {
                    // Ground enemy AI
                    enemy.vy += GRAVITY;

                    // Check for ground ahead before moving
                    const lookAheadX = enemy.direction === 'right' ? enemy.x + enemy.width : enemy.x - 1;
                    let groundAhead = false;
                    for (const platform of platforms) {
                        if (
                            lookAheadX >= platform.x &&
                            lookAheadX <= platform.x + platform.width &&
                            enemy.y + enemy.height + 1 >= platform.y &&
                            enemy.y + enemy.height <= platform.y + 10 // check just below
                        ) {
                            groundAhead = true;
                            break;
                        }
                    }

                    if (!groundAhead) {
                        enemy.vx *= -1;
                        enemy.direction = enemy.direction === 'left' ? 'right' : 'left';
                    }

                    if (enemy.type === 'jumper') {
                        enemy.jumpCooldown! -= deltaTime;
                        let onGround = false;
                        platforms.forEach(platform => { if(areRectsColliding({...enemy, y: enemy.y + 1, height: 1}, platform)) onGround = true; });
                        if (enemy.jumpCooldown! <= 0 && onGround) {
                            enemy.vy = ENEMY_JUMP_FORCE;
                            enemy.jumpCooldown = ENEMY_JUMP_COOLDOWN + Math.random() * 1000;
                        }
                    }
                }
            } else { 
                enemy.vy += GRAVITY;
            }
            
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            
            // Platform collision for ground enemies (or launched flyers)
            if (enemy.type !== 'flyer' || enemy.state !== 'active') {
                platforms.forEach(platform => {
                    if (enemy.y + enemy.height > platform.y && enemy.y + enemy.height < platform.y + 30 && enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width && enemy.vy >= 0) {
                        enemy.y = platform.y - enemy.height;
                        enemy.vy = 0;
                    }
                });
            }
            
            if (enemy.state === 'launched') {
                newEnemies.forEach((otherEnemy, otherIndex) => {
                    if (index !== otherIndex && otherEnemy.state === 'active' && areRectsColliding(enemy, otherEnemy)) {
                        soundService.playSound('hit');
                        if(wasSuperThrow) {
                            // Super Throw Explosion
                            let defeatedCount = 0;
                            newEnemies.forEach(e => {
                                const distance = Math.sqrt(Math.pow(e.x - otherEnemy.x, 2) + Math.pow(e.y - otherEnemy.y, 2));
                                if (e.state === 'active' && distance < SUPER_THROW_EXPLOSION_RADIUS) {
                                    e.state = 'defeated';
                                    defeatedCount++;
                                }
                            });
                             setScore(s => s + (ENEMY_DEFEAT_POINTS * defeatedCount));
                        } else {
                            enemy.state = 'defeated'; otherEnemy.state = 'defeated';
                            setScore(s => s + ENEMY_DEFEAT_POINTS * 2);
                        }
                    }
                });
                if (enemy.y > GAME_HEIGHT) enemy.state = 'defeated';
            }
        });
        return newEnemies;
    });

    // Player-Object Collisions
    setPlayer(p => {
        if (p.isInvincible) return p;
        let tookDamage = false;
        enemies.forEach(enemy => { if (enemy.state === 'active' && areRectsColliding(p, enemy)) tookDamage = true; });

        if (tookDamage) {
            if (p.hasShield) {
                soundService.playSound('hit');
                return { ...p, hasShield: false, isInvincible: true, invincibilityTimer: 500 }; // brief invincibility after shield breaks
            }
            soundService.playSound('damage');
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    soundService.playSound('gameOver');
                    gameStateRef.current = 'gameover';
                    onGameOver();
                }
                return newLives;
            });
            if (lives - 1 > 0) {
                 soundService.playJingle('respawn');
                 return { ...p, x: levels[currentLevelIndex].playerStart.x, y: levels[currentLevelIndex].playerStart.y, vx: 0, vy: 0, isInvincible: true, invincibilityTimer: PLAYER_INVINCIBILITY_DURATION, capturedEnemyId: null };
            }
        }
        return p;
    });

    // Collect Items
    setItems(prev => {
        const remaining = prev.filter(item => {
            if (areRectsColliding(player, item)) {
                switch(item.type) {
                    case 'joystick':
                    case 'floppy':
                    case 'cartridge':
                        setScore(s => s + COLLECTIBLE_POINTS);
                        soundService.playSound('collect');
                        return false;
                    case 'shield':
                        setPlayer(p => ({...p, hasShield: true}));
                        soundService.playSound('powerup');
                        return false;
                    case 'speed-boost':
                        setPlayer(p => ({...p, activePowerUp: 'speed-boost', powerUpTimer: POWER_UP_DURATION}));
                        soundService.playSound('powerup');
                        return false;
                    case 'super-throw':
                        setPlayer(p => ({...p, activePowerUp: 'super-throw'}));
                        soundService.playSound('powerup');
                        return false;
                }
            }
            return true;
        });
        const collectiblesLeft = remaining.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;
        if (collectiblesLeft === 0 && items.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length > 0) {
            soundService.playSound('levelClear');
            gameStateRef.current = 'level-cleared';
            setGameState('level-cleared');
            setTimeout(() => {
                if (currentLevelIndex + 1 >= levels.length) {
                    gameStateRef.current = 'completed';
                    onCompleted();
                } else {
                    setCurrentLevelIndex(i => i + 1);
                }
            }, 2000);
        }
        return remaining;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [items, currentLevelIndex, enemies, keysPressed, lives, platforms, player, onGameOver, onCompleted, setGameState]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameLoop]);

  const collectiblesLeft = items.filter(item => ['joystick', 'floppy', 'cartridge'].includes(item.type)).length;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1a4d] to-[#200e3d]" />
      <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)', backgroundSize: '25px 25px'}}></div>
      <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)', backgroundSize: '50px 50px', opacity: 0.5}}></div>

      <Hud score={score} lives={lives} level={currentLevelIndex + 1} collectiblesLeft={collectiblesLeft} activePowerUp={player.activePowerUp} />
      {platforms.map((p, i) => <Platform key={i} platform={p} />)}
      {items.map(c => (
        <div key={c.id} style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height }}>
          <ItemSprite type={c.type} />
        </div>
      ))}
      {player.width && <Player player={player} />}
      {enemies.map(e => <Enemy key={e.id} enemy={e} />)}
      {gameStateRef.current === 'level-cleared' && (
         <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-20">
            <h2 className="text-7xl text-yellow-400 animate-pulse" style={{textShadow: '3px 3px #000'}}>LEVEL CLEARED!</h2>
         </div>
      )}
    </div>
  );
};

export default GameScreen;