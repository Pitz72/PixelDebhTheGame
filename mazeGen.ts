/**
 * Generates a labyrinth level: corridors on a grid carved with a depth-first walk, the exit in
 * the cell farthest from the start, the items in dead ends, enemies spread along the corridors.
 * Everything comes from a seed, so the same labyrinth is built every time.
 */
import type { EnemyType, ItemType, LevelData, MazeData } from './types';
import { mulberry32 } from './engine/rng';
import {
  HEADINGS,
  cellCenter,
  corridor,
  degree,
  distancesFrom,
  isOpen,
  mazeHeight,
  mazeWidth,
  pathBetween,
} from './engine/mazeGrid';

export interface MazeSpec {
  seed: number;
  cols: number;
  rows: number;
  /** Corridor plus wall. */
  pitch: number;
  wall: number;
  items: Partial<Record<ItemType, number>>;
  enemies: Partial<Record<EnemyType, number>>;
  /** Fraction of the dead ends that get a second way in, which makes loops. */
  braid: number;
  /** Chance of carrying on straight while carving: higher means longer corridors. */
  straight: number;
  /** Player speed in px per step, for the time limit. */
  playerSpeed: number;
}

export interface MazeLevelParts {
  data: MazeData;
  levelWidth: number;
  levelHeight: number;
  platforms: NonNullable<LevelData['platforms']>;
  items: LevelData['items'];
  enemies: LevelData['enemies'];
  checkpoints: NonNullable<LevelData['checkpoints']>;
  goal: NonNullable<LevelData['goal']>;
  playerStart: LevelData['playerStart'];
  timeLimit: number;
  stats: {
    startCell: number;
    goalCell: number;
    /** Cells on the shortest way from the start to the exit. */
    pathCells: number;
    deadEnds: number;
    /** Seconds the greedy collect-everything route takes at the player's speed. */
    routeSeconds: number;
  };
}

const RETRO_ITEMS: ItemType[] = ['joystick', 'floppy', 'cartridge'];
const GOAL_W = 90;
const GOAL_H = 150;
const ENEMY_SIZE: Record<EnemyType, { w: number; h: number }> = {
  base: { w: 50, h: 50 },
  jumper: { w: 50, h: 50 },
  flyer: { w: 60, h: 44 },
  bomber: { w: 50, h: 50 },
  phaser: { w: 50, h: 50 },
};

function carve(spec: MazeSpec, rng: () => number): MazeData {
  const { cols, rows } = spec;
  const openRight = new Array<boolean>(cols * rows).fill(false);
  const openDown = new Array<boolean>(cols * rows).fill(false);
  const open = (c: number, r: number, d: number) => {
    if (d === 0) openRight[r * cols + c] = true;
    else if (d === 1) openDown[r * cols + c] = true;
    else if (d === 2) openRight[r * cols + c - 1] = true;
    else openDown[(r - 1) * cols + c] = true;
  };

  const visited = new Uint8Array(cols * rows);
  const stack = [0];
  visited[0] = 1;
  let last = -1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const c = cur % cols;
    const r = (cur - c) / cols;
    const options: number[] = [];
    for (let d = 0; d < 4; d++) {
      const nc = c + HEADINGS[d].dx;
      const nr = r + HEADINGS[d].dy;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited[nr * cols + nc]) options.push(d);
    }
    if (options.length === 0) {
      stack.pop();
      last = -1;
      continue;
    }
    let d = options[Math.floor(rng() * options.length)];
    if (last >= 0 && options.includes(last) && rng() < spec.straight) d = last;
    open(c, r, d);
    const next = (r + HEADINGS[d].dy) * cols + c + HEADINGS[d].dx;
    visited[next] = 1;
    stack.push(next);
    last = d;
  }

  const data: MazeData = { cols, rows, pitch: spec.pitch, wall: spec.wall, openRight, openDown };

  // Braid: give some dead ends a second way in, so there are loops and not one single path.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (degree(data, c, r) !== 1 || rng() >= spec.braid) continue;
      const closed: number[] = [];
      for (let d = 0; d < 4; d++) {
        const nc = c + HEADINGS[d].dx;
        const nr = r + HEADINGS[d].dy;
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !isOpen(data, c, r, d)) closed.push(d);
      }
      if (closed.length) open(c, r, closed[Math.floor(rng() * closed.length)]);
    }
  }
  return data;
}

