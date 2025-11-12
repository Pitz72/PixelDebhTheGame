
import React, { useState, useCallback } from 'react';
import { useGameScale } from './hooks/useGameScale';
import StartScreen from './components/StartScreen';
import GameScreen from './GameScreen';
import CompletedScreen from './components/CompletedScreen';
import GameoverScreen from './components/GameoverScreen';
import PixelArcadeIntro from './components/PixelArcadeIntro';
import { GameState } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [gameId, setGameId] = useState(1);
  const { dimensions, margins } = useGameScale();

  const handleIntroComplete = useCallback(() => setGameState('start'), []);

  const handleStart = useCallback(() => {
    setGameState('playing');
    setGameId(id => id + 1);
  }, []);
  
  const handleRestart = useCallback(() => {
    // Directly restart the game by changing the key, which forces a remount
    setGameState('playing');
    setGameId(id => id + 1);
  }, []);

  const handleGameOver = useCallback(() => setGameState('gameover'), []);
  const handleGameCompleted = useCallback(() => setGameState('completed'), []);

  const renderContent = () => {
    switch (gameState) {
      case 'intro':
        return <PixelArcadeIntro onIntroComplete={handleIntroComplete} />;
      case 'start':
        return <StartScreen onStart={handleStart} />;
      case 'playing':
      case 'level-cleared':
        return <GameScreen key={gameId} onGameOver={handleGameOver} onCompleted={handleGameCompleted} setGameState={setGameState} />;
      case 'completed':
        return <CompletedScreen onRestart={handleRestart} />;
      case 'gameover':
        return <GameoverScreen onRestart={handleRestart} />;
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