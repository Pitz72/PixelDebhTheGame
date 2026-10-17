import React from 'react';

// ============================================================================
// PIXELDEBH: RETRO-RESCUE! — OFFICIAL LOGO-INSPIRED HD VECTOR ASSET ENGINE
// ============================================================================

/**
 * PlayerSprite — Directly modeled after the official PixelDebh channel logo:
 * - Short chin-length dark brown bob haircut (#4A2511) with side-swept bangs
 * - Iconic burnt-orange retro headphones (#E05326 / #C43E16) with double-ring earcup
 * - Warm peachy skin (#FCD2A8), expressive dark brown eyes, arched brows & warm smile
 * - Burnt-orange sleeveless scoop-neck tank top (#DF5327) with bold cartoon outlines (#2A1810)
 * - Holding her signature dark brown wireless gamepad (#3D2B22)
 * - Exact 54x74 viewBox matching PLAYER_WIDTH (54) x PLAYER_HEIGHT (74) for 1:1 hitbox accuracy!
 */
/** Static poses (SVG transforms) used to bake the character into textures for the WebGL renderer. */
export interface PlayerPose {
  body: string;
  legL: string;
  legR: string;
}

export const PLAYER_POSES: Record<string, PlayerPose> = {
  idle: { body: '', legL: '', legR: '' },
  run0: { body: '', legL: 'rotate(-24 23 54)', legR: 'rotate(22 31 54)' },
  run1: { body: 'translate(0, -2.5)', legL: 'rotate(-4 23 54)', legR: 'rotate(4 31 54)' },
  run2: { body: '', legL: 'rotate(22 23 54)', legR: 'rotate(-24 31 54)' },
  run3: { body: 'translate(0, -2.5)', legL: 'rotate(4 23 54)', legR: 'rotate(-4 31 54)' },
  jump: { body: 'translate(0, -2)', legL: 'rotate(-18 22 54) translate(0, -2)', legR: 'rotate(16 31 54) translate(0, -3)' },
  fall: { body: 'translate(0, -1)', legL: 'rotate(12 22 54)', legR: 'rotate(-14 31 54)' },
};

