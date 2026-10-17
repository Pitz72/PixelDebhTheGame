import React, { useEffect, useState } from 'react';
import { PlayerSprite, EnemySprite } from '../services/assetService';
import { trophyProgress } from '../services/trophyService';
import { usePadConnected } from '../services/gamepadService';
import { isTauri } from '../services/platform';
import { t, useLanguage } from '../services/i18n';
import CreditLine from './CreditLine';
import MenuList, { type MenuItem } from './MenuList';
import { EnemyType } from '../types';

/** What the title menu can ask for. */
export type StartChoice = 'new' | 'leaderboard' | 'trophies' | 'options' | 'howto' | 'credits' | 'quit';

interface StartScreenProps {
  onSelect: (choice: StartChoice) => void;
  /** False while a page (options, trophies...) is open above: the menu keeps still. */
  active?: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelect, active = true }) => {
  useLanguage();
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const { earned, total } = trophyProgress();
  const padConnected = usePadConnected();

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
        setShowMenu(true);
        return c;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [paradeCharacters.length]);

  const items: MenuItem[] = [
    { id: 'new', label: t('menu.newGame') },
    { id: 'leaderboard', label: t('menu.leaderboard') },
    { id: 'trophies', label: `${t('menu.trophies')} (${earned}/${total})` },
    { id: 'options', label: t('menu.options') },
    { id: 'howto', label: t('menu.howto') },
    { id: 'credits', label: t('menu.credits') },
    // a browser tab has nothing to quit
    ...(isTauri() ? [{ id: 'quit', label: t('menu.quit') }] : []),
  ];

  const getSprite = (type: 'player' | EnemyType) => {
    if (type === 'player') {
      return <PlayerSprite direction="right" isInvincible={false} isMoving={true} />;
    }
    return <EnemySprite type={type} state="active" />;
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#050114] via-[#140732] to-[#260c4d] flex flex-col justify-center items-center text-center overflow-hidden">
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
        <div className="flex items-center space-x-6 mb-2">
          <img
            src="/pixeldebh-logo.png"
            alt="PixelDebh Official Logo"
            className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(255,145,0,0.65)]"
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
        <div className="h-32 my-3 flex items-center justify-center space-x-10 bg-[#0b0420]/80 px-12 py-3 rounded-3xl border border-cyan-500/35 shadow-[0_0_45px_rgba(0,229,255,0.18)]">
          {paradeCharacters.slice(0, visibleCharacters).map(char => (
            <div
              key={char.id}
              className="flex flex-col items-center"
              style={{
                animation: 'parade-walk-in 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              }}
            >
              <div className={char.type === 'player' ? 'w-14 h-20' : undefined} style={char.type === 'player' ? undefined : { width: 72, height: 72 }}>
                {getSprite(char.type)}
              </div>
              <span className="text-xs font-bold tracking-wider text-cyan-300 mt-1 uppercase">{char.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col items-center" style={{ minHeight: 440, opacity: showMenu ? 1 : 0, transition: 'opacity 300ms' }}>
          {showMenu && <MenuList items={items} onSelect={id => onSelect(id as StartChoice)} active={active} size="md" width={520} />}
          <p className="mt-4 text-sm font-bold tracking-[0.25em] text-gray-400">
            {t('menu.hint')}
            {padConnected && <span className="ml-4 text-emerald-300">● GAMEPAD</span>}
          </p>
        </div>
      </div>
      <CreditLine />
    </div>
  );
};

export default StartScreen;
