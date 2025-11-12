import React from 'react';

// --- PLAYER SPRITE ---
export const PlayerSprite = ({ direction, isInvincible, showGlove = false }: { direction: 'left' | 'right', isInvincible: boolean, showGlove?: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full transform ${direction === 'left' ? 'scale-x-[-1]' : ''}`}>
    <g>
      {/* Hat */}
      <path d="M4 3 h8 v1 h-1 v1 h-6 v-1 h-1 z" fill="#E43254"/>
      {/* Head */}
      <path d="M5 4 h6 v4 h-1 v1 h-4 v-1 h-1 z" fill="#FED7A3"/>
      {/* Eyes */}
      <rect x="7" y="5" width="1" height="1" fill="#000"/>
      <rect x="9" y="5" width="1" height="1" fill="#000"/>
      {/* Body */}
      <path d="M4 9 h8 v4 h-2 v1 h-4 v-1 h-2 z" fill="#3D50E0"/>
      {/* Arms */}
      <rect x="3" y="9" width="1" height="3" fill={showGlove ? '#ffee00' : '#FED7A3'}/>
      <rect x="12" y="9" width="1" height="3" fill={showGlove ? '#ffee00' : '#FED7A3'}/>
      {/* Feet */}
      <rect x="5" y="14" width="2" height="1" fill="#88554A"/>
      <rect x="9" y="14" width="2" height="1" fill="#88554A"/>
    </g>
  </svg>
);

// --- ENEMY SPRITE ---
export const EnemySprite = ({ type, state }: { type: string, state: string }) => {
  const captured = state === 'captured';
  const purple = '#9472ff';

  switch (type) {
    case 'flyer': // Flappy
      return (
        <svg viewBox="0 0 16 12" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`}>
           <path d="M4 0 h8 v2 h-1 v1 h-1 v1 h-4 v-1 h-1 v-1 h-1 z" fill={captured ? purple : "#d62261"} /> {/* Head */}
           <path d="M5 5 h6 v5 h-1 v1 h-4 v-1 h-1 z" fill={captured ? purple : "#ff3f83"} /> {/* Body */}
           <rect x="7" y="2" width="2" height="2" fill="#FFF"/> {/* Eye */}
           <rect x="8" y="3" width="1" height="1" fill="#000"/> {/* Pupil */}
           <path d="M0 3 h4 v2 h-1 v1 h-1 v1 h-2 z" fill={captured ? purple : "#d62261"} /> {/* Left Wing */}
           <path d="M12 3 h4 v2 h-1 v1 h-1 v1 h-2 z" fill={captured ? purple : "#d62261"} /> {/* Right Wing */}
        </svg>
      );
    case 'jumper': // Hoppy
      return (
        <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : 'animate-bounce'}`}>
          <path d="M3 3 h10 v10 h-10 z" fill={captured ? purple : "#d62231"}/>
          <rect x="5" y="6" width="2" height="2" fill="white"/>
          <rect x="9" y="6" width="2" height="2" fill="white"/>
          <rect x="6" y="7" width="1" height="1" fill="black"/>
          <rect x="10" y="7" width="1" height="1" fill="black"/>
          <path d="M4 13 h8 v1 h-1 v1 h-6 v-1 z" fill={captured ? purple : "#ff3f4c"}/>
        </svg>
      );
    case 'base': // Globby
    default:
      return (
        <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`}>
          <path d="M2 5 a 6 6 0 0 1 12 0 v8 H2 z" fill={captured ? purple : "#25a854"} />
          <rect x="5" y="6" width="6" height="3" fill="white" />
          <rect x="7" y="7" width="2" height="2" fill="black" />
          <rect x="3" y="13" width="2" height="2" fill={captured ? purple : "#1a7d3d"} />
          <rect x="11" y="13" width="2" height="2" fill={captured ? purple : "#1a7d3d"} />
        </svg>
      );
  }
};

