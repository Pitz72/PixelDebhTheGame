import React, { useEffect, useCallback } from 'react';

const GameoverScreen: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onRestart();
      }
    },
    [onRestart]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="w-full h-full bg-gradient-to-b from-[#1a0008] via-[#0d010a] to-black flex flex-col justify-center items-center cursor-pointer"
      onClick={onRestart}
    >
      <h1
        className="text-9xl font-black text-red-500 mb-14 tracking-wider"
        style={{ textShadow: '0 0 35px rgba(239,68,68,0.75), 5px 5px 0px #ffffff' }}
      >
        GAME OVER
      </h1>
      <p className="text-3xl font-extrabold text-white bg-red-600/80 px-10 py-4 rounded-2xl border-2 border-red-300 animate-pulse tracking-widest">
        PREMI INVIO PER RIPROVARE
      </p>
    </div>
  );
};

export default GameoverScreen;
