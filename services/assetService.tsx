
import React from 'react';

// --- PLAYER SPRITE (HIGH FIDELITY PIXEL ART) ---
// Based on the Intro Avatar: Brown hair, Headphones, Orange Tank Top.
export const PlayerSprite = ({ direction, isInvincible, showGlove = false, isMoving = false, isJumping = false }: { direction: 'left' | 'right', isInvincible: boolean, showGlove?: boolean, isMoving?: boolean, isJumping?: boolean }) => {
  
  // Pixel Art Color Palette
  const c = {
    skin: '#ffccaa',
    hair: '#5d4037',
    shirt: '#ff7043',
    shirtDark: '#d84315',
    pants: '#3f51b5', // Blue jeans/shorts
    shoes: '#222',
    headphones: '#d84315',
    headphoneBand: '#bf360c',
    glove: '#ffeb3b'
  };

  // CSS Animation for running
  const runAnimStyle = isMoving && !isJumping ? { animation: 'pixelRun 0.4s steps(4) infinite' } : {};
  const jumpPose = isJumping ? 'translateY(-2px)' : '';

  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes pixelRun {
          0% { transform: translateY(0); }
          25% { transform: translateY(-1px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-1px); }
        }
        .leg-l, .leg-r { transition: transform 0.1s; }
        /* Frame 1 of Run */
        .running .leg-l { transform: translate(2px, 0); }
        .running .leg-r { transform: translate(-2px, 0); }
      `}</style>

      <svg 
        viewBox="0 0 24 32" 
        className={`w-full h-full transform ${direction === 'left' ? 'scale-x-[-1]' : ''}`}
        style={{ imageRendering: 'pixelated' }} // Crucial for crisp edges
      >
        <g style={runAnimStyle}>
            {/* --- HEADPHONES (Back of band) --- */}
            <rect x="8" y="3" width="8" height="2" fill={c.headphoneBand} />
            <rect x="6" y="4" width="2" height="2" fill={c.headphoneBand} />
            <rect x="16" y="4" width="2" height="2" fill={c.headphoneBand} />

            {/* --- HAIR (Back) --- */}
            <rect x="7" y="5" width="10" height="8" fill={c.hair} />
            <rect x="6" y="8" width="12" height="5" fill={c.hair} />
            <rect x="5" y="12" width="2" height="3" fill={c.hair} /> {/* Side burns */}
            <rect x="17" y="12" width="2" height="3" fill={c.hair} />

            {/* --- HEAD --- */}
            <rect x="8" y="6" width="8" height="7" fill={c.skin} />
            <rect x="9" y="13" width="6" height="2" fill={c.skin} /> {/* Chin */}

            {/* --- FACE --- */}
            <rect x="13" y="9" width="2" height="2" fill="#3e2723" /> {/* Eye R */}
            <rect x="15" y="9" width="1" height="1" fill="#fff" opacity="0.5" /> {/* Sparkle */}
            
            {/* Profile view adjustments if direction matters, but assuming side/3/4 view */}
            <rect x="13" y="12" width="2" height="1" fill="#d84315" opacity="0.6" /> {/* Mouth */}
            <rect x="9" y="10" width="2" height="1" fill="#f48fb1" opacity="0.5" /> {/* Blush */}

            {/* --- HAIR (Front/Bangs) --- */}
            <rect x="8" y="5" width="8" height="2" fill={c.hair} />
            <rect x="8" y="7" width="2" height="2" fill={c.hair} />
            
            {/* --- HEADPHONES (Ear cups) --- */}
            <rect x="6" y="7" width="3" height="6" fill={c.headphones} />
            <rect x="5" y="8" width="1" height="4" fill={c.headphoneBand} />

            {/* --- BODY (Torso) --- */}
            <rect x="9" y="15" width="6" height="2" fill={c.skin} /> {/* Neck/Shoulders */}
            <rect x="8" y="16" width="8" height="9" fill={c.shirt} />
            <rect x="9" y="16" width="6" height="2" fill={c.shirtDark} opacity="0.3"/> {/* Collar shadow */}
            
            {/* Arms */}
            <rect x="10" y="18" width="6" height="3" fill={showGlove ? c.glove : c.skin} /> {/* Holding object arms */}
            
            {/* Object/Controller/Hand */}
            <rect x="15" y="18" width="3" height="3" fill={showGlove ? c.glove : c.skin} />

            {/* --- LEGS (Animated via CSS classes based on React state) --- */}
            <g className={isMoving ? (Math.floor(Date.now() / 100) % 2 === 0 ? 'running-a' : 'running-b') : ''}>
                {/* Left Leg (Back) */}
                <g transform={isJumping ? "translate(0, -2)" : (isMoving ? "translate(2, 0)" : "")}>
                     <rect x="9" y="25" width="3" height="6" fill={c.pants} opacity="0.8"/>
                     <rect x="9" y="30" width="3" height="2" fill={c.shoes} />
                </g>

                {/* Right Leg (Front) */}
                <g transform={isJumping ? "translate(0, -4)" : (isMoving ? "translate(-2, 0)" : "")}>
                    <rect x="12" y="25" width="3" height="6" fill={c.pants} />
                    <rect x="12" y="30" width="3" height="2" fill={c.shoes} />
                </g>
            </g>
            
             {/* Scarf / Accessory (Optional dynamic element) */}
             <rect x="7" y="16" width="2" height="4" fill="#e91e63" className={isMoving ? "animate-pulse" : ""} />
        </g>
      </svg>
    </div>
  );
};

// --- ENEMY SPRITE ---
export const EnemySprite = ({ type, state }: { type: string, state: string }) => {
  const captured = state === 'captured';
  const purple = '#9472ff';

  switch (type) {
    case 'phaser': // Ghosty
        return (
            <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`} style={{ imageRendering: 'pixelated' }}>
               <path d="M3 14 a 5 5 0 0 1 10 0 v-8 a 5 5 0 0 0 -10 0 z" fill={captured ? purple : "#e0e0e0"} opacity="0.8"/>
               <rect x="5" y="6" width="2" height="2" fill="black"/>
               <rect x="9" y="6" width="2" height="2" fill="black"/>
               <rect x="5" y="6" width="1" height="1" fill="red"/> {/* Evil Eye */}
               <rect x="9" y="6" width="1" height="1" fill="red"/>
               <path d="M4 14 l2 -2 l2 2 l2 -2 l2 2" fill="none" stroke={captured ? purple : "#e0e0e0"} strokeWidth="1" opacity="0.8"/>
            </svg>
        );
    case 'bomber': // Bomby
        return (
            <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`} style={{ imageRendering: 'pixelated' }}>
                <path d="M2 15 a 6 6 0 0 1 12 0 z" fill={captured ? purple : "#444"} /> {/* Base */}
                <rect x="4" y="12" width="8" height="1" fill="#222" /> {/* Treads */}
                <path d="M3 14 a 5 5 0 0 1 10 0 z" fill={captured ? purple : "#666"} /> {/* Dome */}
                <rect x="7" y="8" width="2" height="4" fill="#222" /> {/* Cannon */}
                <rect x="6" y="8" width="4" height="1" fill="#D32F2F"/>
                <rect x="7" y="0" width="2" height="2" fill="#FFA500" className="animate-pulse"/> {/* Fuse */}
            </svg>
        );
    case 'flyer': // Flappy (Bat-Bot)
      return (
        <svg viewBox="0 0 16 12" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`} style={{ imageRendering: 'pixelated' }}>
           <path d="M6 2 h4 v6 h-4 z" fill={captured ? purple : "#607d8b"} /> {/* Body */}
           <rect x="6" y="3" width="1" height="1" fill="#00ff00" className="animate-blink"/> {/* Eye L */}
           <rect x="9" y="3" width="1" height="1" fill="#00ff00" className="animate-blink"/> {/* Eye R */}
           {/* Left Wing */}
           <path d="M0 2 h6 v1 h-1 v1 h-1 v1 h-1 v-1 h-2 z" fill={captured ? purple : "#455a64"} />
           {/* Right Wing */}
           <path d="M10 2 h6 v1 h-2 v1 h-1 v1 h-1 v-1 h-2 z" fill={captured ? purple : "#455a64"} />
           <rect x="7" y="8" width="2" height="2" fill="#ff5722" /> {/* Thruster */}
        </svg>
      );
    case 'jumper': // Hoppy (Springy)
      return (
        <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : 'animate-bounce'}`} style={{ imageRendering: 'pixelated' }}>
          {/* Spring */}
          <path d="M6 12 h4 v1 h-4 z M6 14 h4 v1 h-4 z" fill="#aaa" />
          <path d="M3 3 h10 v9 h-10 z" fill={captured ? purple : "#d32f2f"}/>
          <rect x="4" y="4" width="8" height="2" fill="#e57373"/> {/* Highlight */}
          <rect x="5" y="6" width="2" height="3" fill="white"/>
          <rect x="9" y="6" width="2" height="3" fill="white"/>
          <rect x="6" y="7" width="1" height="1" fill="black"/>
          <rect x="10" y="7" width="1" height="1" fill="black"/>
          <path d="M4 10 h8 v2 h-8 z" fill="#b71c1c"/> {/* Mouth */}
        </svg>
      );
    case 'base': // Globby (Slime)
    default:
      return (
        <svg viewBox="0 0 16 16" className={`w-full h-full ${captured ? 'animate-bounce' : ''}`} style={{ imageRendering: 'pixelated' }}>
          <path d="M3 6 a 5 5 0 0 1 10 0 v9 H3 z" fill={captured ? purple : "#4caf50"} />
          <rect x="4" y="13" width="8" height="2" fill={captured ? purple : "#2e7d32"} /> {/* Base darkened */}
          
          {/* Bubbles */}
          <rect x="4" y="5" width="1" height="1" fill="#a5d6a7" />
          <rect x="11" y="8" width="1" height="1" fill="#a5d6a7" />

          <rect x="5" y="8" width="2" height="2" fill="white" />
          <rect x="9" y="8" width="2" height="2" fill="white" />
          <rect x="6" y="9" width="1" height="1" fill="black" />
          <rect x="10" y="9" width="1" height="1" fill="black" />
        </svg>
      );
  }
};

// --- ITEM SPRITES (COLLECTIBLES + POWER-UPS) ---
export const ItemSprite = ({ type }: { type: string }) => {
  switch (type) {
    case 'speed-boost':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
                <path d="M8 0 l-3 6 h2 l-3 5 h4 l-1 5 l6 -8 h-3 l4 -5 h-4 z" fill="#ffee00" stroke="#ff9800" strokeWidth="0.5"/>
            </svg>
        );
    case 'shield':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
                <path d="M3 2 l5 -2 l5 2 v5 l-5 8 l-5 -8 z" fill="#00ccff"/>
                <path d="M8 1 l4 2 v5 l-4 4 l-4 -4 v-5 z" fill="#e0f7fa" />
                <rect x="7" y="5" width="2" height="4" fill="#006064" />
                <rect x="5" y="6" width="6" height="2" fill="#006064" />
            </svg>
        );
    case 'super-throw':
        return (
            <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
                <circle cx="8" cy="8" r="7" fill="#ff5722" />
                <path d="M8 2 l1 4 h4 l-3 3 l1 4 l-3 -2 l-3 2 l1 -4 l-3 -3 h4 z" fill="#ffeb3b"/>
            </svg>
        );
    case 'joystick':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
            {/* Base */}
            <path d="M2 12 h12 v3 h-12 z" fill="#424242" />
            <rect x="3" y="11" width="10" height="1" fill="#616161" />
            {/* Buttons */}
            <rect x="10" y="13" width="2" height="1" fill="#f44336"/>
            {/* Stick */}
            <rect x="5" y="7" width="2" height="5" fill="#212121"/>
            {/* Ball */}
            <circle cx="6" cy="6" r="3" fill="#f44336"/>
            <circle cx="5" cy="5" r="1" fill="#ffcdd2"/>
        </svg>
      );
    case 'floppy':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
            <path d="M2 1 h12 v14 h-12 z" fill="#1e88e5"/>
            <rect x="4" y="2" width="8" height="5" fill="white"/> {/* Label */}
            <rect x="5" y="3" width="6" height="1" fill="#1e88e5"/>
            <rect x="5" y="9" width="6" height="6" fill="#bdbdbd"/> {/* Shutter */}
            <rect x="6" y="10" width="2" height="3" fill="#212121"/>
        </svg>
      );
    case 'cartridge':
      return (
        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" style={{ imageRendering: 'pixelated' }}>
            <path d="M2 1 h12 v14 h-12 z" fill="#757575"/>
            <rect x="3" y="3" width="10" height="8" fill="#ffeb3b"/> {/* Sticker */}
            <rect x="3" y="12" width="2" height="3" fill="#424242"/> {/* Pins */}
            <rect x="6" y="12" width="2" height="3" fill="#424242"/>
            <rect x="9" y="12" width="2" height="3" fill="#424242"/>
            <rect x="12" y="12" width="1" height="3" fill="#424242"/>
            <path d="M4 5 h8 v4 h-8 z" fill="#d32f2f"/> {/* Art */}
        </svg>
      );
    default:
      return null;
  }
};

// --- GOAL SPRITE ---
export const GoalSprite = () => (
    <svg viewBox="0 0 24 40" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        {/* Portal Frame */}
        <path d="M0 0 h24 v40 h-24 z" fill="#212121" />
        <path d="M2 2 h20 v36 h-20 z" fill="#424242" />
        {/* Energy Field */}
        <rect x="4" y="4" width="16" height="32" fill="#00e5ff" opacity="0.5">
           <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
        </rect>
        {/* Swirl */}
        <circle cx="12" cy="20" r="6" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 2">
            <animateTransform attributeName="transform" type="rotate" from="0 12 20" to="360 12 20" dur="3s" repeatCount="indefinite" />
        </circle>
    </svg>
);


// --- HEART SPRITE ---
export const HeartSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <path d="M8 4 C 5 2, 2 5, 8 14 C 14 5, 11 2, 8 4" fill="#ff1744" stroke="#fff" strokeWidth="0.5"/>
    </svg>
);

// --- SHIELD SPRITE (for Player) ---
export const ShieldSprite = () => (
    <svg viewBox="0 0 20 20" className="w-full h-full opacity-60" style={{ imageRendering: 'pixelated' }}>
        <circle cx="10" cy="10" r="9" stroke="#00d5ff" strokeWidth="2" fill="rgba(0, 213, 255, 0.3)" />
        <circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
);

// --- PLAYER PROJECTILE SPRITE ---
export const PlayerProjectileSprite = () => (
    <svg viewBox="0 0 8 8" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <circle cx="4" cy="4" r="3.5" fill="#ffde34" />
        <circle cx="4" cy="4" r="2" fill="#ffffff" />
    </svg>
);

// --- BOMB PROJECTILE SPRITE ---
export const BombSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <circle cx="8" cy="8" r="6" fill="#212121" />
        <rect x="7" y="1" width="2" height="3" fill="#8d6e63" />
        <rect x="6" y="0" width="4" height="2" fill="#ffca28" className="animate-pulse" />
        <path d="M9 5 L11 7" stroke="#fff" strokeWidth="1" /> {/* Shine */}
    </svg>
);

// --- EGG PROJECTILE SPRITE ---
export const EggSprite = () => (
    <svg viewBox="0 0 16 20" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        {/* Egg Shape */}
        <path d="M8 1 C 3 1, 1 8, 1 14 C 1 18, 4 19, 8 19 C 12 19, 15 18, 15 14 C 15 8, 13 1, 8 1 Z" fill="#fffde7" stroke="#fbc02d" strokeWidth="1"/>
        {/* Spots */}
        <circle cx="6" cy="8" r="1" fill="#fbc02d" opacity="0.5"/>
        <circle cx="10" cy="12" r="1.5" fill="#fbc02d" opacity="0.5"/>
        <circle cx="5" cy="15" r="1" fill="#fbc02d" opacity="0.5"/>
    </svg>
);

// --- FIREBALL SPRITE ---
export const FireballSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <circle cx="8" cy="8" r="6" fill="#d32f2f" />
        <circle cx="8" cy="8" r="4" fill="#ff5722" />
        <circle cx="8" cy="8" r="2" fill="#ffeb3b" className="animate-pulse" />
        {/* Tail */}
        <path d="M4 12 Q 8 16, 12 12" stroke="#d32f2f" strokeWidth="1" fill="none"/>
    </svg>
);


// --- BOSS CD-ROM PROJECTILE SPRITE ---
export const CDROMSprite = () => (
    <svg viewBox="0 0 16 16" className="w-full h-full animate-spin" style={{ imageRendering: 'pixelated' }}>
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
        <circle cx="8" cy="8" r="7.5" fill="#e0e0e0" stroke="#9e9e9e" strokeWidth="0.5"/>
        <path d="M8 2 a 6 6 0 0 1 0 12 a 6 6 0 0 1 0 -12" fill="none" stroke="url(#rainbow)" strokeWidth="2" opacity="0.8"/>
        <circle cx="8" cy="8" r="2" fill="#000" stroke="#fff" strokeWidth="0.5"/>
    </svg>
);
