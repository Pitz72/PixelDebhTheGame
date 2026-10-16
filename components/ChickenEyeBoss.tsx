import React from 'react';
import { Boss as BossType } from '../types';

interface ChickenEyeBossProps {
  boss: BossType;
}

const ChickenEyeBoss: React.FC<ChickenEyeBossProps> = ({ boss }) => {
  const blink = Math.sin(Date.now() / 1000) > 0.95;

  return (
    <div
      style={{
        position: 'absolute',
        left: boss.x,
        top: boss.y,
        width: boss.width,
        height: boss.height,
        filter: boss.isHit
          ? 'brightness(2.5) drop-shadow(0 0 28px #ff3d00)'
          : 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 18px rgba(244, 81, 30, 0.45))',
        transition: 'filter 0.05s linear',
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
          <radialGradient id="ce-sclera" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#cfd8dc" />
          </radialGradient>
        </defs>

        {/* --- THE EYEBALL --- */}
        <circle cx="70" cy="70" r="60" fill="url(#ce-sclera)" stroke="#757575" strokeWidth="3.5" />

        {/* Veins (Faithful to original LeGallineNellOcchi) */}
        <path d="M 20 50 Q 40 60 45 45" stroke="#ef9a9a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 115 35 Q 95 50 90 35" stroke="#ef9a9a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 65 125 Q 75 105 60 100" stroke="#ef9a9a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 24 88 Q 38 82 44 92" stroke="#ef9a9a" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Layered Orange-Red Iris */}
        <circle cx="70" cy="70" r="40" fill="#d84315" stroke="#bf360c" strokeWidth="1.5" />
        <circle cx="70" cy="70" r="38" fill="#f4511e" />
        <circle cx="70" cy="70" r="32" fill="#ff7043" />

        {/* Dark Pupil */}
        <circle cx="70" cy="70" r="24" fill="#212121" />

        {/* --- THE CHICKEN IN THE PUPIL --- */}
        <g transform="translate(50, 48) scale(0.4)">
          {/* White Plump Body */}
          <ellipse cx="50" cy="55" rx="30" ry="28" fill="#ffffff" stroke="#bdbdbd" strokeWidth="3" />
          {/* Red Comb */}
          <path
            d="M 35 28 C 30 15, 45 15, 45 25 C 50 12, 60 12, 55 25 C 60 18, 70 18, 65 28 Z"
            fill="#d32f2f"
            stroke="#b71c1c"
            strokeWidth="2"
          />
          {/* Eyes */}
          <circle cx="40" cy="45" r="4.5" fill="#000" />
          <circle cx="60" cy="45" r="4.5" fill="#000" />
          <circle cx="38.5" cy="43.5" r="1.5" fill="#fff" />
          <circle cx="58.5" cy="43.5" r="1.5" fill="#fff" />
          {/* Yellow Beak */}
          <polygon points="45,52 55,52 50,65" fill="#fbc02d" stroke="#f57f17" strokeWidth="1.5" />
          {/* Red Wattles */}
          <ellipse cx="45" cy="68" rx="4" ry="5.5" fill="#d32f2f" />
          <ellipse cx="55" cy="68" rx="4" ry="5.5" fill="#d32f2f" />
        </g>

        {/* Eyelid for blinking */}
        {blink && <circle cx="70" cy="70" r="60" fill="#e0e0e0" stroke="#757575" strokeWidth="3.5" />}

        {/* --- THE MAGNIFYING GLASS --- */}
        <g className="magnifying-glass">
          <style>{`
            .magnifying-glass {
              animation: float-glass 3s ease-in-out infinite;
              transform-origin: 70px 70px;
            }
            @keyframes float-glass {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-5px) rotate(3deg); }
            }
          `}</style>
          {/* Handle */}
          <rect
            x="85"
            y="85"
            width="12"
            height="45"
            rx="5"
            fill="#5d4037"
            stroke="#3e2723"
            strokeWidth="2.5"
            transform="rotate(-45 91 91)"
          />
          {/* Rim & Semi-transparent Blue Lens */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="rgba(173, 216, 230, 0.28)"
            stroke="#424242"
            strokeWidth="6"
          />
          {/* Glint on the lens */}
          <path
            d="M 35 35 A 30 30 0 0 1 75 35"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default ChickenEyeBoss;