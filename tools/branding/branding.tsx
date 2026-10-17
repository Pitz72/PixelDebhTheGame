/**
 * Dev page for the promotional images (npm run dev, then /tools/branding/branding.html?asset=banner-16x9).
 * Social banners (16:9, 21:9, 1:1, 9:16), the GitHub social preview and the poster are composed here from
 * the game's own art (the vector React sprites and Debh's rig), then `node tools/branding/export.mjs` takes
 * a screenshot of each at its exact size into branding/. `?asset=debh-poses` shows the poses to pick from.
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import '@fontsource-variable/orbitron';
import '@fontsource/press-start-2p';
import '../../index.css';
import { Application, Texture } from 'pixi.js';
import { FrogBossArt } from '../../components/bosses/FrogArt';
import { ChickenEyeBossArt } from '../../components/bosses/ChickenEyeArt';
import ShadowHeadBoss from '../../components/ShadowHeadBoss';
import { EnemySprite, ItemSprite } from '../../services/assetService';
import type { Boss } from '../../types';
import { DebhRig, groundLineY, RIG_HEIGHT, type DebhPose } from '../../characters/debh/rig';
import { idlePose, aimPose, CHEER, JUMP_APEX, throwPose, CARRY } from '../../characters/debh/anim';
import {
  BBOX,
  HEAD_EXPRESSIONS,
  HeadPart,
  TorsoPart,
  SleevePart,
  HandPart,
  ShoePart,
  ShortsPart,
  PadPart,
  type HandKind,
  type HeadExpression,
} from '../../characters/debh/parts';
import type { DebhTextures, PartTexture } from '../../characters/debh/bake';
import { extractSvg, svgToCanvas } from '../../renderer/svgTexture';
import rmLogo from './assets/runtime-multimedia-bianco.png';

const ASSET = new URLSearchParams(location.search).get('asset') ?? 'banner-16x9';
const ACCENT = '#FFA43B';
const CYAN = '#00e5ff';
const MAGENTA = '#e8175d';
const DISPLAY = "'Orbitron Variable', 'Orbitron', sans-serif";
const PIXEL = "'Press Start 2P', monospace";

// ───────────────────────── Debh at a resolution fit for a poster ─────────────────────────
// Same baking as characters/debh/bake.tsx, but with more texels per rig unit (the game uses 0.5).

async function bakeOne(el: React.ReactElement, box: readonly [number, number, number, number], scale: number): Promise<PartTexture> {
  const [x, y, w, h] = box;
  const markup = renderToStaticMarkup(
    <svg viewBox={`${x} ${y} ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {el}
    </svg>
  );
  const canvas = await svgToCanvas(extractSvg(markup), w, h, scale);
  const texture = Texture.from(canvas);
  texture.source.autoGenerateMipmaps = true;
  return { texture, anchorX: -x / w, anchorY: -y / h, unit: 1 / scale };
}

async function bakeDebhAt(scale: number): Promise<DebhTextures> {
  const head = {} as Record<HeadExpression, PartTexture>;
  const hand: Record<string, PartTexture> = {};
  const kinds: HandKind[] = ['open', 'fist', 'thumbsUp'];
  const [torso, sleeve, sleeveDark, shoe, shoeDark, shorts, shortsDark, pad] = await Promise.all([
    bakeOne(<TorsoPart />, BBOX.torso, scale),
    bakeOne(<SleevePart />, BBOX.sleeve, scale),
    bakeOne(<SleevePart dark />, BBOX.sleeve, scale),
    bakeOne(<ShoePart />, BBOX.shoe, scale),
    bakeOne(<ShoePart dark />, BBOX.shoe, scale),
    bakeOne(<ShortsPart />, BBOX.shorts, scale),
    bakeOne(<ShortsPart dark />, BBOX.shorts, scale),
    bakeOne(<PadPart />, BBOX.pad, scale),
    ...HEAD_EXPRESSIONS.map(async e => {
      head[e] = await bakeOne(<HeadPart expression={e} />, BBOX.head, scale);
    }),
    ...kinds.flatMap(k => [
      bakeOne(<HandPart kind={k} />, BBOX.hand, scale).then(t => void (hand[k] = t)),
      bakeOne(<HandPart kind={k} dark />, BBOX.hand, scale).then(t => void (hand[`${k}Dark`] = t)),
    ]),
  ]);
  return { head, torso, sleeve, sleeveDark, hand, shoe, shoeDark, shorts, shortsDark, pad };
}

interface DebhShot {
  src: string;
  width: number;
  height: number;
}

/** Debh in one pose as a transparent PNG, `heightPx` tall (the rig's standing height). */
async function renderDebh(textures: DebhTextures, pose: DebhPose, heightPx: number): Promise<DebhShot> {
  const S = heightPx / RIG_HEIGHT;
  const width = Math.round(heightPx * 1.25);
  const height = Math.round(heightPx * 1.08);
  const app = new Application();
  await app.init({ width, height, backgroundAlpha: 0, antialias: true, autoStart: false, resolution: 1 });
  const rig = new DebhRig(textures);
  rig.apply(pose);
  rig.root.scale.set(S);
  rig.root.position.set(width * 0.42, height - 10 - groundLineY(pose) * S);
  app.stage.addChild(rig.root);
  app.renderer.render({ container: app.stage });
  // the extraction crops to the figure's own bounds, so the size to use is the canvas it gives back
  const canvas = app.renderer.extract.canvas(app.stage) as HTMLCanvasElement;
  const shot: DebhShot = { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  app.destroy(true, { children: true });
  return shot;
}

// ───────────────────────── The synthwave scene (vector, any size) ─────────────────────────

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface SceneProps {
  w: number;
  h: number;
  horizon: number;
  sun: { x: number; y: number; r: number; opacity?: number };
  seed?: number;
}

const WINDOW_COLORS = [CYAN, '#ffd23f', '#ff4fa3', '#ffffff'];

const SynthScene: React.FC<SceneProps> = ({ w, h, horizon, sun, seed = 7 }) => {
  const hy = Math.round(h * horizon);
  const rand = rng(seed);
  const stars = Array.from({ length: Math.round((w * hy) / 7000) }, () => ({
    x: rand() * w,
    y: rand() * hy * 0.9,
    r: 0.6 + rand() * 1.9,
    o: 0.25 + rand() * 0.7,
  }));
  const layer = (maxH: number, lit: number) => {
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    const wins: { x: number; y: number; c: string; o: number }[] = [];
    let x = -30;
    while (x < w + 30) {
      const bw = 44 + rand() * 96;
      const bh = maxH * (0.22 + rand() * 0.78);
      rects.push({ x, y: hy - bh, w: bw, h: bh + 3 });
      for (let wx = x + 9; wx < x + bw - 14; wx += 16) {
        for (let wy = hy - bh + 14; wy < hy - 12; wy += 22) {
          if (rand() < lit) wins.push({ x: wx, y: wy, c: WINDOW_COLORS[Math.floor(rand() * WINDOW_COLORS.length)], o: 0.35 + rand() * 0.55 });
        }
      }
      x += bw + 4 + rand() * 20;
    }
    return { rects, wins };
  };
  const far = layer(h * 0.15, 0.1);
  const near = layer(h * 0.1, 0.18);
  const floorH = h - hy;
  const cx = w / 2;
  const hLines = Array.from({ length: 16 }, (_, k) => hy + floorH * Math.pow((k + 1) / 16, 2.3));
  const vLines = Array.from({ length: 41 }, (_, i) => cx + (i - 20) * (w / 20));
  const bars = Array.from({ length: 9 }, (_, i) => ({ y: sun.y + sun.r * (0.06 + i * 0.1), h: sun.r * (0.025 + i * 0.012) }));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05020f" />
          <stop offset="0.45" stopColor="#1d0a3f" />
          <stop offset="0.8" stopColor="#6d1a6f" />
          <stop offset="1" stopColor="#ff4d6d" />
        </linearGradient>
        <linearGradient id="sunG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.28" stopColor="#ffd23f" />
          <stop offset="0.55" stopColor="#ff9f1c" />
          <stop offset="0.85" stopColor="#ff2d7a" />
          <stop offset="1" stopColor="#b4146e" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#ff9f1c" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ff2d7a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff2d7a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a0a52" />
          <stop offset="1" stopColor="#07031a" />
        </linearGradient>
        <mask id="slits">
          <rect x="0" y="0" width={w} height={h} fill="#fff" />
          {bars.map((b, i) => (
            <rect key={i} x={sun.x - sun.r - 4} y={b.y} width={sun.r * 2 + 8} height={b.h} fill="#000" />
          ))}
        </mask>
        <linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4fa3" stopOpacity="0" />
          <stop offset="1" stopColor="#ff4fa3" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#sky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
      ))}
      <circle cx={sun.x} cy={sun.y} r={sun.r * 2.1} fill="url(#sunGlow)" />
      <circle cx={sun.x} cy={sun.y} r={sun.r} fill="url(#sunG)" mask="url(#slits)" opacity={sun.opacity ?? 1} />
      <rect x="0" y={hy - h * 0.09} width={w} height={h * 0.09} fill="url(#horizonGlow)" />
      <g fill="#1a0a3d" opacity="0.85">
        {far.rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
        ))}
      </g>
      {far.wins.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width="5" height="8" fill={q.c} opacity={q.o * 0.6} />
      ))}
      <g fill="#0d041f">
        {near.rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
        ))}
      </g>
      {near.wins.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width="6" height="9" fill={q.c} opacity={q.o} />
      ))}
      <rect x="0" y={hy} width={w} height={floorH} fill="url(#ground)" />
      <g stroke={CYAN} strokeOpacity="0.55" strokeWidth="2">
        {hLines.map((y, i) => (
          <line key={i} x1="0" y1={y} x2={w} y2={y} />
        ))}
      </g>
      <g stroke="#ff4fa3" strokeOpacity="0.5" strokeWidth="2">
        {vLines.map((x, i) => (
          <line key={i} x1={cx + (x - cx) * 0.04} y1={hy} x2={x} y2={h} />
        ))}
      </g>
      <rect x="0" y={hy - 1} width={w} height="3" fill={CYAN} opacity="0.85" />
    </svg>
  );
};

