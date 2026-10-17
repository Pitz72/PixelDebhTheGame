import React, { useState, useEffect, useRef } from 'react';
import Hud from './components/Hud';
import DomScene from './components/DomScene';
import AudioOptions from './components/AudioOptions';
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
    // the labyrinth has no left-to-right progress, so the map bar stays hidden there
    levelWidth: f.maze ? 0 : f.levelWidth,
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
  const [showOptions, setShowOptions] = useState(false);
  // Why WebGL could not be used (shown briefly, and with F3, when the compatibility renderer takes over).
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCompat, setShowCompat] = useState(true);
  const pausedRef = useRef(false);
  const [quality, setQualityState] = useState<Quality>(() =>
    storage.getItem(QUALITY_KEY) === 'low' ? 'low' : 'high'
  );
  const qualityRef = useRef<Quality>(quality);
  const debugRef = useRef(false);
  const showCompatRef = useRef(true);

  const callbacksRef = useRef({ onGameOver, onCompleted });
  callbacksRef.current = { onGameOver, onCompleted };

  // Test probe, like window.__pdPerf: the scripts in tools/dev use it to jump to a level and read the
  // state in the release build, where the developer keys do not exist.
  useEffect(() => {
    const w = worldRef.current as World;
    (window as unknown as { __pdGame?: unknown }).__pdGame = {
      load: (index: number) => loadLevel(w, index),
      god: (on: boolean) => {
        w.isGodMode = on;
      },
      state: () => ({
        level: w.currentLevelIndex,
        status: w.status,
        lives: w.lives,
        items: w.items.length,
        enemies: w.enemies.length,
        time: w.timeRemaining,
        x: Math.round(w.player.x),
        y: Math.round(w.player.y),
        zoom: w.zoom,
      }),
    };
  }, []);

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
        (window as unknown as { __pdRenderError?: string }).__pdRenderError = String(error);
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : String(error));
          changeMode('dom');
        }
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      rendererRef.current = null;
      renderer?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== 'dom') return;
    const id = window.setTimeout(() => {
      showCompatRef.current = false;
      if (!debugRef.current) setShowCompat(false);
    }, 12000);
    return () => window.clearTimeout(id);
  }, [mode]);

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
        soundService.playSound('pause');
      } else {
        setShowOptions(false);
        soundService.resumeMusic();
        soundService.playSound('resume');
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
          setShowCompat(debugRef.current || showCompatRef.current);
        }
        return;
      }

      if (e.key.toLowerCase() === 'q' && !e.repeat) {
        applyQuality(qualityRef.current === 'high' ? 'low' : 'high');
        return;
      }

      if (e.key.toLowerCase() === 'o' && pausedRef.current) {
        if (!e.repeat) setShowOptions(true);
        return;
      }

      // Developer shortcuts exist only in dev builds (never in a shipped game).
      if (import.meta.env.DEV && !e.repeat) {
        const k = e.key.toLowerCase();
        const finalBoss = levels.findIndex(l => l.boss?.type === 'shadowHead');
        if (e.key === '9' && finalBoss >= 0) {
          soundService.playSound('powerup');
          loadLevel(w, finalBoss);
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

      {mode === 'dom' && showCompat && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
          <p className="text-lg font-black text-yellow-300 tracking-wider bg-black/70 px-6 py-2 rounded-xl border border-yellow-400/60">
            MODALITÀ COMPATIBILITÀ: WebGL NON DISPONIBILE (niente luci dinamiche)
          </p>
          {renderError && (
            <p className="mt-2 text-xs font-mono text-gray-300 bg-black/70 px-3 py-1 rounded max-w-[1200px] mx-auto">{renderError.slice(0, 300)}</p>
          )}
        </div>
      )}

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
              <strong className="text-cyan-400">[O]</strong> Audio •{' '}
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

      {isPaused && showOptions && <AudioOptions onClose={() => setShowOptions(false)} />}

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
