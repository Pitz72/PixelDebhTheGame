import type { MazeData } from '../types';

/** Headings along the corridors: 0 east, 1 south, 2 west, 3 north. */
export const HEADINGS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
] as const;

export type Heading = 0 | 1 | 2 | 3;

/** Width of a corridor. */
export const corridor = (m: MazeData): number => m.pitch - m.wall;

export const mazeWidth = (m: MazeData): number => m.wall + m.cols * m.pitch;
export const mazeHeight = (m: MazeData): number => m.wall + m.rows * m.pitch;

/** Is there a way through from cell (c, r) in this direction? */
export function isOpen(m: MazeData, c: number, r: number, d: number): boolean {
  switch (d) {
    case 0:
      return c + 1 < m.cols && m.openRight[r * m.cols + c];
    case 1:
      return r + 1 < m.rows && m.openDown[r * m.cols + c];
    case 2:
      return c > 0 && m.openRight[r * m.cols + c - 1];
    default:
      return r > 0 && m.openDown[(r - 1) * m.cols + c];
  }
}

/** Number of ways out of a cell: 1 is a dead end, 3 and 4 are junctions. */
export function degree(m: MazeData, c: number, r: number): number {
  let n = 0;
  for (let d = 0; d < 4; d++) if (isOpen(m, c, r, d)) n++;
  return n;
}

/** World position of the middle of a cell. */
export function cellCenter(m: MazeData, c: number, r: number): { x: number; y: number } {
  const half = corridor(m) / 2;
  return { x: m.wall + c * m.pitch + half, y: m.wall + r * m.pitch + half };
}

/** The cell a world position falls in (or the nearest one when it is in a wall). */
export function cellAt(m: MazeData, x: number, y: number): { c: number; r: number } {
  const c = Math.min(m.cols - 1, Math.max(0, Math.floor((x - m.wall / 2) / m.pitch)));
  const r = Math.min(m.rows - 1, Math.max(0, Math.floor((y - m.wall / 2) / m.pitch)));
  return { c, r };
}

/** Number of steps through the maze from cell (c0, r0) to every cell; -1 where unreachable. */
export function distancesFrom(m: MazeData, c0: number, r0: number): Int32Array {
  const dist = new Int32Array(m.cols * m.rows).fill(-1);
  const queue: number[] = [r0 * m.cols + c0];
  dist[queue[0]] = 0;
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const c = cur % m.cols;
    const r = (cur - c) / m.cols;
    for (let d = 0; d < 4; d++) {
      if (!isOpen(m, c, r, d)) continue;
      const next = (r + HEADINGS[d].dy) * m.cols + c + HEADINGS[d].dx;
      if (dist[next] < 0) {
        dist[next] = dist[cur] + 1;
        queue.push(next);
      }
    }
  }
  return dist;
}

/** The shortest way from one cell to another, as cell indices including both ends. */
export function pathBetween(m: MazeData, from: number, to: number): number[] {
  const parent = new Int32Array(m.cols * m.rows).fill(-2);
  const queue = [from];
  parent[from] = -1;
  for (let head = 0; head < queue.length && parent[to] === -2; head++) {
    const cur = queue[head];
    const c = cur % m.cols;
    const r = (cur - c) / m.cols;
    for (let d = 0; d < 4; d++) {
      if (!isOpen(m, c, r, d)) continue;
      const next = (r + HEADINGS[d].dy) * m.cols + c + HEADINGS[d].dx;
      if (parent[next] === -2) {
        parent[next] = cur;
        queue.push(next);
      }
    }
  }
  if (parent[to] === -2) return [];
  const path: number[] = [];
  for (let cur = to; cur !== -1; cur = parent[cur]) path.push(cur);
  return path.reverse();
}
