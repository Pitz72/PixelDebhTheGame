import { useState, useCallback, useEffect, useRef } from 'react';
import { bakeParade } from './characters/debh/paradeFrames';
import { useGameScale } from './hooks/useGameScale';
import StartScreen, { type StartChoice } from './components/StartScreen';
import GameScreen from './GameScreen';
import CompletedScreen from './components/CompletedScreen';
import GameoverScreen from './components/GameoverScreen';
import PixelArcadeIntro from './components/PixelArcadeIntro';
import BootIntros from './components/BootIntros';
import AiNotice from './components/AiNotice';
import HighscoreScreen from './components/HighscoreScreen';
import EnterHighscoreScreen from './components/EnterHighscoreScreen';
import ScreenOverlay, { type OverlayKind } from './components/ScreenOverlay';
import UpdateBanner, { UpdateStatus } from './components/UpdateBanner';
import { Difficulty, GameState } from './types';
import type { RunStats } from './engine/stats';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import * as highscoreService from './services/highscoreService';
import * as soundService from './services/soundService';
import { checkForUpdate, openPage, UpdateInfo } from './services/updateService';
import { isTauri, quitApp, setFullscreen, toggleFullscreen } from './services/platform';
import { startMenuPad } from './services/gamepadService';
import { getSettings } from './services/settings';
import { loadProgress } from './services/progress';

interface Carry {
  score: number;
  lives?: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('boot');
  const [attractScreen, setAttractScreen] = useState<'start' | 'highscore'>('start');
  const [gameId, setGameId] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  // Score and lives travel with the player from one loop (New Game+) to the next.
  const [carry, setCarry] = useState<Carry>({ score: 0 });
  // The game that is starting, or in progress: where it begins, how hard it is, whether it is practice (a game
  // from the level select: no leaderboard, no trophies) and what a continued game has counted so far.
  const [run, setRun] = useState<{ levelIndex: number; difficulty: Difficulty; practice: boolean; stats?: RunStats }>({
    levelIndex: 0,
    difficulty: 'normal',
    practice: false,
  });
  // The page open over the title (options, trophies, credits, how to play, the leaderboard), if any
  const [overlay, setOverlay] = useState<OverlayKind | null>(null);
  // A newer version on GitHub (looked for once, when the title screen first appears)
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('available');
  const [updateError, setUpdateError] = useState('');
  const { dimensions, margins } = useGameScale();

  // The desktop app always starts fullscreen (window config), so nothing to request there.
  // In a browser tab the game asks for fullscreen on the first interaction (browsers need a user gesture).
  const requestAppFullscreen = useCallback(() => {
    if (!isTauri()) void setFullscreen(true);
  }, []);

  // F / F11 / Alt+Enter can still drop to a window for the current session (not remembered).
  const toggleAppFullscreen = useCallback(() => {
    void toggleFullscreen();
  }, []);

  // Bake Debh's pictures for the title parade while the intros play, so the parade has them the moment it opens.
  useEffect(() => {
    const id = setTimeout(() => void bakeParade().catch(() => undefined), 900);
    return () => clearTimeout(id);
  }, []);

  // Look for a newer version once, the first time a title screen shows (never during a game).
  const updateChecked = useRef(false);
  useEffect(() => {
    if (updateChecked.current || (gameState !== 'start' && gameState !== 'highscore')) return;
    updateChecked.current = true;
    void checkForUpdate().then(found => {
      if (found) setUpdate(found);
    });
  }, [gameState]);