// --- ITEM SPRITES (COLLECTIBLES + POWER-UPS) ---
export const ItemSprite = ({ type }: { type: string }) => {
  switch (type) {
    case 'speed-boost':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
                <path d="M8 0 l-2 4 h4 l-2 4 h4 l-6 8 v-6 h-2 v-6 z" fill="#ffee00"/>
            </svg>
        );
    case 'shield':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
                <path d="M2 2 l6 -2 l6 2 v6 l-6 6 l-6 -6 z" fill="#00ccff"/>
                <path d="M8 1 l4 2 v5 l-4 4 l-4 -4 v-5 z" fill="#ffffff" />
            </svg>
        );
    case 'super-throw':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
                <path d="M4 4 h8 v8 h-8 z" fill="#ff8800"/>
                <rect x="6" y="2" width="4" height="12" fill="#ffaa00"/>
                <rect x="2" y="6" width="12" height="4" fill="#ffaa00"/>
            </svg>
        );
    case 'joystick':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
            {/* Base */}
            <path d="M1 12 H15 V15 H1 z" fill="#7B7B7B" />
            <path d="M2 12 H14 V14 H2 z" fill="#3B3B3B" />
            <path d="M3 11 H13 V12 H3 z" fill="#5B5B5B" />
            {/* Stick */}
            <rect x="7" y="5" width="2" height="6" fill="#1B1B1B"/>
            {/* Ball */}
            <path d="M8 1 a 3 3 0 0 1 0 6 a 3 3 0 0 1 0 -6" fill="#E43254"/>
            <path d="M7 2.5 a 1.5 1.5 0 0 1 1.5 0 v 1 a 0.5 0.5 0 0 1 -1.5 0 z" fill="#FF8A9F"/>
        </svg>
      );
    case 'floppy':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
            {/* Casing */}
            <path d="M1 1 H15 V15 H1 z" fill="#3B3B3B"/>
            <path d="M1 1 H12 V2 H1 z" fill="#5B5B5B"/>
            {/* Label */}
            <path d="M2 2 h12 v6 H2 z" fill="#E0E0E0"/>
            <path d="M3 3 h10 v1 H3 z" fill="#88C0F0"/>
            <path d="M3 5 h8 v1 H3 z" fill="#B0D0F0"/>
            {/* Shutter */}
            <path d="M5 8 h6 v6 H5 z" fill="#9B9B9B"/>
            <path d="M6 9 h4 v4 H6 z" fill="#BBBBBB"/>
            <rect x="10" y="2" width="3" height="1" fill="#BBBBBB" />
        </svg>
      );
    case 'cartridge':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse">
            {/* Casing */}
            <path d="M2 0 h12 v15 a 1 1 0 0 1 -1 1 H3 a 1 1 0 0 1 -1 -1 z" fill="#A9A9A9"/>
            <path d="M3 1 h10 v14 H3 z" fill="#8B8B8B"/>
             {/* Grip Lines */}
            <path d="M3 12 h2 v2 H3z M11 12 h2 v2 h-2z" fill="#7B7B7B" />
            {/* Label Area */}
            <path d="M4 2 h8 v8 H4 z" fill="#222"/>
            {/* Label Art */}
            <path d="M5 8 h6 v1 h-6 z" fill="#e8175d"/>
            <path d="M5 3 h2 v2 H5 z" fill="#3D50E0"/>
            <path d="M9 3 h2 v2 H9 z" fill="#3D50E0"/>
            <path d="M7 5 h2 v1 H7 z" fill="#fef200"/>
        </svg>
      );
    default:
      return null;
  }
};

// --- HEART SPRITE ---
export const HeartSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full">
        <path d="M8 4 C 5 2, 2 5, 8 14 C 14 5, 11 2, 8 4" fill="#ff4444"/>
    </svg>
);

// --- SHIELD SPRITE (for Player) ---
export const ShieldSprite = () => (
    <svg viewBox="0 0 20 20" className="w-full h-full opacity-60">
        <circle cx="10" cy="10" r="9" stroke="#00d5ff" strokeWidth="2" fill="rgba(0, 213, 255, 0.3)" />
    </svg>
);

// --- PLAYER PROJECTILE SPRITE ---
export const PlayerProjectileSprite = () => (
    <svg viewBox="0 0 8 8" className="w-full h-full">
        <circle cx="4" cy="4" r="3.5" fill="#ffde34" />
        <circle cx="4" cy="4" r="2" fill="#ffffff" />
    </svg>
);

// --- BOSS CD-ROM PROJECTILE SPRITE ---
export const CDROMSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full animate-spin">
        <defs>
            <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="16%" stopColor="#ff7f00" />
                <stop offset="33%" stopColor="#ffff00" />
                <stop offset="50%" stopColor="#00ff00" />
                <stop offset="66%" stopColor="#0000ff" />
                <stop offset="83%" stopColor="#4b0082" />
                <stop offset="100%" stopColor="#ee82ee" />
            </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="7.5" fill="#c0c0c0" stroke="#808080" strokeWidth="0.5"/>
        <path d="M8 1.5 a 6.5 6.5 0 0 0 0 13" fill="none" stroke="url(#rainbow)" strokeWidth="1"/>
        <circle cx="8" cy="8" r="2.5" fill="#0c0c17" stroke="#ffffff" strokeWidth="0.5"/>
    </svg>
);