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

  // Color Palette
  const mainColor = "#66BB6A"; 
  const darkColor = "#388E3C"; 
  const eyeIrisColor = "#00897b"; 
  const pupilColor = "#1a1a1a";
  const highlightColor = "#FFFFFF";

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
      {/* The projectile (pixel style) */}
      <div className="projectile-pixel"></div>

      {/* SVG designed to look like Pixel Art */}
      <svg
        className="frog-svg-body"
        viewBox="0 0 64 64" // The "pixel art" canvas
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Group for body animations */}
        <g
          className="frog-body-group"
          style={{ transformOrigin: '32px 48px' }} // Transformation center (base of body)
        >
          {/* Body (drawn with <rect> for a blocky look) */}
          {/* Dark border */}
          <rect x="10" y="20" width="44" height="34" fill={darkColor} />
          <rect x="14" y="16" width="36" height="42" fill={darkColor} />
          {/* Main body */}
          <rect x="12" y="22" width="40" height="30" fill={mainColor} />
          <rect x="16" y="18" width="32" height="38" fill={mainColor} />

          {/* Legs (simple blocks) */}
          <rect x="4" y="44" width="10" height="8" fill={darkColor} />
          <rect x="50" y="44" width="10" height="8" fill={darkColor} />
          <rect x="6" y="46" width="8" height="6" fill={mainColor} />
          <rect x="50" y="46" width="8" height="6" fill={mainColor} />

          {/* Stylized Eye */}
          <g transform="translate(32, 30)"> {/* Centered (X=32, Y=30) */}
            {/* Iris (green oval) */}
            <path d="M -14 0 C -14 -12, 14 -12, 14 0 C 14 12, -14 12, -14 0 Z" fill={eyeIrisColor} />
            {/* Dark border for iris */}
            <path d="M -14 0 C -14 -12, 14 -12, 14 0 C 14 12, -14 12, -14 0 Z" fill="none" stroke={darkColor} strokeWidth="2" />

            {/* Pupil (vertical black oval) */}
            <path d="M -3 0 C -3 -10, 3 -10, 3 0 C 3 10, -3 10, -3 0 Z" fill={pupilColor} />

            {/* Highlights */}
            <rect x="-8" y="-7" width="3" height="4" fill={highlightColor} />
            <rect x="5" y="3" width="2" height="3" fill={highlightColor} />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CyclopsFrogBoss;
