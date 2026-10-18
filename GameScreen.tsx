import React, { useState, useEffect, useRef } from 'react';
import Hud from './components/Hud';
import DomScene from './components/DomScene';
import ScreenOverlay, { type OverlayKind } from './components/ScreenOverlay';
import MenuList from './components/MenuList';
import TrophyToast, { TOAST_MS } from './components/TrophyToast';
import * as soundService from './services/soundService';
import { getSettings, updateSettings, useSettings } from './services/settings';
import { padControls, padStart } from './engine/gamepad';
import { readPad, suppressMenuPad } from './services/gamepadService';
import { t, useLanguage } from './services/i18n';
import { createTrophyTracker, TrophyTracker } from './services/trophyService';
import { clearRun, saveRun } from './services/progress';
import { devProbeAllowed } from './services/devAccess';
import type { TrophyDef } from './trophies';
import { levels } from './levels';
import { GAME_WIDTH, GAME_HEIGHT, COMBO_WINDOW_MS } from './constants';
import {
  World,
  Frame,
  InputController,
  createWorld,
  loadLevel,
  step,
  makeFrame,
  fixedSteps,
} from './engine';
import { GameRenderer, Quality } from './renderer/GameRenderer';
import { Boss, Difficulty, ItemType } from './types';
import type { RunStats } from './engine/stats';

interface GameScreenProps {
  onGameOver: (score: number) => void;
  onCompleted: (score: number, lives: number) => void;
  /** The player leaves the game from the pause menu. */
  onQuit: (score: number) => void;
  /** The level the game begins at (0 for a new game; the saved level for a continued one). */
  startLevel?: number;
  difficulty?: Difficulty;
  /** A game from the level select: no leaderboard, no trophies, nothing saved. */
  practice?: boolean;
  /** What a continued game has counted so far (for the trophies). */
  initialStats?: RunStats;
  loopCount: number;
  /** Score / lives carried over from the previous loop (New Game+). */
  initialScore?: number;
  initialLives?: number;
}


type RenderMode = 'loading' | 'webgl' | 'dom';

/** What the HUD needs, reduced so React only re-renders when something visible changes. */
interface HudData {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
  bosses: { type: Boss['type']; hp: number; maxHp: number }[];
  godMode: boolean;
  timeRemaining: number | null;
  loopCount: number;
  playerX: number;
  levelWidth: number;
  status: Frame['status'];
  bossDefeated: boolean;
  damageFlash: boolean;
  combo: { count: number; mult: number; pct: number };
  guide: { angle: number; metres: number } | null;
}

const deriveHud = (f: Frame, showGuide: boolean): HudData => {
  const bucket = Math.max(1, f.levelWidth / 200);
  return {
    score: f.score,
    lives: f.lives,
    level: f.levelIndex + 1,
    levelName: f.levelName,
    collectiblesLeft: f.collectiblesLeft,
    activePowerUp: f.player.activePowerUp,
    bosses: f.bosses.map(b => ({ type: b.type, hp: b.hp, maxHp: b.maxHp })),
    godMode: f.isGodMode,
    timeRemaining: f.timeRemaining === null ? null : Math.ceil(f.timeRemaining),
    loopCount: f.loopCount,
    playerX: Math.round(f.player.x / bucket) * bucket,
    // the labyrinth has no left-to-right progress, so the map bar stays hidden there
    levelWidth: f.maze ? 0 : f.levelWidth,
    status: f.status,
    bossDefeated: f.bosses.length > 0 && f.bosses.every(b => b.hp <= 0),
    damageFlash: f.damageFlash,
    combo: { count: f.combo.count, mult: f.combo.mult, pct: Math.round((f.combo.timer / COMBO_WINDOW_MS) * 10) * 10 },
    guide:
      showGuide && f.guide
        ? { angle: Math.round(((Math.atan2(f.guide.dy, f.guide.dx) * 180) / Math.PI) / 6) * 6, metres: Math.round(f.guide.dist / 100) }
        : null,
  };
};

