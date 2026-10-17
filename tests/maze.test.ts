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
  areHurtboxesColliding,
} from '../engine';
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  MAZE_PLAYER_SPEED,
  MAZE_PLAYER_SCALE,
  MAZE_PLAYER_WIDTH,
  MAZE_PLAYER_HEIGHT,
  MAZE_PICKUP_MARGIN,
} from '../constants';
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

describe('Debh in the labyrinth', () => {
  const m = labyrinth.maze as NonNullable<LevelData['maze']>;
  const c = corridor(m);
  const k = MAZE_PLAYER_SCALE;
  // the same padding the engine uses for walkers touching her (checkPlayerDamage)
  const touches = (p: { x: number; y: number; width: number; height: number }, pk: number, e: { x: number; y: number; width: number; height: number }) =>
    areHurtboxesColliding(p, e, 9 * pk, 7 * pk, 7, 6);

  it('is drawn smaller and has a low footprint, centred where the start cell is', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    expect(w.playerScale).toBe(MAZE_PLAYER_SCALE);
    expect(w.player.width).toBe(MAZE_PLAYER_WIDTH);
    expect(w.player.height).toBe(MAZE_PLAYER_HEIGHT);
    expect(makeFrame(w).playerScale).toBe(MAZE_PLAYER_SCALE);
    const start = cellCenter(m, 0, 0);
    expect(w.player.x + w.player.width / 2).toBeCloseTo(start.x, 6);
    expect(w.player.y + w.player.height / 2).toBeCloseTo(start.y, 6);

    const plain = createWorld({ rng: mulberry32(1) }); // every other level keeps the full body
    expect(plain.playerScale).toBe(1);
    expect(plain.player.width).toBe(PLAYER_WIDTH);
    expect(plain.player.height).toBe(PLAYER_HEIGHT);
  });

  it('can slip past a walker that sits in the middle of a horizontal corridor', () => {
    const walker = { x: 0, y: (c - 50) / 2, width: 50, height: 50 }; // walkers re-centre in every cell
    const flyer = { x: 0, y: (c - 44) / 2, width: 60, height: 44 };
    for (const e of [walker, flyer]) {
      const top = { x: 0, y: 0, width: MAZE_PLAYER_WIDTH, height: MAZE_PLAYER_HEIGHT };
      const bottom = { ...top, y: c - MAZE_PLAYER_HEIGHT };
      expect(touches(top, k, e)).toBe(false);
      expect(touches(bottom, k, e)).toBe(false);
      // and with room to spare: at least 20 px between the two hurtboxes
      const gap = e.y + 6 - (top.y + top.height - 7 * k);
      expect(gap).toBeGreaterThanOrEqual(20);
    }
  });

  it('could not before: the old 54x90 body filled a 200 px corridor next to a walker', () => {
    const walker = { x: 0, y: (c - 50) / 2, width: 50, height: 50 };
    const top = { x: 0, y: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
    const bottom = { ...top, y: c - PLAYER_HEIGHT };
    expect(touches(top, 1, walker) && touches(bottom, 1, walker)).toBe(true);
  });

  it('picks up items and takes the exit a little before the footprint touches them', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    w.enemies = [];
    const item = w.items.find(i => i.type === 'joystick')!;
    const gap = MAZE_PICKUP_MARGIN - 4;
    w.player.x = item.x - w.player.width - gap; // clear of the item, but inside the margin
    w.player.y = item.y + (item.height - w.player.height) / 2;
    const before = w.items.length;
    step(w);
    expect(w.items.length).toBe(before - 1);

    const far = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    far.enemies = [];
    const other = far.items.find(i => i.type === 'floppy')!;
    far.player.x = other.x - far.player.width - MAZE_PICKUP_MARGIN - 6; // just outside the margin
    far.player.y = other.y + (other.height - far.player.height) / 2;
    const n = far.items.length;
    step(far);
    expect(far.items.length).toBe(n);
  });

  it('shoots from her (smaller) gamepad: the muzzle sits at her shoulder height, scaled', () => {
    const w = createWorld({ levels: [labyrinth], rng: mulberry32(1) });
    w.enemies = [];
    w.input = { ...w.input, shoot: true };
    step(w);
    const shot = w.playerProjectiles[0];
    expect(shot).toBeDefined();
    const feet = w.player.y + w.player.height;
    expect(feet - (shot.y + shot.height / 2)).toBeCloseTo(78 * k, 6); // shoulder: 78 px above her feet at full size
  });
});

