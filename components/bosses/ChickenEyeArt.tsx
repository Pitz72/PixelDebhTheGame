import React from 'react';

/**
 * LeGallineNellOcchi: a big eye with a hen strolling about inside the pupil. The hen is a separate
 * piece so she can walk. Drawn in a 240 x 240 box, scaled by the game to the 300 x 300 hitbox.
 * The magnifying glass is a nod to Sherlock Holmes.
 */
export const EYE_BOX = 240;
const OUT = '#2A1810';

export const PUPIL_R = 47;

export const EyeDefs: React.FC = () => (
  <defs>
    <radialGradient id="ce-sclera" cx="42%" cy="36%" r="70%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="70%" stopColor="#f3f3f3" />
      <stop offset="100%" stopColor="#c4d0d6" />
    </radialGradient>
    <radialGradient id="ce-iris" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffe0a3" />
      <stop offset="45%" stopColor="#ffa000" />
      <stop offset="80%" stopColor="#e65100" />
      <stop offset="100%" stopColor="#7a2400" />
    </radialGradient>
    <radialGradient id="ce-pupil" cx="50%" cy="44%" r="58%">
      <stop offset="0%" stopColor="#241446" />
      <stop offset="100%" stopColor="#05020c" />
    </radialGradient>
    <clipPath id="ce-eye-clip">
      <ellipse cx="120" cy="120" rx="104" ry="90" />
    </clipPath>
    <clipPath id="ce-pupil-clip">
      <circle cx="120" cy="120" r="46" />
    </clipPath>
  </defs>
);

/** The hen, facing right, centred on the origin. `step` swings the legs, from -1 to 1. */
export const HenShape: React.FC<{ step?: number }> = ({ step = 0 }) => {
  const footA = -3 + step * 7;
  const footB = 7 - step * 7;
  return (
    <g>
      {/* legs and feet */}
      <path d={`M -3 12 L ${footA} 25`} stroke={OUT} strokeWidth="4.4" strokeLinecap="round" />
      <path d={`M 7 12 L ${footB} 25`} stroke={OUT} strokeWidth="4.4" strokeLinecap="round" />
      <path d={`M -3 12 L ${footA} 25`} stroke="#ffb300" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M 7 12 L ${footB} 25`} stroke="#ffb300" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M ${footA - 5} 26 L ${footA} 25 L ${footA + 6} 26 M ${footA} 25 L ${footA + 1} 28`} stroke="#ffb300" strokeWidth="1.9" strokeLinecap="round" fill="none" />
      <path d={`M ${footB - 5} 26 L ${footB} 25 L ${footB + 6} 26 M ${footB} 25 L ${footB + 1} 28`} stroke="#ffb300" strokeWidth="1.9" strokeLinecap="round" fill="none" />
      {/* tail */}
      <path d="M -16 -3 C -30 -16, -24 -29, -13 -23 C -22 -21, -21 -9, -12 -6 Z" fill="#e6e6e6" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M -17 2 C -34 -3, -34 -14, -22 -13 C -26 -9, -24 -1, -15 3 Z" fill="#f4f4f4" stroke={OUT} strokeWidth="1.4" strokeLinejoin="round" />
      {/* body and wing */}
      <ellipse cx="0" cy="0" rx="19" ry="14" fill="#fafafa" stroke={OUT} strokeWidth="1.9" />
      <path d="M -9 -1 C -1 -12, 12 -8, 12 2 C 6 9, -5 9, -9 -1 Z" fill="#ececec" stroke="#9e9e9e" strokeWidth="1.1" />
      <path d="M -4 2 C 1 -3, 6 -2, 9 1" fill="none" stroke="#bdbdbd" strokeWidth="1" strokeLinecap="round" />
      {/* head */}
      <circle cx="14" cy="-12" r="8.6" fill="#fafafa" stroke={OUT} strokeWidth="1.8" />
      <g fill="#e53935" stroke={OUT} strokeWidth="1">
        <circle cx="10" cy="-21" r="3.1" />
        <circle cx="14.5" cy="-23" r="3.6" />
        <circle cx="19" cy="-20.5" r="3" />
      </g>
      <ellipse cx="19.5" cy="-3.5" rx="2.3" ry="4.2" fill="#e53935" stroke={OUT} strokeWidth="1" />
      <path d="M 21.5 -13.5 L 30 -10.5 L 21.5 -8 Z" fill="#ffb300" stroke={OUT} strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="16.5" cy="-14" r="1.9" fill="#101010" />
      <circle cx="17.1" cy="-14.7" r="0.6" fill="#ffffff" />
    </g>
  );
};

export interface EyePose {
  /** Hen position inside the pupil, -1 (left) to 1 (right). */
  henX: number;
  /** Leg swing, -1 to 1. */
  step: number;
  /** 1 when she faces left. */
  flip: boolean;
  blink: boolean;
}

export const EYE_REST: EyePose = { henX: 0, step: 0, flip: false, blink: false };

/** Where the hen walks (art units): her middle on the pupil's floor, how far she strolls, how big she is. */
export const HEN_FLOOR = { x: 120, y: 131 };
export const HEN_RANGE = 11;
export const HEN_SCALE = 1.32;
/** Her bounding box around her own origin, and the leg positions the game bakes (`step` from -1 to 1). */
export const HEN_BOX = [-38, -30, 72, 62] as const;
export const HEN_STEPS = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1];
/** The pupil, as the hen's window: she is only seen inside it. */
export const PUPIL_WINDOW = { x: 120, y: 120, r: 46 };

