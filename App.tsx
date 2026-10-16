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

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [attractScreen, setAttractScreen] = useState<'start' | 'highscore'>('start');
  const [gameId, setGameId] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const { dimensions, margins } = useGameScale();

  const requestAppFullscreen = useCallback(() => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Toggle fullscreen with 'F' key (outside highscore initials entry) or enter fullscreen on first interaction
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && gameState !== 'enter-highscore') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
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

  const handleStart = useCallback(() => {
    requestAppFullscreen();
    setGameState('playing');
    setGameId(id => id + 1);
    setLoopCount(1);
  }, [requestAppFullscreen]);

  const handleRestart = useCallback(() => {
    setGameState('playing');
    setGameId(id => id + 1);
    setLoopCount(1);
  }, []);

  const handleLoopContinue = useCallback(() => {
    setLoopCount(prev => prev + 1);
    setGameState('playing');
    setGameId(id => id + 1);
  }, []);

  const handleGameOver = useCallback((score: number) => {
    soundService.stopMusic();
    if (highscoreService.isHighscore(score)) {
      setFinalScore(score);
      setGameState('enter-highscore');
    } else {
      setGameState('gameover');
    }
  }, []);

  const handleGameCompleted = useCallback(() => {
    soundService.stopMusic();
    setGameState('completed');
  }, []);

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
            setGameState={setGameState}
            loopCount={loopCount}
          />
        );
      case 'completed':
        return <CompletedScreen onRestart={handleLoopContinue} loopCount={loopCount} />;
      case 'gameover':
        return <GameoverScreen onRestart={handleRestart} />;
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
