import React from 'react';
import { Boss as BossType } from '../types';

interface CyclopsFrogBossProps {
  boss: BossType;
}

const CyclopsFrogBoss: React.FC<CyclopsFrogBossProps> = ({ boss }) => {
  const spriteClasses = [
    'frog-boss-sprite',
    boss.isThrowing ? 'throwing' : '',
  ].join(' ');

  return (
    <div
      className={spriteClasses}
      style={{
        position: 'absolute',
        left: boss.x,
        top: boss.y,
        width: boss.width,
        height: boss.height,
        filter: boss.isHit
          ? 'brightness(2.6) drop-shadow(0 0 28px #00ff88)'
          : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 18px rgba(102, 187, 106, 0.35))',
        transition: 'filter 0.06s linear',
        zIndex: 9,
      }}
    >
      <svg
        className="frog-svg-body"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <radialGradient id="frog-body-gradient" cx="50%" cy="38%" r="62%" fx="50%" fy="35%">
            <stop offset="0%" style={{ stopColor: '#81C784', stopOpacity: 1 }} />
            <stop offset="55%" style={{ stopColor: '#4CAF50', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2E7D32', stopOpacity: 1 }} />
          </radialGradient>
          <linearGradient id="frog-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C8E6C9" />
            <stop offset="100%" stopColor="#81C784" />
          </linearGradient>
          <radialGradient id="frog-eye-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="72%" style={{ stopColor: '#e8f5e9', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#a5d6a7', stopOpacity: 1 }} />
          </radialGradient>
          <radialGradient id="frog-iris-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#4DB6AC', stopOpacity: 1 }} />
            <stop offset="55%" style={{ stopColor: '#00897B', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#004D40', stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        <g className="frog-body-group" style={{ transformOrigin: '60px 90px' }}>
          {/* Hind Frog Legs (Faithful to original repo anatomy) */}
          <path
            d="M 15 95 C 5 85, 5 105, 25 110"
            stroke="#1B5E20"
            strokeWidth="22"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 15 95 C 5 85, 5 105, 25 110"
            stroke="#388E3C"
            strokeWidth="17"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 105 95 C 115 85, 115 105, 95 110"
            stroke="#1B5E20"
            strokeWidth="22"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 105 95 C 115 85, 115 105, 95 110"
            stroke="#388E3C"
            strokeWidth="17"
            fill="none"
            strokeLinecap="round"
          />

          {/* Main Rounded Frog Body */}
          <ellipse
            cx="60"
            cy="65"
            rx="45"
            ry="40"
            fill="url(#frog-body-gradient)"
            stroke="#1B5E20"
            strokeWidth="3.5"
          />

          {/* Soft Lighter Amphibian Belly */}
          <ellipse
            cx="60"
            cy="80"
            rx="31"
            ry="20"
            fill="url(#frog-belly-grad)"
            opacity="0.75"
          />

          {/* Subtle Amphibian Spots */}
          <circle cx="28" cy="52" r="4.5" fill="#2E7D32" opacity="0.55" />
          <circle cx="23" cy="64" r="3" fill="#2E7D32" opacity="0.55" />
          <circle cx="92" cy="52" r="4.5" fill="#2E7D32" opacity="0.55" />
          <circle cx="97" cy="64" r="3" fill="#2E7D32" opacity="0.55" />

          {/* Front Frog Legs */}
          <path
            d="M 35 95 C 25 115, 30 115, 40 115"
            stroke="#1B5E20"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 35 95 C 25 115, 30 115, 40 115"
            stroke="#66BB6A"
            strokeWidth="13.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 85 95 C 95 115, 90 115, 80 115"
            stroke="#1B5E20"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 85 95 C 95 115, 90 115, 80 115"
            stroke="#66BB6A"
            strokeWidth="13.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Wide Amphibian Mouth */}
          <path
            d="M 30 80 Q 60 95 90 80"
            stroke="#1B5E20"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Mouth Corner Creases */}
          <path d="M 27 77 Q 30 81 33 78" stroke="#1B5E20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 87 78 Q 90 81 93 77" stroke="#1B5E20" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Single Central Cyclops Eye */}
          <g transform="translate(60, 52)">
            {/* Upper Eyelid Ridge */}
            <circle cx="0" cy="0" r="24" fill="#388E3C" stroke="#1B5E20" strokeWidth="2.5" />
            {/* Eyeball Sclera */}
            <circle
              cx="0"
              cy="0"
              r="21.5"
              fill="url(#frog-eye-gradient)"
              stroke="#2E7D32"
              strokeWidth="2"
            />
            {/* Teal Iris */}
            <circle cx="0" cy="0" r="14.5" fill="url(#frog-iris-gradient)" stroke="#004D40" strokeWidth="1.2" />
            {/* Vertical Reptilian/Amphibian Pupil */}
            <ellipse cx="0" cy="0" rx="4.5" ry="11.5" fill="#1a1a1a" />
            {/* Crisp Specular Highlights */}
            <circle cx="-6" cy="-6" r="4.5" fill="white" opacity="0.9" />
            <circle cx="5" cy="5" r="2.2" fill="white" opacity="0.7" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CyclopsFrogBoss;