// ───────────────────────── Shared pieces ─────────────────────────

const Logo: React.FC<{ cx: number; cy: number; d: number }> = ({ cx, cy, d }) => (
  <div
    style={{
      position: 'absolute',
      left: cx - d / 2,
      top: cy - d / 2,
      width: d,
      height: d,
      borderRadius: '50%',
      boxShadow: `0 0 0 ${d * 0.018}px #fff6, 0 0 ${d * 0.1}px ${d * 0.02}px ${ACCENT}aa, 0 0 ${d * 0.3}px ${d * 0.04}px ${MAGENTA}66`,
    }}
  >
    <img src="/pixeldebh-logo.png" alt="" style={{ width: '100%', height: '100%', display: 'block', borderRadius: '50%' }} />
  </div>
);

const Title: React.FC<{ t1: number; t2: number; align: 'left' | 'center' }> = ({ t1, t2, align }) => (
  <div style={{ textAlign: align, lineHeight: 1 }}>
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 900,
        fontSize: t1,
        letterSpacing: '0.03em',
        color: '#fff',
        textShadow: `0 0 ${t1 * 0.12}px ${CYAN}, 0 0 ${t1 * 0.4}px ${CYAN}88, 0 ${t1 * 0.03}px 0 #0b0720`,
        whiteSpace: 'nowrap',
      }}
    >
      PIXELDEBH
    </div>
    <div style={{ position: 'relative', marginTop: t2 * 0.18, display: 'inline-block' }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: t2 * 0.06,
          top: t2 * 0.06,
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: t2,
          letterSpacing: '0.03em',
          color: MAGENTA,
          whiteSpace: 'nowrap',
        }}
      >
        RETRO-RESCUE!
      </span>
      <span
        style={{
          position: 'relative',
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: t2,
          letterSpacing: '0.03em',
          background: 'linear-gradient(180deg, #fff7b0 0%, #ffd23f 45%, #ff9f1c 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          whiteSpace: 'nowrap',
        }}
      >
        RETRO-RESCUE!
      </span>
    </div>
  </div>
);

