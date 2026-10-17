import { mulberry32 } from '../engine/rng';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

/**
 * The look of the final stage, the Collector's Vault: a dark museum hall whose walls are shelves of
 * giant retro gear (the same Atari, Amiga, NES, Sega, CD-ROM and the rest that Debh collects), lit
 * by spotlights from the ceiling, with a polished floor. All drawn with the 2D canvas.
 */

const canvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas unavailable');
  return [c, g];
};

/** The back wall of the hall, full screen: a dark panelled wall with a glow of light high up. */
export function drawVaultWall(): HTMLCanvasElement {
  const [c, g] = canvas(GAME_WIDTH, GAME_HEIGHT);
  const sky = g.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  sky.addColorStop(0, '#0d0924');
  sky.addColorStop(0.38, '#1a1246');
  sky.addColorStop(1, '#07040f');
  g.fillStyle = sky;
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // wall panels
  for (let x = 0; x < GAME_WIDTH; x += 240) {
    if ((x / 240) % 2 === 0) {
      g.fillStyle = 'rgba(255,255,255,0.018)';
      g.fillRect(x, 0, 240, GAME_HEIGHT);
    }
    g.fillStyle = 'rgba(160,140,255,0.06)';
    g.fillRect(x, 0, 2, GAME_HEIGHT);
  }
  // the cornice
  g.fillStyle = 'rgba(255,214,128,0.10)';
  g.fillRect(0, 92, GAME_WIDTH, 8);
  g.fillStyle = 'rgba(255,214,128,0.22)';
  g.fillRect(0, 100, GAME_WIDTH, 2);

  const glow = g.createRadialGradient(GAME_WIDTH / 2, 120, 0, GAME_WIDTH / 2, 120, 980);
  glow.addColorStop(0, 'rgba(140,100,255,0.28)');
  glow.addColorStop(1, 'rgba(140,100,255,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  return c;
}

/**
 * Three shelves of giant collectibles, as one tile that repeats sideways (it starts and ends on a
 * divider). The gear is dimmed so the bosses and the shots stand out in front of it.
 */
export function drawVaultShelves(gear: HTMLCanvasElement[]): HTMLCanvasElement {
  const W = GAME_WIDTH;
  const [c, g] = canvas(W, GAME_HEIGHT);
  const rng = mulberry32(2026);
  const rows = [300, 610, 920];
  const BAY = 480;

  rows.forEach((y, r) => {
    // the back of the bays
    g.fillStyle = 'rgba(40,28,92,0.5)';
    g.fillRect(0, y - 250, W, 250);
    const edge = r % 2 === 0 ? 'rgba(0,229,255,0.55)' : 'rgba(255,64,129,0.5)';
    // the board, with a bright edge and a shadow under it
    const board = g.createLinearGradient(0, y, 0, y + 22);
    board.addColorStop(0, '#4a3680');
    board.addColorStop(1, '#1a1238');
    g.fillStyle = board;
    g.fillRect(0, y, W, 22);
    g.fillStyle = edge;
    g.fillRect(0, y, W, 3);
    const shadow = g.createLinearGradient(0, y + 22, 0, y + 70);
    shadow.addColorStop(0, 'rgba(0,0,0,0.45)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = shadow;
    g.fillRect(0, y + 22, W, 48);

    // the gear: eight pieces on each shelf, resting on the board
    for (let k = 0; k < 8; k++) {
      const item = gear[(r * 3 + k * 5 + 1) % gear.length];
      const size = 150 + Math.floor(rng() * 40);
      const x = 66 + k * 232 + Math.floor((rng() - 0.5) * 12);
      const top = y - size + 8;
      g.fillStyle = 'rgba(0,0,0,0.32)';
      g.beginPath();
      g.ellipse(x + size / 2, y + 4, size * 0.46, 9, 0, 0, Math.PI * 2);
      g.fill();
      // dim the piece itself, not its surroundings
      const [d, dg] = canvas(size, size);
      dg.drawImage(item, 0, 0, size, size);
      dg.globalCompositeOperation = 'source-atop';
      dg.fillStyle = 'rgba(10,6,34,0.52)';
      dg.fillRect(0, 0, size, size);
      g.globalAlpha = 0.9;
      g.drawImage(d, x, top);
      g.globalAlpha = 1;
    }
  });

  // dividers between the bays (half of one on each edge, so the tile joins up)
  for (let x = 0; x <= W; x += BAY) {
    g.fillStyle = '#2a1f5a';
    g.fillRect(x - 8, 0, 16, GAME_HEIGHT);
    g.fillStyle = 'rgba(160,140,255,0.28)';
    g.fillRect(x - 8, 0, 2, GAME_HEIGHT);
  }
  return c;
}

/** A cone of light from a spotlight in the ceiling, narrow at the top, soft all round. */
export function drawVaultLight(): HTMLCanvasElement {
  const w = 300;
  const [c, g] = canvas(w, GAME_HEIGHT);
  const fade = g.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  fade.addColorStop(0, 'rgba(255,240,200,0.9)');
  fade.addColorStop(0.55, 'rgba(255,240,200,0.28)');
  fade.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = fade;
  g.beginPath();
  g.moveTo(w / 2 - 14, 0);
  g.lineTo(w / 2 + 14, 0);
  g.lineTo(w, GAME_HEIGHT);
  g.lineTo(0, GAME_HEIGHT);
  g.closePath();
  g.fill();
  // soften the sides
  g.globalCompositeOperation = 'destination-in';
  const sides = g.createLinearGradient(0, 0, w, 0);
  sides.addColorStop(0, 'rgba(0,0,0,0)');
  sides.addColorStop(0.5, 'rgba(0,0,0,1)');
  sides.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sides;
  g.fillRect(0, 0, w, GAME_HEIGHT);
  return c;
}

/** The polished floor at the bottom of the hall, a tile that repeats sideways. */
export function drawVaultFloor(): HTMLCanvasElement {
  const w = 160;
  const h = 140;
  const [c, g] = canvas(w, h);
  const base = g.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#1c1442');
  base.addColorStop(1, '#09061a');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,229,255,0.12)';
  g.fillRect(0, 0, 2, h); // the seam between tiles
  g.fillStyle = 'rgba(255,255,255,0.045)';
  g.fillRect(0, 36, w, 2);
  g.fillRect(0, 84, w, 2);
  // the bright edge where the floor meets the hall
  g.fillStyle = 'rgba(0,229,255,0.75)';
  g.fillRect(0, 0, w, 4);
  // a reflection of the lights
  const shine = g.createLinearGradient(0, 0, 0, h);
  shine.addColorStop(0, 'rgba(255,255,255,0.14)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.fillStyle = shine;
  g.fillRect(0, 0, w, h);
  return c;
}
