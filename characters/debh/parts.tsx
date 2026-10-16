import React from 'react';
import { C } from './palette';
import { TracedGroup } from './TracedGroup';
import { HEAD_TRACED } from './traced/head';

/**
 * Debh, in profile, taken apart into parts that the renderer bakes into textures and re-assembles
 * as a 2D skeleton. The head is the one vectorised from the channel logo; the body follows the rig
 * approved in the animated intro. Units are logo pixels (the head is ~290 tall); the origin of the
 * rig is the base of the neck, +x is the direction she faces, +y is down.
 */

/** Ink weight used for the body parts. Heavier than the intro's, so the outline survives at game size. */
export const INK = 9;

export type HeadExpression = 'smile' | 'blink' | 'wink' | 'grin' | 'wow' | 'ouch' | 'effort';

export const HEAD_EXPRESSIONS: HeadExpression[] = ['smile', 'blink', 'wink', 'grin', 'wow', 'ouch', 'effort'];

type Eyes = 'open' | 'closed' | 'wink' | 'wide' | 'squeeze';
type Mouth = 'smile' | 'grin' | 'o' | 'flat' | 'ouch';

const EXPRESSIONS: Record<HeadExpression, { eyes: Eyes; mouth: Mouth; brow: number; browTilt: number }> = {
  smile: { eyes: 'open', mouth: 'smile', brow: 0, browTilt: 0 },
  blink: { eyes: 'closed', mouth: 'smile', brow: 0, browTilt: 0 },
  wink: { eyes: 'wink', mouth: 'grin', brow: -8, browTilt: 0 },
  grin: { eyes: 'open', mouth: 'grin', brow: -4, browTilt: 0 },
  wow: { eyes: 'wide', mouth: 'o', brow: -12, browTilt: 0 },
  ouch: { eyes: 'squeeze', mouth: 'ouch', brow: 2, browTilt: 18 },
  effort: { eyes: 'squeeze', mouth: 'grin', brow: 4, browTilt: -10 },
};

const ink = C.ink;

// ---------------------------------------------------------------------------
// Head (face drawn by hand over the vectorised logo head)
// ---------------------------------------------------------------------------

const Eye: React.FC<{ cx: number; cy: number; s: number; mode: Eyes; flip?: boolean }> = ({ cx, cy, s, mode, flip }) => {
  const k = mode === 'wide' ? 1.2 : 1;
  if (mode === 'closed' || mode === 'wink') {
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <path d="M -44 0 C -24 28 22 30 46 -2" fill="none" stroke={ink} strokeWidth={11} strokeLinecap="round" />
        <path d="M -46 -2 L -55 -10 M 46 -4 L 55 -12" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      </g>
    );
  }
  if (mode === 'squeeze') {
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <path
          d={flip ? 'M 40 -22 L -26 4 L 40 28' : 'M -40 -22 L 26 4 L -40 28'}
          fill="none"
          stroke={ink}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <g transform={`scale(1 ${k})`}>
        <path d="M -48 -14 C -30 -42 26 -44 50 -18" fill="none" stroke={C.skinShade} strokeWidth={8} strokeLinecap="round" />
        <path d="M -40 2 C -30 -24 26 -26 42 -4 C 34 24 -28 26 -40 2 Z" fill="#FFEFD2" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={2} cy={0} r={27} fill={ink} />
        <circle cx={11} cy={-9} r={7.5} fill="#CFC3A4" />
        <path d="M -50 4 C -38 -30 28 -34 50 -6" fill="none" stroke={ink} strokeWidth={12} strokeLinecap="round" />
        <path d="M -50 4 L -60 -4" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      </g>
    </g>
  );
};

