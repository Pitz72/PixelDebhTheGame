// ============================================================================
// ENEMY ART (vector HD)
//
// Each enemy keeps the hitbox box and the silhouette it always had (the player reads them at a glance), but is drawn with
// real shading: layered gradients, a rim light, a specular highlight, panel lines and rivets. All of it is plain SVG,
// rasterised once at 4x by renderer/textures.tsx. Three states:
//   active   - the normal look;
//   captured - recoloured purple while Debh holds it;
//   stunned  - dizzy eyes (the renderer adds the circling stars).
// Gradient ids carry the enemy and the state: SVG ids are document-global, so a shared id would make two sprites
// on one page pick up each other's colours (the sheet page and the DOM fallback show several at once).
// ============================================================================

type State = 'active' | 'captured' | 'stunned';
const asState = (s: string): State => (s === 'captured' ? 'captured' : s === 'stunned' ? 'stunned' : 'active');

/** The "dizzy" eye: a dashed ring around a dot, readable at 50 px. */
const DizzyEye = ({ cx, cy, r = 4, ink = '#10131c' }: { cx: number; cy: number; r?: number; ink?: string }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke={ink} strokeWidth="1.1" />
    <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={ink} strokeWidth="1.2" strokeDasharray={`${r * 2.2} ${r * 0.7}`} strokeLinecap="round" />
    <circle cx={cx} cy={cy} r={r * 0.2} fill={ink} />
  </g>
);

