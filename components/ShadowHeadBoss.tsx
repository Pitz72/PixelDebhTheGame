import React from 'react';
import { Boss as BossType } from '../types';

interface ShadowHeadBossProps {
  boss: BossType;
}

const ShadowHeadBoss: React.FC<ShadowHeadBossProps> = ({ boss }) => {
  const opacity = boss.opacity !== undefined ? boss.opacity : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: boss.x,
        top: boss.y,
        width: boss.width,
        height: boss.height,
        opacity: opacity,
        filter: boss.isHit
          ? 'brightness(2.5) drop-shadow(0 0 28px #00ffff)'
          : 'drop-shadow(0 0 22px rgba(211, 47, 47, 0.65))',
        transition: 'opacity 0.1s linear, filter 0.05s linear',
        zIndex: 9,
      }}
    >
      <svg
        viewBox="0 0 140 140"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <linearGradient id="sh-skin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd8bc" />
            <stop offset="65%" stopColor="#ffccaa" />
            <stop offset="100%" stopColor="#eab08c" />
          </linearGradient>
        </defs>

        {/* Red Rounded-Square Background Aura (Faithful to original CapocciaNelBuio) */}
        <rect
          x="20"
          y="20"
          width="100"
          height="100"
          rx="15"
          fill="#d32f2f"
          stroke="#ff5252"
          strokeWidth="2.5"
        />

        {/* Ears */}
        <rect x="25" y="60" width="5" height="15" rx="2" fill="#e6b89c" />
        <rect x="110" y="60" width="5" height="15" rx="2" fill="#e6b89c" />

        {/* Head */}
        <rect
          x="30"
          y="30"
          width="80"
          height="80"
          rx="20"
          fill="url(#sh-skin-grad)"
          stroke="#4e342e"
          strokeWidth="2"
        />

        {/* Short Black Hair */}
        <path
          d="M 30 50 C 30 25, 110 25, 110 50 L 105 50 L 105 40 C 80 40, 60 40, 35 40 L 35 50 Z"
          fill="#1a1a1a"
        />

        {/* Glasses */}
        <rect
          x="35"
          y="58"
          width="30"
          height="15"
          rx="2"
          fill="#e0f7fa"
          stroke="#1a1a1a"
          strokeWidth="3"
          opacity="0.88"
        />
        <rect
          x="75"
          y="58"
          width="30"
          height="15"
          rx="2"
          fill="#e0f7fa"
          stroke="#1a1a1a"
          strokeWidth="3"
          opacity="0.88"
        />
        <line x1="65" y1="65" x2="75" y2="65" stroke="#1a1a1a" strokeWidth="3" />
        {/* Glasses Highlight */}
        <line x1="39" y1="62" x2="49" y2="62" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <line x1="79" y1="62" x2="89" y2="62" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

        {/* Squinting Eyes */}
        <rect x="42" y="65" width="15" height="3" fill="#1a1a1a" />
        <rect x="82" y="65" width="15" height="3" fill="#1a1a1a" />

        {/* Eyebrows */}
        <path d="M 35 52 L 62 56" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
        <path d="M 105 52 L 78 56" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />

        {/* Mouth & Goatee */}
        <path d="M 60 88 Q 70 92 80 88" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="65" y="84" width="10" height="3" fill="#1a1a1a" />
        <polygon points="62,95 78,95 70,110" fill="#1a1a1a" />

        {/* Hands doing V-sign */}
        <g transform="translate(25, 105)">
          <rect x="0" y="0" width="8" height="20" rx="4" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" transform="rotate(-15)" />
          <rect x="10" y="0" width="8" height="20" rx="4" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" transform="rotate(15)" />
          <rect x="0" y="12" width="20" height="15" rx="5" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" />
        </g>
        <g transform="translate(95, 105)">
          <rect x="2" y="0" width="8" height="20" rx="4" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" transform="rotate(-15)" />
          <rect x="12" y="0" width="8" height="20" rx="4" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" transform="rotate(15)" />
          <rect x="0" y="12" width="20" height="15" rx="5" fill="#ffccaa" stroke="#4e342e" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
};

export default ShadowHeadBoss;
