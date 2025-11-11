import React from 'react';
import { Boss as BossType } from '../types';

interface CyclopsFrogBossProps {
  boss: BossType;
}

const CyclopsFrogBoss: React.FC<CyclopsFrogBossProps> = ({ boss }) => {
  const spriteClasses = [
    'frog-boss-sprite',
    boss.isHopping ? 'hopping' : '',
    boss.isThrowing ? 'throwing' : '',
  ].join(' ');

  const mainColor = "#66BB6A";
  const eyeColor = "white";
  const pupilColor = "#333333";

  return (
    <div 
      className={spriteClasses} 
      style={{ 
        position: 'absolute', 
        left: boss.x,
        top: boss.y,
        width: boss.width, 
        height: boss.height,
        filter: boss.isHit ? 'brightness(3)' : 'none',
        transition: 'filter 0.05s linear',
      }}
    >
      <div className="projectile-base projectile"></div>

      <svg
        className="frog-svg-body"
        viewBox="0 0 250 250"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ellipse cx="125" cy="235" rx="80" ry="15" fill="rgba(0,0,0,0.3)" />
        
        <g className="frog-body-group" style={{ transformOrigin: '125px 150px' }}>
          <path
            d="M 60 150 C 30 130, 30 70, 100 50 C 170 30, 220 70, 190 150 C 170 170, 80 170, 60 150 Z"
            fill={mainColor}
          />
          <path d="M 70 140 C 60 160, 50 170, 40 160 L 50 130 Z" fill={mainColor} />
          <path d="M 180 140 C 190 160, 200 170, 210 160 L 200 130 Z" fill={mainColor} />
          <path d="M 50 160 C 30 180, 20 200, 40 200 L 60 180 Z" fill={mainColor} />
          <path d="M 200 160 C 220 180, 230 200, 210 200 L 190 180 Z" fill={mainColor} />
          <path
            d="M 80 160 Q 125 175, 170 160"
            stroke={pupilColor}
            strokeWidth="4"
            fill="none"
          />
          <g transform="translate(125, 100)">
            <circle cx="0" cy="0" r="35" fill={eyeColor} />
            <ellipse cx="0" cy="0" rx="18" ry="25" fill={pupilColor} />
            <circle cx="5" cy="-8" r="6" fill="white" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CyclopsFrogBoss;