const MouthShape: React.FC<{ mode: Mouth }> = ({ mode }) => {
  switch (mode) {
    case 'grin':
      return (
        <g>
          <path d="M 424 448 C 462 436 520 436 548 446 C 546 500 452 512 424 448 Z" fill={C.mouthIn} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
          <path d="M 434 450 C 466 441 516 441 540 449 C 538 460 440 464 434 450 Z" fill={C.white} />
          <path d="M 452 490 C 470 470 510 468 530 486 C 510 502 472 504 452 490 Z" fill={C.lip} />
        </g>
      );
    case 'o':
      return (
        <g>
          <ellipse cx={488} cy={472} rx={24} ry={30} fill={C.mouthIn} stroke={ink} strokeWidth={8} />
          <ellipse cx={488} cy={486} rx={14} ry={11} fill={C.lip} />
        </g>
      );
    case 'flat':
      return <path d="M 440 466 C 470 472 510 472 538 462" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case 'ouch':
      return (
        <path
          d="M 432 470 C 446 454 462 484 478 466 C 494 450 510 482 526 464 C 534 458 540 462 544 468"
          fill="none"
          stroke={ink}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'smile':
    default:
      return (
        <g>
          <path d="M 452 466 C 470 488 512 488 532 462 C 508 474 476 474 452 466 Z" fill={C.lip} />
          <path d="M 430 452 C 456 480 506 484 542 452" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />
          <path d="M 426 446 L 434 456 M 546 446 L 538 456" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
  }
};

const FrontHead: React.FC<{ expression: HeadExpression }> = ({ expression }) => {
  const e = EXPRESSIONS[expression];
  const lMode: Eyes = e.eyes === 'wink' ? 'wink' : e.eyes;
  const rMode: Eyes = e.eyes === 'wink' ? 'open' : e.eyes;
  return (
    <g>
      <TracedGroup obj={HEAD_TRACED} unit={2} x={100} y={20} outline={16} outlineColor={ink} />
      <ellipse cx={392} cy={432} rx={26} ry={14} fill={C.blush} opacity={0.45} />
      <ellipse cx={588} cy={424} rx={18} ry={11} fill={C.blush} opacity={0.35} />
      <MouthShape mode={e.mouth} />
      <Eye cx={428} cy={338} s={1} mode={lMode} />
      <Eye cx={558} cy={346} s={0.9} mode={rMode} flip />
      <g transform={`translate(0 ${e.brow})`}>
        <g transform={`rotate(${-e.browTilt} 425 275)`}>
          <path d="M 372 292 C 394 268 438 258 480 276 C 440 274 404 280 372 292 Z" fill={ink} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
        <g transform={`rotate(${e.browTilt} 565 277)`}>
          <path d="M 520 288 C 542 266 584 266 612 286 C 584 280 550 282 520 288 Z" fill={ink} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};

/** Head on the neck: origin = base of the neck, clipped under the chin like the intro's HeadOnBody. */
export const HeadPart: React.FC<{ expression: HeadExpression }> = ({ expression }) => (
  <g>
    <defs>
      <clipPath id="debh-head-clip">
        <rect x={-300} y={-420} width={600} height={397} />
      </clipPath>
    </defs>
    <g clipPath="url(#debh-head-clip)">
      <g transform="scale(0.5) translate(-470 -600)">
        <FrontHead expression={expression} />
      </g>
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// Body parts
// ---------------------------------------------------------------------------

const s = { stroke: ink, strokeWidth: INK, strokeLinejoin: 'round' as const };

/** Neck + torso (tank top). Origin = base of the neck. */
export const TorsoPart: React.FC = () => (
  <g>
    <path d="M -20 -36 L 28 -36 L 32 22 L -26 22 Z" fill={C.skin} {...s} />
    <path d="M -20 -20 C -6 2 14 2 28 -20 L 28 -4 C 14 16 -6 16 -22 -4 Z" fill={C.skinShade} />
    <path
      d="M -40 -8 C -54 40 -62 130 -58 210 C -56 260 -56 300 -52 332 L 60 332 C 60 292 66 255 68 215 C 72 160 76 100 62 40 C 56 14 46 -4 34 -10 Z"
      fill={C.shirt}
      {...s}
    />
    <path d="M -58 210 C -56 260 -56 300 -52 332 L -30 332 C -34 296 -36 256 -32 196 Z" fill={C.shirtDark} opacity={0.5} />
    <path d="M -40 -8 C -22 10 10 12 34 -10" fill="none" stroke={C.shirtDark} strokeWidth={10} strokeLinecap="round" />
    <path d="M -54 326 L 62 326" stroke={C.shirtDark} strokeWidth={9} />
  </g>
);

/** Short sleeve, hanging straight down from the shoulder (origin = shoulder). */
export const SleevePart: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const main = dark ? C.shirtDark : C.shirt;
  const edge = dark ? '#8F3414' : C.shirtDark;
  const hw = 32;
  const len = 80;
  return (
    <g>
      <path d={`M ${-hw} ${len} L ${-hw - 3} 6 Q ${-hw} -26 0 -26 Q ${hw} -26 ${hw + 3} 6 L ${hw} ${len} Z`} fill={main} {...s} />
      <path d={`M ${-hw + 1} ${len - 9} L ${hw - 1} ${len - 9} L ${hw} ${len} L ${-hw} ${len} Z`} fill={edge} />
    </g>
  );
};

export type HandKind = 'open' | 'fist' | 'thumbsUp';

/** Hand, origin = wrist, +y toward the fingers. */
export const HandPart: React.FC<{ kind: HandKind; dark?: boolean }> = ({ kind, dark }) => {
  const skin = dark ? C.skinShade : C.skin;
  const hs = { stroke: ink, strokeWidth: INK - 1, strokeLinejoin: 'round' as const };
  if (kind === 'thumbsUp') {
    return (
      <g>
        <path d="M -10 52 C -16 74 -10 98 6 100 C 22 102 28 84 24 68 L 24 52 Z" fill={skin} {...hs} />
        <path d="M 4 92 C 10 96 18 94 20 88" fill="none" stroke={C.skinShade} strokeWidth={3} strokeLinecap="round" />
        <rect x={-31} y={0} width={62} height={64} rx={18} fill={skin} {...hs} />
        <path d="M -29 19 Q 0 26 29 19 M -30 35 Q 0 42 30 35 M -29 50 Q 0 57 29 50" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'fist') {
    return (
      <g>
        <rect x={-30} y={0} width={60} height={58} rx={18} fill={skin} {...hs} />
        <path d="M -28 18 Q 0 25 28 18 M -29 34 Q 0 41 29 34" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
        <path d="M -30 8 C -44 14 -44 34 -30 40" fill={skin} {...hs} />
      </g>
    );
  }
  return (
    <g>
      <path d="M -16 0 C -24 22 -22 48 -12 60 C -4 68 12 66 17 54 C 25 38 23 16 16 0 Z" fill={skin} {...hs} />
      <path d="M -12 60 L -12 40 M -2 64 L -2 40 M 8 62 L 8 40" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <path d="M -16 14 C -30 24 -28 42 -18 48" fill={skin} {...hs} />
    </g>
  );
};

/** Sneaker, toe toward +x, origin = ankle. */
export const ShoePart: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const body = dark ? '#D9CBB4' : C.shoe;
  const acc = dark ? '#B24E16' : C.shoeAccent;
  const sole = dark ? '#C2B196' : C.sole;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M -30 -16 C -36 6 -36 26 -32 34 L 90 38 C 106 34 104 16 84 10 C 60 2 44 -6 34 -18 C 14 -26 -14 -26 -30 -16 Z" fill={body} stroke={ink} strokeWidth={INK} />
      <path d="M -33 26 L 94 31 C 98 44 94 50 84 50 L -30 46 C -36 44 -36 32 -33 26 Z" fill={sole} stroke={ink} strokeWidth={INK} />
      <path d="M -30 8 C 6 12 40 16 78 14" fill="none" stroke={acc} strokeWidth={8} />
      <path d="M 40 -4 L 46 4 M 28 -8 L 34 0 M 52 2 L 58 10" fill="none" stroke={ink} strokeWidth={3} />
      <path d="M -26 -14 C -12 -20 10 -20 26 -14" fill="none" stroke={acc} strokeWidth={6} />
    </g>
  );
};

/** Leg of the shorts, hanging straight down from the hip (origin = hip). */
export const ShortsPart: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const w = 88;
  const len = 118;
  return (
    <g>
      <path
        d={`M ${-w / 2} -34 L ${w / 2} -34 L ${w / 2 + 6} ${len} L ${-w / 2 - 6} ${len} Z`}
        fill={dark ? C.shortsDark : C.shorts}
        {...s}
      />
      <path
        d={`M ${-w / 2 - 6} ${len - 14} L ${w / 2 + 6} ${len - 14} L ${w / 2 + 6} ${len} L ${-w / 2 - 6} ${len} Z`}
        fill={dark ? '#1F3F73' : C.shortsDark}
      />
    </g>
  );
};

/** Her signature gamepad (from the logo). Origin = centre, drawn horizontally. */
export const PadPart: React.FC = () => (
  <g>
    <path
      d="M -78 -18 C -82 -40 -52 -48 -30 -44 L 30 -44 C 52 -48 82 -40 78 -18 C 80 10 88 46 70 54 C 56 58 46 36 36 24 L -36 24 C -46 36 -56 58 -70 54 C -88 46 -80 10 -78 -18 Z"
      fill="#3D2B22"
      stroke={ink}
      strokeWidth={INK}
      strokeLinejoin="round"
    />
    <path d="M -60 -34 L 60 -34" stroke="#6B4A39" strokeWidth={6} strokeLinecap="round" />
    <path d="M -52 -10 L -34 -10 M -43 -19 L -43 -1" stroke="#9C7A66" strokeWidth={9} strokeLinecap="round" />
    <circle cx={40} cy={-18} r={8} fill="#FF9E2C" />
    <circle cx={56} cy={-4} r={8} fill="#DE5F1C" />
    <circle cx={24} cy={-4} r={8} fill="#FFF5DC" />
    <circle cx={40} cy={10} r={8} fill="#00E5FF" />
  </g>
);

// ---------------------------------------------------------------------------
// Bounding boxes (rig units) used when baking each part: [x, y, width, height]
// ---------------------------------------------------------------------------

export const BBOX = {
  head: [-190, -345, 380, 340],
  torso: [-80, -50, 170, 395],
  sleeve: [-48, -40, 96, 140],
  hand: [-60, -10, 120, 130],
  shoe: [-52, -34, 170, 96],
  shorts: [-62, -48, 124, 180],
  pad: [-100, -62, 200, 130],
} as const;