const sameHud = (a: HudData, b: HudData): boolean =>
  a.score === b.score &&
  a.lives === b.lives &&
  a.level === b.level &&
  a.levelName === b.levelName &&
  a.collectiblesLeft === b.collectiblesLeft &&
  a.activePowerUp === b.activePowerUp &&
  a.bosses.length === b.bosses.length &&
  a.bosses.every((x, i) => x.hp === b.bosses[i].hp && x.maxHp === b.bosses[i].maxHp) &&
  a.godMode === b.godMode &&
  a.timeRemaining === b.timeRemaining &&
  a.loopCount === b.loopCount &&
  a.playerX === b.playerX &&
  a.levelWidth === b.levelWidth &&
  a.status === b.status &&
  a.bossDefeated === b.bossDefeated &&
  a.damageFlash === b.damageFlash &&
  a.combo.count === b.combo.count &&
  a.combo.mult === b.combo.mult &&
  a.combo.pct === b.combo.pct &&
  a.guide?.angle === b.guide?.angle &&
  a.guide?.metres === b.guide?.metres;

const GameScreen: React.FC<GameScreenProps> = ({
  onGameOver,
  onCompleted,
  onQuit,
  startLevel = 0,
  difficulty = 'normal',
  practice = false,
  initialStats,
  loopCount,
  initialScore = 0,
  initialLives,
}) => {
  const worldRef = useRef<World | null>(null);
  if (worldRef.current === null) {
    worldRef.current = createWorld({
      loopCount,
      score: initialScore,
      lives: initialLives,
      levelIndex: startLevel,
      difficulty,
      practice,
      stats: initialStats,
    });
  }
  const inputRef = useRef<InputController | null>(null);
  if (inputRef.current === null) {
    inputRef.current = new InputController(getSettings().bindings);
    inputRef.current.syncPad(padControls(readPad()));
  }
  const setPausedRef = useRef<(paused: boolean) => void>(() => {});

  const frameRef = useRef<Frame | null>(null);
  if (frameRef.current === null) frameRef.current = makeFrame(worldRef.current);

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const modeRef = useRef<RenderMode>('loading');
  const [mode, setMode] = useState<RenderMode>('loading');
  const [hud, setHud] = useState<HudData>(() => deriveHud(frameRef.current as Frame, getSettings().guide));
  const [domFrame, setDomFrame] = useState<Frame>(() => frameRef.current as Frame);
  const [isPaused, setIsPaused] = useState(false);
  // The page open over the pause menu (options, trophies, how to play), and the "leave the game?" question
  const [overlay, setOverlay] = useState<OverlayKind | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const settings = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useLanguage();
  // Trophies earned and not yet announced: the banner shows them one at a time.
  const [toasts, setToasts] = useState<TrophyDef[]>([]);
  const trackerRef = useRef<TrophyTracker | null>(null);
  if (trackerRef.current === null) {
    trackerRef.current = createTrophyTracker(worldRef.current, t => setToasts(q => [...q, t]));
  }
  // Why WebGL could not be used (shown briefly, and with F3, when the compatibility renderer takes over).
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCompat, setShowCompat] = useState(true);
  const pausedRef = useRef(false);
  const quality: Quality = settings.quality;
  const qualityRef = useRef<Quality>(quality);
  const debugRef = useRef(false);
  const showCompatRef = useRef(true);

  const callbacksRef = useRef({ onGameOver, onCompleted, onQuit });
  callbacksRef.current = { onGameOver, onCompleted, onQuit };

  // Test probe: the scripts in tools/dev use it to jump to a level and read the state in the release build,
  // where the developer keys do not exist. It is only there in dev builds or once the page has been unlocked
  // (services/devAccess.ts); the read-only measures (window.__pdPerf and the like) are always on.
  useEffect(() => {
    if (!devProbeAllowed()) return;
    const w = worldRef.current as World;
    (window as unknown as { __pdGame?: unknown }).__pdGame = {
      load: (index: number) => loadLevel(w, index),
      god: (on: boolean) => {
        w.isGodMode = on;
      },
      /** Puts the player somewhere in the level (for looking at a spot without walking there). */
      warp: (x: number, y: number) => {
        w.player.x = x;
        w.player.y = y;
        w.player.vx = 0;
        w.player.vy = 0;
      },
      /** Brings every boss down to at most this much life (to reach the end of a fight quickly). */
      bossHp: (n: number) => {
        for (const b of w.bosses) b.hp = Math.min(b.hp, n);
      },
      /** The trophy save (earned ones and the lifetime counters) and the counters of this run. */
      trophies: () => trackerRef.current?.save(),
      stats: () => w.stats,
      /** Where the items and the exit are, for walking a level in a test. */
      items: () => w.items.map(i => ({ type: i.type, x: i.x, y: i.y, width: i.width, height: i.height })),
      goal: () => w.goal,
      /** The moving platforms and the springs, where they are now (for timing a ride in a test). */
      movers: () => w.platforms.filter(p => p.move).map(p => ({ x: p.x, y: p.y, width: p.width })),
      springs: () => w.springs.map(s => ({ x: s.x, y: s.y, pressed: s.pressed })),
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
        bosses: w.bosses.map(b => b.hp),
      }),
    };
  }, []);

  // The lifetime counters are written down when the screen goes away (game over, victory, quit).
  useEffect(() => () => trackerRef.current?.flush(), []);

  // The trophy banner: one at a time, with its jingle, then the next.
  const toastId = toasts[0]?.id;
  useEffect(() => {
    if (toastId === undefined) return;
    soundService.playSound('trophy');
    const id = window.setTimeout(() => setToasts(q => q.slice(1)), TOAST_MS + 200);
    return () => window.clearTimeout(id);
  }, [toastId]);

  const changeMode = (m: RenderMode) => {
    modeRef.current = m;
    setMode(m);
  };

  const applyQuality = (q: Quality) => {
    qualityRef.current = q;
    rendererRef.current?.setQuality(q);
    if (getSettings().quality !== q) updateSettings({ quality: q });
  };

  // The settings, live: quality, the comfort options (shake, flashes), and the keys.
  useEffect(() => {
    qualityRef.current = settings.quality;
    rendererRef.current?.setQuality(settings.quality);
    rendererRef.current?.setPreferences({
      autoQuality: settings.autoQuality,
      shake: settings.shake / 100,
      flashes: settings.flashes,
    });
  }, [settings.quality, settings.autoQuality, settings.shake, settings.flashes, mode]);
  useEffect(() => {
    inputRef.current?.setBindings(settings.bindings);
  }, [settings.bindings]);

  // While the game runs the pad belongs to it; in the pause menu it drives the menus again.
  useEffect(() => {
    suppressMenuPad(!isPaused);
    return () => suppressMenuPad(false);
  }, [isPaused]);

  // --- WebGL renderer ---------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let renderer: GameRenderer | null = null;
    let observer: ResizeObserver | null = null;
    let refitFrame = 0;

    const fit = () => {
      if (!renderer || !mount) return;
      const rect = mount.getBoundingClientRect();
      renderer.resize(rect.width / GAME_WIDTH || 1, window.devicePixelRatio || 1);
    };

    // The stage is a 1920x1080 box that the page scales with a CSS transform, and a ResizeObserver does not see a
    // transform change: when the window is resized (a drag, F11, a move to another screen) the canvas would keep the
    // resolution it had and go soft on a bigger screen. So the window's own resize event refits it too, a couple of frames
    // later, once React has applied the new scale.
    const refit = () => {
      cancelAnimationFrame(refitFrame);
      refitFrame = requestAnimationFrame(() => {
        refitFrame = requestAnimationFrame(fit);
      });
    };
    window.addEventListener('resize', refit);

    // `?dom` forces the fallback renderer (for testing it without breaking WebGL)
    const forceDom = new URLSearchParams(window.location.search).has('dom');
    (forceDom
      ? Promise.reject(new Error('DOM renderer requested with ?dom'))
      : GameRenderer.create(mount, {
          quality: qualityRef.current,
          autoQuality: settingsRef.current.autoQuality,
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
      window.removeEventListener('resize', refit);
      cancelAnimationFrame(refitFrame);
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
        trackerRef.current?.flush();
        soundService.pauseMusic();
        soundService.playSound('pause');
      } else {
        setOverlay(null);
        setConfirmQuit(false);
        // a button still down from the menu (the A that chose "resume") must not turn into a jump
        input.syncPad(padControls(readPad()));
        soundService.resumeMusic();
        soundService.playSound('resume');
      }
    };

    setPausedRef.current = setPaused;

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

      if (pausedRef.current && !e.repeat) {
        const k = e.key.toLowerCase();
        if (k === 'o') {
          setOverlay('options');
          return;
        }
        if (k === 't') {
          setOverlay('trophies');
          return;
        }
        if (k === 'h') {
          setOverlay('howto');
          return;
        }
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
    let startWasDown = padStart(readPad());

    const dispatchEvents = () => {
      const events = w.events.splice(0, w.events.length);
      const now = performance.now();
      for (const e of events) {
        switch (e.type) {
          case 'sound':
            soundService.playSound(e.name);
            // a few frames of hit-stop on damage, slow motion when a boss falls
            if (settingsRef.current.hitStop) {
              if (e.name === 'damage') hitStopUntil = now + 80;
              else if (e.name === 'bossDefeat') slowUntil = now + 1400;
            }
            break;
          case 'jingle':
            soundService.playJingle(e.name);
            break;
          case 'music':
            soundService.playMusicLoop(e.theme);
            break;
          case 'level':
            // the game as it stands at the start of a level is what "continue" takes up (not in practice)
            if (!w.practice) {
              saveRun({
                levelIndex: e.index,
                score: w.score,
                lives: w.livesBeforeBoss ?? w.lives, // lives lent for a boss fight are not hers to keep
                loopCount: w.loopCount,
                difficulty: w.difficulty,
                stats: w.stats,
              });
            }
            break;
          case 'gameOver':
            clearRun();
            callbacksRef.current.onGameOver(e.score);
            break;
          case 'completed':
            clearRun();
            callbacksRef.current.onCompleted(e.score, e.lives);
            break;
        }
      }
    };

    const tick = (ts: number) => {
      const delta = Math.min(ts - last, 100);
      last = ts;

      // the pad: Start pauses; the rest becomes the same controls as the keys
      const pad = readPad();
      const startDown = padStart(pad);
      if (startDown && !startWasDown && !pausedRef.current) setPausedRef.current(true);
      startWasDown = startDown;

      const live = w.status === 'playing' || w.status === 'level-cleared';
      if (live && !pausedRef.current && modeRef.current !== 'loading') {
        input.setPad(padControls(pad));
        const now = performance.now();
        const scale = now < hitStopUntil ? 0 : now < slowUntil ? 0.3 : 1;
        const clock = fixedSteps(acc + delta * scale);
        const steps = clock.steps;
        for (let i = 0; i < steps; i++) {
          w.input = input.state();
          for (const a of input.drainActions()) w.actions.push(a);
          step(w);
        }
        acc = clock.acc;
        alpha = clock.alpha;
        // before the events: a game over or a victory leaves the screen in dispatchEvents
        if (steps > 0) trackerRef.current?.update();
        dispatchEvents();
        if (steps > 0) {
          const frame = makeFrame(w);
          frameRef.current = frame;
          const next = deriveHud(frame, settingsRef.current.guide);
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

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#04010c]"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      {/* WebGL canvas (the DOM renderer below is only mounted when WebGL is unavailable) */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      {mode === 'dom' && <DomScene frame={domFrame} />}

      {hud.damageFlash && settings.flashes && <div className="absolute inset-0 bg-red-600/45 z-50 pointer-events-none" />}

      <Hud
        score={hud.score}
        lives={hud.lives}
        level={hud.level}
        levelName={hud.levelName}
        collectiblesLeft={hud.collectiblesLeft}
        activePowerUp={hud.activePowerUp}
        bosses={hud.bosses}
        isGodMode={hud.godMode}
        combo={hud.combo}
        guide={hud.guide}
        timeRemaining={hud.timeRemaining}
        loopCount={hud.loopCount}
        playerX={hud.playerX}
        levelWidth={hud.levelWidth}
      />

      {mode === 'dom' && showCompat && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
          <p className="text-lg font-black text-yellow-300 tracking-wider bg-black/70 px-6 py-2 rounded-xl border border-yellow-400/60">
            {t('game.compat')}
          </p>
          {renderError && (
            <p className="mt-2 text-xs font-mono text-gray-300 bg-black/70 px-3 py-1 rounded-sm max-w-[1200px] mx-auto">{renderError.slice(0, 300)}</p>
          )}
        </div>
      )}

      {mode === 'loading' && (
        <div className="absolute inset-0 flex justify-center items-center z-40 pointer-events-none">
          <p className="text-3xl font-black text-cyan-300 tracking-widest animate-pulse">{t('game.loading')}</p>
        </div>
      )}

      {/* Pause menu */}
      {isPaused && !overlay && (
        <div className="absolute inset-0 bg-[#050114]/85 backdrop-blur-xs z-50 flex flex-col justify-center items-center text-white">
          <h2
            className="text-7xl font-black tracking-widest text-cyan-300 mb-8"
            style={{ textShadow: '0 0 25px #00e5ff' }}
          >
            {confirmQuit ? t('pause.quitAsk') : t('pause.title')}
          </h2>
          {confirmQuit ? (
            <MenuList
              key="quit"
              size="lg"
              width={620}
              initialId="no"
              items={[
                { id: 'no', label: t('pause.quitNo') },
                { id: 'yes', label: t('pause.quitYes') },
              ]}
              onSelect={id => {
                if (id === 'yes') callbacksRef.current.onQuit(worldRef.current?.score ?? 0);
                else setConfirmQuit(false);
              }}
              onBack={() => setConfirmQuit(false)}
            />
          ) : (
            <MenuList
              key="pause"
              size="lg"
              width={620}
              items={[
                { id: 'resume', label: t('pause.resume') },
                { id: 'options', label: t('menu.options') },
                { id: 'trophies', label: t('menu.trophies') },
                { id: 'howto', label: t('menu.howto') },
                { id: 'quit', label: t('pause.quit') },
              ]}
              onSelect={id => {
                if (id === 'resume') setPausedRef.current(false);
                else if (id === 'quit') setConfirmQuit(true);
                else setOverlay(id as OverlayKind);
              }}
              onBack={() => setPausedRef.current(false)}
            />
          )}
          <p className="mt-10 text-sm text-gray-300">{t('pause.keys')}</p>
          {import.meta.env.DEV && (
            <p className="mt-2 text-sm text-gray-400">
              DEBUG: <strong className="text-cyan-400">[L]</strong> skip level •{' '}
              <strong className="text-cyan-400">[0]</strong> god mode •{' '}
              <strong className="text-cyan-400">[9]</strong> final boss
            </p>
          )}
        </div>
      )}

      {isPaused && overlay && <ScreenOverlay kind={overlay} onClose={() => setOverlay(null)} />}

      {toasts.length > 0 && <TrophyToast key={toasts[0].id} trophy={toasts[0]} />}

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