describe('the labyrinth level', () => {
  it('is the last level before the final stage and has a corridor wide enough for the player', () => {
    expect(labyrinthIndex).toBe(levels.length - 2); // its exit leads to the three bosses
    expect(levels[levels.length - 1].bosses).toHaveLength(3);
    const m = labyrinth.maze as NonNullable<LevelData['maze']>;
    expect(corridor(m)).toBeGreaterThanOrEqual(PLAYER_HEIGHT + 60);
    expect(corridor(m)).toBeGreaterThanOrEqual(PLAYER_WIDTH + 60);
  });

  it('zooms in so the map stays hidden, and gives a sane time limit', () => {
    expect(labyrinth.zoom).toBeGreaterThanOrEqual(1.2);
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

describe('the labyrinth gets harder with each LOOP, but stays the same labyrinth', () => {
  const loop = (n: number) => createWorld({ levels: [labyrinth], loopCount: n, rng: mulberry32(1) });
  const base = labyrinth.enemies.length;

  it('is as it was in the first lap', () => {
    const w = loop(1);
    expect(w.enemies).toHaveLength(base);
    expect(w.timeRemaining).toBe(labyrinth.timeLimit);
  });

  it('adds a fifth more walkers for each extra lap, and takes a minute off the clock', () => {
    for (const n of [2, 3, 4]) {
      const w = loop(n);
      expect(w.enemies).toHaveLength(base + Math.round(base * 0.2 * (n - 1)));
      expect(w.timeRemaining).toBe((labyrinth.timeLimit as number) - 60 * (n - 1));
    }
  });

  it('keeps the same walls, items and exit', () => {
    const first = loop(1);
    const later = loop(5);
    expect(later.platforms).toEqual(first.platforms);
    expect(later.items).toEqual(first.items);
    expect(later.goal).toEqual(first.goal);
    expect(later.player.x).toBe(first.player.x);
  });

  it('puts the newcomers in new cells, away from the start and out of the walls', () => {
    const reserve = labyrinth.loopEnemies ?? [];
    expect(reserve.length).toBeGreaterThanOrEqual(base - 2);
    const m = labyrinth.maze as NonNullable<LevelData['maze']>;
    const cells = [...labyrinth.enemies, ...reserve].map(e => {
      const { c, r } = cellAt(m, e.x + e.width / 2, e.y + e.height / 2);
      return r * m.cols + c;
    });
    expect(new Set(cells).size).toBe(cells.length); // no two in one cell
    const d = distancesFrom(m, 0, 0);
    for (const cell of cells) expect(d[cell]).toBeGreaterThanOrEqual(14);
    for (const e of reserve) {
      expect(labyrinth.platforms.some(p => e.x < p.x + p.width && e.x + e.width > p.x && e.y < p.y + p.height && e.y + e.height > p.y)).toBe(false);
    }
    // a mixed bunch: the first few newcomers are not all of one kind
    expect(new Set(reserve.slice(0, 5).map(e => e.type)).size).toBeGreaterThan(2);
  });

  it('never runs the clock below what a clean run needs, and never past the reserve', () => {
    const late = loop(40);
    expect(late.timeRemaining).toBeGreaterThanOrEqual(labyrinth.timeFloor as number);
    expect(late.timeRemaining).toBe(labyrinth.timeFloor);
    expect(late.enemies).toHaveLength(base + (labyrinth.loopEnemies ?? []).length);
    // the floor leaves a flawless run a good margin
    const route = (labyrinth.timeLimit as number) / 2.5;
    expect(late.timeRemaining as number).toBeGreaterThan(route);
  });

  it('does not touch any other level', () => {
    const plain = createWorld({ loopCount: 4, rng: mulberry32(1) });
    expect(plain.enemies).toHaveLength(levels[0].enemies.length);
    expect(plain.timeRemaining).toBeNull();
  });
});
