import React, { useEffect, useCallback } from 'react';

interface CompletedScreenProps {
  onRestart: () => void;
  loopCount: number;
}

const CompletedScreen: React.FC<CompletedScreenProps> = ({ onRestart, loopCount }) => {
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
      className="w-full h-full bg-gradient-to-b from-[#041a14] via-[#092b29] to-[#050114] flex flex-col justify-center items-center text-center cursor-pointer"
      onClick={onRestart}
    >
      <h1
        className="text-8xl font-black text-emerald-400 mb-6 tracking-wider"
        style={{ textShadow: '0 0 30px rgba(16,185,129,0.6), 4px 4px 0px #000' }}
      >
        VICTORY!
      </h1>
      <h2 className="text-5xl font-extrabold text-yellow-300 mb-6 tracking-widest">
        LOOP {loopCount} COMPLETATO!
      </h2>
      <p className="text-2xl font-bold text-pink-400 mb-14 tracking-wider">
        NEL LOOP {loopCount + 1} I NEMICI SARANNO PIÙ VELOCI DEL 20%!
      </p>
      <p className="text-3xl font-black text-white bg-emerald-600/80 px-10 py-4 rounded-2xl border-2 border-emerald-300 animate-pulse">
        PREMI INVIO PER INIZIARE IL LOOP {loopCount + 1}
      </p>
    </div>
  );
};

export default CompletedScreen;
