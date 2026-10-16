import React from 'react';
import { MusicTheme } from '../types';

interface BackgroundProps {
  cameraX: number;
  cameraY?: number;
  theme?: MusicTheme;
}

const themePalettes: Record<MusicTheme, { skyTop: string; skyMid: string; skyBot: string; sunTop: string; sunBot: string; mountain: string; neon: string }> = {
  adventure: {
    skyTop: '#050114',
    skyMid: '#160836',
    skyBot: '#311056',
    sunTop: '#ffea00',
    sunBot: '#ff0055',
    mountain: '#14072b',
    neon: '#00e5ff',
  },
  industrial: {
    skyTop: '#060a12',
    skyMid: '#121d2b',
    skyBot: '#263849',
    sunTop: '#ff9100',
    sunBot: '#d50000',
    mountain: '#0d1520',
    neon: '#ff9100',
  },
  ethereal: {
    skyTop: '#020916',
    skyMid: '#09203f',
    skyBot: '#1b4f72',
    sunTop: '#84ffff',
    sunBot: '#651fff',
    mountain: '#07162c',
    neon: '#84ffff',
  },
  boss: {
    skyTop: '#0f0008',
    skyMid: '#260314',
    skyBot: '#4a071c',
    sunTop: '#ff1744',
    sunBot: '#4a001f',
    mountain: '#1a020c',
    neon: '#ff1744',
  },
};

const Background: React.FC<BackgroundProps> = React.memo(({ cameraX, cameraY = 0, theme = 'adventure' }) => {
  const pal = themePalettes[theme] || themePalettes.adventure;

  // Modular arithmetic guarantees infinite scrolling even at cameraX > 100,000px!
  const starFarX = -((cameraX * 0.05) % 400);
  const starFarY = -((cameraY * 0.05) % 400);
  const mountainOffsetX = -((cameraX * 0.14) % 960);
  const cityOffsetX = -((cameraX * 0.28) % 640);
  const starNearX = -((cameraX * 0.4) % 240);
  const starNearY = -((cameraY * 0.4) % 240);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Layer 1: Deep Vector Gradient Sky */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${pal.skyTop} 0%, ${pal.skyMid} 58%, ${pal.skyBot} 100%)`,
        }}
      />

      {/* Layer 2: Retro-Futuristic Vector Synthwave Sun & Nebula */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bg-synth-sun" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={pal.sunTop} />
            <stop offset="100%" stopColor={pal.sunBot} />
          </linearGradient>
          <radialGradient id="bg-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={pal.sunBot} stopOpacity="0.45" />
            <stop offset="100%" stopColor={pal.sunBot} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="1420" cy="420" r="360" fill="url(#bg-sun-glow)" />
        <circle cx="1420" cy="420" r="190" fill="url(#bg-synth-sun)" opacity="0.88" />
        {/* Synthwave Horizontal Cutlines */}
        <rect x="1220" y="455" width="400" height="8" fill={pal.skyMid} />
        <rect x="1220" y="482" width="400" height="12" fill={pal.skyMid} />
        <rect x="1220" y="512" width="400" height="16" fill={pal.skyMid} />
        <rect x="1220" y="546" width="400" height="22" fill={pal.skyBot} />
        <rect x="1220" y="584" width="400" height="28" fill={pal.skyBot} />
      </svg>

      {/* Layer 3: Distant Starfield (Infinite Modulo Wrapping) */}
      <div
        className="absolute -inset-[400px]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 1.2px, transparent 1.8px)',
          backgroundSize: '80px 80px',
          opacity: 0.45,
          transform: `translate3d(${starFarX}px, ${starFarY}px, 0)`,
        }}
      />

      {/* Layer 4: Infinite Vector Mountain Range */}
      <svg
        className="absolute bottom-28 left-0 h-80 w-[2880px]"
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        style={{
          transform: `translate3d(${mountainOffsetX}px, 0, 0)`,
        }}
      >
        {[0, 960, 1920].map(offset => (
          <g key={offset} transform={`translate(${offset}, 0)`}>
            <polygon
              points="0,320 0,210 140,90 290,220 460,50 640,200 810,110 960,210 960,320"
              fill={pal.mountain}
              stroke={pal.neon}
              strokeWidth="2"
              strokeOpacity="0.45"
            />
            {/* Wireframe ridges */}
            <line x1="140" y1="90" x2="180" y2="320" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.25" />
            <line x1="460" y1="50" x2="430" y2="320" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.25" />
            <line x1="810" y1="110" x2="840" y2="320" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.25" />
          </g>
        ))}
      </svg>

      {/* Layer 5: Infinite Cyberpunk Vector Skyline */}
      <svg
        className="absolute bottom-0 left-0 h-60 w-[2560px]"
        viewBox="0 0 2560 240"
        preserveAspectRatio="none"
        style={{
          transform: `translate3d(${cityOffsetX}px, 0, 0)`,
        }}
      >
        {[0, 640, 1280, 1920].map(offset => (
          <g key={offset} transform={`translate(${offset}, 0)`}>
            <rect x="10" y="90" width="75" height="150" fill="#090416" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.3" />
            <rect x="95" y="45" width="90" height="195" fill="#0c051d" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.35" />
            <rect x="200" y="110" width="70" height="130" fill="#090416" />
            <rect x="280" y="25" width="110" height="215" fill="#0e0622" stroke={pal.neon} strokeWidth="1.2" strokeOpacity="0.4" />
            <rect x="405" y="75" width="85" height="165" fill="#090416" />
            <rect x="505" y="55" width="120" height="185" fill="#0c051d" stroke={pal.neon} strokeWidth="1" strokeOpacity="0.3" />
            {/* Glowing Cyber Windows */}
            <rect x="115" y="65" width="50" height="4" fill={pal.neon} opacity="0.5" />
            <rect x="115" y="80" width="50" height="4" fill={pal.neon} opacity="0.35" />
            <rect x="300" y="48" width="70" height="5" fill="#ff0055" opacity="0.55" />
            <rect x="300" y="64" width="70" height="5" fill={pal.neon} opacity="0.45" />
            <rect x="525" y="80" width="80" height="4" fill="#ffea00" opacity="0.45" />
          </g>
        ))}
      </svg>

      {/* Layer 6: Near Twinkling Stars */}
      <div
        className="absolute -inset-[240px]"
        style={{
          backgroundImage: `radial-gradient(circle, ${pal.neon} 1.3px, transparent 2px)`,
          backgroundSize: '120px 120px',
          opacity: 0.4,
          transform: `translate3d(${starNearX}px, ${starNearY}px, 0)`,
        }}
      />
    </div>
  );
});

export default Background;
