
import React, { useEffect, useCallback } from 'react';

interface CompletedScreenProps {
  onRestart: () => void;
  loopCount: number;
}

const CompletedScreen: React.FC<CompletedScreenProps> = ({ onRestart, loopCount }) => {
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
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center">
      <h1 className="text-8xl text-green-400 mb-8" style={{textShadow: '4px 4px #fff'}}>YOU WIN!</h1>
      <h2 className="text-5xl text-yellow-300 mb-8">LOOP {loopCount} COMPLETED</h2>
      <p className="text-2xl text-red-400 mb-16">ENEMIES WILL BE FASTER IN THE NEXT LOOP!</p>
      <p className="text-4xl text-white animate-blink">Press Enter to Start Loop {loopCount + 1}</p>
    </div>
  );
};

export default CompletedScreen;