const Badge: React.FC<{ size: number; sub: number; align: 'left' | 'center' }> = ({ size, sub, align }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: size * 0.55 }}>
    <div
      style={{
        fontFamily: PIXEL,
        fontSize: size,
        color: '#fff',
        padding: `${size * 0.7}px ${size * 1.1}px`,
        borderRadius: size * 0.5,
        background: `linear-gradient(90deg, ${MAGENTA}, #ff7a1a)`,
        border: `${Math.max(3, size * 0.12)}px solid #fff`,
        boxShadow: `0 0 ${size * 1.2}px ${MAGENTA}aa, 0 ${size * 0.22}px 0 #0b0720`,
        textShadow: `0 ${size * 0.1}px 0 #0b0720`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      DISPONIBILE ORA!
    </div>
    <div
      style={{
        fontFamily: PIXEL,
        fontSize: sub,
        color: CYAN,
        textShadow: `0 0 ${sub * 0.8}px ${CYAN}99`,
        whiteSpace: 'nowrap',
        background: 'rgba(7, 3, 26, 0.62)',
        padding: `${sub * 0.55}px ${sub * 1.0}px`,
        borderRadius: sub * 0.6,
      }}
    >
      GRATIS · WINDOWS · LINUX
    </div>
  </div>
);

const RM: React.FC<{ w: number; right?: number; left?: number; bottom: number }> = ({ w, right, left, bottom }) => (
  <img
    src={rmLogo}
    alt=""
    style={{ position: 'absolute', width: w, right, left, bottom, opacity: 0.95, filter: 'drop-shadow(0 4px 10px #000a)' }}
  />
);

const Float: React.FC<{ type: string; cx: number; cy: number; size: number; rot: number; o: number }> = ({ type, cx, cy, size, rot, o }) => (
  <div
    style={{
      position: 'absolute',
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      transform: `rotate(${rot}deg)`,
      opacity: o,
      filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.28))',
    }}
  >
    <ItemSprite type={type} />
  </div>
);

