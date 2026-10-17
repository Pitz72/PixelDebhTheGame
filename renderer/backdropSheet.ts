/**
 * Dev page (npm run dev, then /backdrop-sheet.html?theme=industrial&cam=0): one world's backdrop as the game composes it
 * (sky, sun, far strip, near strip, glowing lights), 1920 x 1080, with a floor, a ledge and a figure of Debh's size
 * to judge how much the scenery competes with the play field. `cam` is the camera position in px (parallax).
 */
import { MusicTheme } from '../types';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { PALETTES } from './palette';
import { ART_SCALE, FAR_H, NEAR_H, makeWorldLayers } from './worldArt';

const q = new URLSearchParams(location.search);
const theme = (q.get('theme') ?? 'adventure') as MusicTheme;
const cam = Number(q.get('cam') ?? 0);
const p = PALETTES[theme];
const seed = theme.length * 977;
const t0 = performance.now();
const layers = makeWorldLayers(theme, p, seed);
document.title = `${theme}: ${(performance.now() - t0).toFixed(0)} ms to draw`;

const c = document.createElement('canvas');
c.width = GAME_WIDTH;
c.height = GAME_HEIGHT;
document.body.appendChild(c);
const ctx = c.getContext('2d') as CanvasRenderingContext2D;

ctx.drawImage(layers.sky, 0, 0, GAME_WIDTH, GAME_HEIGHT);
// a few stars
let s = seed;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 140; i++) {
  ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.5})`;
  ctx.beginPath();
  ctx.arc(rnd() * GAME_WIDTH, rnd() * GAME_HEIGHT * 0.75, 0.6 + rnd() * 1.4, 0, Math.PI * 2);
  ctx.fill();
}
ctx.drawImage(layers.sun, 1420 - 400 - cam * 0.015, 420 - 400);

const strip = (img: HTMLCanvasElement, y: number, h: number, factor: number, alpha = 1, add = false) => {
  const w = img.width / ART_SCALE;
  const off = -((cam * factor) % w);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (add) ctx.globalCompositeOperation = 'lighter';
  for (let x = off - w; x < GAME_WIDTH + w; x += w) ctx.drawImage(img, x, y, w, h);
  ctx.restore();
};
strip(layers.far, GAME_HEIGHT - 112 - FAR_H + 20, FAR_H, 0.14);
strip(layers.near, GAME_HEIGHT - NEAR_H, NEAR_H, 0.28);
strip(layers.lights, GAME_HEIGHT - NEAR_H, NEAR_H, 0.28, 0.7, true);

// the play field, for scale: a floor, a ledge, and Debh's size (54 x 122)
ctx.fillStyle = p.platformTop;
ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
ctx.fillStyle = p.rail;
ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 3);
ctx.fillStyle = p.platformTop;
ctx.fillRect(700, GAME_HEIGHT - 330, 420, 30);
ctx.fillStyle = p.rail;
ctx.fillRect(700, GAME_HEIGHT - 330, 420, 3);
ctx.fillStyle = 'rgba(255,255,255,0.55)';
ctx.fillRect(300, GAME_HEIGHT - 40 - 122, 54, 122);
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.fillRect(900, GAME_HEIGHT - 330 - 50, 50, 50);
