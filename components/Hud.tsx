import React from 'react';
import { HeartSprite, ItemSprite } from '../services/assetService';
import { ItemType, Boss } from '../types';

interface HudProps {
  score: number;
  lives: number;
  level: number;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
  boss?: Boss | null;
}

const Hud: React.FC<HudProps> = ({ score, lives, level, collectiblesLeft, activePowerUp, boss }) => {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-4xl z-10 bg-black bg-opacity-35" style={{ textShadow: '3px 3px #222' }}>
        
        {/* Group all items together */}
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

          {/* Items (only if not a boss level) */}
          {(!boss) && (
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10"><ItemSprite type="joystick" /></div>
               <p className="text-white text-5xl">x {collectiblesLeft}</p>
            </div>
          )}
        </div>
        
        {/* Active Power-up on the right */}
        {activePowerUp && (
          <div className="bg-black bg-opacity-50 p-2 border-2 border-yellow-400 rounded-full animate-pulse">
              <div className="w-12 h-12">
                  <ItemSprite type={activePowerUp} />
              </div>
          </div>
        )}
      </div>

      {/* Boss Health Bar */}
      {boss && boss.hp > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1/2 z-10">
          <p className="text-center text-4xl text-red-500 mb-2" style={{textShadow: '2px 2px #000'}}>CYCLOPS FROG</p>
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