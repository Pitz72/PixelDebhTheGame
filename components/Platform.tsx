import React from 'react';
import { Platform as PlatformType, MusicTheme } from '../types';

const themeColors: Record<MusicTheme, { rail: string; glow: string; bodyTop: string; bodyBot: string; border: string }> = {
  adventure: {
    rail: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.45)',
    bodyTop: '#1e1b4b',
    bodyBot: '#0f0a2c',
    border: '#7c4dff',
  },
  industrial: {
    rail: '#ff9100',
    glow: 'rgba(255, 145, 0, 0.45)',
    bodyTop: '#263238',
    bodyBot: '#11171a',
    border: '#546e7a',
  },
  ethereal: {
    rail: '#84ffff',
    glow: 'rgba(132, 255, 255, 0.5)',
    bodyTop: '#0d3b66',
    bodyBot: '#061a33',
    border: '#00b0ff',
  },
  boss: {
    rail: '#ff1744',
    glow: 'rgba(255, 23, 68, 0.5)',
    bodyTop: '#3b0a1e',
    bodyBot: '#1a030c',
    border: '#d50000',
  },
};

const Platform: React.FC<{ platform: PlatformType; theme?: MusicTheme }> = React.memo(({ platform, theme = 'adventure' }) => {
  const c = themeColors[theme] || themeColors.adventure;

  return (
    <div
      style={{
        position: 'absolute',
        left: platform.x,
        top: platform.y,
        width: platform.width,
        height: platform.height,
        background: `linear-gradient(180deg, ${c.bodyTop} 0%, ${c.bodyBot} 100%)`,
        borderTop: `4px solid ${c.rail}`,
        borderBottom: `3px solid ${c.border}`,
        borderLeft: `2px solid ${c.border}`,
        borderRight: `2px solid ${c.border}`,
        borderRadius: '4px',
        boxShadow: `0 -2px 12px ${c.glow}, inset 0 2px 6px rgba(255,255,255,0.18)`,
        overflow: 'hidden',
      }}
    >
      {/* Internal Vector Tech Truss Pattern */}
      <div
        className="w-full h-full opacity-35"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 14px, ${c.border} 14px, ${c.border} 16px)`,
        }}
      />
    </div>
  );
});

export default Platform;