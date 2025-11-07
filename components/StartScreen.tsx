import React, { useEffect, useCallback } from 'react';
import { PlayerSprite } from '../services/assetService';
import * as soundService from '../services/soundService';

const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const handleStart = useCallback(() => {
    soundService.initAudio();
    soundService.playSound('start');
    onStart();
  }, [onStart]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  }, [handleStart]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center">
      <h1 className="text-8xl text-cyan-400 mb-4" style={{textShadow: '4px 4px #e8175d'}}>PixelDebh</h1>
      <h2 className="text-6xl text-yellow-300 mb-12" style={{textShadow: '3px 3px #e8175d'}}>Retro-Rescue!</h2>
      
      <div className="w-24 h-24 my-8">
        <PlayerSprite direction="right" isInvincible={false} />
      </div>

      <p className="text-4xl text-white animate-blink mt-8">Press Enter to Start</p>
      <p className="text-lg text-gray-400 mt-24">
          CONTROLS: [A][D] or Arrows to Move | [W] or Space to Jump | [C] or [X] to Capture/Launch
      </p>
    </div>
  );
};

export default StartScreen;