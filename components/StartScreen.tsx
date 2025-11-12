import React, { useEffect, useCallback, useState } from 'react';
import { PlayerSprite, EnemySprite } from '../services/assetService';
import * as soundService from '../services/soundService';
import { EnemyType } from '../types';

const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [showText, setShowText] = useState(false);

  const paradeCharacters: { type: 'player' | EnemyType, id: string }[] = [
    { type: 'player', id: 'player' },
    { type: 'base', id: 'base-1' },
    { type: 'jumper', id: 'jumper-1' },
    { type: 'flyer', id: 'flyer-1' },
  ];

  useEffect(() => {
    soundService.playMusicLoop('startScreenTheme');
    const interval = setInterval(() => {
        setVisibleCharacters(c => {
            if (c < paradeCharacters.length) {
                return c + 1;
            }
            clearInterval(interval);
            setShowText(true);
            return c;
        });
    }, 500);

    return () => {
        clearInterval(interval);
        soundService.stopMusic();
    };
  }, []);

  const handleStart = useCallback(() => {
    soundService.stopMusic();
    soundService.playSound('start');
    onStart();
  }, [onStart]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && showText) {
      handleStart();
    }
  }, [handleStart, showText]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getSprite = (type: 'player' | EnemyType) => {
    if (type === 'player') {
      return <PlayerSprite direction="right" isInvincible={false} />;
    }
    // Dummy state for sprite rendering
    return <EnemySprite type={type} state={'active'} />;
  };

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center overflow-hidden">
      <h1 className="text-8xl text-cyan-400 mb-4" style={{textShadow: '4px 4px #e8175d'}}>PixelDebh</h1>
      <h2 className="text-6xl text-yellow-300 mb-12" style={{textShadow: '3px 3px #e8175d'}}>Retro-Rescue!</h2>
      
      <div className="h-24 my-8 flex items-center justify-center space-x-8">
        {paradeCharacters.slice(0, visibleCharacters).map((char, index) => (
          <div
            key={char.id}
            className="w-24 h-24"
            style={{
              animation: `parade-walk-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            }}
          >
            {getSprite(char.type)}
          </div>
        ))}
      </div>

      {showText && (
        <>
            <p className="text-4xl text-white animate-blink mt-8">Press Enter to Start</p>
            <p className="text-lg text-gray-400 mt-24">
                CONTROLS: [A][D] or Arrows to Move | [W] or Space to Jump | [C] or [X] to Capture/Launch
            </p>
        </>
      )}
    </div>
  );
};

export default StartScreen;