export const PlayerSprite = ({
  direction,
  isInvincible,
  showGlove = false,
  isMoving = false,
  isJumping = false,
  pose,
}: {
  direction: 'left' | 'right';
  isInvincible: boolean;
  showGlove?: boolean;
  isMoving?: boolean;
  isJumping?: boolean;
  /** When set the sprite is a still pose: no CSS animation (used for texture baking). */
  pose?: PlayerPose;
}) => {
  const animated = !pose;
  const runClass = (name: string) => (animated && isMoving && !isJumping ? name : '');
  const hairClass = animated && (isMoving || isJumping) ? 'pd-hair-bob' : '';
  const bodyTransform = pose ? pose.body : isJumping ? 'translate(0, -2)' : '';
  const legLTransform = pose ? pose.legL : isJumping ? 'rotate(-18 22 54) translate(0, -2)' : '';
  const legRTransform = pose ? pose.legR : isJumping ? 'rotate(16 31 54) translate(0, -3)' : '';
  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes pdBobRun {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes pdLegL {
          0%, 100% { transform: rotate(-24deg); }
          50% { transform: rotate(22deg); }
        }
        @keyframes pdLegR {
          0%, 100% { transform: rotate(22deg); }
          50% { transform: rotate(-24deg); }
        }
        @keyframes pdHairBounce {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-2.5deg) translateY(-1px); }
        }
        .pd-run-body { animation: pdBobRun 0.28s ease-in-out infinite; transform-origin: 27px 42px; }
        .pd-run-leg-l { animation: pdLegL 0.28s ease-in-out infinite; transform-origin: 23px 54px; }
        .pd-run-leg-r { animation: pdLegR 0.28s ease-in-out infinite; transform-origin: 31px 54px; }
        .pd-hair-bob { animation: pdHairBounce 0.28s ease-in-out infinite; transform-origin: 27px 18px; }
      `}</style>

      <svg
        viewBox="0 0 54 74"
        className={`w-full h-full transform ${direction === 'left' ? 'scale-x-[-1]' : ''}`}
        style={{
          filter: isInvincible
            ? 'drop-shadow(0 0 10px #00f0ff)'
            : 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
        }}
      >
        <defs>
          <linearGradient id="pd-logo-hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#63361e" />
            <stop offset="55%" stopColor="#4A2511" />
            <stop offset="100%" stopColor="#2E1508" />
          </linearGradient>
          <linearGradient id="pd-logo-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE0BE" />
            <stop offset="65%" stopColor="#FCD2A8" />
            <stop offset="100%" stopColor="#EBAA76" />
          </linearGradient>
          <linearGradient id="pd-logo-tank" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F26838" />
            <stop offset="55%" stopColor="#DF5327" />
            <stop offset="100%" stopColor="#B83B14" />
          </linearGradient>
          <linearGradient id="pd-logo-headphone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F46A38" />
            <stop offset="55%" stopColor="#E05326" />
            <stop offset="100%" stopColor="#A8320E" />
          </linearGradient>
          <linearGradient id="pd-logo-shorts" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B4D6B" />
            <stop offset="100%" stopColor="#222D42" />
          </linearGradient>
          <radialGradient id="pd-pad-beam" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="45%" stopColor="#FF9E2C" />
            <stop offset="100%" stopColor="#E05326" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className={runClass('pd-run-body')} transform={bodyTransform}>
          {/* --- BACK OF SHORT BOB HAIRCUT --- */}
          <g className={hairClass}>
            <path
              d="M 11 16 C 8 24, 9 34, 15 37 L 39 37 C 44 34, 45 24, 42 16 Z"
              fill="url(#pd-logo-hair)"
              stroke="#2A1810"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>

          {/* --- BACK LEG (LEFT) --- */}
          <g
            className={runClass('pd-run-leg-l')}
            transform={legLTransform}
          >
            {/* Leg Skin */}
            <rect x="18" y="55" width="7" height="12" rx="3" fill="#EBAA76" stroke="#2A1810" strokeWidth="1.8" />
            {/* Shorts Left */}
            <rect x="17" y="51" width="9" height="8" rx="2.5" fill="url(#pd-logo-shorts)" stroke="#2A1810" strokeWidth="1.8" />
            {/* Sneaker Left */}
            <path
              d="M 16 65 L 27 65 C 29 65, 30 68, 30 71 L 15 71 Z"
              fill="#DF5327"
              stroke="#2A1810"
              strokeWidth="1.8"
            />
            <rect x="15" y="70" width="15" height="2.5" rx="1" fill="#FFF5DC" stroke="#2A1810" strokeWidth="1.2" />
          </g>

          {/* --- FRONT LEG (RIGHT) --- */}
          <g
            className={runClass('pd-run-leg-r')}
            transform={legRTransform}
          >
            {/* Leg Skin */}
            <rect x="27" y="55" width="7" height="12" rx="3" fill="url(#pd-logo-skin)" stroke="#2A1810" strokeWidth="1.8" />
            {/* Shorts Right */}
            <rect x="26" y="51" width="10" height="8" rx="2.5" fill="url(#pd-logo-shorts)" stroke="#2A1810" strokeWidth="1.8" />
            {/* Sneaker Right */}
            <path
              d="M 25 65 L 37 65 C 40 65, 41 68, 41 71 L 24 71 Z"
              fill="#DF5327"
              stroke="#2A1810"
              strokeWidth="1.8"
            />
            <rect x="24" y="70" width="17" height="2.5" rx="1" fill="#FFF5DC" stroke="#2A1810" strokeWidth="1.2" />
          </g>

          {/* --- NECK & SLEEVELESS ORANGE TANK TOP (FROM LOGO) --- */}
          <rect x="23" y="31" width="8" height="8" rx="3" fill="url(#pd-logo-skin)" stroke="#2A1810" strokeWidth="1.8" />
          <path
            d="M 17 36 C 17 35, 21 35, 22 37 C 24 40, 30 40, 32 37 C 33 35, 36 35, 36 36 L 38 53 L 16 53 Z"
            fill="url(#pd-logo-tank)"
            stroke="#2A1810"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Subtle Tank Top Fold Highlight */}
          <path d="M 20 39 L 19 50" stroke="#FF8A5B" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />

          {/* --- HEAD & FACE (EXACT LOGO PROPORTIONS & EXPRESSION) --- */}
          <g className={hairClass}>
            {/* Face Shape */}
            <path
              d="M 15 14 C 15 7, 39 7, 39 14 L 39 24 C 39 31, 33 35, 27 35 C 21 35, 15 31, 15 24 Z"
              fill="url(#pd-logo-skin)"
              stroke="#2A1810"
              strokeWidth="2"
            />

            {/* Warm Cheek Blush */}
            <ellipse cx="22" cy="26.5" rx="2.6" ry="1.3" fill="#F2785C" opacity="0.45" />
            <ellipse cx="36" cy="26.5" rx="2.2" ry="1.2" fill="#F2785C" opacity="0.45" />

            {/* Arched Dark Eyebrows */}
            <path d="M 22 18.2 Q 25 16.5, 27.8 18" stroke="#2A1810" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 32.2 18 Q 35 16.5, 37.2 18.2" stroke="#2A1810" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Expressive Dark Brown Eyes with White Sclera & Catchlight */}
            <ellipse cx="25" cy="22" rx="3" ry="3.4" fill="#FFF8E7" stroke="#2A1810" strokeWidth="1.4" />
            <circle cx="25.6" cy="22" r="2.1" fill="#2A1810" />
            <circle cx="24.8" cy="21" r="0.85" fill="#FFFFFF" />

            <ellipse cx="34.5" cy="22" rx="2.7" ry="3.2" fill="#FFF8E7" stroke="#2A1810" strokeWidth="1.4" />
            <circle cx="35" cy="22" r="1.9" fill="#2A1810" />
            <circle cx="34.3" cy="21" r="0.8" fill="#FFFFFF" />

            {/* Cute Cartoon Nose (From Logo) */}
            <path d="M 30 21.5 C 31.5 23.5, 31.5 25.5, 29.5 26" stroke="#2A1810" strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* Warm Smile with Lower Lip Tint */}
            <path d="M 25.5 28.8 Q 29.5 31.6, 33.2 28.8" stroke="#2A1810" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            <path d="M 27.2 30.2 Q 29.5 31.8, 31.5 30.2" stroke="#D84A24" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Side-Swept Bob Bangs & Right Bob Lock */}
            <path
              d="M 14 17 C 14 7, 40 6, 41 18 C 41 25, 41 31, 37 34 C 39 28, 39 21, 36 16 C 32 11, 30 15, 23 17 C 19 18, 16 21, 15 25 Z"
              fill="url(#pd-logo-hair)"
              stroke="#2A1810"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            {/* Left Chin-Length Bob Lock framing earcup */}
            <path
              d="M 10 21 C 8 27, 10 34, 16 36 C 14 31, 14 25, 15 21 Z"
              fill="url(#pd-logo-hair)"
              stroke="#2A1810"
              strokeWidth="1.8"
            />
            {/* Warm Hair Shine */}
            <path d="M 20 11 Q 27 8.5, 34 11" stroke="#7D4628" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* --- ICONIC BURNT-ORANGE HEADPHONES (FROM LOGO) --- */}
            {/* Headband Arch */}
            <path
              d="M 14 20 C 14 4, 38 4, 39 17"
              stroke="url(#pd-logo-headphone)"
              strokeWidth="4.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 14 20 C 14 4, 38 4, 39 17"
              stroke="#2A1810"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Outer Earcup Cushion */}
            <ellipse
              cx="14.5"
              cy="24.5"
              rx="5.2"
              ry="7.2"
              fill="url(#pd-logo-headphone)"
              stroke="#2A1810"
              strokeWidth="2"
            />
            {/* Inner Earcup Cap */}
            <ellipse
              cx="13.8"
              cy="24.5"
              rx="3.2"
              ry="4.8"
              fill="#C43E16"
              stroke="#2A1810"
              strokeWidth="1.5"
            />
            <path d="M 12.8 21.5 A 2 3.5 0 0 1 12.8 27" stroke="#FF9E6D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>

          {/* --- ARMS & SIGNATURE DARK GAMEPAD CONTROLLER (FROM LOGO) --- */}
          <g>
            {/* Left/Front Arm bent holding controller */}
            <path
              d="M 16 38 C 12 43, 13 49, 18 49 L 29 46 L 28 42 L 19 44 L 21 38 Z"
              fill="url(#pd-logo-skin)"
              stroke="#2A1810"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            {/* Tractor-Beam / Energy Aura when holding Enemy or Super-Throw */}
            {showGlove && (
              <circle cx="38" cy="43" r="11" fill="url(#pd-pad-beam)" className="animate-pulse" />
            )}

            {/* Wireless Gamepad Controller (#3D2B22) */}
            <g transform="translate(25, 37)">
              <rect
                x="0"
                y="0"
                width="22"
                height="12"
                rx="5"
                fill="#3D2B22"
                stroke="#2A1810"
                strokeWidth="1.8"
              />
              {/* D-Pad */}
              <path d="M 6 4 L 6 8 M 4 6 L 8 6" stroke="#8C6754" strokeWidth="1.8" strokeLinecap="round" />
              {/* Action Buttons */}
              <circle cx="16.5" cy="4.5" r="1.3" fill="#FF9E2C" />
              <circle cx="18.5" cy="6.2" r="1.3" fill="#DF5327" />
              <circle cx="14.5" cy="6.2" r="1.3" fill="#FFF5DC" />
              <circle cx="16.5" cy="7.9" r="1.3" fill="#00E5FF" />
            </g>

            {/* Hands gripping Gamepad */}
            <ellipse cx="29" cy="44" rx="3.2" ry="2.6" fill="url(#pd-logo-skin)" stroke="#2A1810" strokeWidth="1.6" />
            <ellipse cx="45" cy="44" rx="2.8" ry="2.4" fill="url(#pd-logo-skin)" stroke="#2A1810" strokeWidth="1.6" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// ENEMY SPRITES (EXACT HITBOX ALIGNMENT — NO CSS BOUNCE DISLOCATION!)
// All ground/standard enemies use viewBox="0 0 50 50" filling x=2..48, y=2..49
// ============================================================================
export const EnemySprite = ({ type, state }: { type: string; state: string }) => {
  const captured = state === 'captured';
  const stunned = state === 'stunned';
  // Gradient ids differ per variant: SVG ids are document-global, so a shared id made every enemy pick up the first one's colours.
  const v = captured ? 'c' : 'n';

  switch (type) {
    case 'phaser': // Ghosty — Spectral Wraith (fills 50x50 cleanly)
      return (
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <defs>
            <linearGradient id={`ghost-grad-${v}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={captured ? '#e040fb' : '#e0f7fa'} stopOpacity="0.95" />
              <stop offset="65%" stopColor={captured ? '#7c4dff' : '#4dd0e1'} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#311b92" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id="ghost-eye" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#ff1744" />
              <stop offset="100%" stopColor="#880e4f" />
            </radialGradient>
          </defs>
          <path
            d="M 5 24 C 5 6, 45 6, 45 24 L 47 46 C 42 41, 38 48, 33 44 C 29 40, 25 49, 20 44 C 15 40, 10 48, 3 46 Z"
            fill={`url(#ghost-grad-${v})`}
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          <ellipse cx="25" cy="23" rx="13" ry="11" fill="#120924" opacity="0.6" />
          <circle cx="19" cy="22" r="4.2" fill="url(#ghost-eye)" />
          <circle cx="31" cy="22" r="4.2" fill="url(#ghost-eye)" />
          <path
            d="M 18 32 Q 21.5 29, 25 32 Q 28.5 35, 32 32"
            stroke="#ff5252"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'bomber': // Bomby — Heavy Cyber-Artillery Tank (fills 50x50 cleanly)
      return (
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <defs>
            <linearGradient id={`tank-dome-${v}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={captured ? '#b388ff' : '#90a4ae'} />
              <stop offset="55%" stopColor={captured ? '#7c4dff' : '#455a64'} />
              <stop offset="100%" stopColor="#1c262b" />
            </linearGradient>
          </defs>
          {/* Mortar Cannon */}
          <rect x="18" y="4" width="14" height="16" rx="3" fill="#37474f" stroke="#2A1810" strokeWidth="2" />
          <rect x="15" y="2" width="20" height="5" rx="2" fill="#DF5327" stroke="#2A1810" strokeWidth="1.8" />
          {/* Armored Dome */}
          <path
            d="M 4 38 C 4 14, 46 14, 46 38 Z"
            fill={`url(#tank-dome-${v})`}
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          {/* Optic Visor */}
          <rect x="11" y="24" width="28" height="7" rx="3.5" fill="#111" stroke="#2A1810" strokeWidth="1.5" />
          <circle cx="25" cy="27.5" r="3" fill="#ff1744" />
          {/* Heavy Treads filling bottom of 50x50 */}
          <rect x="2" y="36" width="46" height="12" rx="6" fill="#263238" stroke="#2A1810" strokeWidth="2.2" />
          <circle cx="11" cy="42" r="3.5" fill="#90a4ae" stroke="#2A1810" strokeWidth="1.2" />
          <circle cx="25" cy="42" r="3.5" fill="#90a4ae" stroke="#2A1810" strokeWidth="1.2" />
          <circle cx="39" cy="42" r="3.5" fill="#90a4ae" stroke="#2A1810" strokeWidth="1.2" />
        </svg>
      );

    case 'flyer': // Flappy — Cyber Bat-Drone (fills 60x44 cleanly)
      return (
        <svg viewBox="0 0 60 44" className="w-full h-full">
          <defs>
            <linearGradient id={`bat-wing-${v}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={captured ? '#ba68c8' : '#00e5ff'} />
              <stop offset="100%" stopColor={captured ? '#4a148c' : '#1a237e'} />
            </linearGradient>
          </defs>
          {/* Left & Right Wings spanning x=2..58 */}
          <path
            d="M 20 18 L 2 5 L 5 22 L 12 19 L 10 30 L 20 26 Z"
            fill={`url(#bat-wing-${v})`}
            stroke="#2A1810"
            strokeWidth="2"
          />
          <path
            d="M 40 18 L 58 5 L 55 22 L 48 19 L 50 30 L 40 26 Z"
            fill={`url(#bat-wing-${v})`}
            stroke="#2A1810"
            strokeWidth="2"
          />
          {/* Thruster Flame */}
          <path d="M 25 32 L 30 43 L 35 32 Z" fill="#FF9E2C" stroke="#2A1810" strokeWidth="1.5" />
          {/* Central Body */}
          <ellipse cx="30" cy="21" rx="13" ry="13" fill="#455a64" stroke="#2A1810" strokeWidth="2.2" />
          {/* Ears */}
          <polygon points="21,11 18,2 26,9" fill="#37474f" stroke="#2A1810" strokeWidth="1.8" />
          <polygon points="39,11 42,2 34,9" fill="#37474f" stroke="#2A1810" strokeWidth="1.8" />
          {/* Glowing Eyes */}
          <polygon points="22,18 28,20 23,24" fill="#76ff03" />
          <polygon points="38,18 32,20 37,24" fill="#76ff03" />
        </svg>
      );

    case 'jumper': // Hoppy — Spring Droid (NO CSS animate-bounce! Physics handles jumps!)
      return (
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <defs>
            <linearGradient id={`hoppy-head-${v}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={captured ? '#ce93d8' : '#ff5252'} />
              <stop offset="55%" stopColor={captured ? '#8e24aa' : '#d50000'} />
              <stop offset="100%" stopColor="#7f0000" />
            </linearGradient>
          </defs>
          {/* Heavy Chrome Spring Coils at bottom y=34..48 */}
          <path
            d="M 14 34 L 36 37 L 13 41 L 37 44 L 15 48 L 35 48"
            stroke="#cfd8dc"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Droid Body filling x=4..46, y=3..35 */}
          <rect
            x="4"
            y="3"
            width="42"
            height="32"
            rx="10"
            fill={`url(#hoppy-head-${v})`}
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          <path d="M 11 8 L 39 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
          {/* Eyes */}
          <rect x="12" y="12" width="10" height="11" rx="4" fill="#ffffff" stroke="#2A1810" strokeWidth="1.5" />
          <rect x="28" y="12" width="10" height="11" rx="4" fill="#ffffff" stroke="#2A1810" strokeWidth="1.5" />
          <circle cx="17" cy="18" r="3" fill="#111" />
          <circle cx="33" cy="18" r="3" fill="#111" />
          <circle cx="16" cy="16.5" r="1.2" fill="#fff" />
          <circle cx="32" cy="16.5" r="1.2" fill="#fff" />
          {/* Grille Mouth */}
          <rect x="13" y="26" width="24" height="5.5" rx="2" fill="#212121" stroke="#2A1810" strokeWidth="1.2" />
          <line x1="19" y1="26" x2="19" y2="31.5" stroke="#ffeb3b" strokeWidth="1.5" />
          <line x1="25" y1="26" x2="25" y2="31.5" stroke="#ffeb3b" strokeWidth="1.5" />
          <line x1="31" y1="26" x2="31" y2="31.5" stroke="#ffeb3b" strokeWidth="1.5" />
        </svg>
      );

    case 'base': // Globby — Cyber-Slime (fills 50x50 cleanly from x=3..47, y=4..48)
    default:
      return (
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <defs>
            <radialGradient id={`slime-body-${v}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={captured ? '#ea80fc' : '#b9f6ca'} />
              <stop offset="45%" stopColor={captured ? '#9c27b0' : '#00e676'} />
              <stop offset="100%" stopColor={captured ? '#4a148c' : '#00695c'} />
            </radialGradient>
          </defs>
          <path
            d="M 4 44 C 2 24, 9 4, 25 4 C 41 4, 48 24, 46 44 C 44 48, 6 48, 4 44 Z"
            fill={`url(#slime-body-${v})`}
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          <path d="M 12 16 C 15 10, 21 9, 26 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          <circle cx="14" cy="36" r="2.5" fill="#ffffff" opacity="0.5" />
          <circle cx="37" cy="20" r="2.8" fill="#ffffff" opacity="0.45" />
          {/* Eyes */}
          <ellipse cx="18" cy="27" rx="4.5" ry="5.5" fill="#ffffff" stroke="#2A1810" strokeWidth="1.5" />
          <ellipse cx="32" cy="27" rx="4.5" ry="5.5" fill="#ffffff" stroke="#2A1810" strokeWidth="1.5" />
          <circle cx="19" cy="28" r="2.6" fill={stunned ? '#ff9100' : '#1b5e20'} />
          <circle cx="33" cy="28" r="2.6" fill={stunned ? '#ff9100' : '#1b5e20'} />
          <circle cx="18" cy="26.5" r="1.2" fill="#ffffff" />
          <circle cx="32" cy="26.5" r="1.2" fill="#ffffff" />
        </svg>
      );
  }
};

// ============================================================================
// ITEM SPRITES (COLLECTIBLES & POWER-UPS)
// ============================================================================
/** The "P" of Pixel on the arcade token, drawn as 4 px blocks. */
const PIXEL_P: [number, number][] = [
  [22, 18], [26, 18], [30, 18], [34, 18],
  [22, 22], [38, 22],
  [22, 26], [38, 26],
  [22, 30], [26, 30], [30, 30], [34, 30],
  [22, 34], [22, 38], [22, 42],
];

export const ItemSprite = ({ type }: { type: string }) => {
  switch (type) {
    case 'speed-boost':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffff8d" />
              <stop offset="50%" stopColor="#ffea00" />
              <stop offset="100%" stopColor="#ff6d00" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="rgba(255, 234, 0, 0.18)" stroke="#ffea00" strokeWidth="1.8" strokeDasharray="6 4" />
          <path
            d="M 36 6 L 16 34 L 30 34 L 24 58 L 48 28 L 34 28 Z"
            fill="url(#bolt-grad)"
            stroke="#2A1810"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shield':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84ffff" />
              <stop offset="50%" stopColor="#00bcd4" />
              <stop offset="100%" stopColor="#004d40" />
            </linearGradient>
          </defs>
          <path
            d="M 32 6 L 54 15 L 54 33 C 54 46, 43 54, 32 60 C 21 54, 10 46, 10 33 L 10 15 Z"
            fill="url(#shield-grad)"
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          <path
            d="M 32 12 L 48 19 L 48 32 C 48 42, 40 48, 32 53 C 24 48, 16 42, 16 32 L 16 19 Z"
            fill="rgba(255,255,255,0.25)"
          />
          <path d="M 32 20 L 32 44 M 20 32 L 44 32" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'super-throw':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <radialGradient id="super-orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#ffea00" />
              <stop offset="75%" stopColor="#ff3d00" />
              <stop offset="100%" stopColor="#b71c1c" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="24" fill="url(#super-orb)" stroke="#2A1810" strokeWidth="2.2" />
          <polygon
            points="32,10 37,24 52,24 40,33 44,48 32,39 20,48 24,33 12,24 27,24"
            fill="#ffffff"
            opacity="0.92"
          />
        </svg>
      );

    case 'joystick':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <radialGradient id="joy-ball" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ff8a80" />
              <stop offset="40%" stopColor="#E05326" />
              <stop offset="100%" stopColor="#880e4f" />
            </radialGradient>
            <linearGradient id="joy-base" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#455a64" />
              <stop offset="100%" stopColor="#1c262b" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="rgba(255, 158, 44, 0.16)" />
          <rect x="10" y="42" width="44" height="14" rx="5" fill="url(#joy-base)" stroke="#2A1810" strokeWidth="2.2" />
          <ellipse cx="42" cy="46" rx="4" ry="2.2" fill="#ff1744" />
          <ellipse cx="49" cy="49" rx="4" ry="2.2" fill="#ffea00" />
          <rect x="24" y="23" width="5" height="20" rx="2" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1.5" />
          <ellipse cx="26.5" cy="43" rx="8" ry="3.5" fill="#263238" />
          <circle cx="26.5" cy="18" r="10.5" fill="url(#joy-ball)" stroke="#2A1810" strokeWidth="2" />
          <ellipse cx="23" cy="14" rx="3.2" ry="2" fill="#ffffff" opacity="0.75" transform="rotate(-25 23 14)" />
        </svg>
      );

    case 'floppy':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="floppy-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2979ff" />
              <stop offset="100%" stopColor="#0d47a1" />
            </linearGradient>
          </defs>
          <path
            d="M 10 8 L 48 8 L 54 14 L 54 56 L 10 56 Z"
            fill="url(#floppy-body)"
            stroke="#2A1810"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="17" y="10" width="28" height="20" rx="2" fill="#FFF5DC" stroke="#2A1810" strokeWidth="1.2" />
          <line x1="21" y1="15" x2="41" y2="15" stroke="#DF5327" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="21" y1="20" x2="38" y2="20" stroke="#2979ff" strokeWidth="2" strokeLinecap="round" />
          <rect x="20" y="36" width="24" height="20" rx="1.5" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1.5" />
          <rect x="24" y="39" width="6" height="14" rx="1" fill="#1c262b" />
        </svg>
      );

    case 'cartridge':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="cart-shell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#90a4ae" />
              <stop offset="100%" stopColor="#37474f" />
            </linearGradient>
            <linearGradient id="cart-art" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9E2C" />
              <stop offset="50%" stopColor="#DF5327" />
              <stop offset="100%" stopColor="#651fff" />
            </linearGradient>
          </defs>
          <rect x="10" y="6" width="44" height="50" rx="4" fill="url(#cart-shell)" stroke="#2A1810" strokeWidth="2.2" />
          <rect x="17" y="12" width="30" height="26" rx="2.5" fill="url(#cart-art)" stroke="#2A1810" strokeWidth="1.5" />
          <polygon points="28,19 39,25 28,31" fill="#FFF5DC" />
          <rect x="16" y="48" width="32" height="8" fill="#212121" />
          <rect x="19" y="49" width="3" height="7" fill="#ffd740" />
          <rect x="25" y="49" width="3" height="7" fill="#ffd740" />
          <rect x="31" y="49" width="3" height="7" fill="#ffd740" />
          <rect x="37" y="49" width="3" height="7" fill="#ffd740" />
          <rect x="43" y="49" width="3" height="7" fill="#ffd740" />
        </svg>
      );

    case 'cassette':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="cass-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8a65" />
              <stop offset="100%" stopColor="#bf360c" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="rgba(255, 112, 67, 0.16)" />
          <rect x="6" y="14" width="52" height="36" rx="4" fill="url(#cass-body)" stroke="#2A1810" strokeWidth="2.2" />
          <rect x="11" y="18" width="42" height="16" rx="2" fill="#FFF5DC" stroke="#2A1810" strokeWidth="1.3" />
          <line x1="15" y1="23" x2="42" y2="23" stroke="#2979ff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="15" y1="28" x2="36" y2="28" stroke="#DF5327" strokeWidth="2" strokeLinecap="round" />
          <rect x="19" y="36" width="26" height="10" rx="5" fill="#212121" stroke="#2A1810" strokeWidth="1.5" />
          <circle cx="26" cy="41" r="3.6" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1" />
          <circle cx="38" cy="41" r="3.6" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1" />
          <circle cx="26" cy="41" r="1.3" fill="#212121" />
          <circle cx="38" cy="41" r="1.3" fill="#212121" />
          <circle cx="10" cy="46" r="1.4" fill="#2A1810" />
          <circle cx="54" cy="46" r="1.4" fill="#2A1810" />
        </svg>
      );

    case 'token':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <radialGradient id="tok-gold" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fffde7" />
              <stop offset="45%" stopColor="#ffd54f" />
              <stop offset="100%" stopColor="#e65100" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="rgba(255, 213, 79, 0.18)" />
          <circle cx="32" cy="32" r="24" fill="url(#tok-gold)" stroke="#2A1810" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="18.5" fill="none" stroke="#a65d00" strokeWidth="1.6" strokeDasharray="3 2.4" />
          <g fill="#7a3b00">
            {PIXEL_P.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />
            ))}
          </g>
          <path d="M 14 25 A 20 20 0 0 1 30 12" stroke="#fffde7" strokeWidth="2.5" fill="none" opacity="0.75" strokeLinecap="round" />
        </svg>
      );

    case 'crt':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="crt-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#607d8b" />
              <stop offset="100%" stopColor="#263238" />
            </linearGradient>
            <radialGradient id="crt-screen" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#b9f6ca" />
              <stop offset="55%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#006064" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="34" r="28" fill="rgba(0, 229, 255, 0.14)" />
          <path d="M 24 14 L 18 4 M 40 14 L 46 4" stroke="#cfd8dc" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="18" cy="4" r="1.8" fill="#cfd8dc" />
          <circle cx="46" cy="4" r="1.8" fill="#cfd8dc" />
          <rect x="6" y="13" width="52" height="40" rx="7" fill="url(#crt-body)" stroke="#2A1810" strokeWidth="2.2" />
          <rect x="11" y="18" width="33" height="29" rx="9" fill="url(#crt-screen)" stroke="#2A1810" strokeWidth="1.8" />
          <g stroke="rgba(0, 60, 70, 0.35)" strokeWidth="1">
            <line x1="14" y1="25" x2="41" y2="25" />
            <line x1="14" y1="29" x2="41" y2="29" />
            <line x1="14" y1="33" x2="41" y2="33" />
            <line x1="14" y1="37" x2="41" y2="37" />
            <line x1="14" y1="41" x2="41" y2="41" />
          </g>
          <path d="M 15 27 C 16 22, 24 20, 30 20.5" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
          <circle cx="51" cy="25" r="3.2" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1.3" />
          <circle cx="51" cy="35" r="3.2" fill="#cfd8dc" stroke="#2A1810" strokeWidth="1.3" />
          <path d="M 48 42 L 54 42 M 48 45 L 54 45 M 48 48 L 54 48" stroke="#1c262b" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="12" y="53" width="8" height="4" rx="1.5" fill="#212121" />
          <rect x="44" y="53" width="8" height="4" rx="1.5" fill="#212121" />
        </svg>
      );

    case 'atari2600':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="atari-wood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d9954a" />
              <stop offset="50%" stopColor="#9a5b26" />
              <stop offset="100%" stopColor="#5d3a1a" />
            </linearGradient>
            <linearGradient id="atari-lid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#56646b" />
              <stop offset="100%" stopColor="#1c262b" />
            </linearGradient>
            <linearGradient id="atari-cart" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78909c" />
              <stop offset="100%" stopColor="#37474f" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="34" r="28" fill="rgba(217, 149, 74, 0.17)" />
          <rect x="22" y="4" width="20" height="14" rx="2" fill="url(#atari-cart)" stroke="#2A1810" strokeWidth="2" />
          <rect x="25" y="7" width="14" height="7" rx="1" fill="#FF9E2C" stroke="#2A1810" strokeWidth="1.1" />
          <path d="M 15 16 L 49 16 L 58 36 L 6 36 Z" fill="url(#atari-lid)" stroke="#2A1810" strokeWidth="2.2" strokeLinejoin="round" />
          <g stroke="#0d1317" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
            <line x1="17" y1="20" x2="47" y2="20" />
            <line x1="15" y1="24" x2="49" y2="24" />
            <line x1="13" y1="28" x2="51" y2="28" />
          </g>
          <g fill="#eceff1" stroke="#2A1810" strokeWidth="1">
            <rect x="12" y="31" width="4.4" height="3.4" rx="0.8" />
            <rect x="18.6" y="31" width="4.4" height="3.4" rx="0.8" />
            <rect x="41" y="31" width="4.4" height="3.4" rx="0.8" />
            <rect x="47.6" y="31" width="4.4" height="3.4" rx="0.8" />
          </g>
          <path
            d="M 6 36 L 58 36 L 58 51 Q 58 54.5 54.5 54.5 L 9.5 54.5 Q 6 54.5 6 51 Z"
            fill="url(#atari-wood)"
            stroke="#2A1810"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <g fill="none" stroke="#4a2c12" strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
            <path d="M 10 41 C 22 39, 34 44, 54 41" />
            <path d="M 10 47 C 24 45, 36 49, 54 46.5" />
          </g>
          <path d="M 9 38.4 L 55 38.4" stroke="#ffd9a0" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    case 'amiga500':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="amiga-top" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#faf6ee" />
              <stop offset="100%" stopColor="#d8cdbd" />
            </linearGradient>
            <linearGradient id="amiga-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d3c8b8" />
              <stop offset="100%" stopColor="#9a8d7c" />
            </linearGradient>
            <radialGradient id="amiga-ball-shade" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
            </radialGradient>
            <clipPath id="amiga-ball-clip">
              <circle cx="46" cy="14" r="9" />
            </clipPath>
          </defs>
          <circle cx="32" cy="34" r="28" fill="rgba(255, 224, 178, 0.17)" />
          <g clipPath="url(#amiga-ball-clip)">
            <rect x="37" y="5" width="18" height="18" fill="#ffffff" />
            <g fill="#e53935">
              <rect x="37" y="5" width="4.5" height="4.5" />
              <rect x="46" y="5" width="4.5" height="4.5" />
              <rect x="41.5" y="9.5" width="4.5" height="4.5" />
              <rect x="50.5" y="9.5" width="4.5" height="4.5" />
              <rect x="37" y="14" width="4.5" height="4.5" />
              <rect x="46" y="14" width="4.5" height="4.5" />
              <rect x="41.5" y="18.5" width="4.5" height="4.5" />
              <rect x="50.5" y="18.5" width="4.5" height="4.5" />
            </g>
            <rect x="37" y="5" width="18" height="18" fill="url(#amiga-ball-shade)" />
          </g>
          <circle cx="46" cy="14" r="9" fill="none" stroke="#2A1810" strokeWidth="2" />
          <path d="M 10 27 L 54 27 L 60 41 L 4 41 Z" fill="url(#amiga-top)" stroke="#2A1810" strokeWidth="2.2" strokeLinejoin="round" />
          <g fill="#eee7da" stroke="#7d7060" strokeWidth="0.9">
            <rect x="13" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="18.8" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="24.6" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="30.4" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="36.2" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="42" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="11" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="17" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="23" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="29" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="35" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="41" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="47" y="33.2" width="4.6" height="2.8" rx="0.6" />
            <rect x="19" y="37.3" width="26" height="2.4" rx="0.8" />
          </g>
          <g fill="#8d8070" stroke="#7d7060" strokeWidth="0.9">
            <rect x="48.6" y="29.2" width="4.4" height="2.8" rx="0.6" />
            <rect x="12" y="37.3" width="5" height="2.4" rx="0.8" />
            <rect x="47" y="37.3" width="5" height="2.4" rx="0.8" />
          </g>
          <path
            d="M 4 41 L 60 41 L 60 50 Q 60 53.5 56.5 53.5 L 7.5 53.5 Q 4 53.5 4 50 Z"
            fill="url(#amiga-front)"
            stroke="#2A1810"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="38" y="45" width="17" height="2.8" rx="1" fill="#3a3530" />
          <circle cx="10.5" cy="47.4" r="1.7" fill="#69f0ae" stroke="#2A1810" strokeWidth="0.8" />
          <circle cx="15.6" cy="47.4" r="1.7" fill="#ff5252" stroke="#2A1810" strokeWidth="0.8" />
        </svg>
      );

    case 'cdrom':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <radialGradient id="cdrom-base" cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#d9e1e5" />
              <stop offset="100%" stopColor="#7c919b" />
            </radialGradient>
            <clipPath id="cdrom-clip">
              <path
                clipRule="evenodd"
                d="M 7 32 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0 Z M 26 32 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 Z"
              />
            </clipPath>
          </defs>
          <circle cx="32" cy="32" r="29" fill="rgba(128, 222, 234, 0.18)" />
          <path
            fillRule="evenodd"
            d="M 7 32 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0 Z M 26 32 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 Z"
            fill="url(#cdrom-base)"
          />
          <g clipPath="url(#cdrom-clip)">
            <polygon points="32,32 52,-2.6 69.6,18.3" fill="#00e5ff" opacity="0.55" />
            <polygon points="32,32 69.6,18.3 69.6,45.7" fill="#ffee58" opacity="0.5" />
            <polygon points="32,32 69.6,45.7 55,64.8" fill="#ff4081" opacity="0.55" />
            <polygon points="32,32 12,66.6 -5.6,45.7" fill="#00e5ff" opacity="0.55" />
            <polygon points="32,32 -5.6,45.7 -5.6,18.3" fill="#ffee58" opacity="0.5" />
            <polygon points="32,32 -5.6,18.3 9,-0.8" fill="#ff4081" opacity="0.55" />
          </g>
          <circle cx="32" cy="32" r="11" fill="none" stroke="#ffffff" strokeWidth="2.2" opacity="0.7" />
          <circle cx="32" cy="32" r="16.5" fill="none" stroke="rgba(120, 144, 156, 0.55)" strokeWidth="0.9" />
          <path
            fillRule="evenodd"
            d="M 7 32 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0 Z M 26 32 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 Z"
            fill="none"
            stroke="#2A1810"
            strokeWidth="2.2"
          />
          <path d="M 14 22 A 20 20 0 0 1 30 11.5" stroke="#ffffff" strokeWidth="2.6" fill="none" opacity="0.8" strokeLinecap="round" />
        </svg>
      );

    case 'nes':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="nes-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f3f4" />
              <stop offset="100%" stopColor="#aab4b9" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="34" r="28" fill="rgba(229, 57, 53, 0.15)" />
          <path d="M 32 18 C 32 10, 40 9, 46 4" stroke="#2A1810" strokeWidth="4.6" strokeLinecap="round" fill="none" />
          <path d="M 32 18 C 32 10, 40 9, 46 4" stroke="#607d8b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <rect x="3" y="17" width="58" height="32" rx="4.5" fill="url(#nes-body)" stroke="#2A1810" strokeWidth="2.2" />
          <rect x="7.5" y="21.5" width="49" height="23" rx="2.5" fill="#2b3237" stroke="#2A1810" strokeWidth="1.2" />
          <path
            d="M 15 25.5 H 21 V 30 H 25.5 V 36 H 21 V 40.5 H 15 V 36 H 10.5 V 30 H 15 Z"
            fill="#cfd8dc"
            stroke="#0d1317"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <rect x="27.5" y="35" width="7.5" height="3.2" rx="1.6" fill="#78909c" stroke="#0d1317" strokeWidth="0.9" />
          <rect x="37" y="35" width="7.5" height="3.2" rx="1.6" fill="#78909c" stroke="#0d1317" strokeWidth="0.9" />
          <circle cx="47" cy="34" r="4" fill="#e53935" stroke="#0d1317" strokeWidth="1.2" />
          <circle cx="54" cy="34" r="4" fill="#e53935" stroke="#0d1317" strokeWidth="1.2" />
          <circle cx="45.8" cy="32.6" r="1.2" fill="#ffffff" opacity="0.75" />
          <circle cx="52.8" cy="32.6" r="1.2" fill="#ffffff" opacity="0.75" />
          <path d="M 7 19.5 L 57 19.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'sega':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full animate-vector-float">
          <defs>
            <linearGradient id="sega-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a565d" />
              <stop offset="45%" stopColor="#1f282d" />
              <stop offset="100%" stopColor="#0d1317" />
            </linearGradient>
            <linearGradient id="sega-cart" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#90a4ae" />
              <stop offset="100%" stopColor="#455a64" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="34" r="28" fill="rgba(66, 165, 245, 0.17)" />
          <rect x="19" y="4" width="26" height="23" rx="3" fill="url(#sega-cart)" stroke="#2A1810" strokeWidth="2.2" />
          <rect x="23" y="8" width="18" height="11" rx="1.5" fill="#1e88e5" stroke="#2A1810" strokeWidth="1.2" />
          <polygon points="29,10.5 36,13.5 29,16.5" fill="#ffffff" />
          <path
            d="M 5 41 C 5 30, 12 25, 22 25 L 42 25 C 52 25, 59 30, 59 41 L 59 50 Q 59 54.5 54.5 54.5 L 9.5 54.5 Q 5 54.5 5 50 Z"
            fill="url(#sega-body)"
            stroke="#2A1810"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <ellipse cx="32" cy="29" rx="17" ry="3.6" fill="#0d1317" stroke="#cfd8dc" strokeWidth="1.2" />
          <path d="M 9 37 C 12 31, 18 28.6, 24 28.4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.28" />
          <rect x="12" y="43" width="12" height="6" rx="1.6" fill="#10161a" stroke="#546e7a" strokeWidth="1" />
          <rect x="40" y="43" width="12" height="6" rx="1.6" fill="#10161a" stroke="#546e7a" strokeWidth="1" />
          <g fill="#546e7a">
            <rect x="14.5" y="44.8" width="1.6" height="2.4" />
            <rect x="17.5" y="44.8" width="1.6" height="2.4" />
            <rect x="20.5" y="44.8" width="1.6" height="2.4" />
            <rect x="42.5" y="44.8" width="1.6" height="2.4" />
            <rect x="45.5" y="44.8" width="1.6" height="2.4" />
            <rect x="48.5" y="44.8" width="1.6" height="2.4" />
          </g>
          <circle cx="32" cy="46.2" r="1.8" fill="#ff1744" stroke="#2A1810" strokeWidth="0.8" />
          <path d="M 27 51.6 L 37 51.6" stroke="#ffca28" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};