// ---------------------------------------------------------------------------
// Globby: a jelly slime
// ---------------------------------------------------------------------------
const Globby = ({ state }: { state: State }) => {
  const c = state === 'captured';
  const id = `gl-${state}`;
  const light = c ? '#f3c6ff' : '#d4ffe6';
  const mid = c ? '#b64fe0' : '#2ee68a';
  const deep = c ? '#6a1fa8' : '#009f62';
  const edge = c ? '#34095e' : '#044a35';
  const body = 'M 3.5 44 C 2 25 8 5.5 25 5 C 42 5.5 48 25 46.5 44 C 46 47.6 41 48.6 25 48.6 C 9 48.6 4 47.6 3.5 44 Z';
  return (
    <svg viewBox="0 0 50 50" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.38" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor={edge} stopOpacity="0.55" />
          <stop offset="1" stopColor={edge} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="50%" cy="50%" r="50%">
          <stop offset="0.72" stopColor={light} stopOpacity="0" />
          <stop offset="1" stopColor={light} stopOpacity="0.55" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
      </defs>
      {/* the puddle it sits in */}
      <ellipse cx="25" cy="48.3" rx="21" ry="1.8" fill="#000" opacity="0.35" />
      <path d={body} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx="25" cy="34" rx="17" ry="12" fill={`url(#${id}-core)`} />
        <rect x="0" y="0" width="50" height="50" fill={`url(#${id}-rim)`} />
        {/* bubbles caught inside the jelly */}
        <circle cx="12.5" cy="38" r="2.4" fill="none" stroke={light} strokeOpacity="0.7" strokeWidth="0.9" />
        <circle cx="12" cy="37.4" r="0.7" fill="#fff" opacity="0.9" />
        <circle cx="38" cy="40.5" r="1.7" fill="none" stroke={light} strokeOpacity="0.6" strokeWidth="0.8" />
        <circle cx="35.5" cy="15" r="1.4" fill="#fff" opacity="0.55" />
        <circle cx="40.5" cy="30" r="1" fill="#fff" opacity="0.4" />
        {/* light catching the bottom edge */}
        <path d="M 9 45.5 C 18 47.8 32 47.8 41 45.5" stroke={light} strokeOpacity="0.55" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
      <path d={body} fill="none" stroke={edge} strokeWidth="1.6" strokeLinejoin="round" />
      {/* the big specular streak and its dot */}
      <path d="M 10.5 19 C 12.5 11.5 18 8.6 24 8.6" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <circle cx="9" cy="24.5" r="1.3" fill="#fff" opacity="0.8" />
      {/* the face */}
      {state === 'stunned' ? (
        <>
          <DizzyEye cx={18} cy={27} r={4.8} ink={edge} />
          <DizzyEye cx={32} cy={27} r={4.8} ink={edge} />
          <path d="M 20 37.5 Q 22.5 35.5 25 37.5 Q 27.5 39.5 30 37.5" stroke={edge} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="18" cy="27" rx="4.8" ry="5.7" fill="#fff" stroke={edge} strokeWidth="1.2" />
          <ellipse cx="32" cy="27" rx="4.8" ry="5.7" fill="#fff" stroke={edge} strokeWidth="1.2" />
          <ellipse cx="19.2" cy="28" rx="2.9" ry="3.5" fill={c ? '#3b0f66' : '#0b3d2a'} />
          <ellipse cx="33.2" cy="28" rx="2.9" ry="3.5" fill={c ? '#3b0f66' : '#0b3d2a'} />
          <circle cx="18.2" cy="26.3" r="1.25" fill="#fff" />
          <circle cx="32.2" cy="26.3" r="1.25" fill="#fff" />
          <circle cx="20.3" cy="29.6" r="0.6" fill="#fff" opacity="0.8" />
          <circle cx="34.3" cy="29.6" r="0.6" fill="#fff" opacity="0.8" />
          {c ? (
            <path d="M 21 38 Q 25 35 29 38" stroke={edge} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M 21 36 Q 25 39.2 29 36" stroke={edge} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}
          {/* brows: a touch of attitude */}
          <path d="M 13.6 20.4 Q 18 18 22.4 20.6" stroke={edge} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M 27.6 20.6 Q 32 18 36.4 20.4" stroke={edge} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
        </>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Hoppy: a spring droid
// ---------------------------------------------------------------------------
const Hoppy = ({ state }: { state: State }) => {
  const c = state === 'captured';
  const id = `hp-${state}`;
  const hi = c ? '#e3a6f0' : '#ff8a80';
  const mid = c ? '#a33cc2' : '#e5001f';
  const lo = c ? '#4a1068' : '#7a0010';
  const edge = c ? '#2c0a40' : '#3d0008';
  return (
    <svg viewBox="0 0 50 50" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-head`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.3" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2740" />
          <stop offset="1" stopColor="#05070f" />
        </linearGradient>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#455a64" />
          <stop offset="0.45" stopColor="#cfd8dc" />
          <stop offset="1" stopColor="#37474f" />
        </linearGradient>
        <radialGradient id={`${id}-bulb`} cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor={c ? '#ea80fc' : '#ffee58'} />
          <stop offset="1" stopColor={c ? '#8e24aa' : '#ff8f00'} />
        </radialGradient>
      </defs>
      {/* the coil: dark steel, a lighter core and a thin highlight, so it reads as a round wire */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 14 37 L 36 39.6 L 14 42.2 L 36 44.8 L 15 47.2" stroke="#263238" strokeWidth="4.6" />
        <path d="M 14 37 L 36 39.6 L 14 42.2 L 36 44.8 L 15 47.2" stroke="#90a4ae" strokeWidth="3" />
        <path d="M 14 36.6 L 36 39.2 L 14 41.8 L 36 44.4 L 15 46.8" stroke="#eceff1" strokeWidth="0.9" opacity="0.9" />
      </g>
      <rect x="13" y="46.4" width="24" height="3.2" rx="1.4" fill={`url(#${id}-steel)`} stroke="#1c262b" strokeWidth="1" />
      {/* the antenna */}
      <path d="M 25 8 L 25 3.6" stroke="#263238" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 25 8 L 25 3.6" stroke="#90a4ae" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="25" cy="3" r="2.5" fill={`url(#${id}-bulb)`} stroke={edge} strokeWidth="0.8" />
      {/* side bolts */}
      <rect x="1" y="17" width="4.4" height="9" rx="1.8" fill={`url(#${id}-steel)`} stroke="#1c262b" strokeWidth="1" />
      <rect x="44.6" y="17" width="4.4" height="9" rx="1.8" fill={`url(#${id}-steel)`} stroke="#1c262b" strokeWidth="1" />
      {/* the head */}
      <rect x="4" y="7.5" width="42" height="28" rx="10" fill={`url(#${id}-head)`} stroke={edge} strokeWidth="1.6" />
      <path d="M 12 9.6 L 38 9.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <path d="M 6.4 24 C 6.4 14 11 10.6 15 10.4" stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* rivets */}
      {[[8.4, 11.6], [41.6, 11.6], [8.4, 31], [41.6, 31]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="1.35" fill={lo} />
          <circle cx={x - 0.35} cy={y - 0.4} r="0.55" fill="#fff" opacity="0.7" />
        </g>
      ))}
      {/* the visor and the eyes behind it */}
      <rect x="9" y="12" width="32" height="14.6" rx="6.5" fill={`url(#${id}-visor)`} stroke={edge} strokeWidth="1.2" />
      {state === 'stunned' ? (
        <>
          <DizzyEye cx={17.5} cy={19} r={4.3} />
          <DizzyEye cx={32.5} cy={19} r={4.3} />
        </>
      ) : (
        <>
          <ellipse cx="17.5" cy="19.3" rx="4.6" ry="5.2" fill="#fff" />
          <ellipse cx="32.5" cy="19.3" rx="4.6" ry="5.2" fill="#fff" />
          <circle cx="18.3" cy="20" r="2.5" fill="#0b0f1a" />
          <circle cx="33.3" cy="20" r="2.5" fill="#0b0f1a" />
          <circle cx="17.4" cy="18.4" r="1" fill="#fff" />
          <circle cx="32.4" cy="18.4" r="1" fill="#fff" />
          {/* angry brow lines across the visor */}
          <path d="M 12.4 14.2 L 22 16.6" stroke={c ? '#ea80fc' : '#ff5252'} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M 37.6 14.2 L 28 16.6" stroke={c ? '#ea80fc' : '#ff5252'} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      <path d="M 12 13.8 C 16 12.6 26 12.4 31 13" stroke="#fff" strokeWidth="0.9" fill="none" opacity="0.28" strokeLinecap="round" />
      {/* the grille mouth */}
      <rect x="13" y="28.2" width="24" height="5" rx="2" fill="#14181f" stroke={edge} strokeWidth="1" />
      {[18.4, 25, 31.6].map(x => (
        <line key={x} x1={x} y1="28.8" x2={x} y2="32.6" stroke={state === 'stunned' ? '#ff9100' : '#ffee58'} strokeWidth="1.5" strokeLinecap="round" />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Flappy: a bat drone (60 x 44)
// ---------------------------------------------------------------------------
const Flappy = ({ state }: { state: State }) => {
  const c = state === 'captured';
  const id = `fl-${state}`;
  const wingHi = c ? '#d99bf0' : '#4fe3ff';
  const wingMid = c ? '#8e3fb8' : '#1976d2';
  const wingLo = c ? '#3a0f5c' : '#0d1b6e';
  const rib = c ? '#f3c6ff' : '#9df3ff';
  const eye = c ? '#ff80ab' : '#9dff3b';
  const edge = c ? '#240838' : '#08123a';
  // the left wing; the right one is its mirror image
  const wing = 'M 21 16 L 1.5 2.5 C 3 8 1.5 15 4 23 C 6.4 20.6 8.6 21 10 24 C 11 28.4 13 32.4 15.6 35 C 16.4 30.6 18.4 27.4 21.5 25.4 Z';
  return (
    <svg viewBox="0 0 60 44" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={wingHi} />
          <stop offset="0.55" stopColor={wingMid} />
          <stop offset="1" stopColor={wingLo} />
        </linearGradient>
        <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#b0bec5" />
          <stop offset="0.5" stopColor="#546e7a" />
          <stop offset="1" stopColor="#1c262b" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffde7" />
          <stop offset="0.35" stopColor="#ffb300" />
          <stop offset="1" stopColor="#ff3d00" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2740" />
          <stop offset="1" stopColor="#05070f" />
        </linearGradient>
      </defs>
      {[0, 1].map(side => (
        <g key={side} transform={side ? 'translate(60 0) scale(-1 1)' : undefined}>
          <path d={wing} fill={`url(#${id}-wing)`} stroke={edge} strokeWidth="1.5" strokeLinejoin="round" />
          {/* the ribs of the membrane */}
          <path d="M 21 17 L 3.4 4.6 M 20.6 20 L 5.6 22 M 20.8 22.6 L 10.6 25.4 M 21 24 L 15.2 33" stroke={rib} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" fill="none" />
          <path d="M 21 16 L 1.5 2.5" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
        </g>
      ))}
      {/* thruster and its flame */}
      <path d="M 24.5 33.5 C 26 38 28.4 42.6 30 43.4 C 31.6 42.6 34 38 35.5 33.5 Z" fill={`url(#${id}-flame)`} />
      <path d="M 28 34 C 28.6 37 29.4 39 30 39.8 C 30.6 39 31.4 37 32 34 Z" fill="#fffde7" opacity="0.9" />
      <path d="M 25.4 31 L 34.6 31 L 33.4 35.2 L 26.6 35.2 Z" fill="#37474f" stroke="#1c262b" strokeWidth="1" strokeLinejoin="round" />
      {/* ears */}
      <path d="M 21 12.6 L 17.6 2.2 L 26.6 9.4 Z" fill="#455a64" stroke="#1c262b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M 39 12.6 L 42.4 2.2 L 33.4 9.4 Z" fill="#455a64" stroke="#1c262b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M 21.2 10.6 L 19.2 4.8 L 24 8.8 Z" fill={eye} opacity="0.55" />
      <path d="M 38.8 10.6 L 40.8 4.8 L 36 8.8 Z" fill={eye} opacity="0.55" />
      {/* the body */}
      <circle cx="30" cy="21.5" r="13.2" fill={`url(#${id}-body)`} stroke="#1c262b" strokeWidth="1.6" />
      <path d="M 19.4 15 C 21.6 11 26 9 30 9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M 17.4 22 C 17.6 30 23 34.2 30 34.2" stroke={rib} strokeWidth="1" fill="none" opacity="0.4" />
      {/* the visor with the glowing eyes and two small fangs */}
      <path d="M 18.4 17 L 41.6 17 L 40.4 25.6 C 36 27.4 24 27.4 19.6 25.6 Z" fill={`url(#${id}-visor)`} stroke="#10171b" strokeWidth="1.1" strokeLinejoin="round" />
      {state === 'stunned' ? (
        <>
          <DizzyEye cx={24} cy={21.4} r={3.4} />
          <DizzyEye cx={36} cy={21.4} r={3.4} />
        </>
      ) : (
        <>
          <polygon points="21.2,19.2 27.6,21.2 22.6,24.4" fill={eye} />
          <polygon points="38.8,19.2 32.4,21.2 37.4,24.4" fill={eye} />
          <polygon points="22.6,21 25.4,21.6 23.4,22.8" fill="#fff" opacity="0.9" />
          <polygon points="37.4,21 34.6,21.6 36.6,22.8" fill="#fff" opacity="0.9" />
        </>
      )}
      <path d="M 25.6 27.6 L 27.4 31.2 L 29 27.8 M 31 27.8 L 32.6 31.2 L 34.4 27.6" fill="#f5f5f5" stroke="#1c262b" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bomby: an artillery tank
// ---------------------------------------------------------------------------
const Bomby = ({ state }: { state: State }) => {
  const c = state === 'captured';
  const id = `bm-${state}`;
  const edge = '#101a1f';
  const domeHi = c ? '#d1b3ff' : '#cfd8dc';
  const domeMid = c ? '#7c4dff' : '#607d8b';
  const domeLo = c ? '#2a1466' : '#263238';
  const eye = state === 'stunned' ? '#ff9100' : '#ff1744';
  return (
    <svg viewBox="0 0 50 50" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-barrel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#263238" />
          <stop offset="0.4" stopColor="#78909c" />
          <stop offset="1" stopColor="#1c262b" />
        </linearGradient>
        <radialGradient id={`${id}-dome`} cx="34%" cy="25%" r="85%">
          <stop offset="0" stopColor={domeHi} />
          <stop offset="0.45" stopColor={domeMid} />
          <stop offset="1" stopColor={domeLo} />
        </radialGradient>
        <linearGradient id={`${id}-tread`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#546e7a" />
          <stop offset="0.5" stopColor="#263238" />
          <stop offset="1" stopColor="#10171a" />
        </linearGradient>
        <radialGradient id={`${id}-eye`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={eye} />
          <stop offset="1" stopColor={eye} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-hub`} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#eceff1" />
          <stop offset="1" stopColor="#546e7a" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M 4 38 C 4 14.5, 46 14.5, 46 38 Z" />
        </clipPath>
      </defs>
      {/* the mortar */}
      <rect x="18.5" y="5" width="13" height="16" rx="2.6" fill={`url(#${id}-barrel)`} stroke={edge} strokeWidth="1.5" />
      <rect x="21" y="9" width="8" height="1.4" fill="#000" opacity="0.35" />
      <rect x="21" y="13" width="8" height="1.4" fill="#000" opacity="0.35" />
      <rect x="15.5" y="2.4" width="19" height="5.4" rx="2.4" fill="#e65100" stroke={edge} strokeWidth="1.4" />
      <rect x="17.5" y="3.2" width="15" height="1.4" rx="0.7" fill="#ffcc80" opacity="0.8" />
      <ellipse cx="25" cy="3.6" rx="5.5" ry="1" fill="#1b0d05" opacity="0.8" />
      {/* the dome */}
      <path d="M 4 38 C 4 14.5, 46 14.5, 46 38 Z" fill={`url(#${id}-dome)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* hazard stripes along the base of the dome */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <polygon key={i} points={`${3 + i * 4.8},38 ${6.4 + i * 4.8},38 ${8.6 + i * 4.8},33.4 ${5.2 + i * 4.8},33.4`} fill="#ffb300" opacity="0.9" />
        ))}
        <path d="M 6 33.4 L 44 33.4" stroke={edge} strokeWidth="0.8" opacity="0.7" />
        {/* a panel seam */}
        <path d="M 25 15 L 25 23.4" stroke={edge} strokeWidth="0.9" opacity="0.5" />
        <path d="M 9 29 C 13 24 18 22.4 22 22.4" stroke={edge} strokeWidth="0.8" fill="none" opacity="0.45" />
        <path d="M 41 29 C 37 24 32 22.4 28 22.4" stroke={edge} strokeWidth="0.8" fill="none" opacity="0.45" />
      </g>
      <path d="M 4 38 C 4 14.5, 46 14.5, 46 38" fill="none" stroke={edge} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M 9.6 27 C 11 21.4 15.6 18.4 21 17.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
      {/* rivets */}
      {[[9.4, 33], [40.6, 33], [14, 21.4], [36, 21.4]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="1.2" fill={domeLo} />
          <circle cx={x - 0.3} cy={y - 0.35} r="0.5" fill="#fff" opacity="0.75" />
        </g>
      ))}
      {/* the optic slot */}
      <rect x="11" y="23.4" width="28" height="7.6" rx="3.8" fill="#080b0f" stroke={edge} strokeWidth="1.2" />
      {state === 'stunned' ? (
        <>
          <path d="M 15 25.6 L 19 29 M 19 25.6 L 15 29" stroke={eye} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 31 25.6 L 35 29 M 35 25.6 L 31 29" stroke={eye} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="25" cy="27.2" r="6" fill={`url(#${id}-eye)`} />
          <circle cx="25" cy="27.2" r="2.7" fill={eye} />
          <circle cx="24.1" cy="26.3" r="0.9" fill="#fff" />
          <path d="M 13.6 27.2 L 18.6 27.2 M 31.4 27.2 L 36.4 27.2" stroke={eye} strokeWidth="0.9" opacity="0.55" strokeLinecap="round" />
        </>
      )}
      {/* the treads */}
      <rect x="2" y="36" width="46" height="12.4" rx="6.2" fill={`url(#${id}-tread)`} stroke={edge} strokeWidth="1.7" />
      <path d="M 7 37.6 L 43 37.6" stroke="#fff" strokeWidth="0.9" opacity="0.28" strokeLinecap="round" />
      {[8, 12.6, 17.2, 21.8, 26.4, 31, 35.6, 40.2].map(x => (
        <line key={x} x1={x} y1="36.8" x2={x} y2="39.4" stroke="#000" strokeWidth="0.9" opacity="0.5" />
      ))}
      {[11, 25, 39].map(x => (
        <g key={x}>
          <circle cx={x} cy="42.4" r="3.9" fill="#10171a" stroke={edge} strokeWidth="1" />
          <circle cx={x} cy="42.4" r="2.7" fill={`url(#${id}-hub)`} />
          <circle cx={x} cy="42.4" r="0.9" fill="#37474f" />
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Ghosty: a wraith
// ---------------------------------------------------------------------------
const Ghosty = ({ state }: { state: State }) => {
  const c = state === 'captured';
  const id = `gh-${state}`;
  const hi = c ? '#f6d4ff' : '#f2feff';
  const mid = c ? '#b45df0' : '#6fe3f2';
  const lo = c ? '#4527c8' : '#2c52d4';
  const edge = c ? '#2a0a5c' : '#0f2a6e';
  const body = 'M 5 25 C 4.4 6.4 45.6 6.4 45 25 L 46.6 46 C 43 42.6 40 47.6 36.4 44.4 C 33 41.6 30 48.6 25.6 44.8 C 21.6 41.4 18.4 48.4 14.4 44.6 C 10.6 41.4 8 47 3.4 46 Z';
  return (
    <svg viewBox="0 0 50 50" className="w-full h-full">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} stopOpacity="0.97" />
          <stop offset="0.45" stopColor={mid} stopOpacity="0.9" />
          <stop offset="0.85" stopColor={lo} stopOpacity="0.6" />
          <stop offset="1" stopColor={lo} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="38%" r="55%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-hood`} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#2b1450" stopOpacity="0.95" />
          <stop offset="1" stopColor="#0b0620" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor={c ? '#ff80ff' : '#ff3d6e'} />
          <stop offset="1" stopColor={c ? '#7b1fa2' : '#b0003a'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx="25" cy="20" rx="22" ry="17" fill={`url(#${id}-glow)`} />
        {/* the folds of the sheet */}
        <path d="M 14 30 C 13 36 14 41 15 45 M 25 33 C 25 38 25 42 25.6 45 M 36 30 C 37 36 36.6 41 36 45" stroke={lo} strokeOpacity="0.35" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <path d={body} fill="none" stroke={edge} strokeWidth="1.5" strokeLinejoin="round" strokeOpacity="0.85" />
      <path d="M 10.4 21 C 11 14 16.6 11 22.4 10.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* two little hands that float at its sides */}
      <path d="M 5.6 29 C 2.8 29.6 2 32.6 3.8 34.2 C 5 33.4 5.8 32 6.2 30.4" fill={mid} opacity="0.85" stroke={edge} strokeWidth="0.9" />
      <path d="M 44.4 29 C 47.2 29.6 48 32.6 46.2 34.2 C 45 33.4 44.2 32 43.8 30.4" fill={mid} opacity="0.85" stroke={edge} strokeWidth="0.9" />
      {/* the hollow face */}
      <ellipse cx="25" cy="23" rx="13.4" ry="11.2" fill={`url(#${id}-hood)`} />
      {state === 'stunned' ? (
        <>
          <DizzyEye cx={19.4} cy={22} r={4} ink="#1a0b33" />
          <DizzyEye cx={30.6} cy={22} r={4} ink="#1a0b33" />
          <path d="M 19 31.4 Q 22 29 25 31.4 Q 28 33.8 31 31.4" stroke={c ? '#ff80ff' : '#ff5c80'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="19.4" cy="22" r="6" fill={`url(#${id}-eye)`} />
          <circle cx="30.6" cy="22" r="6" fill={`url(#${id}-eye)`} />
          <circle cx="19.4" cy="22" r="2.6" fill="#fff" opacity="0.95" />
          <circle cx="30.6" cy="22" r="2.6" fill="#fff" opacity="0.95" />
          <path d="M 17.4 30.2 L 19.6 32.6 L 21.8 29.8 L 24 32.8 L 26.2 29.8 L 28.4 32.6 L 30.6 30.2" stroke={c ? '#ff80ff' : '#ff5c80'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {/* motes of ectoplasm */}
      <circle cx="9" cy="41" r="1" fill="#fff" opacity="0.5" />
      <circle cx="41.4" cy="38.6" r="1.3" fill="#fff" opacity="0.45" />
      <circle cx="31" cy="42.4" r="0.8" fill="#fff" opacity="0.5" />
    </svg>
  );
};

/** One enemy in one state, drawn in a 50 x 50 box (the flyer: 60 x 44). */
export const EnemyArt = ({ type, state }: { type: string; state: string }) => {
  const s = asState(state);
  switch (type) {
    case 'phaser':
      return <Ghosty state={s} />;
    case 'bomber':
      return <Bomby state={s} />;
    case 'flyer':
      return <Flappy state={s} />;
    case 'jumper':
      return <Hoppy state={s} />;
    case 'base':
    default:
      return <Globby state={s} />;
  }
};
