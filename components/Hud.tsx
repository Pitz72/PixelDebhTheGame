
import React from 'react';
import { HeartSprite, ItemSprite } from '../services/assetService';
import { ItemType, Boss } from '../types';

interface HudProps {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
  boss?: Boss | null;
  isGodMode: boolean;
  timeRemaining?: number | null;
  loopCount: number;
}

const Hud: React.FC<HudProps> = ({ score, lives, level, levelName, collectiblesLeft, activePowerUp, boss, isGodMode, timeRemaining, loopCount }) => {
  
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start text-4xl z-10 bg-black bg-opacity-35" style={{ textShadow: '3px 3px #222' }}>
        
        {/* Group left items */}
        <div className="flex flex-col space-y-2">
          {/* Top Row */}
          <div className="flex items-center space-x-8">
            {/* Score */}
            <div className="flex items-baseline space-x-4">
              <p className="text-yellow-400">SCORE</p>
              <p className="text-white text-5xl">{score.toString().padStart(8, '0')}</p>
            </div>
            
            {/* Lives */}
            <div className="flex items-center space-x-3">
               <p className="text-yellow-400">LIVES</p>
               <div className="flex space-x-1">
                {Array.from({ length: lives }).map((_, i) => (
                    <div key={i} className="w-10 h-10"><HeartSprite /></div>
                ))}
               </div>
            </div>

             {/* Level */}
             <div className="flex items-baseline space-x-4">
              <p className="text-yellow-400">LEVEL</p>
              <p className="text-white text-5xl">{level}</p>
            </div>

            {/* Loop Indicator */}
            <div className="flex items-baseline space-x-2">
              <p className="text-red-500 text-xl">LOOP</p>
              <p className="text-white text-3xl">{loopCount}</p>
            </div>

            {/* Items (only if not a boss level) */}
            {(!boss) && (
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10"><ItemSprite type="joystick" /></div>
                 <p className="text-white text-5xl">x {collectiblesLeft}</p>
              </div>
            )}
          </div>
          {/* Bottom Row - Level Name */}
          <div className="pl-2">
            <p className="text-cyan-400 text-3xl">{levelName}</p>
          </div>
        </div>
        
        {/* Center Time Display */}
        {timeRemaining !== null && timeRemaining !== undefined && (
             <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
                 <p className="text-yellow-400 text-sm mb-1">TIME</p>
                 <p className={`text-5xl ${timeRemaining < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                     {formatTime(timeRemaining)}
                 </p>
             </div>
        )}
        
        {/* Group right items */}
        <div className="flex items-center space-x-4">
          {isGodMode && (
            <div className="bg-black bg-opacity-50 p-2 border-2 border-lime-400 rounded-lg">
              <p className="text-3xl text-lime-400 animate-pulse">GOD MODE</p>
            </div>
          )}
          {activePowerUp && (
            <div className="bg-black bg-opacity-50 p-2 border-2 border-yellow-400 rounded-full animate-pulse">
                <div className="w-12 h-12">
                    <ItemSprite type={activePowerUp} />
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Boss Health Bar */}
      {boss && boss.hp > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1/2 z-10">
          <p className="text-center text-4xl text-red-500 mb-2" style={{textShadow: '2px 2px #000'}}>{levelName.toUpperCase()}</p>
          <div className="w-full h-8 bg-gray-700 border-4 border-black rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-300 ease-out"
              style={{ width: `${(boss.hp / boss.maxHp) * 100}%`}}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Hud;
