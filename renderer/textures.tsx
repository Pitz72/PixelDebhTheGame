import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Texture } from 'pixi.js';
import { Boss, ItemType, MusicTheme } from '../types';
import {
  EnemySprite,
  ItemSprite,
  GoalSprite,
  CheckpointSprite,
  ShieldSprite,
  PlayerProjectileSprite,
  BombSprite,
  EggSprite,
  FireballSprite,
  CDROMSprite,
} from '../services/assetService';
import CyclopsFrogBoss from '../components/FrogBoss';
import ChickenEyeBoss from '../components/ChickenEyeBoss';
import ShadowHeadBoss from '../components/ShadowHeadBoss';
import { mulberry32 } from '../engine/rng';
import { PALETTES } from './palette';
import { extractSvg, stripText, svgToCanvas } from './svgTexture';

export interface ThemeTextures {
  sky: Texture;
  starsFar: Texture;
  sun: Texture;
  mountains: Texture;
  skyline: Texture;
  skylineLights: Texture;
  starsNear: Texture;
  fog: Texture;
  platformBody: Texture;
  platformTruss: Texture;
  railGlow: Texture;
}

export interface TextureSet {
  enemies: Record<string, Texture>;
  items: Record<ItemType, Texture>;
  projectiles: { bomb: Texture; egg: Texture; fireball: Texture; cdrom: Texture; shot: Texture };
  bosses: { frog: Texture; chickenEye: Texture; chickenEyeBlink: Texture; shadowHead: Texture };
  goalLocked: Texture;
  goalUnlocked: Texture;
  checkpointOff: Texture;
  checkpointOn: Texture;
  shield: Texture;
  glow: Texture;
  light: Texture;
  ring: Texture;
  vignette: Texture;
  themes: Record<MusicTheme, ThemeTextures>;
}

const canvas2d = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
};

const tex = (source: HTMLCanvasElement, opts: { repeat?: boolean; mipmaps?: boolean } = {}): Texture => {
  const t = Texture.from(source);
  if (opts.mipmaps) t.source.autoGenerateMipmaps = true;
  if (opts.repeat) t.source.style.addressMode = 'repeat';
  return t;
};

const html = (el: React.ReactElement): string => renderToStaticMarkup(el);

// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------

