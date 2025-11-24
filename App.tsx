
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

  const handleIntroComplete = useCallback(() => setGameState('start'), []);

  const handleStart = useCallback(() => {
    setGameState('playing');
    setGameId(id => id + 1);
    setLoopCount(1); // Reset loop on fresh start
  }, []);
  
  const handleRestart = useCallback(() => {
    setGameState('playing');
    setGameId(id => id + 1);
    // Note: If restart comes from Game Over, we reset loop. 
    // If it comes from CompletedScreen (Loop continue), we handle it in handleLoopContinue.
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
  
  const handleBackToStart = useCallback(() => {
      setAttractScreen('start'); // Force back to start screen
      setGameState('start');
  }, []);
  
  const handleHighscoreEntered = useCallback(() => {
      setAttractScreen('highscore'); // Show highscore screen after entering
      setGameState('start');
  }, []);

  // Attract Mode Logic
  useEffect(() => {
    let attractTimer: number | null = null;
    if (gameState === 'start') {
        attractTimer = window.setInterval(() => {
            setAttractScreen(current => (current === 'start' ? 'highscore' : 'start'));
        }, 10000); // Switch every 10 seconds
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
      // Return a cleanup function that stops the music when the state is no longer 'start'
      return () => {
        soundService.stopMusic();
      }
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
        return <GameScreen key={gameId} onGameOver={handleGameOver} onCompleted={handleGameCompleted} setGameState={setGameState} loopCount={loopCount} />;
      case 'completed':
        return <CompletedScreen onRestart={handleLoopContinue} loopCount={loopCount} />;
      case 'gameover':
        return <GameoverScreen onRestart={handleRestart} />;
      case 'highscore':
        return <HighscoreScreen onStart={handleStart} />;
      case 'enter-highscore':
        return <EnterHighscoreScreen score={finalScore} onHighscoreEntered={handleHighscoreEntered} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-black">
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