/** The walls as a short list of rectangles: long runs along the rows and the columns of the grid. */
function wallRects(m: MazeData): NonNullable<LevelData['platforms']> {
  const T = m.wall;
  const C = corridor(m);
  const nI = 2 * m.cols + 1;
  const nJ = 2 * m.rows + 1;
  const solid = (i: number, j: number): boolean => {
    const iEven = i % 2 === 0;
    const jEven = j % 2 === 0;
    if (iEven && jEven) return true; // pillar
    if (!iEven && !jEven) return false; // corridor
    if (iEven) {
      const k = i / 2;
      return k === 0 || k === m.cols || !m.openRight[((j - 1) / 2) * m.cols + k - 1];
    }
    const k = j / 2;
    return k === 0 || k === m.rows || !m.openDown[(k - 1) * m.cols + (i - 1) / 2];
  };
  const at = (i: number) => Math.ceil(i / 2) * T + Math.floor(i / 2) * C;
  const size = (i: number) => (i % 2 === 0 ? T : C);

  const rects: NonNullable<LevelData['platforms']> = [];
  // vertical runs along the wall columns (pillars included)
  for (let i = 0; i < nI; i += 2) {
    let j = 0;
    while (j < nJ) {
      if (!solid(i, j)) {
        j++;
        continue;
      }
      let end = j;
      while (end + 1 < nJ && solid(i, end + 1)) end++;
      rects.push({ x: at(i), y: at(j), width: T, height: at(end) + size(end) - at(j), wall: true });
      j = end + 1;
    }
  }
  // horizontal runs along the wall rows (only the wall pieces; pillars are in the columns above)
  for (let j = 0; j < nJ; j += 2) {
    let i = 1;
    while (i < nI) {
      if (!solid(i, j)) {
        i += 2;
        continue;
      }
      let end = i;
      while (end + 2 < nI && solid(end + 2, j)) end += 2;
      rects.push({ x: at(i), y: at(j), width: at(end) + size(end) - at(i), height: T, wall: true });
      i = end + 2;
    }
  }
  return rects;
}

