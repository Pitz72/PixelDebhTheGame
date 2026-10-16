import React, { useState, useEffect, useRef } from 'react';
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
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import {
  World,
  Frame,
  InputController,
  createWorld,
  loadLevel,
  step,
  makeFrame,
  STEP_MS,
} from './engine';

interface GameScreenProps {
  onGameOver: (score: number) => void;
  onCompleted: (score: number, lives: number) => void;
  loopCount: number;
  /** Score / lives carried over from the previous loop (New Game+). */
  initialScore?: number;
  initialLives?: number;
}

const MAX_STEPS_PER_FRAME = 5;

const GameScreen: React.FC<GameScreenProps> = ({
  onGameOver,
  onCompleted,
  loopCount,
  initialScore = 0,
  initialLives,
}) => {
  const worldRef = useRef<World | null>(null);
  if (worldRef.current === null) {
    worldRef.current = createWorld({ loopCount, score: initialScore, lives: initialLives });
  }
  const inputRef = useRef<InputController | null>(null);
  if (inputRef.current === null) inputRef.current = new InputController();

  const [frame, setFrame] = useState<Frame>(() => makeFrame(worldRef.current as World));
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);

  const callbacksRef = useRef({ onGameOver, onCompleted });
  callbacksRef.current = { onGameOver, onCompleted };

  // --- Keyboard, focus and pause handling ---------------------------------
  useEffect(() => {
    const w = worldRef.current as World;
    const input = inputRef.current as InputController;

    const setPaused = (paused: boolean) => {
      if (pausedRef.current === paused) return;
      pausedRef.current = paused;
      setIsPaused(paused);
      if (paused) {
        input.reset();
        soundService.pauseMusic();
      } else {
        soundService.resumeMusic();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!e.repeat) setPaused(!pausedRef.current);
        return;
      }

      // Developer shortcuts exist only in dev builds (never in a shipped game).
      if (import.meta.env.DEV && !e.repeat) {
        const k = e.key.toLowerCase();
        if (e.key === '9' && levels.length > 10) {
          soundService.playSound('powerup');
          loadLevel(w, 10);
          return;
        }
        if (k === 'l') {
          soundService.playSound('powerup');
          if (w.currentLevelIndex + 1 >= levels.length) {
            w.status = 'completed';
            w.events.push({ type: 'completed', score: w.score, lives: w.lives });
          } else {
            loadLevel(w, w.currentLevelIndex + 1);
          }
          return;
        }
        if (e.key === '0') {
          w.isGodMode = !w.isGodMode;
          return;
        }
      }

      if (pausedRef.current) return;
      if (e.key === ' ') e.preventDefault();
      input.keyDown(e);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      input.keyUp(e);
    };

    // Losing focus means key-up events are lost: drop every held key and pause the game.
    const onBlur = () => {
      input.reset();
      setPaused(true);
    };
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // --- Fixed-timestep game loop -------------------------------------------
  useEffect(() => {
    const w = worldRef.current as World;
    const input = inputRef.current as InputController;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const dispatchEvents = () => {
      const events = w.events.splice(0, w.events.length);
      for (const e of events) {
        switch (e.type) {
          case 'sound':
            soundService.playSound(e.name);
            break;
          case 'jingle':
            soundService.playJingle(e.name);
            break;
          case 'music':
            soundService.playMusicLoop(e.theme);
            break;
          case 'gameOver':
            callbacksRef.current.onGameOver(e.score);
            break;
          case 'completed':
            callbacksRef.current.onCompleted(e.score, e.lives);
            break;
        }
      }
    };

    const tick = (ts: number) => {
      const delta = Math.min(ts - last, 100);
      last = ts;

      const live = w.status === 'playing' || w.status === 'level-cleared';
      if (live && !pausedRef.current) {
        acc += delta;
        let steps = 0;
        while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
          w.input = input.state();
          for (const a of input.drainActions()) w.actions.push(a);
          step(w);
          acc -= STEP_MS;
          steps++;
        }
        if (steps === MAX_STEPS_PER_FRAME) acc = 0; // never try to catch up a long stall
        dispatchEvents();
        if (steps > 0) setFrame(makeFrame(w));
      } else {
        dispatchEvents();
      }
      raf = requestAnimationFrame(tick);
    };

    dispatchEvents(); // level music + start jingle queued by createWorld
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- Render ---------------------------------------------------------------
  const { player, boss } = frame;
  const isShadowHeadBoss = boss && boss.type === 'shadowHead';

  // Viewport frustum culling (only mount visible DOM elements, +/- 450px margin)
  const cullMinX = frame.cameraX - 450;
  const cullMaxX = frame.cameraX + GAME_WIDTH + 450;
  const cullMinY = frame.cameraY - 450;
  const cullMaxY = frame.cameraY + GAME_HEIGHT + 450;

  const isVisible = (obj: { x: number; y: number; width: number; height: number }) =>
    obj.x + obj.width >= cullMinX &&
    obj.x <= cullMaxX &&
    obj.y + obj.height >= cullMinY &&
    obj.y <= cullMaxY;

  const shakeX = frame.screenShake > 0.2 ? (Math.random() - 0.5) * frame.screenShake * 1.8 : 0;
  const shakeY = frame.screenShake > 0.2 ? (Math.random() - 0.5) * frame.screenShake * 1.8 : 0;

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

      {frame.damageFlash && <div className="absolute inset-0 bg-red-600/45 z-50 pointer-events-none" />}

      {isShadowHeadBoss ? (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #1a020c 0%, #040006 80%)',
          }}
        />
      ) : (
        <Background cameraX={frame.cameraX} cameraY={frame.cameraY} theme={frame.theme} />
      )}

      <Hud
        score={frame.score}
        lives={frame.lives}
        level={frame.levelIndex + 1}
        levelName={frame.levelName}
        collectiblesLeft={frame.collectiblesLeft}
        activePowerUp={player.activePowerUp}
        boss={boss}
        isGodMode={frame.isGodMode}
        timeRemaining={frame.timeRemaining}
        loopCount={frame.loopCount}
        playerX={player.x}
        levelWidth={frame.levelWidth}
      />

      <div
        className="absolute top-0 left-0"
        style={{
          willChange: 'transform',
          transform: `translate3d(${-frame.cameraX + shakeX}px, ${-frame.cameraY + shakeY}px, 0)`,
        }}
      >
        {/* Frustum-Culled Platforms */}
        {frame.platforms.map((p, i) =>
          isVisible(p) ? <Platform key={i} platform={p} theme={frame.theme} /> : null
        )}

        {/* Frustum-Culled Checkpoints */}
        {frame.checkpoints.map(cp =>
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
        {frame.goal && isVisible(frame.goal) && (
          <div
            style={{
              position: 'absolute',
              left: frame.goal.x,
              top: frame.goal.y,
              width: frame.goal.width,
              height: frame.goal.height,
              zIndex: 3,
            }}
          >
            <GoalSprite unlocked={frame.collectiblesLeft === 0} remaining={frame.collectiblesLeft} />
          </div>
        )}

        {/* Frustum-Culled Items */}
        {frame.items.map(c =>
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
        {frame.enemies.map(e => (isVisible(e) ? <Enemy key={e.id} enemy={e} /> : null))}

        {/* Bosses */}
        {boss && boss.type === 'frog' && <CyclopsFrogBoss boss={boss} />}
        {boss && boss.type === 'chickenEye' && <ChickenEyeBoss boss={boss} />}
        {boss && boss.type === 'shadowHead' && <ShadowHeadBoss boss={boss} />}

        {/* Frustum-Culled Enemy Projectiles */}
        {frame.projectiles.map(p =>
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
        {frame.playerProjectiles.map(p =>
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
        {frame.shockwaves.map(sw => (
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
        {frame.particles.map(p => (
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
        {frame.floatingTexts.map(ft => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: ft.x,
              top: ft.y,
              transform: `translate(-50%, -50%) scale(${ft.scale})`,
              color: ft.color,
              fontFamily: "'Orbitron Variable', 'Orbitron', sans-serif",
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
            PAUSA
          </h2>
          <p className="text-2xl font-bold text-yellow-300 animate-blink mt-4">
            PREMI ESC PER CONTINUARE
          </p>
          <div className="mt-12 bg-white/5 border border-cyan-500/30 rounded-2xl px-8 py-4 text-sm text-gray-300 space-y-1 text-center">
            <p>
              <strong className="text-cyan-400">[M]</strong> Muto •{' '}
              <strong className="text-cyan-400">[F]</strong> Schermo intero
            </p>
            {import.meta.env.DEV && (
              <p>
                DEBUG: <strong className="text-cyan-400">[L]</strong> Salta Livello •{' '}
                <strong className="text-cyan-400">[0]</strong> God Mode •{' '}
                <strong className="text-cyan-400">[9]</strong> Boss Finale
              </p>
            )}
          </div>
        </div>
      )}

      {/* Level Cleared Banner */}
      {frame.status === 'level-cleared' && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/30 z-40 pointer-events-none">
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
