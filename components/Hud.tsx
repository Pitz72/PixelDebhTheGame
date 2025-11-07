import React from 'react';
import { HeartSprite, ItemSprite } from '../services/assetService';
import { ItemType } from '../types';

interface HudProps {
  score: number;
  lives: number;
  level: number;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
}

const Hud: React.FC<HudProps> = ({ score, lives, level, collectiblesLeft, activePowerUp }) => {
  return (
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

        {/* Items */}
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10"><ItemSprite type="joystick" /></div>
           <p className="text-white text-5xl">x {collectiblesLeft}</p>
        </div>
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
  );
};

export default Hud;