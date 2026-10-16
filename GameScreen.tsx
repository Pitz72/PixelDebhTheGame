import React, { useState, useEffect, useRef } from 'react';
import Hud from './components/Hud';
import DomScene from './components/DomScene';
import * as soundService from './services/soundService';
import * as storage from './services/storage';
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
import { GameRenderer, Quality } from './renderer/GameRenderer';
import { ItemType } from './types';

interface GameScreenProps {
  onGameOver: (score: number) => void;
  onCompleted: (score: number, lives: number) => void;
  loopCount: number;
  /** Score / lives carried over from the previous loop (New Game+). */
  initialScore?: number;
  initialLives?: number;
}

const MAX_STEPS_PER_FRAME = 5;
const QUALITY_KEY = 'pixelDebhQuality';

type RenderMode = 'loading' | 'webgl' | 'dom';

/** What the HUD needs, reduced so React only re-renders when something visible changes. */
interface HudData {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
  boss: { hp: number; maxHp: number } | null;
  godMode: boolean;
  timeRemaining: number | null;
  loopCount: number;
  playerX: number;
  levelWidth: number;
  status: Frame['status'];
  bossDefeated: boolean;
  damageFlash: boolean;
}

const deriveHud = (f: Frame): HudData => {
  const bucket = Math.max(1, f.levelWidth / 200);
  return {
    score: f.score,
    lives: f.lives,
    level: f.levelIndex + 1,
    levelName: f.levelName,
    collectiblesLeft: f.collectiblesLeft,
    activePowerUp: f.player.activePowerUp,
    boss: f.boss ? { hp: f.boss.hp, maxHp: f.boss.maxHp } : null,
    godMode: f.isGodMode,
    timeRemaining: f.timeRemaining === null ? null : Math.ceil(f.timeRemaining),
    loopCount: f.loopCount,
    playerX: Math.round(f.player.x / bucket) * bucket,
    levelWidth: f.levelWidth,
    status: f.status,
    bossDefeated: Boolean(f.boss && f.boss.hp <= 0),
    damageFlash: f.damageFlash,
  };
};

