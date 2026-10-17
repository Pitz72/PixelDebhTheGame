/**
 * The scenery behind each world, drawn with the canvas (no Pixi in here, so the dev page can draw it too).
 *
 *   adventure  - the neon city on the edge of town, behind a mountain range
 *   industrial - a refinery: cooling towers, smokestacks, tanks, gantries, furnaces glowing in the smog
 *   ethereal   - floating islands over a sea of cloud, crystal spires, an aurora and a ringed planet
 *   boss       - a ruined citadel under a cracked blood moon
 *
 * Every world is made of the same five pieces, so the renderer treats them alike:
 *   sky     a smooth picture the size of the screen
 *   sun     the big thing in the sky (a sun, a ringed planet, a moon), drawn on a square
 *   far     a strip that repeats sideways: the distant scenery, drifting slowly
 *   near    a strip that repeats sideways: the foreground scenery, drifting faster
 *   lights  the glowing parts of `near` (windows, furnaces, crystals), added on top and made to flicker
 * The strips are drawn at ART_SCALE times their size and shown at 1/ART_SCALE, so they stay sharp on a big screen.
 * Both strips are laid out as one period of a loop: the first thing starts at 0 and the last one ends at the width.
 */
import { MusicTheme } from '../types';
import { mulberry32 } from '../engine/rng';
import { ThemePalette } from './palette';

export const ART_SCALE = 2;
export const FAR_W = 1280;
export const FAR_H = 340;
export const NEAR_W = 1280;
export const NEAR_H = 260;
export const SKY_W = 960;
export const SKY_H = 540;
export const SUN_SIZE = 800;

export interface WorldLayers {
  sky: HTMLCanvasElement;
  sun: HTMLCanvasElement;
  far: HTMLCanvasElement;
  near: HTMLCanvasElement;
  lights: HTMLCanvasElement;
}

type Rng = () => number;

// ---------------------------------------------------------------------------
// Small tools
// ---------------------------------------------------------------------------

