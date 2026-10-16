import React, { useState, useCallback, useEffect } from 'react';
import { useGameScale } from './hooks/useGameScale';
import StartScreen from './components/StartScreen';
import GameScreen from './GameScreen';
import CompletedScreen from './components/CompletedScreen';
import GameoverScreen from './components/GameoverScreen';
import PixelArcadeIntro from './components/PixelArcadeIntro';
import HighscoreScreen from './components/HighscoreScreen';
import EnterHighscoreScreen from './components/EnterHighscoreScreen';
import { GameState } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import * as highscoreService from './services/highscoreService';
import * as soundService from './services/soundService';

interface Carry {
  score: number;
  lives?: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [attractScreen, setAttractScreen] = useState<'start' | 'highscore'>('start');
  const [gameId, setGameId] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  // Score and lives travel with the player from one loop (New Game+) to the next.
  const [carry, setCarry] = useState<Carry>({ score: 0 });
  const { dimensions, margins } = useGameScale();

  const requestAppFullscreen = useCallback(() => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Global keys: F toggles fullscreen, M toggles mute (neither while typing initials);
  // any key during the intro also enters fullscreen.
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (gameState === 'enter-highscore' || e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (key === 'm') {
        soundService.toggleMuted();
      } else if (gameState === 'intro') {
        requestAppFullscreen();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, requestAppFullscreen]);

  const handleIntroComplete = useCallback(() => {
    requestAppFullscreen();
    setGameState('start');
  }, [requestAppFullscreen]);

  const startFresh = useCallback(() => {
    setCarry({ score: 0 });
    setGameState('playing');
    setGameId(id => id + 1);
    setLoopCount(1);
  }, []);

  const handleStart = useCallback(() => {
    requestAppFullscreen();
    startFresh();
  }, [requestAppFullscreen, startFresh]);

  const handleLoopContinue = useCallback(() => {
    setLoopCount(prev => prev + 1);
    setGameState('playing');
    setGameId(id => id + 1);
  }, []);

  /** Ends a run: the score goes to the leaderboard if it qualifies. */
  const finishRun = useCallback((score: number, fallback: GameState) => {
    soundService.stopMusic();
    if (highscoreService.isHighscore(score)) {
      setFinalScore(score);
      setGameState('enter-highscore');
    } else {
      setGameState(fallback);
    }
  }, []);

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

  // Attract Mode Logic
  useEffect(() => {
    let attractTimer: number | null = null;
    if (gameState === 'start') {
      attractTimer = window.setInterval(() => {
        setAttractScreen(current => (current === 'start' ? 'highscore' : 'start'));
      }, 10000);
    }
    return () => {
      if (attractTimer) {
        clearInterval(attractTimer);
      }
    };
  }, [gameState]);

  // Manage start screen music loop
  useEffect(() => {
    if (gameState === 'start') {
      soundService.playMusicLoop('startScreenTheme');
      return () => {
        soundService.stopMusic();
      };
    }
  }, [gameState]);

  const renderContent = () => {
    switch (gameState) {
      case 'intro':
        return <PixelArcadeIntro onIntroComplete={handleIntroComplete} />;
      case 'start':
        if (attractScreen === 'highscore') {
          return <HighscoreScreen onStart={handleStart} />;
        }
        return <StartScreen onStart={handleStart} />;
      case 'playing':
      case 'level-cleared':
        return (
          <GameScreen
            key={gameId}
            onGameOver={handleGameOver}
            onCompleted={handleGameCompleted}
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
        return <GameoverScreen onRestart={startFresh} />;
      case 'highscore':
        return <HighscoreScreen onStart={handleStart} />;
      case 'enter-highscore':
        return (
          <EnterHighscoreScreen
            score={finalScore}
            onHighscoreEntered={handleHighscoreEntered}
          />
        );
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

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
          style={{
            transform: `scale(${dimensions.width / GAME_WIDTH})`,
            transformOrigin: 'top left',
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