const sameHud = (a: HudData, b: HudData): boolean =>
  a.score === b.score &&
  a.lives === b.lives &&
  a.level === b.level &&
  a.levelName === b.levelName &&
  a.collectiblesLeft === b.collectiblesLeft &&
  a.activePowerUp === b.activePowerUp &&
  a.boss?.hp === b.boss?.hp &&
  a.boss?.maxHp === b.boss?.maxHp &&
  a.godMode === b.godMode &&
  a.timeRemaining === b.timeRemaining &&
  a.loopCount === b.loopCount &&
  a.playerX === b.playerX &&
  a.levelWidth === b.levelWidth &&
  a.status === b.status &&
  a.bossDefeated === b.bossDefeated &&
  a.damageFlash === b.damageFlash;

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

  const frameRef = useRef<Frame | null>(null);
  if (frameRef.current === null) frameRef.current = makeFrame(worldRef.current);

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const modeRef = useRef<RenderMode>('loading');
  const [mode, setMode] = useState<RenderMode>('loading');
  const [hud, setHud] = useState<HudData>(() => deriveHud(frameRef.current as Frame));
  const [domFrame, setDomFrame] = useState<Frame>(() => frameRef.current as Frame);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const [quality, setQualityState] = useState<Quality>(() =>
    storage.getItem(QUALITY_KEY) === 'low' ? 'low' : 'high'
  );
  const qualityRef = useRef<Quality>(quality);
  const debugRef = useRef(false);

  const callbacksRef = useRef({ onGameOver, onCompleted });
  callbacksRef.current = { onGameOver, onCompleted };

  const changeMode = (m: RenderMode) => {
    modeRef.current = m;
    setMode(m);
  };

  const applyQuality = (q: Quality, persist = true) => {
    qualityRef.current = q;
    setQualityState(q);
    rendererRef.current?.setQuality(q);
    if (persist) storage.setItem(QUALITY_KEY, q);
  };

  // --- WebGL renderer ---------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let renderer: GameRenderer | null = null;
    let observer: ResizeObserver | null = null;

    const fit = () => {
      if (!renderer || !mount) return;
      const rect = mount.getBoundingClientRect();
      renderer.resize(rect.width / GAME_WIDTH || 1, window.devicePixelRatio || 1);
    };

    // `?dom` forces the fallback renderer (for testing it without breaking WebGL)
    const forceDom = new URLSearchParams(window.location.search).has('dom');
    (forceDom
      ? Promise.reject(new Error('DOM renderer requested with ?dom'))
      : GameRenderer.create(mount, {
          quality: qualityRef.current,
          autoQuality: true,
          onQualityChange: q => applyQuality(q),
        })
    )
      .then(r => {
        if (cancelled) {
          r.destroy();
          return;
        }
        renderer = r;
        rendererRef.current = r;
        r.setDebug(debugRef.current);
        fit();
        observer = new ResizeObserver(fit);
        observer.observe(mount);
        changeMode('webgl');
      })
      .catch(error => {
        console.error('WebGL renderer unavailable, using the DOM renderer:', error);
        if (!cancelled) changeMode('dom');
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      rendererRef.current = null;
      renderer?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      if (e.key === 'F3') {
        e.preventDefault();
        if (!e.repeat) {
          debugRef.current = !debugRef.current;
          rendererRef.current?.setDebug(debugRef.current);
        }
        return;
      }

      if (e.key.toLowerCase() === 'q' && !e.repeat) {
        applyQuality(qualityRef.current === 'high' ? 'low' : 'high');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fixed-timestep simulation + interpolated rendering ---------------------
  useEffect(() => {
    const w = worldRef.current as World;
    const input = inputRef.current as InputController;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let alpha = 0;
    let hitStopUntil = 0;
    let slowUntil = 0;

    const dispatchEvents = () => {
      const events = w.events.splice(0, w.events.length);
      const now = performance.now();
      for (const e of events) {
        switch (e.type) {
          case 'sound':
            soundService.playSound(e.name);
            // a few frames of hit-stop on damage, slow motion when a boss falls
            if (e.name === 'damage') hitStopUntil = now + 80;
            else if (e.name === 'bossDefeat') slowUntil = now + 1400;
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
      if (live && !pausedRef.current && modeRef.current !== 'loading') {
        const now = performance.now();
        const scale = now < hitStopUntil ? 0 : now < slowUntil ? 0.3 : 1;
        acc += delta * scale;
        let steps = 0;
        while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
          w.input = input.state();
          for (const a of input.drainActions()) w.actions.push(a);
          step(w);
          acc -= STEP_MS;
          steps++;
        }
        if (steps === MAX_STEPS_PER_FRAME) acc = 0; // never try to catch up a long stall
        alpha = Math.min(1, acc / STEP_MS);
        dispatchEvents();
        if (steps > 0) {
          const frame = makeFrame(w);
          frameRef.current = frame;
          const next = deriveHud(frame);
          setHud(prev => (sameHud(prev, next) ? prev : next));
          if (modeRef.current === 'dom') setDomFrame(frame);
        }
      } else if (modeRef.current !== 'loading') {
        dispatchEvents();
      }

      rendererRef.current?.render(frameRef.current as Frame, alpha, ts);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- Render ---------------------------------------------------------------------
  const boss = hud.boss;

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#04010c]"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      {/* WebGL canvas (the DOM renderer below is only mounted when WebGL is unavailable) */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      {mode === 'dom' && <DomScene frame={domFrame} />}

      {hud.damageFlash && <div className="absolute inset-0 bg-red-600/45 z-50 pointer-events-none" />}

      <Hud
        score={hud.score}
        lives={hud.lives}
        level={hud.level}
        levelName={hud.levelName}
        collectiblesLeft={hud.collectiblesLeft}
        activePowerUp={hud.activePowerUp}
        boss={boss}
        isGodMode={hud.godMode}
        timeRemaining={hud.timeRemaining}
        loopCount={hud.loopCount}
        playerX={hud.playerX}
        levelWidth={hud.levelWidth}
      />

      {mode === 'loading' && (
        <div className="absolute inset-0 flex justify-center items-center z-40 pointer-events-none">
          <p className="text-3xl font-black text-cyan-300 tracking-widest animate-pulse">CARICAMENTO…</p>
        </div>
      )}

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
              <strong className="text-cyan-400">[F]</strong> Schermo intero / finestra •{' '}
              <strong className="text-cyan-400">[Q]</strong> Qualità grafica:{' '}
              <span className="text-yellow-300">{quality === 'high' ? 'ALTA' : 'BASSA'}</span> •{' '}
              <strong className="text-cyan-400">[F3]</strong> Prestazioni
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
      {hud.status === 'level-cleared' && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/30 z-40 pointer-events-none">
          <h2
            className="text-8xl font-black text-yellow-300 tracking-wider animate-pulse"
            style={{ textShadow: '0 0 35px #00e5ff, 4px 4px 0px #e8175d' }}
          >
            {hud.bossDefeated ? 'BOSS DEFEATED!' : 'STAGE CLEARED!'}
          </h2>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
