import React, { useState, useCallback, useEffect } from 'react';
import * as highscoreService from '../services/highscoreService';
import * as soundService from '../services/soundService';

interface EnterHighscoreScreenProps {
  score: number;
  onHighscoreEntered: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const EnterHighscoreScreen: React.FC<EnterHighscoreScreenProps> = ({ score, onHighscoreEntered }) => {
  const [initials, setInitials] = useState<string[]>(['A', 'A', 'A']);
  const [activeIndex, setActiveIndex] = useState(0);

  const changeLetter = useCallback(
    (direction: number) => {
      soundService.playSound('collect');
      setInitials(currentInitials => {
        const newInitials = [...currentInitials];
        const currentLetter = newInitials[activeIndex];
        const currentIndex = ALPHABET.indexOf(currentLetter);
        const nextIndex = (currentIndex + direction + ALPHABET.length) % ALPHABET.length;
        newInitials[activeIndex] = ALPHABET[nextIndex];
        return newInitials;
      });
    },
    [activeIndex]
  );

  const confirmLetter = useCallback(() => {
    soundService.playSound('start');
    if (activeIndex < 2) {
      setActiveIndex(activeIndex + 1);
    } else {
      const finalName = initials.join('');
      highscoreService.addHighscore(finalName, score);
      onHighscoreEntered();
    }
  }, [activeIndex, initials, score, onHighscoreEntered]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          changeLetter(1);
          break;
        case 's':
        case 'arrowdown':
          changeLetter(-1);
          break;
        case 'enter':
          confirmLetter();
          break;
      }
    },
    [changeLetter, confirmLetter]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#050114] via-[#12062c] to-[#240a46] flex flex-col justify-center items-center text-center p-8">
      <h1
        className="text-7xl font-black text-emerald-400 mb-6 tracking-wider"
        style={{ textShadow: '0 0 25px rgba(16,185,129,0.55)' }}
      >
        NEW HIGH SCORE!
      </h1>
      <p className="text-6xl font-mono font-black text-white mb-12">
        {score.toString().padStart(8, '0')}
      </p>

      <div className="flex flex-col items-center bg-[#0c0524]/90 px-12 py-10 rounded-3xl border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(0,229,255,0.2)]">
        <p className="text-3xl font-bold text-yellow-300 mb-8 tracking-widest uppercase">
          Inserisci le tue Iniziali
        </p>

        <div className="flex space-x-6">
          {initials.map((letter, index) => (
            <div
              key={index}
              className={`w-28 h-36 flex justify-center items-center text-7xl font-black rounded-2xl bg-slate-950 border-4 text-white transition-all ${
                index === activeIndex
                  ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.6)] scale-105'
                  : 'border-slate-700 opacity-60'
              }`}
            >
              {letter}
            </div>
          ))}
        </div>

        <div className="text-xl text-cyan-200/80 mt-10 space-y-2 font-bold">
          <p>[W / S] o [↑ / ↓] per cambiare lettera</p>
          <p>[INVIO] per confermare</p>
        </div>
      </div>
    </div>
  );
};

export default EnterHighscoreScreen;
