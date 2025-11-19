
import React from 'react';
import { Boss as BossType } from '../types';

interface ChickenEyeBossProps {
  boss: BossType;
}

const ChickenEyeBoss: React.FC<ChickenEyeBossProps> = ({ boss }) => {
  // Simple animation based on time
  const blink = Math.sin(Date.now() / 1000) > 0.95; 

  return (
    <div
      style={{
        position: 'absolute',
        left: boss.x,
        top: boss.y,
        width: boss.width,
        height: boss.height,
        filter: boss.isHit ? 'brightness(3) sepia(1) hue-rotate(-50deg)' : 'none',
        transition: 'filter 0.05s linear',
      }}
    >
      {/* Pixel Art SVG Construction of "LeGallineNellOcchi" */}
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated'
        }}
      >
        {/* --- THE EYEBALL --- */}
        {/* Sclera (White part) */}
        <circle cx="50" cy="50" r="45" fill="#f0f0f0" stroke="#4e342e" strokeWidth="2" />
        
        {/* Veins */}
        <path d="M10 50 Q 20 40, 30 50" stroke="#ef9a9a" strokeWidth="1" fill="none" />
        <path d="M80 20 Q 70 30, 60 25" stroke="#ef9a9a" strokeWidth="1" fill="none" />
        <path d="M50 90 Q 60 80, 50 70" stroke="#ef9a9a" strokeWidth="1" fill="none" />

        {/* Iris (Orange/Red gradient simulated with rings) */}
        <circle cx="50" cy="50" r="30" fill="#d84315" />
        <circle cx="50" cy="50" r="25" fill="#f4511e" />
        <circle cx="50" cy="50" r="20" fill="#ff7043" />

        {/* Pupil (Black void) */}
        <circle cx="50" cy="50" r="18" fill="#212121" />

        {/* --- THE CHICKEN (Inside Pupil) --- */}
        <g transform="translate(38, 35) scale(0.25)">
             {/* Body */}
             <rect x="20" y="20" width="60" height="60" rx="30" fill="#fff" stroke="#ccc" strokeWidth="2"/>
             
             {/* Comb (Red thing on head) */}
             <rect x="35" y="5" width="10" height="15" fill="#d32f2f" />
             <rect x="45" y="8" width="10" height="12" fill="#d32f2f" />
             <rect x="55" y="5" width="10" height="15" fill="#d32f2f" />

             {/* Eyes */}
             <rect x="35" y="40" width="8" height="8" fill="black" />
             <rect x="57" y="40" width="8" height="8" fill="black" />

             {/* Beak */}
             <path d="M 45 55 L 55 55 L 50 70 Z" fill="#fbc02d" />

             {/* Wattle (Red thing under beak) */}
             <circle cx="45" cy="75" r="5" fill="#d32f2f" />
             <circle cx="55" cy="75" r="5" fill="#d32f2f" />
             
             {/* Wings */}
             <ellipse cx="10" cy="50" rx="10" ry="20" fill="#eee" transform="rotate(-20 10 50)" />
             <ellipse cx="90" cy="50" rx="10" ry="20" fill="#eee" transform="rotate(20 90 50)" />
        </g>
        
        {/* Eyelid (Blinking animation) */}
        {blink && (
            <rect x="0" y="0" width="100" height="100" fill="#f0f0f0" />
        )}
        
        {/* --- MAGNIFYING GLASS (Floating in front) --- */}
        <g className="magnifier-float">
            <style>{`
                .magnifier-float {
                    animation: floatGlass 3s ease-in-out infinite;
                    transform-origin: center;
                }
                @keyframes floatGlass {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(5deg); }
                }
            `}</style>
            {/* Handle */}
            <rect x="60" y="60" width="10" height="40" fill="#5d4037" transform="rotate(-45 65 65)" />
            
            {/* Glass Rim */}
            <circle cx="40" cy="40" r="35" fill="none" stroke="#424242" strokeWidth="4" />
            
            {/* Glass Lens (Semi-transparent blue) */}
            <circle cx="40" cy="40" r="33" fill="rgba(224, 247, 250, 0.3)" />
            
            {/* Glint on glass */}
            <path d="M 25 25 Q 40 20, 55 25" stroke="white" strokeWidth="3" opacity="0.6" fill="none" />
        </g>

      </svg>
    </div>
  );
};

export default ChickenEyeBoss;