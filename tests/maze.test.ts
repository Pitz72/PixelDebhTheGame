import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { generateMaze, type MazeSpec } from '../mazeGen';
import {
  createWorld,
  loadLevel,
  step,
  makeFrame,
  cameraFor,
  cellAt,
  cellCenter,
  corridor,
  distancesFrom,
  isOpen,
  mulberry32,
  pathBetween,
} from '../engine';
import { PLAYER_WIDTH, PLAYER_HEIGHT, MAZE_PLAYER_SPEED } from '../constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import type { LevelData } from '../types';

const SPEC: MazeSpec = {
  seed: 5,
  cols: 14,
  rows: 9,
  pitch: 256,
  wall: 56,
  items: { joystick: 3, floppy: 3, cartridge: 3, 'speed-boost': 1, shield: 1, 'super-throw': 1 },
  enemies: { phaser: 1, flyer: 2, base: 2, jumper: 1, bomber: 1 },
  braid: 0.35,
  straight: 0.55,
  playerSpeed: MAZE_PLAYER_SPEED,
};

const labyrinthIndex = levels.findIndex(l => l.maze);
const labyrinth = levels[labyrinthIndex];

const inside = (px: number, py: number, p: { x: number; y: number; width: number; height: number }) =>
  px >= p.x && px < p.x + p.width && py >= p.y && py < p.y + p.height;

describe('maze generator', () => {
  const a = generateMaze(SPEC);

  it('builds the same labyrinth from the same seed and another from another seed', () => {
    expect(generateMaze(SPEC)).toEqual(a);
    expect(generateMaze({ ...SPEC, seed: 6 }).data.openRight).not.toEqual(a.data.openRight);
  });

  it('connects every cell to the start', () => {
    const d = distancesFrom(a.data, 0, 0);
    expect(Array.from(d).filter(x => x < 0)).toHaveLength(0);
  });

  it('puts the exit as far from the start as the labyrinth allows', () => {
    const d = distancesFrom(a.data, 0, 0);
    expect(d[a.stats.goalCell]).toBe(Math.max(...Array.from(d)));
  });

  it('draws a wall exactly where the grid says there is one', () => {
    const m = a.data;
    const wallAt = (x: number, y: number) => a.platforms.some(p => inside(x, y, p));
    for (let r = 0; r < m.rows; r++) {
      for (let c = 0; c < m.cols; c++) {
        const mid = cellCenter(m, c, r);
        expect(wallAt(mid.x, mid.y), `cell ${c},${r} is a corridor`).toBe(false);
        const half = corridor(m) / 2 + m.wall / 2;
        expect(wallAt(mid.x + half, mid.y), `east of ${c},${r}`).toBe(!isOpen(m, c, r, 0));
        expect(wallAt(mid.x, mid.y + half), `south of ${c},${r}`).toBe(!isOpen(m, c, r, 1));
        expect(wallAt(mid.x - half, mid.y), `west of ${c},${r}`).toBe(!isOpen(m, c, r, 2));
        expect(wallAt(mid.x, mid.y - half), `north of ${c},${r}`).toBe(!isOpen(m, c, r, 3));
      }
    }
  });

  it('places the items, enemies and exit in corridors, where the player can reach them', () => {
    expect(a.items).toHaveLength(Object.values(SPEC.items).reduce((s, n) => s + (n ?? 0), 0));
    expect(a.enemies).toHaveLength(Object.values(SPEC.enemies).reduce((s, n) => s + (n ?? 0), 0));
    const rects = [...a.items, ...a.enemies, a.goal];
    for (const r of rects) {
      expect(a.platforms.some(p => r.x < p.x + p.width && r.x + r.width > p.x && r.y < p.y + p.height && r.y + r.height > p.y)).toBe(false);
    }
  });

  it('keeps the enemies at least 14 steps through the labyrinth from the start', () => {
    const d = distancesFrom(a.data, 0, 0);
    for (const e of a.enemies) {
      const { c, r } = cellAt(a.data, e.x + e.width / 2, e.y + e.height / 2);
      expect(d[r * a.data.cols + c]).toBeGreaterThanOrEqual(14);
    }
  });
});

