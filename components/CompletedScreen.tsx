import React, { useEffect } from 'react';

interface CompletedScreenProps {
  score: number;
  loopCount: number;
  onNextLoop: () => void;
  onBank: () => void;
}

const CompletedScreen: React.FC<CompletedScreenProps> = ({ score, loopCount, onNextLoop, onBank }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') onNextLoop();
      else if (e.key === 'Escape') onBank();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextLoop, onBank]);

  return (
    <div
      className="w-full h-full bg-gradient-to-b from-[#041a14] via-[#092b29] to-[#050114] flex flex-col justify-center items-center text-center cursor-pointer"
      onClick={onNextLoop}
    >
      <h1
        className="text-8xl font-black text-emerald-400 mb-6 tracking-wider"
        style={{ textShadow: '0 0 30px rgba(16,185,129,0.6), 4px 4px 0px #000' }}
      >
        VICTORY!
      </h1>
      <h2 className="text-5xl font-extrabold text-yellow-300 mb-4 tracking-widest">
        LOOP {loopCount} COMPLETATO!
      </h2>
      <p className="text-4xl font-mono font-black text-white mb-8">
        {score.toString().padStart(8, '0')}
      </p>
      <p className="text-2xl font-bold text-pink-400 mb-12 tracking-wider">
        NEL LOOP {loopCount + 1} I NEMICI SARANNO PIÙ VELOCI DEL 20%!
      </p>
      <p className="text-3xl font-black text-white bg-emerald-600/80 px-10 py-4 rounded-2xl border-2 border-emerald-300 animate-pulse">
        PREMI INVIO PER INIZIARE IL LOOP {loopCount + 1}
      </p>
      <p className="text-xl font-bold text-cyan-200/80 mt-8 tracking-wider">
        [ESC] SALVA IL PUNTEGGIO ED ESCI
      </p>
    </div>
  );
};

export default CompletedScreen;