// ============================================================================
// GOAL PORTAL & CHECKPOINT SPRITES (HD VECTOR)
// ============================================================================
export const GoalSprite = ({ unlocked = true, remaining = 0 }: { unlocked?: boolean; remaining?: number }) => (
  <svg viewBox="0 0 90 150" className="w-full h-full">
    <defs>
      <linearGradient id="portal-frame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#546e7a" />
        <stop offset="50%" stopColor="#263238" />
        <stop offset="100%" stopColor="#0f171e" />
      </linearGradient>
      <radialGradient id="portal-open" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#00e5ff" />
        <stop offset="75%" stopColor="#7c4dff" />
        <stop offset="100%" stopColor="#1a0033" />
      </radialGradient>
      <radialGradient id="portal-locked" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ff9100" stopOpacity="0.6" />
        <stop offset="60%" stopColor="#d50000" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#1a0000" stopOpacity="0.85" />
      </radialGradient>
    </defs>

    <path
      d="M 6 146 L 6 42 C 6 12, 84 12, 84 42 L 84 146 Z"
      fill="url(#portal-frame)"
      stroke={unlocked ? '#00e5ff' : '#ff5252'}
      strokeWidth="3"
    />
    <path
      d="M 15 142 L 15 44 C 15 22, 75 22, 75 44 L 75 142 Z"
      fill={unlocked ? 'url(#portal-open)' : 'url(#portal-locked)'}
    />

    {unlocked ? (
      <g>
        <ellipse cx="45" cy="85" rx="22" ry="38" fill="none" stroke="#84ffff" strokeWidth="2.5" strokeDasharray="10 6">
          <animateTransform attributeName="transform" type="rotate" from="0 45 85" to="360 45 85" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="45" cy="85" rx="12" ry="22" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4">
          <animateTransform attributeName="transform" type="rotate" from="360 45 85" to="0 45 85" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <text x="45" y="18" textAnchor="middle" fill="#00e676" fontSize="9" fontWeight="bold" fontFamily="Orbitron, sans-serif">
          EXIT OPEN
        </text>
      </g>
    ) : (
      <g>
        <line x1="18" y1="60" x2="72" y2="60" stroke="#ff5252" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="18" y1="85" x2="72" y2="85" stroke="#ff5252" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="18" y1="110" x2="72" y2="110" stroke="#ff5252" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="35" y="76" width="20" height="16" rx="3" fill="#ff1744" stroke="#fff" strokeWidth="1.5" />
        <path d="M 39 76 L 39 70 C 39 65, 51 65, 51 70 L 51 76" fill="none" stroke="#fff" strokeWidth="2.5" />
        <text x="45" y="118" textAnchor="middle" fill="#ffeb3b" fontSize="11" fontWeight="bold" fontFamily="Orbitron, sans-serif">
          -{remaining}
        </text>
      </g>
    )}

    <rect x="2" y="142" width="86" height="8" rx="3" fill="#00e5ff" opacity={unlocked ? 0.9 : 0.35} />
  </svg>
);