// ───────────────────────── Banners ─────────────────────────

type FloatSpec = [type: string, cx: number, cy: number, size: number, rot: number, o: number];

interface BannerCfg {
  w: number;
  h: number;
  logo: { cx: number; cy: number; d: number };
  text: { x: number; cy: number; w: number; align: 'left' | 'center' };
  t1: number;
  t2: number;
  badge: number;
  sub: number;
  rm: { w: number; right?: number; left?: number; bottom: number };
  horizon: number;
  sun: { x: number; y: number; r: number; opacity?: number };
  items: FloatSpec[];
}

const BANNERS: Record<string, BannerCfg> = {
  'banner-16x9': {
    w: 1920,
    h: 1080,
    logo: { cx: 470, cy: 500, d: 600 },
    text: { x: 870, cy: 500, w: 940, align: 'left' },
    t1: 132,
    t2: 84,
    badge: 36,
    sub: 20,
    rm: { w: 300, right: 60, bottom: 50 },
    horizon: 0.84,
    sun: { x: 1640, y: 830, r: 250, opacity: 0.9 },
    items: [
      ['joystick', 120, 150, 120, -14, 0.8],
      ['floppy', 1810, 140, 100, 12, 0.8],
      ['nes', 800, 940, 120, -8, 0.7],
      ['atari2600', 1390, 975, 130, 6, 0.7],
    ],
  },
  'banner-21x9': {
    w: 2560,
    h: 1080,
    logo: { cx: 520, cy: 500, d: 640 },
    text: { x: 1010, cy: 500, w: 1300, align: 'left' },
    t1: 168,
    t2: 106,
    badge: 40,
    sub: 22,
    rm: { w: 330, right: 70, bottom: 50 },
    horizon: 0.84,
    sun: { x: 2150, y: 830, r: 260, opacity: 0.9 },
    items: [
      ['joystick', 130, 150, 120, -14, 0.8],
      ['cartridge', 2380, 150, 110, 14, 0.8],
      ['floppy', 960, 960, 100, -10, 0.65],
      ['cdrom', 1530, 975, 110, 8, 0.65],
      ['nes', 2330, 560, 120, -8, 0.7],
    ],
  },
  'banner-1x1': {
    w: 1080,
    h: 1080,
    logo: { cx: 540, cy: 285, d: 440 },
    text: { x: 540, cy: 690, w: 1000, align: 'center' },
    t1: 112,
    t2: 70,
    badge: 32,
    sub: 18,
    rm: { w: 250, right: 45, bottom: 40 },
    horizon: 0.86,
    sun: { x: 540, y: 820, r: 230, opacity: 0.55 },
    items: [
      ['joystick', 110, 120, 110, -14, 0.8],
      ['floppy', 970, 130, 100, 12, 0.8],
      ['nes', 90, 560, 100, -8, 0.7],
      ['cartridge', 990, 520, 100, 10, 0.7],
    ],
  },
  'banner-9x16': {
    w: 1080,
    h: 1920,
    logo: { cx: 540, cy: 500, d: 680 },
    text: { x: 540, cy: 1120, w: 1000, align: 'center' },
    t1: 120,
    t2: 74,
    badge: 34,
    sub: 20,
    rm: { w: 280, left: 50, bottom: 70 },
    horizon: 0.88,
    sun: { x: 540, y: 1560, r: 300, opacity: 0.55 },
    items: [
      ['joystick', 110, 130, 120, -14, 0.8],
      ['floppy', 970, 150, 110, 12, 0.8],
      ['nes', 100, 900, 120, -8, 0.7],
      ['atari2600', 960, 880, 130, 8, 0.7],
      ['cdrom', 140, 1400, 110, 10, 0.65],
      ['cartridge', 950, 1380, 110, -10, 0.65],
    ],
  },
  'github-social': {
    w: 1280,
    h: 640,
    logo: { cx: 270, cy: 320, d: 420 },
    text: { x: 540, cy: 300, w: 700, align: 'left' },
    t1: 82,
    t2: 52,
    badge: 22,
    sub: 13,
    rm: { w: 200, right: 36, bottom: 30 },
    horizon: 0.84,
    sun: { x: 1090, y: 520, r: 160, opacity: 0.85 },
    items: [
      ['joystick', 70, 80, 80, -14, 0.8],
      ['floppy', 1210, 90, 72, 12, 0.8],
    ],
  },
};

