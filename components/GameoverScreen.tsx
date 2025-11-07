
import React, { useEffect, useCallback } from 'react';

const GameoverScreen: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        onRestart();
    }
  }, [onRestart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center">
      <h1 className="text-9xl text-red-600 mb-16" style={{textShadow: '4px 4px #fff'}}>GAME OVER</h1>
      <p className="text-4xl text-white animate-blink">Press Enter to Restart</p>
    </div>
  );
};

export default GameoverScreen;