export const CheckpointSprite = ({ activated }: { activated: boolean }) => (
  <svg viewBox="0 0 48 96" className="w-full h-full">
    <defs>
      <linearGradient id="cp-pole" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#546e7a" />
        <stop offset="50%" stopColor="#cfd8dc" />
        <stop offset="100%" stopColor="#37474f" />
      </linearGradient>
    </defs>
    <rect x="8" y="88" width="32" height="8" rx="3" fill="#263238" stroke={activated ? '#00e676' : '#00e5ff'} strokeWidth="1.5" />
    <rect x="21" y="16" width="6" height="72" fill="url(#cp-pole)" />
    <polygon
      points="27,18 46,27 27,36"
      fill={activated ? '#00e676' : '#FF9E2C'}
      opacity={activated ? '0.95' : '0.55'}
    />
    <circle
      cx="24"
      cy="14"
      r="7"
      fill={activated ? '#00e676' : '#37474f'}
      stroke="#ffffff"
      strokeWidth="1.5"
    />
  </svg>
);

// ============================================================================
// HUD & PROJECTILE SPRITES (HD VECTOR)
// ============================================================================
export const HeartSprite = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <radialGradient id="heart-grad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="45%" stopColor="#ff1744" />
        <stop offset="100%" stopColor="#880e4f" />
      </radialGradient>
    </defs>
    <path
      d="M 16 28 C 16 28, 3 19, 3 10.5 C 3 5.5, 7 2.5, 11.5 2.5 C 14 2.5, 16 4.5, 16 6.5 C 16 4.5, 18 2.5, 20.5 2.5 C 25 2.5, 29 5.5, 29 10.5 C 29 19, 16 28, 16 28 Z"
      fill="url(#heart-grad)"
      stroke="#2A1810"
      strokeWidth="1.8"
    />
    <ellipse cx="10" cy="8.5" rx="2.8" ry="1.6" fill="#ffffff" opacity="0.65" transform="rotate(-25 10 8.5)" />
  </svg>
);