function makeGlow(size: number, stops: Array<[number, number]>): HTMLCanvasElement {
  const [c, ctx] = canvas2d(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, a] of stops) g.addColorStop(at, `rgba(255,255,255,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function makeRing(size: number): HTMLCanvasElement {
  const [c, ctx] = canvas2d(size, size);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.035;
  ctx.setLineDash([size * 0.09, size * 0.06]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  return c;
}

function makeVignette(): HTMLCanvasElement {
  const [c, ctx] = canvas2d(480, 270);
  const g = ctx.createRadialGradient(240, 135, 70, 240, 135, 310);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 270);
  return c;
}

function makeSky(skyTop: string, skyMid: string, skyBot: string): HTMLCanvasElement {
  const [c, ctx] = canvas2d(4, 540);
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, skyTop);
  g.addColorStop(0.58, skyMid);
  g.addColorStop(1, skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 540);
  return c;
}

function makeStarsFar(seed: number): HTMLCanvasElement {
  const rng = mulberry32(seed);
  const [c, ctx] = canvas2d(512, 512);
  for (let i = 0; i < 90; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const r = 0.6 + rng() * 1.5;
    ctx.fillStyle = `rgba(255,255,255,${0.45 + rng() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

function makeStarsNear(neon: string, seed: number): HTMLCanvasElement {
  const rng = mulberry32(seed);
  const [c, ctx] = canvas2d(320, 320);
  for (let i = 0; i < 12; i++) {
    const x = rng() * 320;
    const y = rng() * 320;
    const r = 1.6 + rng() * 2.4;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, neon);
    g.addColorStop(0.3, neon);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.45 + rng() * 0.4;
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
  return c;
}

function makeSun(p: (typeof PALETTES)['adventure']): HTMLCanvasElement {
  const [c, ctx] = canvas2d(800, 800);
  const glow = ctx.createRadialGradient(400, 400, 0, 400, 400, 360);
  glow.addColorStop(0, hexA(p.sunBot, 0.5));
  glow.addColorStop(1, hexA(p.sunBot, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 800, 800);

  const [discCanvas, dctx] = canvas2d(800, 800);
  const disc = dctx.createLinearGradient(0, 210, 0, 590);
  disc.addColorStop(0, p.sunTop);
  disc.addColorStop(1, p.sunBot);
  dctx.fillStyle = disc;
  dctx.beginPath();
  dctx.arc(400, 400, 190, 0, Math.PI * 2);
  dctx.fill();

  // retro cut lines through the lower half of the sun
  const cuts: Array<[number, number, string]> = [
    [35, 8, p.skyMid],
    [62, 12, p.skyMid],
    [92, 16, p.skyMid],
    [126, 22, p.skyBot],
    [164, 28, p.skyBot],
  ];
  dctx.globalCompositeOperation = 'destination-out';
  for (const [dy, h] of cuts) dctx.fillRect(200, 400 + dy, 400, h);
  ctx.globalAlpha = 0.92;
  ctx.drawImage(discCanvas, 0, 0);
  ctx.globalAlpha = 1;
  return c;
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function makeMountains(p: (typeof PALETTES)['adventure']): HTMLCanvasElement {
  const [c, ctx] = canvas2d(960, 340);
  ctx.translate(0, 20);
  ctx.beginPath();
  const pts = [
    [0, 320],
    [0, 210],
    [140, 90],
    [290, 220],
    [460, 50],
    [640, 200],
    [810, 110],
    [960, 210],
    [960, 320],
  ];
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = p.mountain;
  ctx.fill();
  ctx.shadowColor = p.neon;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = hexA(p.neon, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = hexA(p.neon, 0.25);
  ctx.lineWidth = 1;
  for (const [x1, y1, x2, y2] of [
    [140, 90, 180, 320],
    [460, 50, 430, 320],
    [810, 110, 840, 320],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  return c;
}

const BUILDINGS: Array<[number, number, number, number, string, number]> = [
  [10, 90, 75, 150, '#090416', 0.3],
  [95, 45, 90, 195, '#0c051d', 0.35],
  [200, 110, 70, 130, '#090416', 0],
  [280, 25, 110, 215, '#0e0622', 0.4],
  [405, 75, 85, 165, '#090416', 0],
  [505, 55, 120, 185, '#0c051d', 0.3],
];

function makeSkyline(p: (typeof PALETTES)['adventure']): HTMLCanvasElement {
  const [c, ctx] = canvas2d(640, 240);
  for (const [x, y, w, h, fill, edge] of BUILDINGS) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    if (edge > 0) {
      ctx.strokeStyle = hexA(p.neon, edge);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, w, h);
    }
  }
  return c;
}

function makeSkylineLights(p: (typeof PALETTES)['adventure'], seed: number): HTMLCanvasElement {
  const rng = mulberry32(seed);
  const [c, ctx] = canvas2d(640, 240);
  const palette = [p.neon, '#ff0055', '#ffea00'];
  for (const [x, y, w, h] of BUILDINGS) {
    const cols = Math.max(2, Math.floor(w / 16));
    const rows = Math.max(2, Math.floor(h / 22));
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        if (rng() < 0.55) continue;
        const wx = x + 6 + k * ((w - 12) / cols);
        const wy = y + 8 + r * ((h - 16) / rows);
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.globalAlpha = 0.35 + rng() * 0.5;
        ctx.fillRect(wx, wy, 7, 4);
      }
    }
  }
  return c;
}

function makeFog(neon: string, seed: number): HTMLCanvasElement {
  const rng = mulberry32(seed);
  const [c, ctx] = canvas2d(1024, 256);
  for (let i = 0; i < 12; i++) {
    const x = rng() * 1024;
    const y = 90 + rng() * 140;
    const rx = 120 + rng() * 160;
    const ry = 26 + rng() * 40;
    for (const ox of [-1024, 0, 1024]) {
      const g = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rx);
      g.addColorStop(0, hexA(neon, 0.18));
      g.addColorStop(1, hexA(neon, 0));
      ctx.save();
      ctx.translate(x + ox, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-(x + ox), -y);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  return c;
}

function makePlatformBody(top: string, bottom: string): HTMLCanvasElement {
  const [c, ctx] = canvas2d(4, 64);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 64);
  return c;
}

function makeTruss(border: string): HTMLCanvasElement {
  const [c, ctx] = canvas2d(16, 16);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  for (const o of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.moveTo(o - 2, 18 + 0);
    ctx.lineTo(o + 18, -2);
    ctx.stroke();
  }
  return c;
}

function makeRailGlow(): HTMLCanvasElement {
  // radial glow centred on the bottom edge: stretched over a platform it becomes a soft half-ellipse
  const [c, ctx] = canvas2d(128, 64);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.32)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 64);
  return c;
}
function buildTheme(theme: MusicTheme): ThemeTextures {
  const p = PALETTES[theme];
  const seed = theme.length * 977;
  return {
    sky: tex(makeSky(p.skyTop, p.skyMid, p.skyBot)),
    starsFar: tex(makeStarsFar(seed + 1), { repeat: true }),
    sun: tex(makeSun(p), { mipmaps: true }),
    mountains: tex(makeMountains(p), { repeat: true }),
    skyline: tex(makeSkyline(p), { repeat: true }),
    skylineLights: tex(makeSkylineLights(p, seed + 2), { repeat: true }),
    starsNear: tex(makeStarsNear(p.neon, seed + 3), { repeat: true }),
    fog: tex(makeFog(p.neon, seed + 4), { repeat: true }),
    platformBody: tex(makePlatformBody(p.platformTop, p.platformBot)),
    platformTruss: tex(makeTruss(p.border), { repeat: true }),
    railGlow: tex(makeRailGlow()),
  };
}

// ---------------------------------------------------------------------------
// Texture set
// ---------------------------------------------------------------------------

const fakeBoss = (type: Boss['type']): Boss => ({
  type,
  x: 0,
  y: 0,
  width: 320,
  height: 320,
  vx: 0,
  vy: 0,
  hp: 1,
  maxHp: 1,
  attackCooldown: 0,
  isHit: false,
  hitTimer: 0,
  isThrowing: false,
  movementTimer: 0,
  opacity: 1,
});

/** ChickenEyeBoss decides "blinking" from Date.now(); pin the clock so both variants are deterministic. */
function withClock<T>(ms: number, fn: () => T): T {
  const real = Date.now;
  Date.now = () => ms;
  try {
    return fn();
  } finally {
    Date.now = real;
  }
}

let cached: Promise<TextureSet> | null = null;

/** The art is rasterised once per run of the app and shared by every renderer instance (restarts, retries). */
export function buildTextures(): Promise<TextureSet> {
  cached ??= buildTexturesUncached().catch(error => {
    cached = null;
    throw error;
  });
  return cached;
}

async function buildTexturesUncached(): Promise<TextureSet> {
  const art = async (el: React.ReactElement, w: number, h: number, scale: number, opts: { text?: boolean } = {}) => {
    let svg = extractSvg(html(el));
    if (!opts.text) svg = stripText(svg);
    return tex(await svgToCanvas(svg, w, h, scale), { mipmaps: true });
  };

  const enemyDefs: Array<[string, string, string, number, number]> = [];
  for (const type of ['base', 'jumper', 'bomber', 'phaser']) {
    for (const state of ['active', 'captured', 'stunned']) {
      enemyDefs.push([`${type}:${state}`, type, state, 50, 50]);
    }
  }
  for (const state of ['active', 'captured']) enemyDefs.push([`flyer:${state}`, 'flyer', state, 60, 44]);
  const enemies: Record<string, Texture> = {};
  await Promise.all(
    enemyDefs.map(async ([key, type, state, w, h]) => {
      enemies[key] = await art(<EnemySprite type={type} state={state} />, w, h, 4);
    })
  );

  const itemTypes: ItemType[] = [
    'joystick', 'floppy', 'cartridge', 'cassette', 'token', 'crt', 'webcam', 'microphone', 'ringlight',
    'speed-boost', 'shield', 'super-throw',
  ];
  const items = {} as Record<ItemType, Texture>;
  await Promise.all(
    itemTypes.map(async t => {
      items[t] = await art(<ItemSprite type={t} />, 64, 64, 3);
    })
  );

  const [bomb, egg, fireball, cdrom, shot, shield, goalLocked, goalUnlocked, cpOff, cpOn] = await Promise.all([
    art(<BombSprite />, 32, 32, 4),
    art(<EggSprite />, 32, 40, 4),
    art(<FireballSprite />, 32, 32, 4),
    art(<CDROMSprite />, 32, 32, 4),
    art(<PlayerProjectileSprite />, 24, 24, 4),
    art(<ShieldSprite />, 64, 64, 3),
    art(<GoalSprite unlocked={false} remaining={0} />, 90, 150, 3),
    art(<GoalSprite unlocked remaining={0} />, 90, 150, 3),
    art(<CheckpointSprite activated={false} />, 48, 96, 3),
    art(<CheckpointSprite activated />, 48, 96, 3),
  ]);

  const frog = await art(<CyclopsFrogBoss boss={fakeBoss('frog')} />, 120, 120, 5.4);
  const chickenEye = await withClock(0, () => art(<ChickenEyeBoss boss={fakeBoss('chickenEye')} />, 140, 140, 4.6));
  const chickenEyeBlink = await withClock((Math.PI / 2) * 1000, () =>
    art(<ChickenEyeBoss boss={fakeBoss('chickenEye')} />, 140, 140, 4.6)
  );
  const shadowHead = await art(<ShadowHeadBoss boss={fakeBoss('shadowHead')} />, 140, 140, 4.6);

  const themes = {} as Record<MusicTheme, ThemeTextures>;
  for (const t of Object.keys(PALETTES) as MusicTheme[]) themes[t] = buildTheme(t);

  return {
    enemies,
    items,
    projectiles: { bomb, egg, fireball, cdrom, shot },
    bosses: { frog, chickenEye, chickenEyeBlink, shadowHead },
    goalLocked,
    goalUnlocked,
    checkpointOff: cpOff,
    checkpointOn: cpOn,
    shield,
    glow: tex(makeGlow(128, [[0, 1], [0.25, 0.55], [0.6, 0.14], [1, 0]])),
    light: tex(makeGlow(256, [[0, 1], [0.45, 0.5], [0.8, 0.12], [1, 0]])),
    ring: tex(makeRing(256), { mipmaps: true }),
    vignette: tex(makeVignette()),
    themes,
  };
}