const Banner: React.FC<{ cfg: BannerCfg }> = ({ cfg }) => {
  const { text } = cfg;
  const left = text.align === 'center' ? text.x - text.w / 2 : text.x;
  return (
    <div style={{ position: 'relative', width: cfg.w, height: cfg.h, overflow: 'hidden', background: '#07031a' }}>
      <SynthScene w={cfg.w} h={cfg.h} horizon={cfg.horizon} sun={cfg.sun} seed={5} />
      {cfg.items.map((it, i) => (
        <Float key={i} type={it[0]} cx={it[1]} cy={it[2]} size={it[3]} rot={it[4]} o={it[5]} />
      ))}
      <Logo {...cfg.logo} />
      <div
        style={{
          position: 'absolute',
          left,
          top: text.cy,
          width: text.w,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: text.align === 'center' ? 'center' : 'flex-start',
          gap: cfg.t1 * 0.34,
        }}
      >
        <Title t1={cfg.t1} t2={cfg.t2} align={text.align} />
        <Badge size={cfg.badge} sub={cfg.sub} align={text.align} />
      </div>
      <RM {...cfg.rm} />
    </div>
  );
};

// ───────────────────────── Poster ─────────────────────────

const POSTER_W = 2000;
const POSTER_H = 3000;

const HEAD: Boss = { x: 0, y: 0, width: 600, height: 600, opacity: 1, isHit: false } as unknown as Boss;

