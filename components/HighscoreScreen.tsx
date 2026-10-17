import React, { useState, useEffect, useCallback } from 'react';
import * as highscoreService from '../services/highscoreService';
import * as soundService from '../services/soundService';
import { t, useLanguage } from '../services/i18n';
import { HighscoreEntry } from '../types';
import CreditLine from './CreditLine';

interface HighscoreScreenProps {
  /** Enter, Space, Escape or a click: back to the title menu (or, in `closing` mode, close the page). */
  onStart: () => void;
  /** Shown as a page over the menu: it takes the keys it uses so the menu underneath stays still. */
  closing?: boolean;
}

const HighscoreScreen: React.FC<HighscoreScreenProps> = ({ onStart, closing = false }) => {
  useLanguage();
  const [scores, setScores] = useState<HighscoreEntry[]>([]);

  useEffect(() => {
    setScores(highscoreService.getHighscores());
  }, []);

  const handleStart = useCallback(() => {
    soundService.initAudio();
    soundService.playSound('start');
    onStart();
  }, [onStart]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === ' ' || (closing && k === 'escape')) {
        if (closing) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (e.repeat) return;
        }
        handleStart();
      }
    },
    [handleStart, closing]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, closing);
    return () => window.removeEventListener('keydown', handleKeyDown, closing);
  }, [handleKeyDown, closing]);

  return (
    <div
      className="relative w-full h-full bg-gradient-to-b from-[#050114] via-[#12062c] to-[#240a46] flex flex-col justify-center items-center text-center p-8 cursor-pointer"
      onClick={handleStart}
    >
      <h1
        className="text-7xl font-black text-yellow-400 tracking-wider mb-10"
        style={{ textShadow: '0 0 24px rgba(250,204,21,0.5), 4px 4px 0px #e8175d' }}
      >
        HALL OF FAME
      </h1>

      <div className="w-full max-w-3xl bg-[#0b0420]/85 rounded-3xl border-2 border-cyan-500/40 p-8 shadow-[0_0_40px_rgba(0,229,255,0.2)]">
        {scores.length > 0 ? (
          scores.map((entry, index) => (
            <div
              key={index}
              className="flex justify-between items-center px-6 py-4 my-2 rounded-xl bg-white/5 border border-white/10 text-4xl font-bold"
            >
              <span className={index === 0 ? 'text-yellow-300' : 'text-cyan-400'}>
                #{index + 1} &nbsp; {entry.name}
              </span>
              <span className="text-white font-mono">{entry.score.toString().padStart(8, '0')}</span>
            </div>
          ))
        ) : (
          <p className="text-3xl text-gray-400 py-8">{t('highscore.empty')}</p>
        )}
      </div>

      <p className="text-3xl font-extrabold text-cyan-300 animate-blink mt-12 tracking-widest">{t('highscore.back')}</p>
      <CreditLine />
    </div>
  );
};

export default HighscoreScreen;
