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
import ShadowHeadBoss from '../components/ShadowHeadBoss';
import { bakeFrog, bakeEye, type FrogTextures, type EyeTextures } from '../components/bosses/bakeBosses';
import { COLLECTIBLE_TYPES } from '../constants';
import { drawVaultWall, drawVaultShelves, drawVaultLight, drawVaultFloor } from './vaultArt';
import { mulberry32 } from '../engine/rng';
import { PALETTES } from './palette';
import { extractSvg, stripText, svgToCanvas } from './svgTexture';
import { makeWorldLayers } from './worldArt';

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
  /** The frog and LeGallineNellOcchi come in parts so they can move; CapocciaNelBuio is one picture. */
  bosses: { frog: FrogTextures; chickenEye: EyeTextures; shadowHead: Texture };
  /** The Collector's Vault, the final stage's hall. */
  vault: { wall: Texture; shelves: Texture; light: Texture; floor: Texture };
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

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
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
  const world = makeWorldLayers(theme, p, seed);
  return {
    sky: tex(world.sky),
    starsFar: tex(makeStarsFar(seed + 1), { repeat: true }),
    sun: tex(world.sun, { mipmaps: true }),
    mountains: tex(world.far, { repeat: true, mipmaps: true }),
    skyline: tex(world.near, { repeat: true, mipmaps: true }),
    skylineLights: tex(world.lights, { repeat: true, mipmaps: true }),
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
    'joystick', 'floppy', 'cartridge', 'cassette', 'token', 'atari2600', 'amiga500', 'crt', 'cdrom', 'nes', 'sega',
    'speed-boost', 'shield', 'super-throw',
  ];
  const items = {} as Record<ItemType, Texture>;
  await Promise.all(
    itemTypes.map(async t => {
      items[t] = await art(<ItemSprite type={t} />, 64, 64, 3);
    })
  );

  // the vault's shelves are full of giant versions of the collectibles
  const gear = await Promise.all(
    COLLECTIBLE_TYPES.map(t => svgToCanvas(stripText(extractSvg(html(<ItemSprite type={t} />))), 64, 64, 4))
  );
  const vault = {
    wall: tex(drawVaultWall()),
    shelves: tex(drawVaultShelves(gear), { repeat: true }),
    light: tex(drawVaultLight()),
    floor: tex(drawVaultFloor(), { repeat: true }),
  };

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

  const [frog, chickenEye] = await Promise.all([bakeFrog(), bakeEye()]);
  const shadowHead = await art(<ShadowHeadBoss boss={fakeBoss('shadowHead')} />, 140, 140, 4.6);

  // Each world's scenery is big (several megabytes of canvas), so a world is drawn the first time it is asked for. The first
  // world is ready now; the others are drawn in the background a little later, so no level starts with a pause.
  const themes = {} as Record<MusicTheme, ThemeTextures>;
  const built = new Map<MusicTheme, ThemeTextures>();
  const names = Object.keys(PALETTES) as MusicTheme[];
  for (const t of names) {
    Object.defineProperty(themes, t, {
      enumerable: true,
      get: () => {
        let v = built.get(t);
        if (!v) {
          v = buildTheme(t);
          built.set(t, v);
        }
        return v;
      },
    });
  }
  void themes.adventure;
  names.filter(t => t !== 'adventure').forEach((t, i) => setTimeout(() => void themes[t], 2000 + 700 * i));


  return {
    enemies,
    items,
    projectiles: { bomb, egg, fireball, cdrom, shot },
    bosses: { frog, chickenEye, shadowHead },
    vault,
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