export const ChickenEyeBossArt: React.FC<{ pose?: EyePose; hit?: boolean; hideHen?: boolean }> = ({
  pose = EYE_REST,
  hit = false,
  hideHen = false,
}) => {
  const hx = HEN_FLOOR.x + pose.henX * HEN_RANGE;
  const bob = Math.abs(pose.step) * -1.6;
  return (
    <svg viewBox={`0 0 ${EYE_BOX} ${EYE_BOX}`} width="100%" height="100%" overflow="visible" style={hit ? { filter: 'brightness(2.2) saturate(0.7)' } : undefined}>
      <EyeDefs />
      {/* the eyeball */}
      <ellipse cx="120" cy="120" rx="106" ry="92" fill="url(#ce-sclera)" stroke={OUT} strokeWidth="5" />
      <g clipPath="url(#ce-eye-clip)" fill="none" stroke="#e57373" strokeLinecap="round" opacity="0.62">
        <path d="M 14 112 C 36 106, 50 120, 72 112 M 40 110 C 46 98, 58 96, 66 90" strokeWidth="1.9" />
        <path d="M 12 134 C 34 132, 44 146, 66 140 M 30 138 C 34 150, 44 156, 52 162" strokeWidth="1.7" />
        <path d="M 28 92 C 44 96, 54 86, 70 92" strokeWidth="1.5" />
        <path d="M 226 112 C 204 106, 190 120, 168 112 M 200 110 C 194 98, 182 96, 174 90" strokeWidth="1.9" />
        <path d="M 228 134 C 206 132, 196 146, 174 140 M 210 138 C 206 150, 196 156, 188 162" strokeWidth="1.7" />
        <path d="M 212 92 C 196 96, 186 86, 170 92" strokeWidth="1.5" />
      </g>

      {/* the iris, with fibres */}
      <circle cx="120" cy="120" r="68" fill="url(#ce-iris)" stroke="#5d1f00" strokeWidth="3" />
      <g stroke="#7a2400" strokeWidth="1.3" opacity="0.38">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <line key={i} x1={120 + Math.cos(a) * 50} y1={120 + Math.sin(a) * 50} x2={120 + Math.cos(a) * 65} y2={120 + Math.sin(a) * 65} />;
        })}
      </g>

      {/* the pupil, a small dark stage for the hen */}
      <circle cx="120" cy="120" r={PUPIL_R} fill="url(#ce-pupil)" stroke="#05020c" strokeWidth="2" />
      <g clipPath="url(#ce-pupil-clip)">
        <ellipse cx="120" cy="158" rx="42" ry="7.5" fill="#3a2d63" />
        <ellipse cx="120" cy="156" rx="37" ry="4.6" fill="#51407f" opacity="0.7" />
        {!hideHen && (
          <g transform={`translate(${hx} ${HEN_FLOOR.y + bob}) scale(${pose.flip ? -HEN_SCALE : HEN_SCALE} ${HEN_SCALE})`}>
            <HenShape step={pose.step} />
          </g>
        )}
      </g>
      <circle cx="120" cy="120" r={PUPIL_R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.6" />
      <ellipse cx="92" cy="84" rx="18" ry="9.5" transform="rotate(-32 92 84)" fill="#ffffff" opacity="0.55" />

      {/* the magnifying glass */}
      <path d="M 198 198 L 220 220" stroke={OUT} strokeWidth="12" strokeLinecap="round" />
      <path d="M 198 198 L 220 220" stroke="#8d5524" strokeWidth="7.4" strokeLinecap="round" />
      <circle cx="176" cy="176" r="31" fill="rgba(144,202,249,0.2)" stroke={OUT} strokeWidth="9.5" />
      <circle cx="176" cy="176" r="31" fill="none" stroke="#d4a017" strokeWidth="5.4" />
      <path d="M 158 166 A 21 21 0 0 1 172 153" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.82" fill="none" />

      {/* a closed eye: the lid comes down over everything but the glass */}
      {pose.blink && (
        <g>
          <ellipse cx="120" cy="120" rx="106" ry="92" fill="#d9a066" stroke={OUT} strokeWidth="5" />
          <path d="M 22 124 C 70 158, 170 158, 218 124" fill="none" stroke={OUT} strokeWidth="4.4" strokeLinecap="round" />
          <g stroke={OUT} strokeWidth="3" strokeLinecap="round">
            <path d="M 46 140 L 36 152 M 74 150 L 68 164 M 104 155 L 102 170 M 136 155 L 138 170 M 166 150 L 172 164 M 194 140 L 204 152" />
          </g>
          <path d="M 198 198 L 220 220" stroke={OUT} strokeWidth="12" strokeLinecap="round" />
          <path d="M 198 198 L 220 220" stroke="#8d5524" strokeWidth="7.4" strokeLinecap="round" />
          <circle cx="176" cy="176" r="31" fill="rgba(144,202,249,0.2)" stroke={OUT} strokeWidth="9.5" />
          <circle cx="176" cy="176" r="31" fill="none" stroke="#d4a017" strokeWidth="5.4" />
        </g>
      )}
    </svg>
  );
};
