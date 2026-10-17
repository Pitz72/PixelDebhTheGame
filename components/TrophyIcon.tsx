import React from 'react';
import type { TrophyTier } from '../trophies';

/** Metal of each kind of trophy: bronze, silver, gold and platinum. */
export const TIER_COLORS: Record<TrophyTier, { main: string; light: string; dark: string; text: string }> = {
  normal: { main: '#cd7f32', light: '#f3b77a', dark: '#8a4f1c', text: '#f0b27a' },
  rare: { main: '#b9c3d1', light: '#f2f6fb', dark: '#7b8798', text: '#d5dde8' },
  hard: { main: '#ffc61a', light: '#fff1a0', dark: '#b8860b', text: '#ffd84d' },
  complete: { main: '#4dd9f0', light: '#e3fbff', dark: '#1f8da3', text: '#7df9ff' },
};

interface TrophyIconProps {
  tier: TrophyTier;
  /** A locked trophy is drawn in grey. */
  locked?: boolean;
  size?: number;
}

/** A small vector cup, in the metal of its tier. */
const TrophyIcon: React.FC<TrophyIconProps> = ({ tier, locked = false, size = 56 }) => {
  const c = locked
    ? { main: '#4a4560', light: '#6a6485', dark: '#2c2840', text: '#6a6485' }
    : TIER_COLORS[tier];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
      {/* handles */}
      <path d="M14 14 H6 c0 12 4 18 13 20" fill="none" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
      <path d="M50 14 H58 c0 12 -4 18 -13 20" fill="none" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
      {/* bowl */}
      <path d="M14 8 H50 V22 C50 33 42 40 32 40 C22 40 14 33 14 22 Z" fill={c.main} />
      <path d="M18 10 H28 V24 C28 31 25 35 21 36 C17 33 16 28 16 22 Z" fill={c.light} opacity="0.55" />
      {/* stem and base */}
      <rect x="28" y="40" width="8" height="9" fill={c.dark} />
      <rect x="20" y="49" width="24" height="6" rx="1.5" fill={c.main} />
      <rect x="16" y="55" width="32" height="5" rx="1.5" fill={c.dark} />
      {/* star */}
      {!locked && (
        <path
          d="M32 14 l2.6 5.3 5.8 .8 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -.8 Z"
          fill={c.light}
          stroke={c.dark}
          strokeWidth="0.8"
        />
      )}
      {locked && <rect x="27" y="17" width="10" height="9" rx="1.5" fill={c.light} />}
    </svg>
  );
};

export default TrophyIcon;