const Poster: React.FC<{ debh: DebhShot | null }> = ({ debh }) => (
  <div style={{ position: 'relative', width: POSTER_W, height: POSTER_H, overflow: 'hidden', background: '#07031a' }}>
    <SynthScene w={POSTER_W} h={POSTER_H} horizon={0.8} sun={{ x: 1000, y: 1520, r: 640 }} seed={11} />
    {/* rays out of the sun */}
    <svg width={POSTER_W} height={POSTER_H} style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: 0.35 }}>
      <defs>
        <radialGradient id="rayFade" cx="1000" cy="1520" r="1700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: 14 }, (_, i) => {
        const a0 = (i / 14) * Math.PI * 2;
        const a1 = a0 + 0.1;
        const R = 3200;
        return (
          <polygon
            key={i}
            points={`1000,1520 ${1000 + Math.cos(a0) * R},${1520 + Math.sin(a0) * R} ${1000 + Math.cos(a1) * R},${1520 + Math.sin(a1) * R}`}
            fill="url(#rayFade)"
          />
        );
      })}
    </svg>

    <div style={{ position: 'absolute', top: 70, width: '100%', textAlign: 'center', fontFamily: PIXEL, fontSize: 30, color: '#fff', opacity: 0.9, letterSpacing: '0.12em' }}>
      RUNTIME MULTIMEDIA PRESENTA
    </div>
    <div
      style={{
        position: 'absolute',
        top: 160,
        width: '100%',
        textAlign: 'center',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 62,
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        color: '#fff',
        textShadow: `0 0 30px ${CYAN}, 0 0 80px ${CYAN}88`,
      }}
    >
      CATTURA. LANCIA. RACCOGLI TUTTO.
    </div>

    {/* the three bosses, looming */}
    <div style={{ position: 'absolute', left: 90, top: 420, width: 640, height: 640, transform: 'rotate(-7deg)', filter: 'drop-shadow(0 0 60px #22ff88aa)' }}>
      <FrogBossArt pose={{ armL: -24, armR: 20, legL: 18, legR: -14 }} />
    </div>
    <div style={{ position: 'absolute', left: 650, top: 250, width: 700, height: 700, filter: 'drop-shadow(0 0 70px #ffaa33aa)' }}>
      <ChickenEyeBossArt pose={{ henX: 0.2, step: 0.4, flip: false, blink: false }} />
    </div>
    <div style={{ position: 'absolute', left: 1300, top: 430, width: 600, height: 600, transform: 'rotate(6deg)', filter: 'drop-shadow(0 0 60px #ff3355aa)' }}>
      <ShadowHeadBoss boss={HEAD} />
    </div>

    {/* Debh */}
    {debh ? (
      <img
        src={debh.src}
        alt=""
        style={{ position: 'absolute', left: 1000 - debh.width * 0.42 + 60, top: 2230 - debh.height, width: debh.width, height: debh.height, filter: 'drop-shadow(0 30px 40px #000a)' }}
      />
    ) : null}

    {/* a few of the swarm at her feet */}
    {(
      [
        ['base', 'active', 230, 2090, 170, 0],
        ['jumper', 'active', 1780, 2080, 170, 0],
        ['flyer', 'active', 430, 1500, 170, -8],
        ['bomber', 'active', 1650, 1620, 170, 6],
        ['phaser', 'active', 300, 1930, 170, 4],
      ] as const
    ).map(([type, state, cx, cy, size, rot], i) => (
      <div key={i} style={{ position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 0 24px #0009)' }}>
        <EnemySprite type={type} state={state} />
      </div>
    ))}

    {/* the haul, orbiting */}
    {(
      [
        ['atari2600', 1620, 1280, 250, 10, 1],
        ['amiga500', 330, 1260, 260, -9, 1],
        ['nes', 1560, 1900, 230, -12, 1],
        ['joystick', 420, 1750, 200, 14, 1],
        ['cartridge', 1830, 1830, 190, 10, 0.95],
        ['cdrom', 140, 1760, 170, -8, 0.95],
        ['crt', 1700, 1070, 190, 8, 0.9],
        ['floppy', 600, 1130, 170, -10, 0.9],
      ] as const
    ).map(([type, cx, cy, size, rot, o], i) => (
      <Float key={i} type={type} cx={cx} cy={cy} size={size} rot={rot} o={o} />
    ))}

    {/* the dark floor under the title, for the type to stand on */}
    <div style={{ position: 'absolute', left: 0, top: 2120, width: '100%', height: 880, background: 'linear-gradient(180deg, rgba(7,3,26,0) 0%, rgba(7,3,26,0.88) 26%, #07031a 100%)' }} />

    <div style={{ position: 'absolute', left: 0, top: 2170, width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Title t1={240} t2={142} align="center" />
    </div>
    <div style={{ position: 'absolute', left: 0, top: 2625, width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Badge size={38} sub={22} align="center" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        bottom: 28,
        width: 1380,
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: 18,
        lineHeight: 1.5,
        letterSpacing: '0.1em',
        color: '#d8cdf5',
        opacity: 0.92,
      }}
    >
      IL VIDEOGIOCO UFFICIALE DEL CANALE YOUTUBE DI PIXELDEBH · UN GIOCO DI SIMONE PIZZI
      <br />
      CON DEBH, GLOBBY, HOPPY, FLAPPY, BOMBY E GHOSTY
      <br />E I BOSS CYCLOPS FROG, LEGALLINENELLOCCHI E CAPOCCIANELBUIO
      <br />
      REALIZZATO CON L&apos;AIUTO DELL&apos;IA (CLAUDE, LYRIA) SOTTO LA DIREZIONE DELL&apos;AUTORE
    </div>
    <RM w={330} right={110} bottom={40} />
  </div>
);

// ───────────────────────── Pose chooser (dev only) ─────────────────────────

const POSES: Array<[string, DebhPose]> = [
  ['idle', idlePose(0.4)],
  ['cheer', CHEER(0.3)],
  ['aim avanti', aimPose(idlePose(0), 1, 0)],
  ['aim su', aimPose(idlePose(0), 0.7, -0.7)],
  ['throw 0.2', throwPose(0.2, idlePose(0))],
  ['throw 0.6', throwPose(0.6, idlePose(0))],
  ['carry', CARRY],
  ['apex', JUMP_APEX],
];

const PoseChooser: React.FC<{ shots: DebhShot[] }> = ({ shots }) => (
  <div style={{ width: 1920, height: 1080, background: '#1a1240', display: 'flex', flexWrap: 'wrap', padding: 20, boxSizing: 'border-box', gap: 10 }}>
    {shots.map((s, i) => (
      <figure key={i} style={{ margin: 0, width: 460, textAlign: 'center', color: '#c9b8ff', font: '20px monospace' }}>
        <img src={s.src} alt="" style={{ height: 440, width: 'auto', background: '#2a1c60' }} />
        <figcaption>{POSES[i][0]}</figcaption>
      </figure>
    ))}
  </div>
);

// ───────────────────────── Page ─────────────────────────

declare global {
  interface Window {
    __ready?: boolean;
  }
}

const App: React.FC = () => {
  const [debh, setDebh] = useState<DebhShot | null>(null);
  const [poses, setPoses] = useState<DebhShot[]>([]);
  const needsDebh = ASSET === 'poster';
  const choosing = ASSET === 'debh-poses';

  useEffect(() => {
    let live = true;
    (async () => {
      if (needsDebh) {
        const tex = await bakeDebhAt(1.7);
        const shot = await renderDebh(tex, aimPose(idlePose(0), 0.7, -0.7), 1420);
        if (live) setDebh(shot);
      } else if (choosing) {
        const tex = await bakeDebhAt(0.9);
        const shots: DebhShot[] = [];
        for (const [, pose] of POSES) shots.push(await renderDebh(tex, pose, 420));
        if (live) setPoses(shots);
      }
    })().catch(error => {
      console.error(error);
      document.title = 'ERRORE: ' + String(error);
    });
    return () => {
      live = false;
    };
  }, [needsDebh, choosing]);

  const ready = (!needsDebh || debh !== null) && (!choosing || poses.length === POSES.length);
  useEffect(() => {
    if (!ready) return;
    (async () => {
      await document.fonts.load("900 100px 'Orbitron Variable'");
      await document.fonts.load("800 40px 'Orbitron Variable'");
      await document.fonts.load("20px 'Press Start 2P'");
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => undefined)));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.__ready = true;
    })();
  }, [ready]);

  if (choosing) return <PoseChooser shots={poses} />;
  if (ASSET === 'poster') return <Poster debh={debh} />;
  const cfg = BANNERS[ASSET];
  if (!cfg) return <div style={{ color: '#fff', font: '24px monospace' }}>asset sconosciuto: {ASSET}</div>;
  return <Banner cfg={cfg} />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
