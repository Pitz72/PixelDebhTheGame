
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
        filter: boss.isHit ? 'brightness(3) sepia(1) hue-rotate(180deg)' : 'none',
        transition: 'opacity 0.1s linear, filter 0.05s linear',
      }}
    >
      {/* Pixel Art SVG of "CapocciaNelBuio" */}
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
         {/* Background Red Square (Shirt/BG combo) */}
         <rect x="10" y="10" width="80" height="80" rx="5" fill="#d32f2f" />

         {/* Head Shape (Skin) */}
         <rect x="20" y="20" width="60" height="60" rx="10" fill="#ffccaa" />
         <rect x="15" y="45" width="5" height="10" fill="#ffccaa" /> {/* Ear L */}
         <rect x="80" y="45" width="5" height="10" fill="#ffccaa" /> {/* Ear R */}

         {/* Hair (Black, Bowl cut/Short) */}
         <path d="M 20 20 L 80 20 L 80 40 L 75 40 L 75 30 L 25 30 L 25 40 L 20 40 Z" fill="#1a1a1a" />
         <rect x="20" y="18" width="60" height="5" fill="#1a1a1a" />

         {/* Glasses (Rectangular, Black rim) */}
         <rect x="25" y="45" width="22" height="12" fill="#e0f7fa" opacity="0.7" />
         <rect x="25" y="45" width="22" height="12" fill="none" stroke="#000" strokeWidth="2" />
         
         <rect x="53" y="45" width="22" height="12" fill="#e0f7fa" opacity="0.7" />
         <rect x="53" y="45" width="22" height="12" fill="none" stroke="#000" strokeWidth="2" />
         
         <line x1="47" y1="51" x2="53" y2="51" stroke="#000" strokeWidth="2" /> {/* Bridge */}

         {/* Eyes (Squinting/Deadpan) */}
         <rect x="30" y="50" width="12" height="2" fill="#000" />
         <rect x="58" y="50" width="12" height="2" fill="#000" />

         {/* Eyebrows (Angry/Serious) */}
         <path d="M 25 42 L 45 45" stroke="#000" strokeWidth="3" />
         <path d="M 75 42 L 55 45" stroke="#000" strokeWidth="3" />

         {/* Goatee (Black) */}
         <path d="M 45 75 L 55 75 L 50 85 Z" fill="#1a1a1a" />
         <rect x="47" y="73" width="6" height="2" fill="#1a1a1a" /> {/* Moustache bit */}

         {/* Mouth (Small smile/smirk) */}
         <path d="M 45 68 Q 50 72, 55 68" stroke="#000" strokeWidth="2" fill="none" />

         {/* Hands (V-Sign / Peace) - Bottom */}
         <g transform="translate(20, 80)">
            <rect x="0" y="0" width="5" height="15" fill="#ffccaa" transform="rotate(-15)" />
            <rect x="8" y="0" width="5" height="15" fill="#ffccaa" transform="rotate(15)" />
            <rect x="0" y="10" width="15" height="10" fill="#ffccaa" rx="2" />
         </g>
         
         <g transform="translate(65, 80)">
             <rect x="0" y="0" width="5" height="15" fill="#ffccaa" transform="rotate(-15)" />
             <rect x="8" y="0" width="5" height="15" fill="#ffccaa" transform="rotate(15)" />
             <rect x="0" y="10" width="15" height="10" fill="#ffccaa" rx="2" />
         </g>

      </svg>
    </div>
  );
};

export default ShadowHeadBoss;
