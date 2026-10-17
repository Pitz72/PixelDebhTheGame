import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { PLAYER_HEIGHT, PLAYER_LEGACY_HEIGHT } from '../constants';
import type { LevelData } from '../types';

/**
 * Can the player get to every collectible and to the goal of a platform level?
 *
 * A deliberately cautious model of the jump. A single jump rises 312 px (JUMP_FORCE -25,
 * GRAVITY 1) and carries about 450 px sideways at normal speed; the model allows less than
 * that. With the double jump (MAX_JUMPS 2) a hop can rise about twice as high.
 *
 * Every level must be completable with the double jump. A level in COMFORTABLE must also be
 * completable with single jumps only, so it never asks for the harder move.
 */
const COMFORTABLE = ['Level 11: The Phantom Reach'];
const MAX_RISE = 290;
const MAX_RISE_DOUBLE = 520;
const GAP_DOUBLE = 260; // widest hop that still needs a double jump to climb
const GAP_FLAT = 380; // widest hop between two platforms at about the same height
const GAP_RISING = 300; // widest hop when the next platform is more than 150 px higher
const GAP_FALLING = 430; // widest hop when the next platform is lower

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function canHop(a: Rect, b: Rect, doubleJump: boolean): boolean {
  const gap = Math.max(0, b.x - (a.x + a.width), a.x - (b.x + b.width));
  const rise = a.y - b.y; // > 0: b is higher
  if (rise > MAX_RISE) return doubleJump && rise <= MAX_RISE_DOUBLE && gap <= GAP_DOUBLE;
  if (rise < -20) return gap <= GAP_FALLING;
  return gap <= (rise > 150 ? GAP_RISING : GAP_FLAT);
}

/** Platforms the player can stand on, starting from the one under the spawn point. */
function reachablePlatforms(level: LevelData, doubleJump: boolean): Set<number> {
  const ps = level.platforms;
  const feetY = level.playerStart.y - (PLAYER_HEIGHT - PLAYER_LEGACY_HEIGHT) + PLAYER_HEIGHT;
  let start = -1;
  ps.forEach((p, i) => {
    const under = p.x <= level.playerStart.x + 30 && p.x + p.width >= level.playerStart.x && p.y >= feetY - 40;
    if (under && (start < 0 || p.y < ps[start].y)) start = i;
  });
  const seen = new Set<number>();
  if (start < 0) return seen;
  const queue = [start];
  seen.add(start);
  while (queue.length) {
    const a = ps[queue.pop() as number];
    ps.forEach((b, j) => {
      if (!seen.has(j) && canHop(a, b, doubleJump)) {
        seen.add(j);
        queue.push(j);
      }
    });
  }
  return seen;
}

/** True when something standing on a reachable platform can touch the rect. */
function touchable(level: LevelData, reach: Set<number>, r: Rect): boolean {
  for (const i of reach) {
    const p = level.platforms[i];
    const near = r.x + r.width >= p.x - 100 && r.x <= p.x + p.width + 100;
    const aboveBy = p.y - r.y; // > 0: the rect is above the platform top
    if (near && aboveBy <= 400 && aboveBy >= -100) return true;
  }
  return false;
}

describe('platform levels are completable', () => {
  levels.forEach((level, i) => {
    if (level.boss || level.isZeroG) return;
    const modes = COMFORTABLE.includes(level.name) ? [true, false] : [true];
    for (const doubleJump of modes) {
      describe(`#${i + 1} ${level.name} (${doubleJump ? 'with' : 'without'} the double jump)`, () => {
        const reach = reachablePlatforms(level, doubleJump);

        it('has a platform under the spawn point', () => {
          expect(reach.size).toBeGreaterThan(0);
        });

        it('lets the player reach every collectible', () => {
          const missed = level.items.filter(it => !touchable(level, reach, it));
          expect(missed.map(it => `${it.type}@${it.x},${it.y}`)).toEqual([]);
        });

        it('lets the player reach the goal', () => {
          expect(level.goal).toBeDefined();
          expect(touchable(level, reach, level.goal as Rect)).toBe(true);
        });
      });
    }
  });
});
