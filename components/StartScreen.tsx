import React, { useEffect, useCallback, useState } from 'react';
import { PlayerSprite, EnemySprite } from '../services/assetService';
import * as soundService from '../services/soundService';
import { trophyProgress } from '../services/trophyService';
import CreditLine from './CreditLine';
import { EnemyType } from '../types';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [showText, setShowText] = useState(false);
  const { earned, total } = trophyProgress();

  const paradeCharacters: { type: 'player' | EnemyType; id: string; label: string }[] = [
    { type: 'player', id: 'player', label: 'PixelDebh' },
    { type: 'base', id: 'base-1', label: 'Globby' },
    { type: 'jumper', id: 'jumper-1', label: 'Hoppy' },
    { type: 'flyer', id: 'flyer-1', label: 'Flappy' },
    { type: 'bomber', id: 'bomber-1', label: 'Bomby' },
    { type: 'phaser', id: 'phaser-1', label: 'Ghosty' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCharacters(c => {
        if (c < paradeCharacters.length) {
          return c + 1;
        }
        clearInterval(interval);
        setShowText(true);
        return c;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [paradeCharacters.length]);

  const handleStart = useCallback(() => {
    soundService.initAudio();
    soundService.playSound('start');
    onStart();
  }, [onStart]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleStart();
      }
    },
    [handleStart]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getSprite = (type: 'player' | EnemyType) => {
    if (type === 'player') {
      return <PlayerSprite direction="right" isInvincible={false} isMoving={true} />;
    }
    return <EnemySprite type={type} state="active" />;
  };

  return (
    <div
      className="w-full h-full relative bg-gradient-to-b from-[#050114] via-[#140732] to-[#260c4d] flex flex-col justify-center items-center text-center overflow-hidden cursor-pointer"
      onClick={handleStart}
    >
      {/* Decorative Vector Grid Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(0, 229, 255, 0.35), transparent 65%), linear-gradient(rgba(0,229,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.12) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 64px 64px, 64px 64px',
        }}
      />

      <div className="z-10 flex flex-col items-center">
        {/* Official Logo Badge + Title Header */}
        <div className="flex items-center space-x-6 mb-3">
          <img
            src="/pixeldebh-logo.png"
            alt="PixelDebh Official Logo"
            className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(255,145,0,0.65)]"
            draggable={false}
          />
          <div className="text-left">
            <span className="inline-block px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-orange-300 text-xs font-bold tracking-[0.25em] mb-1">
              CANALE YOUTUBE UFFICIALE • VECTOR ARCADE EDITION
            </span>
            <h1
              className="text-7xl font-black text-white tracking-wider leading-none"
              style={{ textShadow: '0 0 30px #00e5ff, 5px 5px 0px #e8175d' }}
            >
              PIXELDEBH
            </h1>
            <h2
              className="text-3xl font-extrabold text-yellow-300 tracking-widest mt-1"
              style={{ textShadow: '3px 3px 0px #e8175d' }}
            >
              RETRO-RESCUE!
            </h2>
          </div>
        </div>

        {/* Character Cast Parade */}
        <div className="h-36 my-4 flex items-center justify-center space-x-10 bg-[#0b0420]/80 px-12 py-4 rounded-3xl border border-cyan-500/35 shadow-[0_0_45px_rgba(0,229,255,0.18)]">
          {paradeCharacters.slice(0, visibleCharacters).map(char => (
            <div
              key={char.id}
              className="flex flex-col items-center"
              style={{
                animation: 'parade-walk-in 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              }}
            >
              <div className={char.type === 'player' ? 'w-16 h-22' : 'w-20 h-20'}>
                {getSprite(char.type)}
              </div>
              <span className="text-xs font-bold tracking-wider text-cyan-300 mt-2 uppercase">
                {char.label}
              </span>
            </div>
          ))}
        </div>

        {showText && (
          <div className="flex flex-col items-center mt-6">
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-600 to-purple-600 text-white text-3xl font-black tracking-widest border-2 border-yellow-300 shadow-[0_0_30px_rgba(255,145,0,0.55)] animate-pulse cursor-pointer"
            >
              PRESS ENTER TO START
            </button>

            <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-2 text-left bg-[#09031c]/85 px-8 py-4 rounded-2xl border border-purple-500/35 text-sm text-gray-300">
              <div><strong className="text-cyan-400">[A / D] o Frecce:</strong> Muovi</div>
              <div><strong className="text-cyan-400">[SPAZIO]:</strong> Salto / Doppio Salto</div>
              <div><strong className="text-cyan-400">[C] o [X]:</strong> Cattura / Lancia Nemico</div>
              <div><strong className="text-cyan-400">[SHIFT SX]:</strong> Spara (Boss &amp; Zero-G)</div>
              <div><strong className="text-cyan-400">[O]:</strong> Opzioni audio</div>
              <div><strong className="text-cyan-400">[M]:</strong> Muto</div>
              <div><strong className="text-cyan-400">[T]:</strong> Trofei ({earned}/{total})</div>
              <div><strong className="text-cyan-400">[F]:</strong> Schermo intero / finestra</div>
            </div>
          </div>
        )}
      </div>
      <CreditLine />
    </div>
  );
};

export default StartScreen;