export const ShieldSprite = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <radialGradient id="aura-shield" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.05" />
        <stop offset="75%" stopColor="#00e5ff" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#84ffff" stopOpacity="0.7" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#aura-shield)" stroke="#00e5ff" strokeWidth="2" />
    <polygon
      points="32,4 56,18 56,46 32,60 8,46 8,18"
      fill="none"
      stroke="#84ffff"
      strokeWidth="1.5"
      strokeDasharray="6 4"
      opacity="0.8"
    />
  </svg>
);

export const PlayerProjectileSprite = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <defs>
      <radialGradient id="plasma-shot" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#FF9E2C" />
        <stop offset="100%" stopColor="#E05326" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#plasma-shot)" />
    <circle cx="12" cy="12" r="5.5" fill="#FFF5DC" stroke="#E05326" strokeWidth="1.5" />
  </svg>
);

export const BombSprite = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <radialGradient id="bomb-sphere" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#546e7a" />
        <stop offset="50%" stopColor="#263238" />
        <stop offset="100%" stopColor="#0a0e12" />
      </radialGradient>
    </defs>
    <path d="M 16 6 Q 20 2, 24 5" stroke="#ff9100" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="5" r="3" fill="#ffea00" className="animate-ping" />
    <circle cx="16" cy="18" r="11" fill="url(#bomb-sphere)" stroke="#2A1810" strokeWidth="1.8" />
    <ellipse cx="12" cy="14" rx="3" ry="1.8" fill="#ffffff" opacity="0.5" transform="rotate(-30 12 14)" />
  </svg>
);