  // U: install the update (installed copies) or open its page (portable copies and packages).
  const runUpdate = useCallback(async (found: UpdateInfo) => {
    if (!found.canInstall) {
      void openPage(found.releaseUrl);
      return;
    }
    if (updateStatus === 'installing') return;
    setUpdateStatus('installing');
    try {
      await found.install(); // restarts the game when it is done
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : String(error));
      setUpdateStatus('failed');
    }
  }, [updateStatus]);

  // Global keys: F / F11 / Alt+Enter toggle fullscreen, M toggles mute
  // (F and M are ignored while typing initials).
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
        e.preventDefault();
        void toggleAppFullscreen();
        return;
      }
      if (gameState === 'enter-highscore') return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        void toggleAppFullscreen();
      } else if (key === 'm') {
        soundService.toggleMuted();
      } else if (key === 'o' && (gameState === 'start' || gameState === 'highscore')) {
        soundService.initAudio();
        setOverlay('options');
      } else if (key === 't' && (gameState === 'start' || gameState === 'highscore')) {
        setOverlay('trophies');
      } else if (key === 'u' && update && (gameState === 'start' || gameState === 'highscore')) {
        runUpdate(update);
      } else if (gameState === 'intro') {
        requestAppFullscreen();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, requestAppFullscreen, toggleAppFullscreen, update, runUpdate]);

  // After the intros (Runtime, Pixel Debh) comes the note on the AI, then the game's own intro.
  const handleBootDone = useCallback(() => setGameState('notice'), []);
  const handleNoticeDone = useCallback(() => setGameState('intro'), []);

  const handleIntroComplete = useCallback(() => {
    requestAppFullscreen();
    setGameState('start');
  }, [requestAppFullscreen]);

  const startFresh = useCallback(() => {
    setCarry({ score: 0 });
    setRun({ levelIndex: 0, difficulty: getSettings().difficulty, practice: false });
    setGameState('playing');
    setGameId(id => id + 1);
    setLoopCount(1);
  }, []);

  const handleStart = useCallback(() => {
    requestAppFullscreen();
    startFresh();
  }, [requestAppFullscreen, startFresh]);

  /** "Continue" in the title menu: the saved game, from the start of the level she was in. */
  const handleContinue = useCallback(() => {
    const saved = loadProgress().run;
    if (!saved) return handleStart();
    requestAppFullscreen();
    setCarry({ score: saved.score, lives: saved.lives });
    setRun({ levelIndex: saved.levelIndex, difficulty: saved.difficulty, practice: false, stats: saved.stats });
    setLoopCount(saved.loopCount);
    setGameState('playing');
    setGameId(id => id + 1);
  }, [handleStart, requestAppFullscreen]);

  /** The level select: a practice game from that level. */
  const handlePlayLevel = useCallback(
    (levelIndex: number) => {
      requestAppFullscreen();
      setOverlay(null);
      setCarry({ score: 0 });
      setRun({ levelIndex, difficulty: getSettings().difficulty, practice: true });
      setLoopCount(1);
      setGameState('playing');
      setGameId(id => id + 1);
    },
    [requestAppFullscreen]
  );

  const handleLoopContinue = useCallback(() => {
    setRun(r => ({ ...r, levelIndex: 0, stats: undefined }));
    setLoopCount(prev => prev + 1);
    setGameState('playing');
    setGameId(id => id + 1);
  }, []);

  /** Ends a run: the score goes to the leaderboard if it qualifies. */
  const finishRun = useCallback((score: number, fallback: GameState) => {
    soundService.stopMusic();
    if (!run.practice && highscoreService.isHighscore(score)) {
      setFinalScore(score);
      setGameState('enter-highscore');
    } else {
      setGameState(fallback);
    }
  }, [run.practice]);

  const handleGameOver = useCallback(
    (score: number) => finishRun(score, 'gameover'),
    [finishRun]
  );

  const handleGameCompleted = useCallback((score: number, lives: number) => {
    soundService.stopMusic();
    setCarry({ score, lives });
    setGameState('completed');
  }, []);

  // "Save and quit" from the victory screen: bank the score instead of starting another loop.
  const handleBankScore = useCallback(() => {
    finishRun(carry.score, 'start');
    setAttractScreen('highscore');
  }, [carry.score, finishRun]);

  const handleHighscoreEntered = useCallback(() => {
    setAttractScreen('highscore');
    setGameState('start');
  }, []);

  // The pad drives the menus by sending them the keys they know (the game reads it itself while playing).
  useEffect(() => startMenuPad(), []);

  // Attract mode: left alone on the title, the game shows the leaderboard for a while and goes back. Any key,
  // click or move of the pad brings the menu back and starts the waiting again.
  const lastActivity = useRef(performance.now());
  useEffect(() => {
    const touch = () => {
      lastActivity.current = performance.now();
    };
    window.addEventListener('keydown', touch, true);
    window.addEventListener('pointerdown', touch, true);
    window.addEventListener('mousemove', touch, true);
    return () => {
      window.removeEventListener('keydown', touch, true);
      window.removeEventListener('pointerdown', touch, true);
      window.removeEventListener('mousemove', touch, true);
    };
  }, []);
  useEffect(() => {
    if (gameState !== 'start' || overlay) return;
    lastActivity.current = performance.now();
    const timer = window.setInterval(() => {
      const idle = performance.now() - lastActivity.current;
      setAttractScreen(current => {
        if (current === 'start' && idle > 20000) {
          lastActivity.current = performance.now();
          return 'highscore';
        }
        if (current === 'highscore' && idle > 10000) {
          lastActivity.current = performance.now();
          return 'start';
        }
        return current;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState, overlay]);

  /** A choice made in the title menu. */
  const handleTitleChoice = useCallback(
    (choice: StartChoice) => {
      switch (choice) {
        case 'new':
          handleStart();
          break;
        case 'continue':
          handleContinue();
          break;
        case 'quit':
          void quitApp();
          break;
        default:
          setOverlay(choice);
      }
    },
    [handleStart, handleContinue]
  ),
  handleLeaveGame = useCallback(
    (score: number) => {
      finishRun(score, 'start');
      setAttractScreen('start');
    },
    [finishRun]
  );

  // Music of the screens outside the game (the levels start their own from the engine events).
  useEffect(() => {
    const track: Partial<Record<GameState, { name: string; once?: boolean }>> = {
      start: { name: 'startScreenTheme' },
      highscore: { name: 'highscore' },
      'enter-highscore': { name: 'highscore' },
      completed: { name: 'victory', once: true },
      gameover: { name: 'gameover', once: true },
    };
    const t = track[gameState];
    if (!t) return;
    if (t.once) soundService.playMusicOnce(t.name);
    else soundService.playMusicLoop(t.name);
    return () => {
      soundService.stopMusic();
    };
  }, [gameState]);

  const renderContent = () => {
    switch (gameState) {
      case 'notice':
        return <AiNotice onDone={handleNoticeDone} />;
      case 'intro':
        return <PixelArcadeIntro onIntroComplete={handleIntroComplete} />;
      case 'start':
        if (attractScreen === 'highscore' && !overlay) {
          return <HighscoreScreen onStart={() => setAttractScreen('start')} />;
        }
        return <StartScreen onSelect={handleTitleChoice} active={!overlay} />;
      case 'playing':
      case 'level-cleared':
        return (
          <GameScreen
            key={gameId}
            onGameOver={handleGameOver}
            onCompleted={handleGameCompleted}
            onQuit={handleLeaveGame}
            startLevel={run.levelIndex}
            difficulty={run.difficulty}
            practice={run.practice}
            initialStats={run.stats}
            loopCount={loopCount}
            initialScore={carry.score}
            initialLives={carry.lives}
          />
        );
      case 'completed':
        return (
          <CompletedScreen
            score={carry.score}
            loopCount={loopCount}
            onNextLoop={handleLoopContinue}
            onBank={handleBankScore}
          />
        );
      case 'gameover':
        return <GameoverScreen onRestart={startFresh} onTitle={() => setGameState('start')} />;
      case 'highscore':
        return <HighscoreScreen onStart={() => setGameState('start')} />;
      case 'enter-highscore':
        return (
          <EnterHighscoreScreen
            score={finalScore}
            difficulty={run.difficulty}
            onHighscoreEntered={handleHighscoreEntered}
          />
        );
      default:
        return <StartScreen onSelect={handleTitleChoice} active={!overlay} />;
    }
  };

  // The intros are sized on the window, not on the 1920x1080 stage: they sit outside it.
  if (gameState === 'boot') return <BootIntros onDone={handleBootDone} />;

  return (
    <div
      className="flex justify-center items-center w-screen h-screen bg-black"
      onClick={requestAppFullscreen}
    >
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
          marginTop: margins.marginTop,
          marginLeft: margins.marginLeft,
        }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${dimensions.width / GAME_WIDTH})`,
            transformOrigin: 'top left',
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
          }}
        >
          {renderContent()}
          {overlay && <ScreenOverlay kind={overlay} onClose={() => setOverlay(null)} onPlayLevel={handlePlayLevel} />}
          {update && (gameState === 'start' || gameState === 'highscore') && (
            <UpdateBanner update={update} status={updateStatus} error={updateError} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