describe('the labyrinth level', () => {
  it('is the last level and has a corridor wide enough for the player', () => {
    expect(labyrinthIndex).toBe(levels.length - 1);
    const m = labyrinth.maze as NonNullable<LevelData['maze']>;
    expect(corridor(m)).toBeGreaterThanOrEqual(PLAYER_HEIGHT + 60);
    expect(corridor(m)).toBeGreaterThanOrEqual(PLAYER_WIDTH + 60);
  });

  it('zooms in so the map stays hidden, and gives a sane time limit', () => {
    expect(labyrinth.zoom).toBeGreaterThanOrEqual(1.4);
    expect(labyrinth.timeLimit).toBeGreaterThanOrEqual(600);
    expect(labyrinth.timeLimit).toBeLessThanOrEqual(1800);
  });

  it('shows only a small part of the map at a time', () => {
    const zoom = labyrinth.zoom as number;
    const shown = (GAME_WIDTH / zoom) * (GAME_HEIGHT / zoom);
    const area = (labyrinth.levelWidth as number) * (labyrinth.levelHeight as number);
    expect(shown / area).toBeGreaterThan(0.005);
    expect(shown / area).toBeLessThan(0.05);
  });

  it('can be finished by walking the corridors: collect everything, then take the exit', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(3) });
    w.isGodMode = true;
    w.enemies = [];
    const m = w.maze as NonNullable<LevelData['maze']>;

    // a greedy route through every item, then the exit
    const cellOf = (r: { x: number; y: number; width: number; height: number }) => {
      const { c, r: row } = cellAt(m, r.x + r.width / 2, r.y + r.height / 2);
      return row * m.cols + c;
    };
    const targets = w.items.map(cellOf);
    const goalCell = cellOf(w.goal as { x: number; y: number; width: number; height: number });
    let here = cellOf({ x: w.player.x, y: w.player.y, width: w.player.width, height: w.player.height });
    const waypoints: number[] = [];
    const left = targets.slice();
    while (left.length) {
      const d = distancesFrom(m, here % m.cols, Math.floor(here / m.cols));
      let best = 0;
      for (let i = 1; i < left.length; i++) if (d[left[i]] < d[left[best]]) best = i;
      waypoints.push(...pathBetween(m, here, left[best]).slice(1));
      here = left[best];
      left.splice(best, 1);
    }
    waypoints.push(...pathBetween(m, here, goalCell).slice(1));

    let next = 0;
    let steps = 0;
    const limit = (labyrinth.timeLimit as number) * 60;
    while (w.status === 'playing' && steps < limit) {
      const target = cellCenter(m, waypoints[next] % m.cols, Math.floor(waypoints[next] / m.cols));
      const px = w.player.x + w.player.width / 2;
      const py = w.player.y + w.player.height / 2;
      const dx = target.x - px;
      const dy = target.y - py;
      if (Math.abs(dx) <= MAZE_PLAYER_SPEED && Math.abs(dy) <= MAZE_PLAYER_SPEED) {
        if (next < waypoints.length - 1) next++;
      }
      w.input = { ...w.input, left: false, right: false, up: false, down: false };
      if (Math.abs(dx) > MAZE_PLAYER_SPEED) {
        if (dx > 0) w.input.right = true;
        else w.input.left = true;
      } else if (Math.abs(dy) > 2) {
        if (dy > 0) w.input.down = true;
        else w.input.up = true;
      }
      step(w);
      steps++;
    }

    expect(w.status).toBe('level-cleared');
    expect(w.items).toHaveLength(0);
    expect(w.timeRemaining).toBeGreaterThan(0);
    // the best route is well inside the time limit, as designed
    expect(steps / 60).toBeLessThan((labyrinth.timeLimit as number) * 0.6);
  });

  it('keeps the walkers inside the corridors', () => {
    const base = createWorld({ levels: [labyrinth], rng: mulberry32(11) });
    const walkers = base.enemies.filter(e => e.type === 'base' || e.type === 'jumper' || e.type === 'flyer').slice(0, 4);
    expect(walkers.length).toBeGreaterThan(0);
    for (const spawn of walkers) {
      const w = createWorld({ levels: [labyrinth], rng: mulberry32(11) });
      w.isGodMode = true;
      const e = w.enemies.find(x => x.id === spawn.id)!;
      w.player.x = e.x - 600; // close enough to wake the enemy up, in a wall-free spot is not needed in god mode
      w.player.y = e.y;
      const start = { x: e.x, y: e.y };
      let moved = 0;
      for (let i = 0; i < 1800; i++) {
        step(w);
        const rect = { x: e.x + 2, y: e.y + 2, width: e.width - 4, height: e.height - 4 };
        const hit = w.platforms.find(p => rect.x < p.x + p.width && rect.x + rect.width > p.x && rect.y < p.y + p.height && rect.y + rect.height > p.y);
        expect(hit, `${e.type} #${e.id} walked into a wall at step ${i}`).toBeUndefined();
        moved = Math.max(moved, Math.hypot(e.x - start.x, e.y - start.y));
      }
      expect(moved).toBeGreaterThan(200);
    }
  });

  it('centres the zoomed view on the player and never shows outside the level', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    const zoom = w.zoom;
    const viewW = GAME_WIDTH / zoom;
    const viewH = GAME_HEIGHT / zoom;
    for (const [cx, cy] of [[w.levelWidth / 2, w.levelHeight / 2], [0, 0], [w.levelWidth, w.levelHeight], [900, 5000]]) {
      const cam = cameraFor(w, cx, cy);
      const left = cam.x + (GAME_WIDTH - viewW) / 2;
      const top = cam.y + (GAME_HEIGHT - viewH) / 2;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left + viewW).toBeLessThanOrEqual(w.levelWidth + 1e-6);
      expect(top + viewH).toBeLessThanOrEqual(w.levelHeight + 1e-6);
    }
    const mid = cameraFor(w, w.levelWidth / 2, w.levelHeight / 2);
    expect(mid.x + (GAME_WIDTH - viewW) / 2 + viewW / 2).toBeCloseTo(w.levelWidth / 2, 3);
  });

  it('moves the player exactly with the keys, with no inertia, and stops at once', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    w.enemies = [];
    w.input = { ...w.input, right: true };
    step(w);
    expect(w.player.vx).toBeCloseTo(MAZE_PLAYER_SPEED, 6);
    w.input = { ...w.input, right: false };
    step(w);
    expect(w.player.vx).toBe(0);
    w.input = { ...w.input, right: true, down: true };
    step(w);
    expect(Math.hypot(w.player.vx, w.player.vy)).toBeCloseTo(MAZE_PLAYER_SPEED, 6);
  });

  it('is announced to the renderer: zoom, maze flag and every item counted', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    const f = makeFrame(w);
    expect(f.maze).toBe(true);
    expect(f.zoom).toBe(labyrinth.zoom);
    expect(f.collectiblesLeft).toBe(labyrinth.items.length);
    loadLevel(createWorld({ rng: mulberry32(1) }), 0); // a normal level is unaffected
    const plain = makeFrame(createWorld({ rng: mulberry32(1) }));
    expect(plain.maze).toBe(false);
    expect(plain.zoom).toBe(1);
  });
});