export function generateMaze(spec: MazeSpec): MazeLevelParts {
  const rng = mulberry32(spec.seed);
  const data = carve(spec, rng);
  const { cols, rows } = data;
  const total = cols * rows;
  const cr = (i: number) => ({ c: i % cols, r: Math.floor(i / cols) });

  // start in the top-left cell, exit in the cell farthest from it
  const fromStart = distancesFrom(data, 0, 0);
  let goalCell = 0;
  for (let i = 0; i < total; i++) if (fromStart[i] > fromStart[goalCell]) goalCell = i;
  const path = pathBetween(data, 0, goalCell);

  const deadEnds: number[] = [];
  const junctions: number[] = [];
  for (let i = 0; i < total; i++) {
    const { c, r } = cr(i);
    const deg = degree(data, c, r);
    if (i === 0 || i === goalCell) continue;
    if (deg === 1) deadEnds.push(i);
    else if (deg >= 3) junctions.push(i);
  }

  const shuffle = <T>(list: T[]): T[] => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const manhattan = (a: number, b: number) => {
    const p = cr(a);
    const q = cr(b);
    return Math.abs(p.c - q.c) + Math.abs(p.r - q.r);
  };

  const taken = new Set<number>([0, goalCell]);
  /** Picks `n` cells from the candidates, as far apart from each other as the supply allows. */
  const pick = (candidates: number[], n: number, spacing: number): number[] => {
    const chosen: number[] = [];
    let pool = shuffle(candidates.filter(i => !taken.has(i)));
    for (let gap = spacing; gap >= 0 && chosen.length < n; gap -= 2) {
      for (const cell of pool) {
        if (chosen.length >= n) break;
        if (taken.has(cell)) continue;
        if ([...taken].every(t => manhattan(t, cell) >= gap)) {
          chosen.push(cell);
          taken.add(cell);
        }
      }
      pool = pool.filter(i => !taken.has(i));
    }
    return chosen;
  };

  // items: the retro gear in dead ends, power-ups at junctions
  const items: LevelData['items'] = [];
  const place = (type: ItemType, cell: number) => {
    const { c, r } = cr(cell);
    const p = cellCenter(data, c, r);
    items.push({ type, x: p.x - 25, y: p.y - 25, width: 50, height: 50 });
  };
  const anywhere = Array.from({ length: total }, (_, i) => i);
  for (const [type, count] of Object.entries(spec.items) as [ItemType, number][]) {
    const isRetro = RETRO_ITEMS.includes(type);
    let cells = pick(isRetro ? deadEnds : junctions, count, 7);
    // a small labyrinth may run out of dead ends or junctions: fill up from anywhere
    if (cells.length < count) cells = cells.concat(pick(anywhere, count - cells.length, 5));
    if (cells.length < count) throw new Error(`not enough cells for ${count} ${type}`);
    cells.forEach(cell => place(type, cell));
  }

  // checkpoints along the way to the exit
  const checkpoints: NonNullable<LevelData['checkpoints']> = [0.2, 0.4, 0.6, 0.8].map(f => {
    const { c, r } = cr(path[Math.floor(path.length * f)]);
    const p = cellCenter(data, c, r);
    return { x: p.x - 24, y: p.y - 48, width: 48, height: 96 };
  });

  // enemies, away from the start; Bomby needs a long straight corridor to see along
  const straightRun = (i: number): number => {
    const { c, r } = cr(i);
    let best = 0;
    for (let d = 0; d < 4; d++) {
      let n = 0;
      let cc = c;
      let rr = r;
      while (isOpen(data, cc, rr, d)) {
        cc += HEADINGS[d].dx;
        rr += HEADINGS[d].dy;
        n++;
      }
      best = Math.max(best, n);
    }
    return best;
  };
  const far = (i: number) => fromStart[i] >= 14;
  const all = Array.from({ length: total }, (_, i) => i);
  const enemies: LevelData['enemies'] = [];
  for (const [type, count] of Object.entries(spec.enemies) as [EnemyType, number][]) {
    const pool = all.filter(i => far(i) && (type !== 'bomber' || straightRun(i) >= 3));
    const cells = pick(pool, count, 5);
    for (const cell of cells) {
      const { c, r } = cr(cell);
      const p = cellCenter(data, c, r);
      const s = ENEMY_SIZE[type];
      const x = p.x - s.w / 2;
      const y = p.y - s.h / 2;
      enemies.push({ type, x, y, width: s.w, height: s.h, originalX: x, originalY: y });
    }
  }

  const g = cellCenter(data, cr(goalCell).c, cr(goalCell).r);
  const goal = { x: g.x - GOAL_W / 2, y: g.y - GOAL_H / 2, width: GOAL_W, height: GOAL_H };
  const s0 = cellCenter(data, 0, 0);
  // playerStart.y is for the legacy 74 px body (see loadLevel): centre the 90 px body in the cell
  const playerStart = { x: s0.x - 27, y: s0.y - 29 };

  // time limit: a greedy nearest-item tour at the player's speed, with plenty of room
  const itemCells = items.map(it => {
    const cx = it.x + it.width / 2;
    const cy = it.y + it.height / 2;
    return Math.floor((cy - data.wall / 2) / data.pitch) * cols + Math.floor((cx - data.wall / 2) / data.pitch);
  });
  let pos = 0;
  let steps = 0;
  const left = itemCells.slice();
  while (left.length) {
    const d = distancesFrom(data, pos % cols, Math.floor(pos / cols));
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (d[left[i]] < d[left[bi]]) bi = i;
    steps += d[left[bi]];
    pos = left[bi];
    left.splice(bi, 1);
  }
  steps += distancesFrom(data, pos % cols, Math.floor(pos / cols))[goalCell];
  const routeSeconds = (steps * data.pitch) / (spec.playerSpeed * 60);
  // the player explores blind, so allow 2.5 times the best possible route
  const timeLimit = Math.max(600, Math.ceil((routeSeconds * 2.5) / 30) * 30);

  return {
    data,
    levelWidth: mazeWidth(data),
    levelHeight: mazeHeight(data),
    platforms: wallRects(data),
    items,
    enemies,
    checkpoints,
    goal,
    playerStart,
    timeLimit,
    stats: { startCell: 0, goalCell, pathCells: path.length, deadEnds: deadEnds.length, routeSeconds },
  };
}