export const EggSprite = () => (
  <svg viewBox="0 0 32 40" className="w-full h-full">
    <defs>
      <radialGradient id="egg-grad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="65%" stopColor="#fff59d" />
        <stop offset="100%" stopColor="#fbc02d" />
      </radialGradient>
    </defs>
    <path
      d="M 16 2 C 7 2, 3 16, 3 26 C 3 34, 9 38, 16 38 C 23 38, 29 34, 29 26 C 29 16, 25 2, 16 2 Z"
      fill="url(#egg-grad)"
      stroke="#2A1810"
      strokeWidth="2"
    />
    <circle cx="12" cy="16" r="2.2" fill="#f57f17" opacity="0.55" />
    <circle cx="20" cy="24" r="3" fill="#f57f17" opacity="0.55" />
    <circle cx="11" cy="29" r="2" fill="#f57f17" opacity="0.55" />
  </svg>
);

export const FireballSprite = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <radialGradient id="fire-orb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#ffea00" />
        <stop offset="70%" stopColor="#ff3d00" />
        <stop offset="100%" stopColor="#d50000" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="16" cy="16" r="15" fill="url(#fire-orb)" />
    <circle cx="16" cy="16" r="7" fill="#fff59d" />
  </svg>
);

export const CDROMSprite = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full animate-spin">
    <defs>
      <linearGradient id="cd-holo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="25%" stopColor="#76ff03" />
        <stop offset="50%" stopColor="#ffea00" />
        <stop offset="75%" stopColor="#ff1744" />
        <stop offset="100%" stopColor="#d500f9" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14.5" fill="#eceff1" stroke="#2A1810" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="11" fill="none" stroke="url(#cd-holo)" strokeWidth="5" opacity="0.85" />
    <circle cx="16" cy="16" r="4" fill="#0d0d1a" stroke="#ffffff" strokeWidth="1.2" />
  </svg>
);