function canvas(w: number, h: number, scale = 1): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.scale(scale, scale);
  return [c, ctx];
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexA = (hex: string, a: number): string => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
/** A blend of two #rrggbb colours: t = 0 gives a, t = 1 gives b. */
const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const h = (x: number) => Math.round(x).toString(16).padStart(2, '0');
  return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`;
};
const range = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

/** Items side by side that fill exactly `total` px: widths are drawn at random, then scaled to fit (a seamless loop). */
function row(rng: Rng, total: number, minW: number, maxW: number, gap = 0): { x: number; w: number }[] {
  const widths: number[] = [];
  let sum = 0;
  while (sum < total) {
    const w = range(rng, minW, maxW);
    widths.push(w);
    sum += w + gap;
  }
  const k = total / sum;
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (const w of widths) {
    out.push({ x, w: w * k });
    x += (w + gap) * k;
  }
  return out;
}

/** Runs `draw` three times, shifted by -W, 0, +W: whatever crosses an edge comes back in on the other side. */
const wrapped = (W: number, draw: (dx: number) => void) => {
  for (const dx of [-W, 0, W]) draw(dx);
};

function poly(ctx: CanvasRenderingContext2D, pts: number[][], dx = 0) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x + dx, y) : ctx.lineTo(x + dx, y)));
  ctx.closePath();
}

function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, a: number) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, hexA(color, a));
  g.addColorStop(1, hexA(color, 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA('#ffffff', a));
  g.addColorStop(0.25, hexA(color, a));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A vertical gradient that dims towards the ground, so the layers melt into the fog. */
function groundFade(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, from = 0.55, a = 0.85) {
  const g = ctx.createLinearGradient(0, H * from, 0, H);
  g.addColorStop(0, hexA(color, 0));
  g.addColorStop(1, hexA(color, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, H * from, W, H * (1 - from));
}

// ---------------------------------------------------------------------------
// Adventure: neon city
// ---------------------------------------------------------------------------

function adventureFar(p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, FAR_H, ART_SCALE);
  const range2 = (n: number, lo: number, hi: number, pad: number) => {
    // peak heights for one period: the last point repeats the first, so the loop closes
    const ys: number[] = [];
    for (let i = 0; i < n; i++) ys.push(range(rng, lo, hi));
    ys.push(ys[0]);
    return { ys, step: FAR_W / n, pad };
  };
  const ridge = (shape: { ys: number[]; step: number }, base: number) => {
    const pts: number[][] = [[0, FAR_H]];
    shape.ys.forEach((y, i) => {
      pts.push([i * shape.step, y]);
      if (i < shape.ys.length - 1) pts.push([i * shape.step + shape.step * range(rng, 0.42, 0.62), y + range(rng, 40, 90)]);
    });
    pts.push([FAR_W, FAR_H]);
    void base;
    return pts;
  };

  // the back range: lighter, hazy, no outline
  const back = ridge(range2(6, 120, 210, 0), 0);
  poly(ctx, back);
  const gb = ctx.createLinearGradient(0, 100, 0, FAR_H);
  gb.addColorStop(0, mix(p.mountain, p.skyBot, 0.5));
  gb.addColorStop(1, mix(p.mountain, p.skyBot, 0.15));
  ctx.fillStyle = gb;
  ctx.fill();

  // the front range: dark, with a neon edge and a few facet lines
  const front = ridge(range2(5, 50, 170, 0), 0);
  poly(ctx, front);
  const gf = ctx.createLinearGradient(0, 30, 0, FAR_H);
  gf.addColorStop(0, mix(p.mountain, '#000000', 0.1));
  gf.addColorStop(1, mix(p.mountain, '#000000', 0.5));
  ctx.fillStyle = gf;
  ctx.fill();
  ctx.save();
  ctx.shadowColor = p.neon;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = hexA(p.neon, 0.5);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  front.slice(1, -1).forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = hexA(p.neon, 0.16);
  ctx.lineWidth = 1;
  front.slice(1, -1).forEach(([x, y], i) => {
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + range(rng, -40, 40), FAR_H);
      ctx.stroke();
    }
  });
  groundFade(ctx, FAR_W, FAR_H, mix(p.skyBot, p.mountain, 0.5), 0.5, 0.75);
  return c;
}

function adventureNear(p: ThemePalette, rng: Rng): { near: HTMLCanvasElement; lights: HTMLCanvasElement } {
  const [near, n] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const [lights, l] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const accents = [p.neon, '#ff2d7a', '#ffea00', '#b388ff'];
  const buildings = row(rng, NEAR_W, 84, 150, 4);
  buildings.forEach(({ x, w }, i) => {
    const h = range(rng, 90, 215);
    const y = NEAR_H - h;
    const accent = accents[Math.floor(rng() * accents.length)];
    const body = n.createLinearGradient(0, y, 0, NEAR_H);
    body.addColorStop(0, i % 2 ? '#150a30' : '#110726');
    body.addColorStop(1, '#070312');
    n.fillStyle = body;
    // rooftop styles: flat, stepped, slanted
    const roof = Math.floor(rng() * 3);
    if (roof === 1) {
      poly(n, [[x, NEAR_H], [x, y + 14], [x + w * 0.2, y + 14], [x + w * 0.2, y], [x + w * 0.8, y], [x + w * 0.8, y + 14], [x + w, y + 14], [x + w, NEAR_H]]);
    } else if (roof === 2) {
      poly(n, [[x, NEAR_H], [x, y + 22], [x + w, y], [x + w, NEAR_H]]);
    } else {
      poly(n, [[x, NEAR_H], [x, y], [x + w, y], [x + w, NEAR_H]]);
    }
    n.fill();
    // lit edge on the side that faces the sun, and the roof line
    n.strokeStyle = hexA(accent, 0.38);
    n.lineWidth = 1.3;
    n.beginPath();
    n.moveTo(x + 0.6, NEAR_H);
    n.lineTo(x + 0.6, roof === 2 ? y + 22 : roof === 1 ? y + 14 : y);
    n.lineTo(x + w * (roof === 1 ? 0.2 : 1), roof === 2 ? y : roof === 1 ? y + 14 : y);
    n.stroke();
    // an antenna, a tank, or a billboard on the roof
    const extra = rng();
    if (extra < 0.35) {
      n.strokeStyle = '#1f1440';
      n.lineWidth = 2;
      n.beginPath();
      n.moveTo(x + w * 0.62, y);
      n.lineTo(x + w * 0.62, y - range(rng, 22, 44));
      n.stroke();
      glowDot(l, x + w * 0.62, y - 24, 9, '#ff2d7a', 0.9);
    } else if (extra < 0.6) {
      n.fillStyle = '#0a0518';
      n.fillRect(x + w * 0.2, y - 14, w * 0.3, 14);
      n.fillStyle = '#0d061f';
      n.fillRect(x + w * 0.24, y - 20, w * 0.22, 6);
    } else if (extra < 0.78 && w > 100) {
      const bw = w * 0.6;
      const bx = x + w * 0.2;
      n.fillStyle = '#070312';
      n.fillRect(bx, y - 34, bw, 24);
      n.fillRect(bx + 6, y - 10, 3, 10);
      n.fillRect(bx + bw - 9, y - 10, 3, 10);
      l.fillStyle = hexA(accent, 0.8);
      l.fillRect(bx + 3, y - 31, bw - 6, 18);
      l.fillStyle = hexA('#05020e', 0.75);
      for (let k = 0; k < 4; k++) l.fillRect(bx + 8 + k * ((bw - 16) / 4), y - 27, (bw - 16) / 4 - 6, 10);
    }
    // the windows (they go to the light layer)
    const cols = Math.max(3, Math.floor(w / 15));
    const rows = Math.max(3, Math.floor(h / 20));
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        if (rng() < 0.5) continue;
        const wx = x + 7 + k * ((w - 14) / cols);
        const wy = y + 12 + r * ((h - 26) / rows);
        l.fillStyle = hexA(rng() < 0.7 ? accent : accents[Math.floor(rng() * accents.length)], 0.35 + rng() * 0.5);
        l.fillRect(wx, wy, 6.5, 4);
      }
    }
  });
  groundFade(n, NEAR_W, NEAR_H, '#1b0f3a', 0.7, 0.5);
  return { near, lights };
}

// ---------------------------------------------------------------------------
// Industrial: a refinery in the smog
// ---------------------------------------------------------------------------

function industrialFar(p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, FAR_H, ART_SCALE);
  const rim = hexA(p.neon, 0.4);
  const tone = (t: number) => mix('#0b121a', p.skyBot, t);
  // the furnaces' glow along the horizon
  softBlob(ctx, FAR_W * 0.25, FAR_H, 360, 120, p.neon, 0.28);
  softBlob(ctx, FAR_W * 0.75, FAR_H, 360, 120, '#ff5722', 0.22);

  const things = row(rng, FAR_W, 150, 250, 20);
  things.forEach(({ x, w }, i) => {
    wrapped(FAR_W, dx => {
      const cx = x + w / 2 + dx;
      const kind = i % 3;
      if (kind === 0) {
        // a cooling tower: a hyperbola, wide at the base, pinched at the waist, flared at the lip
        const h = range(rng, 190, 260);
        const bw = w * 0.82;
        const top = FAR_H - h;
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2, FAR_H);
        ctx.bezierCurveTo(cx - bw * 0.3, FAR_H - h * 0.35, cx - bw * 0.3, FAR_H - h * 0.7, cx - bw * 0.36, top);
        ctx.lineTo(cx + bw * 0.36, top);
        ctx.bezierCurveTo(cx + bw * 0.3, FAR_H - h * 0.7, cx + bw * 0.3, FAR_H - h * 0.35, cx + bw / 2, FAR_H);
        ctx.closePath();
        const g = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
        g.addColorStop(0, tone(0.22));
        g.addColorStop(0.55, tone(0.08));
        g.addColorStop(1, tone(0.03));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2, FAR_H);
        ctx.bezierCurveTo(cx - bw * 0.3, FAR_H - h * 0.35, cx - bw * 0.3, FAR_H - h * 0.7, cx - bw * 0.36, top);
        ctx.stroke();
        // the lip, and the steam climbing out of it
        ctx.fillStyle = tone(0.16);
        ctx.fillRect(cx - bw * 0.38, top - 3, bw * 0.76, 5);
        softBlob(ctx, cx, top - 18, bw * 0.55, 26, '#cfd8dc', 0.2);
        softBlob(ctx, cx + 10, top - 46, bw * 0.45, 22, '#cfd8dc', 0.13);
      } else if (kind === 1) {
        // a smokestack with red and white bands near the top
        const h = range(rng, 230, 300);
        const sw = 22;
        const top = FAR_H - h;
        ctx.beginPath();
        ctx.moveTo(cx - sw * 0.9, FAR_H);
        ctx.lineTo(cx - sw * 0.5, top);
        ctx.lineTo(cx + sw * 0.5, top);
        ctx.lineTo(cx + sw * 0.9, FAR_H);
        ctx.closePath();
        const g = ctx.createLinearGradient(cx - sw, 0, cx + sw, 0);
        g.addColorStop(0, tone(0.24));
        g.addColorStop(1, tone(0.03));
        ctx.fillStyle = g;
        ctx.fill();
        for (let b = 0; b < 3; b++) {
          ctx.fillStyle = b % 2 === 0 ? 'rgba(210,60,40,0.55)' : 'rgba(220,220,220,0.4)';
          ctx.fillRect(cx - sw * (0.5 + b * 0.04), top + 6 + b * 10, sw * (1 + b * 0.08), 7);
        }
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - sw * 0.9, FAR_H);
        ctx.lineTo(cx - sw * 0.5, top);
        ctx.stroke();
        softBlob(ctx, cx + 14, top - 20, 60, 20, '#90a4ae', 0.2);
        glowDot(ctx, cx, top - 3, 10, '#ff1744', 0.9);
      } else {
        // a block of tanks and a pipe bridge to the next structure
        const tanks = 2 + Math.floor(rng() * 2);
        for (let t = 0; t < tanks; t++) {
          const tw = w / tanks - 6;
          const th = range(rng, 70, 120);
          const tx = x + dx + t * (w / tanks) + 3;
          const g = ctx.createLinearGradient(tx, 0, tx + tw, 0);
          g.addColorStop(0, tone(0.2));
          g.addColorStop(1, tone(0.04));
          ctx.fillStyle = g;
          ctx.fillRect(tx, FAR_H - th, tw, th);
          ctx.beginPath();
          ctx.ellipse(tx + tw / 2, FAR_H - th, tw / 2, 9, 0, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = rim;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(tx + 0.5, FAR_H);
          ctx.lineTo(tx + 0.5, FAR_H - th);
          ctx.stroke();
        }
        ctx.strokeStyle = tone(0.12);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + dx - 20, FAR_H - 62);
        ctx.lineTo(x + dx + w + 30, FAR_H - 62);
        ctx.stroke();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + dx - 20, FAR_H - 64.5);
        ctx.lineTo(x + dx + w + 30, FAR_H - 64.5);
        ctx.stroke();
      }
    });
  });
  groundFade(ctx, FAR_W, FAR_H, mix(p.skyBot, '#000', 0.2), 0.55, 0.8);
  return c;
}

function industrialNear(p: ThemePalette, rng: Rng): { near: HTMLCanvasElement; lights: HTMLCanvasElement } {
  const [near, n] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const [lights, l] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const steel = (top: number, bot: number) => mix('#0c141b', '#2a3b49', top) + '|' + mix('#05090d', '#10181f', bot);
  void steel;
  const body = (x: number, y: number, w: number, h: number, a = 0.18) => {
    const g = n.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, mix('#0e1820', '#2b3d4b', a));
    g.addColorStop(1, '#060a0e');
    n.fillStyle = g;
    n.fillRect(x, y, w, h);
  };
  const rimLight = (pts: number[][]) => {
    n.strokeStyle = hexA(p.neon, 0.45);
    n.lineWidth = 1.3;
    n.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? n.moveTo(x, y) : n.lineTo(x, y)));
    n.stroke();
  };
  const slots = row(rng, NEAR_W, 120, 220, 0);
  slots.forEach(({ x, w }, i) => {
    const kind = i % 5;
    if (kind === 0) {
      // a sawtooth hall with a row of furnace windows
      const h = range(rng, 70, 110);
      const y = NEAR_H - h;
      body(x, y, w, h);
      const teeth = Math.max(2, Math.round(w / 38));
      const tw = w / teeth;
      for (let t = 0; t < teeth; t++) {
        poly(n, [[x + t * tw, y], [x + t * tw, y - 22], [x + (t + 1) * tw, y]]);
        n.fillStyle = '#0a1117';
        n.fill();
        rimLight([[x + t * tw, y], [x + t * tw, y - 22], [x + (t + 1) * tw, y]]);
      }
      rimLight([[x, NEAR_H], [x, y]]);
      for (let k = 0; k < Math.floor(w / 22); k++) {
        l.fillStyle = hexA(rng() < 0.75 ? '#ff9100' : '#ffd180', 0.5 + rng() * 0.4);
        l.fillRect(x + 8 + k * 22, y + 14, 12, 7);
        if (rng() < 0.4) l.fillRect(x + 8 + k * 22, y + 32, 12, 7);
      }
      // a smoking chimney on the roof
      const sx = x + w * range(rng, 0.2, 0.7);
      n.fillStyle = '#0a1016';
      n.fillRect(sx, y - 54, 11, 54);
      glowDot(l, sx + 5.5, y - 56, 12, '#ff5722', 0.85);
    } else if (kind === 1) {
      // storage tanks with bands and a catwalk
      const tanks = Math.max(2, Math.round(w / 64));
      for (let t = 0; t < tanks; t++) {
        const tw = w / tanks - 8;
        const th = range(rng, 90, 150);
        const tx = x + t * (w / tanks) + 4;
        const ty = NEAR_H - th;
        const g = n.createLinearGradient(tx, 0, tx + tw, 0);
        g.addColorStop(0, '#2a3b49');
        g.addColorStop(0.35, '#16222c');
        g.addColorStop(1, '#070b0f');
        n.fillStyle = g;
        n.fillRect(tx, ty, tw, th);
        n.beginPath();
        n.ellipse(tx + tw / 2, ty, tw / 2, 10, 0, Math.PI, 0);
        n.fill();
        n.fillStyle = 'rgba(0,0,0,0.5)';
        for (let b = 1; b < 5; b++) n.fillRect(tx, ty + (b * th) / 5, tw, 2.2);
        rimLight([[tx + 0.6, NEAR_H], [tx + 0.6, ty]]);
        glowDot(l, tx + tw * 0.5, ty - 7, 7, '#ff1744', rng() < 0.5 ? 0.9 : 0.4);
      }
      n.fillStyle = '#0a1016';
      n.fillRect(x, NEAR_H - 52, w, 4);
    } else if (kind === 2) {
      // a gantry crane: a lattice tower and a jib
      const h = range(rng, 150, 210);
      const tx = x + w * 0.3;
      const top = NEAR_H - h;
      n.strokeStyle = '#0d151c';
      n.lineWidth = 3;
      n.beginPath();
      n.moveTo(tx, NEAR_H);
      n.lineTo(tx + 8, top);
      n.moveTo(tx + 30, NEAR_H);
      n.lineTo(tx + 22, top);
      n.stroke();
      n.lineWidth = 1.5;
      n.beginPath();
      for (let k = 0; k < 9; k++) {
        const yy = NEAR_H - (k * h) / 9;
        const yy2 = NEAR_H - ((k + 1) * h) / 9;
        const xa = tx + (8 * k) / 9;
        const xb = tx + 30 - (8 * k) / 9;
        const xa2 = tx + (8 * (k + 1)) / 9;
        const xb2 = tx + 30 - (8 * (k + 1)) / 9;
        n.moveTo(xa, yy);
        n.lineTo(xb2, yy2);
        n.moveTo(xb, yy);
        n.lineTo(xa2, yy2);
      }
      n.stroke();
      n.fillStyle = '#0d151c';
      n.fillRect(tx - 36, top - 7, w * 0.78, 7);
      n.strokeStyle = '#0d151c';
      n.lineWidth = 1.2;
      n.beginPath();
      n.moveTo(tx + 15, top - 7);
      n.lineTo(tx + 15, top - 26);
      n.moveTo(tx + 15, top - 26);
      n.lineTo(tx - 36, top - 7);
      n.stroke();
      rimLight([[tx - 36, top - 7], [tx - 36 + w * 0.78, top - 7]]);
      n.strokeStyle = '#1b2a35';
      n.lineWidth = 1;
      n.beginPath();
      n.moveTo(tx - 20, top);
      n.lineTo(tx - 20, top + 46);
      n.stroke();
      n.fillStyle = '#0a1016';
      n.fillRect(tx - 28, top + 46, 16, 12);
      glowDot(l, tx + 15, top - 28, 9, '#ff1744', 0.9);
    } else if (kind === 3) {
      // a pipe rack: pipes at three heights on A-frame legs, with a glowing valve
      const legs = Math.max(3, Math.round(w / 52));
      const ys = [NEAR_H - 120, NEAR_H - 86, NEAR_H - 52];
      n.fillStyle = '#0a1117';
      for (let k = 0; k < legs; k++) n.fillRect(x + (k * (w - 8)) / (legs - 1), ys[0] - 8, 8, NEAR_H - ys[0] + 8);
      ys.forEach((yy, k) => {
        const g = n.createLinearGradient(0, yy, 0, yy + 14);
        g.addColorStop(0, '#2c3f4e');
        g.addColorStop(1, '#0a1218');
        n.fillStyle = g;
        n.fillRect(x - 6, yy, w + 12, 12 - k);
        n.fillStyle = 'rgba(255,255,255,0.1)';
        n.fillRect(x - 6, yy + 1, w + 12, 1.4);
      });
      rimLight([[x - 6, ys[0]], [x + w + 6, ys[0]]]);
      const vx = x + w * range(rng, 0.25, 0.75);
      n.fillStyle = '#0a1117';
      n.fillRect(vx - 3, ys[0] - 22, 6, 22);
      glowDot(l, vx, ys[0] - 22, 8, '#ff9100', 0.9);
      // steam leaking out of a joint
      softBlob(l, x + w * 0.5, ys[1] - 22, 26, 18, '#ffcc80', 0.18);
    } else {
      // a cluster of silos with domes, and a lit control room at their feet
      const silos = Math.max(2, Math.round(w / 52));
      for (let t = 0; t < silos; t++) {
        const sw = w / silos - 4;
        const sh = range(rng, 100, 170);
        const sx = x + t * (w / silos) + 2;
        const g = n.createLinearGradient(sx, 0, sx + sw, 0);
        g.addColorStop(0, '#273846');
        g.addColorStop(0.4, '#14202a');
        g.addColorStop(1, '#070b0f');
        n.fillStyle = g;
        n.fillRect(sx, NEAR_H - sh, sw, sh);
        n.beginPath();
        n.ellipse(sx + sw / 2, NEAR_H - sh, sw / 2, sw * 0.32, 0, Math.PI, 0);
        n.fill();
        rimLight([[sx + 0.6, NEAR_H], [sx + 0.6, NEAR_H - sh]]);
        for (let b = 0; b < 3; b++) {
          n.fillStyle = 'rgba(0,0,0,0.45)';
          n.fillRect(sx, NEAR_H - sh + 14 + b * (sh / 3.4), sw, 2);
        }
      }
      n.fillStyle = '#0a1117';
      n.fillRect(x + w * 0.1, NEAR_H - 34, w * 0.8, 34);
      for (let k = 0; k < 5; k++) {
        l.fillStyle = hexA('#ffe0b2', 0.4 + rng() * 0.4);
        l.fillRect(x + w * 0.14 + k * (w * 0.15), NEAR_H - 26, 10, 8);
      }
    }
  });
  groundFade(n, NEAR_W, NEAR_H, '#1b0b05', 0.72, 0.55);
  return { near, lights };
}

// ---------------------------------------------------------------------------
// Ethereal: floating islands, crystals, aurora
// ---------------------------------------------------------------------------

function etherealFar(p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, FAR_H, ART_SCALE);
  const slots = row(rng, FAR_W, 190, 300, 30);
  // a sea of cloud at the bottom, far behind everything
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * FAR_W + range(rng, -20, 20);
    wrapped(FAR_W, dx => softBlob(ctx, x + dx, FAR_H - range(rng, 8, 50), range(rng, 120, 220), range(rng, 22, 40), '#9fd8ff', 0.1));
  }
  slots.forEach(({ x, w }, i) => {
    const cy = range(rng, 70, 190);
    wrapped(FAR_W, dx => {
      const cx = x + w / 2 + dx;
      const rx = w * 0.46;
      const depth = range(rng, 60, 110);
      // the rock underneath: a ragged cone of stalactites
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy);
      const teeth = 6;
      for (let t = 0; t <= teeth; t++) {
        const tx = cx - rx + (t / teeth) * rx * 2;
        const tipDepth = depth * (1 - Math.abs(t / teeth - 0.5) * 1.5) * range(rng, 0.7, 1.05);
        ctx.lineTo(tx, cy + 6 + tipDepth * (t % 2 ? 0.6 : 1));
      }
      ctx.lineTo(cx + rx, cy);
      ctx.closePath();
      const rock = ctx.createLinearGradient(0, cy, 0, cy + depth);
      rock.addColorStop(0, mix('#0b1a35', p.skyBot, 0.3));
      rock.addColorStop(1, '#050b1c');
      ctx.fillStyle = rock;
      ctx.fill();
      // the top: a grassy mound with a glowing rim
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, 14, 0, Math.PI, 0);
      ctx.lineTo(cx + rx, cy + 6);
      ctx.lineTo(cx - rx, cy + 6);
      ctx.closePath();
      const top = ctx.createLinearGradient(0, cy - 14, 0, cy + 6);
      top.addColorStop(0, mix('#0c2a4d', p.neon, 0.25));
      top.addColorStop(1, '#0a1a38');
      ctx.fillStyle = top;
      ctx.fill();
      ctx.strokeStyle = hexA(p.neon, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, 14, 0, Math.PI, 0);
      ctx.stroke();
      // little crystal trees on top
      for (let t = 0; t < 4; t++) {
        const tx = cx + range(rng, -rx * 0.7, rx * 0.7);
        const th = range(rng, 14, 30);
        ctx.fillStyle = hexA(i % 2 ? '#b388ff' : p.neon, 0.55);
        poly(ctx, [[tx - 3.5, cy - 4], [tx, cy - 4 - th], [tx + 3.5, cy - 4]]);
        ctx.fill();
        glowDot(ctx, tx, cy - 4 - th, 7, i % 2 ? '#b388ff' : p.neon, 0.5);
      }
      // a thin waterfall from the edge, fading as it falls
      if (i % 2 === 0) {
        const wx = cx + rx * range(rng, 0.45, 0.75) * (rng() < 0.5 ? -1 : 1);
        const g = ctx.createLinearGradient(0, cy + 6, 0, FAR_H);
        g.addColorStop(0, hexA('#e0f7ff', 0.5));
        g.addColorStop(1, hexA('#e0f7ff', 0));
        ctx.fillStyle = g;
        ctx.fillRect(wx - 2.2, cy + 6, 4.4, FAR_H - cy - 6);
      }
    });
  });
  groundFade(ctx, FAR_W, FAR_H, mix(p.skyBot, '#ffffff', 0.1), 0.62, 0.55);
  return c;
}

function crystal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  w: number,
  h: number,
  lean: number,
  c1: string,
  c2: string
) {
  // a hexagonal prism seen from the side: lit left face, dark right face, pointed tip
  const tipX = cx + lean;
  const tipY = base - h;
  const faceL = [[cx - w / 2, base], [cx - w / 2, base - h * 0.78], [tipX, tipY], [cx + lean * 0.3, base - h * 0.78 + 4], [cx + lean * 0.3, base]];
  const faceR = [[cx + lean * 0.3, base], [cx + lean * 0.3, base - h * 0.78 + 4], [tipX, tipY], [cx + w / 2, base - h * 0.78], [cx + w / 2, base]];
  const gl = ctx.createLinearGradient(cx - w / 2, base, tipX, tipY);
  gl.addColorStop(0, hexA(c2, 0.95));
  gl.addColorStop(1, hexA(c1, 0.95));
  const gr = ctx.createLinearGradient(cx + w / 2, base, tipX, tipY);
  gr.addColorStop(0, hexA(mix(c2, '#000000', 0.45), 0.95));
  gr.addColorStop(1, hexA(mix(c1, '#000000', 0.4), 0.95));
  poly(ctx, faceL);
  ctx.fillStyle = gl;
  ctx.fill();
  poly(ctx, faceR);
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.strokeStyle = hexA('#ffffff', 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, base - h * 0.78);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.strokeStyle = hexA('#ffffff', 0.18);
  ctx.beginPath();
  ctx.moveTo(cx + lean * 0.3, base);
  ctx.lineTo(cx + lean * 0.3, base - h * 0.78 + 4);
  ctx.stroke();
}

function etherealNear(p: ThemePalette, rng: Rng): { near: HTMLCanvasElement; lights: HTMLCanvasElement } {
  const [near, n] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const [lights, l] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const slots = row(rng, NEAR_W, 130, 230, 0);
  slots.forEach(({ x, w }, i) => {
    const kind = i % 4;
    wrapped(NEAR_W, dx => {
      if (kind === 3) {
        // a monolith: a tall tapering slab with runes that glow, standing among the crystals
        const mw = Math.min(54, w * 0.34);
        const mx = x + dx + w * 0.5 - mw / 2;
        const h = range(rng, 150, 200);
        const top = NEAR_H - h;
        poly(n, [[mx, NEAR_H], [mx + mw * 0.12, top + 10], [mx + mw * 0.5, top], [mx + mw * 0.88, top + 14], [mx + mw, NEAR_H]]);
        const g = n.createLinearGradient(mx, 0, mx + mw, 0);
        g.addColorStop(0, '#2c4a8c');
        g.addColorStop(0.5, '#142a5c');
        g.addColorStop(1, '#070d24');
        n.fillStyle = g;
        n.fill();
        n.strokeStyle = hexA(p.neon, 0.45);
        n.lineWidth = 1.3;
        n.beginPath();
        n.moveTo(mx + 0.5, NEAR_H);
        n.lineTo(mx + mw * 0.12, top + 10);
        n.lineTo(mx + mw * 0.5, top);
        n.stroke();
        for (let r = 0; r < 5; r++) {
          const ry = top + 34 + r * (h - 60) / 5;
          l.strokeStyle = hexA(r % 2 ? '#d1b3ff' : p.neon, 0.85);
          l.lineWidth = 1.6;
          l.beginPath();
          l.moveTo(mx + mw * 0.3, ry);
          l.lineTo(mx + mw * 0.5, ry + 7);
          l.lineTo(mx + mw * 0.7, ry);
          l.stroke();
          glowDot(l, mx + mw * 0.5, ry + 7, 6, r % 2 ? '#d1b3ff' : p.neon, 0.6);
        }
      } else {
        // a stand of crystals of different heights and leans
        const count = 4 + Math.floor(rng() * 3);
        const spread = w * 0.9;
        for (let k = 0; k < count; k++) {
          const cx = x + dx + w * 0.05 + (k / (count - 1)) * spread + range(rng, -8, 8);
          const mid = 1 - Math.abs(k / (count - 1) - 0.5) * 1.1;
          const h = range(rng, 70, 160) * (0.55 + 0.6 * mid);
          const cw = range(rng, 26, 44);
          const violet = rng() < 0.4;
          const c1 = violet ? '#c4a3ff' : '#7fe3f7';
          const c2 = violet ? '#4527a0' : '#0d47a1';
          crystal(n, cx, NEAR_H, cw, h, range(rng, -10, 10), c1, c2);
          // the glow inside the crystal goes to the light layer
          // kept soft: where several crystals stand together the glows add up, and the bloom turns them white
          const g = l.createRadialGradient(cx, NEAR_H - h * 0.35, 0, cx, NEAR_H - h * 0.35, h * 0.5);
          g.addColorStop(0, hexA(violet ? '#c9a8ff' : '#5fe8ff', 0.26));
          g.addColorStop(1, hexA(violet ? '#c9a8ff' : '#5fe8ff', 0));
          l.fillStyle = g;
          l.fillRect(cx - h * 0.5, NEAR_H - h * 0.35 - h * 0.5, h, h);
          glowDot(l, cx + 2, NEAR_H - h + 6, 5, violet ? '#d1b3ff' : '#84ffff', 0.5);
        }
      }
    });
  });
  // floating motes drifting above the crystals
  for (let i = 0; i < 26; i++) glowDot(l, range(rng, 0, NEAR_W), range(rng, 10, NEAR_H * 0.8), range(rng, 3, 6), rng() < 0.5 ? '#84ffff' : '#d1b3ff', 0.7);
  groundFade(n, NEAR_W, NEAR_H, '#0a1a3a', 0.7, 0.5);
  return { near, lights };
}

// ---------------------------------------------------------------------------
// Boss: a ruined citadel
// ---------------------------------------------------------------------------

function bossFar(p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, FAR_H, ART_SCALE);
  const tone = (t: number) => mix('#12040a', p.skyBot, t);
  // lava glow behind the ridge
  softBlob(ctx, FAR_W * 0.3, FAR_H, 380, 130, '#ff3d00', 0.3);
  softBlob(ctx, FAR_W * 0.78, FAR_H, 340, 110, '#d50000', 0.28);
  // jagged spires: irregular triangles, sharp tips
  const spires = row(rng, FAR_W, 70, 150, 0);
  spires.forEach(({ x, w }) => {
    const h = range(rng, 90, 250);
    wrapped(FAR_W, dx => {
      const tip = x + w * range(rng, 0.3, 0.7) + dx;
      const pts = [[x + dx - 8, FAR_H], [x + dx + w * 0.12, FAR_H - h * 0.45], [tip - 6, FAR_H - h * 0.8], [tip, FAR_H - h], [tip + 5, FAR_H - h * 0.7], [x + dx + w * 0.86, FAR_H - h * 0.4], [x + dx + w + 8, FAR_H]];
      poly(ctx, pts);
      const g = ctx.createLinearGradient(x + dx, 0, x + dx + w, 0);
      g.addColorStop(0, tone(0.2));
      g.addColorStop(1, tone(0.02));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hexA('#ff5252', 0.28);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.lineTo(pts[3][0], pts[3][1]);
      ctx.stroke();
    });
  });
  // the citadel: three towers and a broken wall, black against the glow
  const castleX = FAR_W * 0.5;
  const ink = '#0a0206';
  ctx.fillStyle = ink;
  ctx.fillRect(castleX - 190, FAR_H - 78, 380, 78);
  const tower = (cx: number, w: number, h: number, broken: boolean) => {
    ctx.fillRect(cx - w / 2, FAR_H - h, w, h);
    if (broken) {
      poly(ctx, [[cx - w / 2, FAR_H - h], [cx - w * 0.1, FAR_H - h - 22], [cx + w * 0.1, FAR_H - h - 6], [cx + w / 2, FAR_H - h - 28], [cx + w / 2, FAR_H - h]]);
      ctx.fill();
    } else {
      for (let k = 0; k < 4; k++) ctx.fillRect(cx - w / 2 + k * (w / 3.6), FAR_H - h - 9, w / 7, 10);
      poly(ctx, [[cx - w * 0.6, FAR_H - h], [cx, FAR_H - h - 48], [cx + w * 0.6, FAR_H - h]]);
      ctx.fill();
    }
  };
  tower(castleX - 150, 46, 180, false);
  tower(castleX + 6, 64, 240, true);
  tower(castleX + 150, 42, 150, false);
  // a few red windows
  for (const [wx, wy] of [[castleX - 150, FAR_H - 150], [castleX + 6, FAR_H - 190], [castleX + 6, FAR_H - 140], [castleX + 150, FAR_H - 120], [castleX - 60, FAR_H - 44], [castleX + 80, FAR_H - 50]]) {
    glowDot(ctx, wx, wy, 8, '#ff1744', 0.85);
  }
  groundFade(ctx, FAR_W, FAR_H, '#220509', 0.6, 0.85);
  return c;
}

function bossNear(rng: Rng): { near: HTMLCanvasElement; lights: HTMLCanvasElement } {
  const [near, n] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const [lights, l] = canvas(NEAR_W, NEAR_H, ART_SCALE);
  const slots = row(rng, NEAR_W, 110, 200, 0);
  slots.forEach(({ x, w }, i) => {
    wrapped(NEAR_W, dx => {
      const kind = i % 3;
      const edge = hexA('#ff5252', 0.4);
      if (kind === 0) {
        // broken columns of different heights
        const cols = 3;
        for (let k = 0; k < cols; k++) {
          const cw = 22;
          const cx = x + dx + w * 0.12 + k * (w * 0.32);
          const h = range(rng, 60, 160);
          const g = n.createLinearGradient(cx, 0, cx + cw, 0);
          g.addColorStop(0, '#2a0f16');
          g.addColorStop(1, '#0a0306');
          n.fillStyle = g;
          poly(n, [[cx, NEAR_H], [cx, NEAR_H - h], [cx + cw * 0.4, NEAR_H - h - 8], [cx + cw * 0.7, NEAR_H - h + 4], [cx + cw, NEAR_H - h - 3], [cx + cw, NEAR_H]]);
          n.fill();
          n.strokeStyle = edge;
          n.lineWidth = 1.2;
          n.beginPath();
          n.moveTo(cx + 0.5, NEAR_H);
          n.lineTo(cx + 0.5, NEAR_H - h);
          n.stroke();
          n.fillStyle = 'rgba(0,0,0,0.5)';
          for (let f = 1; f < 4; f++) n.fillRect(cx + 5 * f, NEAR_H - h + 10, 1.4, h - 10);
        }
      } else if (kind === 1) {
        // a ruined archway with a chain hanging from it
        const aw = w * 0.8;
        const ax = x + dx + w * 0.1;
        const h = range(rng, 130, 175);
        const mid = ax + aw / 2;
        const r = aw / 2 - 10;
        n.fillStyle = '#12060a';
        n.fillRect(ax, NEAR_H - h * 0.75, 20, h * 0.75);
        n.fillRect(ax + aw - 20, NEAR_H - h * 0.55, 20, h * 0.55);
        n.strokeStyle = '#12060a';
        n.lineWidth = 18;
        n.lineCap = 'butt';
        n.beginPath();
        n.arc(mid, NEAR_H - h * 0.75, r, Math.PI, Math.PI * 1.78);
        n.stroke();
        n.strokeStyle = edge;
        n.lineWidth = 1.2;
        n.beginPath();
        n.arc(mid, NEAR_H - h * 0.75, r + 9, Math.PI, Math.PI * 1.78);
        n.stroke();
        n.beginPath();
        n.moveTo(ax + 0.5, NEAR_H);
        n.lineTo(ax + 0.5, NEAR_H - h * 0.75);
        n.stroke();
        n.strokeStyle = '#2a0e15';
        n.lineWidth = 2;
        n.setLineDash([4, 3]);
        n.beginPath();
        n.moveTo(mid, NEAR_H - h * 0.75 - r + 4);
        n.lineTo(mid, NEAR_H - h * 0.32);
        n.stroke();
        n.setLineDash([]);
        glowDot(l, mid, NEAR_H - h * 0.32, 7, '#ff6d00', 0.8);
      } else {
        // shards of black glass standing in the ground, cracked with red
        const count = 5;
        for (let k = 0; k < count; k++) {
          const cx = x + dx + w * 0.08 + (k / (count - 1)) * w * 0.84;
          const h = range(rng, 50, 130);
          const sw = range(rng, 20, 36);
          const lean = range(rng, -12, 12);
          poly(n, [[cx - sw / 2, NEAR_H], [cx - sw * 0.3 + lean * 0.4, NEAR_H - h * 0.7], [cx + lean, NEAR_H - h], [cx + sw * 0.35 + lean * 0.4, NEAR_H - h * 0.65], [cx + sw / 2, NEAR_H]]);
          const g = n.createLinearGradient(cx - sw, 0, cx + sw, 0);
          g.addColorStop(0, '#34111a');
          g.addColorStop(1, '#090205');
          n.fillStyle = g;
          n.fill();
          n.strokeStyle = edge;
          n.lineWidth = 1.2;
          n.beginPath();
          n.moveTo(cx - sw / 2, NEAR_H);
          n.lineTo(cx - sw * 0.3 + lean * 0.4, NEAR_H - h * 0.7);
          n.lineTo(cx + lean, NEAR_H - h);
          n.stroke();
          l.strokeStyle = hexA('#ff3d00', 0.9);
          l.lineWidth = 1.4;
          l.beginPath();
          l.moveTo(cx + lean * 0.4, NEAR_H - h * 0.8);
          l.lineTo(cx - 3 + lean * 0.2, NEAR_H - h * 0.55);
          l.lineTo(cx + 2, NEAR_H - h * 0.35);
          l.stroke();
        }
      }
    });
  });
  // embers hanging in the air
  for (let i = 0; i < 34; i++) glowDot(l, range(rng, 0, NEAR_W), range(rng, 20, NEAR_H), range(rng, 2.5, 6), rng() < 0.6 ? '#ff6d00' : '#ff1744', 0.75);
  groundFade(n, NEAR_W, NEAR_H, '#220509', 0.7, 0.55);
  return { near, lights };
}

// ---------------------------------------------------------------------------
// Skies and suns
// ---------------------------------------------------------------------------

function skyBase(p: ThemePalette): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const [c, ctx] = canvas(SKY_W, SKY_H);
  const g = ctx.createLinearGradient(0, 0, 0, SKY_H);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(0.58, p.skyMid);
  g.addColorStop(1, p.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SKY_W, SKY_H);
  return [c, ctx];
}

function sky(theme: MusicTheme, p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = skyBase(p);
  if (theme === 'industrial') {
    // layers of smog, thicker towards the horizon, tinted by the furnaces
    for (let i = 0; i < 16; i++) {
      const y = range(rng, 200, SKY_H);
      softBlob(ctx, range(rng, 0, SKY_W), y, range(rng, 160, 340), range(rng, 14, 36), i % 3 === 0 ? '#ff7043' : '#455a64', range(rng, 0.1, 0.22));
    }
    softBlob(ctx, SKY_W / 2, SKY_H + 10, 640, 150, p.neon, 0.2);
  } else if (theme === 'ethereal') {
    // the aurora: curtains of light that sway across the upper sky
    for (let band = 0; band < 3; band++) {
      const col = [p.neon, '#b388ff', '#69f0ae'][band];
      const base = 90 + band * 55;
      for (let x = 0; x < SKY_W; x += 3) {
        const y = base + Math.sin(x / 120 + band * 1.7) * 38 + Math.sin(x / 47 + band) * 9;
        const h = 130 + Math.sin(x / 70 + band * 2.3) * 40;
        const g = ctx.createLinearGradient(0, y - h, 0, y);
        g.addColorStop(0, hexA(col, 0));
        g.addColorStop(0.7, hexA(col, 0.12));
        g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x, y - h, 3, h);
      }
    }
    softBlob(ctx, SKY_W * 0.5, SKY_H, 620, 120, '#9fd8ff', 0.16);
  } else if (theme === 'boss') {
    // an angry sky: dark clouds streaked with red
    for (let i = 0; i < 14; i++) {
      softBlob(ctx, range(rng, 0, SKY_W), range(rng, 40, 420), range(rng, 160, 320), range(rng, 22, 50), i % 3 === 0 ? '#ff1744' : '#1a0208', range(rng, 0.12, 0.3));
    }
    softBlob(ctx, SKY_W / 2, SKY_H + 20, 700, 160, '#d50000', 0.22);
  } else {
    // adventure: a few long, thin clouds catching the neon and a pink haze at the horizon
    for (let i = 0; i < 9; i++) {
      softBlob(ctx, range(rng, 0, SKY_W), range(rng, 120, 430), range(rng, 150, 300), range(rng, 6, 12), i % 2 ? '#ff4081' : '#7c4dff', range(rng, 0.1, 0.2));
    }
    softBlob(ctx, SKY_W * 0.72, SKY_H - 60, 480, 120, p.sunBot, 0.22);
  }
  return c;
}

function sunDisc(theme: MusicTheme, p: ThemePalette, rng: Rng): HTMLCanvasElement {
  const [c, ctx] = canvas(SUN_SIZE, SUN_SIZE);
  const m = SUN_SIZE / 2;
  if (theme === 'ethereal') {
    // a ringed planet and its small moon
    const halo = ctx.createRadialGradient(m, m, 80, m, m, 380);
    halo.addColorStop(0, hexA(p.sunTop, 0.35));
    halo.addColorStop(1, hexA(p.sunTop, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, SUN_SIZE, SUN_SIZE);
    const ring = (front: boolean) => {
      ctx.save();
      ctx.translate(m, m);
      ctx.rotate(-0.38);
      ctx.beginPath();
      ctx.rect(-400, front ? 0 : -400, 800, 400);
      ctx.clip();
      for (const [rx, ry, a, w] of [[285, 62, 0.5, 14], [240, 52, 0.35, 8], [315, 70, 0.22, 5]]) {
        ctx.strokeStyle = hexA(rng() < 0.5 ? p.sunTop : '#ffffff', a);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };
    ring(false);
    const g = ctx.createLinearGradient(m - 150, m - 150, m + 150, m + 150);
    g.addColorStop(0, '#e0f7ff');
    g.addColorStop(0.45, p.sunTop);
    g.addColorStop(1, p.sunBot);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m, m, 150, 0, Math.PI * 2);
    ctx.fill();
    // bands of cloud on the planet, and the shadow of the ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(m, m, 150, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = hexA(i % 2 ? '#ffffff' : p.sunBot, 0.06 + rng() * 0.07);
      ctx.fillRect(m - 160, m - 140 + i * 32 + rng() * 8, 320, 8 + rng() * 18);
    }
    const shade = ctx.createLinearGradient(m + 60, m - 100, m - 120, m + 120);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(8,4,40,0.62)');
    ctx.fillStyle = shade;
    ctx.fillRect(m - 160, m - 160, 320, 320);
    ctx.restore();
    ring(true);
    // the small moon
    ctx.fillStyle = '#e8eaf6';
    ctx.beginPath();
    ctx.arc(m + 250, m - 175, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,30,100,0.35)';
    ctx.beginPath();
    ctx.arc(m + 257, m - 170, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 'industrial') {
    // a sun seen through smog: big and dim, with bands of smoke drifting across it
    const halo = ctx.createRadialGradient(m, m, 60, m, m, 400);
    halo.addColorStop(0, hexA('#ff8a50', 0.42));
    halo.addColorStop(0.5, hexA('#bf360c', 0.15));
    halo.addColorStop(1, hexA('#bf360c', 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, SUN_SIZE, SUN_SIZE);
    const g = ctx.createRadialGradient(m - 20, m - 30, 10, m, m, 175);
    g.addColorStop(0, '#fff0d0');
    g.addColorStop(0.4, '#ffab40');
    g.addColorStop(1, '#e65100');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m, m, 175, 0, Math.PI * 2);
    ctx.fill();
    // smoke: long soft streaks that run past the edge of the disc, so it looks like haze and not like bands on a planet
    for (let i = 0; i < 5; i++) {
      softBlob(ctx, m + range(rng, -140, 140), m - 110 + i * 62, range(rng, 260, 340), range(rng, 12, 26), '#3a1a10', range(rng, 0.2, 0.34));
    }
  } else if (theme === 'boss') {
    // a cracked blood moon
    const halo = ctx.createRadialGradient(m, m, 120, m, m, 400);
    halo.addColorStop(0, hexA('#ff1744', 0.4));
    halo.addColorStop(1, hexA('#ff1744', 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, SUN_SIZE, SUN_SIZE);
    const g = ctx.createRadialGradient(m - 50, m - 50, 20, m, m, 185);
    g.addColorStop(0, '#ff8a65');
    g.addColorStop(0.4, '#c62828');
    g.addColorStop(1, '#3e0510');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m, m, 185, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(m, m, 185, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(40,0,10,${0.14 + rng() * 0.18})`;
      ctx.beginPath();
      ctx.arc(m + range(rng, -150, 150), m + range(rng, -150, 150), range(rng, 10, 36), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,0,6,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(m - 40, m - 190);
    ctx.lineTo(m - 20, m - 100);
    ctx.lineTo(m - 70, m - 30);
    ctx.lineTo(m - 30, m + 50);
    ctx.lineTo(m - 80, m + 120);
    ctx.lineTo(m - 60, m + 190);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m - 70, m - 30);
    ctx.lineTo(m - 140, m - 10);
    ctx.moveTo(m - 20, m - 100);
    ctx.lineTo(m + 40, m - 130);
    ctx.stroke();
    ctx.restore();
  } else {
    // the retro sun: a gradient disc cut by lines that thicken towards the bottom
    const glow = ctx.createRadialGradient(m, m, 0, m, m, 360);
    glow.addColorStop(0, hexA(p.sunBot, 0.5));
    glow.addColorStop(1, hexA(p.sunBot, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SUN_SIZE, SUN_SIZE);
    const [disc, d] = canvas(SUN_SIZE, SUN_SIZE);
    const g = d.createLinearGradient(0, m - 190, 0, m + 190);
    g.addColorStop(0, p.sunTop);
    g.addColorStop(1, p.sunBot);
    d.fillStyle = g;
    d.beginPath();
    d.arc(m, m, 190, 0, Math.PI * 2);
    d.fill();
    d.globalCompositeOperation = 'destination-out';
    for (const [dy, h] of [[35, 8], [62, 12], [92, 16], [126, 22], [164, 28]]) d.fillRect(m - 200, m + dy, 400, h);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(disc, 0, 0);
    ctx.globalAlpha = 1;
  }
  return c;
}

/** The five pieces of a world's backdrop. */
export function makeWorldLayers(theme: MusicTheme, p: ThemePalette, seed: number): WorldLayers {
  const rng = mulberry32(seed);
  const skyCanvas = sky(theme, p, mulberry32(seed + 11));
  const sunCanvas = sunDisc(theme, p, mulberry32(seed + 23));
  if (theme === 'industrial') {
    const { near, lights } = industrialNear(p, rng);
    return { sky: skyCanvas, sun: sunCanvas, far: industrialFar(p, mulberry32(seed + 31)), near, lights };
  }
  if (theme === 'ethereal') {
    const { near, lights } = etherealNear(p, rng);
    return { sky: skyCanvas, sun: sunCanvas, far: etherealFar(p, mulberry32(seed + 31)), near, lights };
  }
  if (theme === 'boss') {
    const { near, lights } = bossNear(rng);
    return { sky: skyCanvas, sun: sunCanvas, far: bossFar(p, mulberry32(seed + 31)), near, lights };
  }
  const { near, lights } = adventureNear(p, rng);
  return { sky: skyCanvas, sun: sunCanvas, far: adventureFar(p, mulberry32(seed + 31)), near, lights };
}
