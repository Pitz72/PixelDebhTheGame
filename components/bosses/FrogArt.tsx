import React from 'react';

/**
 * The Cyclops Frog, drawn in parts so the arms and legs can move: a glossy green sphere that is also
 * the single eye, with a slit pupil and a pale frog swimming inside it, the edge fading to red, two
 * spindly arms and two small legs. Everything is drawn in a 240 x 240 box, which the game scales to
 * the 320 x 320 hitbox.
 *
 * The idea comes from the old Frogwares logo (a frog on an eye), as a wink: the drawing here is
 * ours, with no lettering.
 */
export type FrogVariant = 'a' | 'b';

export interface FrogPose {
  /** Degrees, positive swings the limb up / forward. */
  armL: number;
  armR: number;
  legL: number;
  legR: number;
}

export const FROG_BOX = 240;
export const FROG_REST: FrogPose = { armL: 0, armR: 0, legL: 0, legR: 0 };

const OUT = '#2A1810';

interface Palette {
  limb: string;
  limbLight: string;
  joint: string;
  web: string;
  rim: [string, string, string];
}

const PALETTE: Record<FrogVariant, Palette> = {
  // A: green limbs with red joints, the edge of the eye fading to red
  a: { limb: '#2e7d32', limbLight: '#a5f09a', joint: '#e53935', web: '#66bb6a', rim: ['#1a6b2e', '#b3261e', '#ff3d2e'] },
  // B: a hotter, redder frog: red-brown limbs with golden joints and a stronger red edge
  b: { limb: '#8e2a1e', limbLight: '#ff9a7a', joint: '#ffd54f', web: '#d84315', rim: ['#2a5a1a', '#d32f2f', '#ff6e40'] },
};

export const FrogDefs: React.FC<{ variant: FrogVariant }> = ({ variant: v }) => {
  const p = PALETTE[v];
  return (
    <defs>
      <radialGradient id={`fg-sphere-${v}`} cx="40%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#ccff90" />
        <stop offset="32%" stopColor="#00e676" />
        <stop offset="62%" stopColor="#00a152" />
        <stop offset="80%" stopColor={p.rim[0]} />
        <stop offset="92%" stopColor={p.rim[1]} />
        <stop offset="100%" stopColor={p.rim[2]} />
      </radialGradient>
      <linearGradient id={`fg-pupil-${v}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0b2417" />
        <stop offset="50%" stopColor="#000000" />
        <stop offset="100%" stopColor="#0b2417" />
      </linearGradient>
      <linearGradient id={`fg-gloss-${v}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`fg-redrim-${v}`} cx="50%" cy="50%" r="50%">
        <stop offset="70%" stopColor="#ff2a1e" stopOpacity="0" />
        <stop offset="92%" stopColor="#ff2a1e" stopOpacity={v === 'a' ? 0.4 : 0.6} />
        <stop offset="100%" stopColor="#ff3d2e" stopOpacity={v === 'a' ? 0.7 : 0.85} />
      </radialGradient>
      <clipPath id={`fg-clip-${v}`}>
        <circle cx="120" cy="104" r="77" />
      </clipPath>
    </defs>
  );
};

/** A limb segment: dark outline, body colour and a thin highlight. */
const Seg: React.FC<{ d: string; w: number; color: string; light: string }> = ({ d, w, color, light }) => (
  <>
    <path d={d} fill="none" stroke={OUT} strokeWidth={w + 4.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={light} strokeWidth={w * 0.28} strokeLinecap="round" strokeLinejoin="round" opacity="0.7" transform="translate(-0.8 -1.2)" />
  </>
);

export const FrogBodyGroup: React.FC<{ variant: FrogVariant }> = ({ variant: v }) => (
  <g>
    <circle cx="120" cy="104" r="80" fill={`url(#fg-sphere-${v})`} stroke={OUT} strokeWidth="4.5" />
    <circle cx="120" cy="104" r="80" fill={`url(#fg-redrim-${v})`} />
    <circle cx="120" cy="104" r="74.5" fill="none" stroke="rgba(255,140,100,0.38)" strokeWidth="3" />

    {/* a pale, see-through frog swimming inside the eye */}
    <g clipPath={`url(#fg-clip-${v})`}>
      <g transform="translate(120 104)" opacity="0.3" fill="#ffffff" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="0" cy="-54" rx="15" ry="11" stroke="none" />
        <circle cx="-10" cy="-62" r="6" stroke="none" />
        <circle cx="10" cy="-62" r="6" stroke="none" />
        <ellipse cx="0" cy="-14" rx="17" ry="29" stroke="none" />
        <g fill="none" strokeWidth="7">
          <path d="M -12 -32 L -34 -22 L -50 -38" />
          <path d="M 12 -32 L 34 -22 L 50 -38" />
          <path d="M -12 8 L -40 18 L -52 46" strokeWidth="8.5" />
          <path d="M 12 8 L 40 18 L 52 46" strokeWidth="8.5" />
        </g>
        <g fill="none" strokeWidth="3.4">
          <path d="M -50 -38 L -62 -48 M -50 -38 L -65 -38 M -50 -38 L -61 -27" />
          <path d="M 50 -38 L 62 -48 M 50 -38 L 65 -38 M 50 -38 L 61 -27" />
          <path d="M -52 46 L -66 56 M -52 46 L -56 62 M -52 46 L -42 62" />
          <path d="M 52 46 L 66 56 M 52 46 L 56 62 M 52 46 L 42 62" />
        </g>
      </g>
    </g>

    {/* the slit pupil */}
    <path d="M 120 36 C 142 62, 142 146, 120 172 C 98 146, 98 62, 120 36 Z" fill={`url(#fg-pupil-${v})`} stroke="#050505" strokeWidth="2" />
    <path d="M 120 44 C 136 66, 136 142, 120 164 C 104 142, 104 66, 120 44 Z" fill="none" stroke="rgba(0,230,118,0.22)" strokeWidth="1.6" />
    <ellipse cx="112" cy="72" rx="5.5" ry="19" transform="rotate(10 112 72)" fill="#ffffff" opacity="0.92" />
    <ellipse cx="129" cy="148" rx="3" ry="8" fill="#ffffff" opacity="0.4" />

    {/* gloss */}
    <ellipse cx="82" cy="58" rx="40" ry="21" transform="rotate(-38 82 58)" fill={`url(#fg-gloss-${v})`} />
  </g>
);

/** A spindly arm. The shoulder is the origin, the arm points left; the right arm is the mirror image. */
export const FrogArmShape: React.FC<{ variant: FrogVariant }> = ({ variant: v }) => {
  const p = PALETTE[v];
  return (
    <g>
      <Seg d="M 0 0 L -22 11" w={6} color={p.limb} light={p.limbLight} />
      <Seg d="M -22 11 L -44 3" w={5} color={p.limb} light={p.limbLight} />
      <Seg d="M -44 3 L -55 -6 M -44 3 L -57 4 M -44 3 L -54 13" w={2.6} color={p.limb} light={p.limbLight} />
      <circle cx="-22" cy="11" r="4.4" fill={p.joint} stroke={OUT} strokeWidth="1.6" />
      <circle cx="0" cy="0" r="6.2" fill={p.limb} stroke={OUT} strokeWidth="2" />
    </g>
  );
};

/** A small leg with a webbed foot. The hip is the origin, the leg points down; the right leg is mirrored. */
export const FrogLegShape: React.FC<{ variant: FrogVariant }> = ({ variant: v }) => {
  const p = PALETTE[v];
  return (
    <g>
      <Seg d="M 0 0 L -14 22" w={7.4} color={p.limb} light={p.limbLight} />
      <Seg d="M -14 22 L -4 46" w={6} color={p.limb} light={p.limbLight} />
      <path d="M -4 46 L -26 58 L -8 66 L 14 58 Z" fill={p.web} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M -4 46 L -26 58 M -4 46 L -8 66 M -4 46 L 14 58" fill="none" stroke={OUT} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="-26" cy="58" r="2.6" fill={p.limbLight} stroke={OUT} strokeWidth="1" />
      <circle cx="-8" cy="66" r="2.6" fill={p.limbLight} stroke={OUT} strokeWidth="1" />
      <circle cx="14" cy="58" r="2.6" fill={p.limbLight} stroke={OUT} strokeWidth="1" />
      <circle cx="-14" cy="22" r="4.6" fill={p.joint} stroke={OUT} strokeWidth="1.6" />
      <circle cx="0" cy="0" r="6.4" fill={p.limb} stroke={OUT} strokeWidth="2" />
    </g>
  );
};

// where the limbs join the sphere
export const FROG_JOINTS = {
  shoulderL: { x: 56, y: 118 },
  shoulderR: { x: 184, y: 118 },
  hipL: { x: 88, y: 176 },
  hipR: { x: 152, y: 176 },
};

/** The whole frog in one SVG: legs and arms behind the sphere, so their roots tuck behind it. */
export const FrogBossArt: React.FC<{ variant?: FrogVariant; pose?: FrogPose; hit?: boolean }> = ({
  variant = 'a',
  pose = FROG_REST,
  hit = false,
}) => (
  <svg viewBox={`0 0 ${FROG_BOX} ${FROG_BOX}`} width="100%" height="100%" overflow="visible" style={hit ? { filter: 'brightness(2.2) saturate(0.7)' } : undefined}>
    <FrogDefs variant={variant} />
    <g transform={`translate(${FROG_JOINTS.hipL.x} ${FROG_JOINTS.hipL.y}) rotate(${pose.legL})`}>
      <FrogLegShape variant={variant} />
    </g>
    <g transform={`translate(${FROG_JOINTS.hipR.x} ${FROG_JOINTS.hipR.y}) scale(-1 1) rotate(${pose.legR})`}>
      <FrogLegShape variant={variant} />
    </g>
    <g transform={`translate(${FROG_JOINTS.shoulderL.x} ${FROG_JOINTS.shoulderL.y}) rotate(${pose.armL})`}>
      <FrogArmShape variant={variant} />
    </g>
    <g transform={`translate(${FROG_JOINTS.shoulderR.x} ${FROG_JOINTS.shoulderR.y}) scale(-1 1) rotate(${pose.armR})`}>
      <FrogArmShape variant={variant} />
    </g>
    <FrogBodyGroup variant={variant} />
  </svg>
);
