import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { PLAYER_HEIGHT, PLAYER_LEGACY_HEIGHT, SPRING_HEIGHT } from '../constants';
import { createWorld, step, mulberry32 } from '../engine';
import type { World } from '../engine';
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
const SPRING_RISE = 560; // a spring throws her up to 648 px; a shelf this high is cleared with room to spare
const SPRING_REACH = 420; // how far sideways, from the pad, a spring throw can still land

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A platform as the model sees it: a moving one counts as two still ones, at the ends of its sweep. */
interface Spot extends Rect {
  group: number;
}

function spotsOf(level: LevelData): Spot[] {
  const out: Spot[] = [];
  level.platforms.forEach((p, group) => {
    const { move, ...rect } = p;
    out.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, group });
    if (move) {
      out.push({
        x: rect.x + (move.axis === 'x' ? move.range : 0),
        y: rect.y + (move.axis === 'y' ? move.range : 0),
        width: rect.width,
        height: rect.height,
        group,
      });
    }
  });
  return out;
}

/** Springs that stand on the platform `a`. */
function springsOn(level: LevelData, a: Spot) {
  return (level.springs ?? []).filter(s => s.x >= a.x - 1 && s.x + (s.width ?? 90) <= a.x + a.width + 1 && Math.abs(s.y + SPRING_HEIGHT - a.y) < 2);
}

/** Can a throw from a spring on `a` land on `b`? Not when `b` is right overhead (she would bump her head). */
function canSpring(level: LevelData, a: Spot, b: Spot): boolean {
  const rise = a.y - b.y;
  if (rise > SPRING_RISE || rise < -20) return false;
  return springsOn(level, a).some(s => {
    const w = s.width ?? 90;
    const gap = Math.max(0, b.x - (s.x + w), s.x - (b.x + b.width));
    if (gap > SPRING_REACH) return false;
    const overhead = gap === 0;
    return !(overhead && rise > MAX_RISE_DOUBLE);
  });
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
  const ps = spotsOf(level);
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
      // riding a moving platform takes her to both ends of its sweep
      if (!seen.has(j) && (b.group === (a as Spot).group || canHop(a, b, doubleJump) || canSpring(level, a as Spot, b))) {
        seen.add(j);
        queue.push(j);
      }
    });
  }
  return seen;
}

/** True when something standing on a reachable platform can touch the rect. */
function touchable(level: LevelData, reach: Set<number>, r: Rect): boolean {
  const spots = spotsOf(level);
  for (const i of reach) {
    const p = spots[i];
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

describe('the checkpoints of the platform levels', () => {
  levels.forEach((level, i) => {
    if (level.boss || level.isZeroG || !level.checkpoints?.length) return;
    describe(`#${i + 1} ${level.name}`, () => {
      const spots = spotsOf(level);
      const reach = reachablePlatforms(level, true);

      level.checkpoints!.forEach((cp, n) => {
        const bottom = cp.y + cp.height;
        // the platform it stands on: its top is at the checkpoint's feet and it spans the whole checkpoint
        const supports = spots.map((s, idx) => ({ s, idx })).filter(({ s }) => Math.abs(s.y - bottom) <= 2 && s.x <= cp.x && s.x + s.width >= cp.x + cp.width);

        it(`checkpoint ${n + 1} (x ${cp.x}) stands on a platform, not in the air`, () => {
          expect(supports.length).toBeGreaterThan(0);
        });

        it(`checkpoint ${n + 1} (x ${cp.x}) stands on a platform the player can reach`, () => {
          expect(supports.some(({ idx }) => reach.has(idx))).toBe(true);
        });

        it(`checkpoint ${n + 1} (x ${cp.x}) switches on when she stands there`, () => {
          const w = worldOf(i);
          w.enemies.length = 0; // a walker may start right on the spot (level 11's first one does): this checks the checkpoint, not the fight
          const p = w.player;
          p.x = cp.x;
          p.y = bottom - p.height;
          p.vx = 0;
          p.vy = 0;
          p.isOnGround = true;
          step(w);
          expect(w.checkpoints[n].activated).toBe(true);
        });
      });
    });
  });
});

// ---------------------------------------------------------------------------
// The optional routes, played by a robot on the real engine
// ---------------------------------------------------------------------------

const withSprings = levels.map((level, index) => ({ level, index })).filter(({ level }) => level.springs?.length);
const withMovers = levels.map((level, index) => ({ level, index })).filter(({ level }) => level.platforms.some(p => p.move));

const worldOf = (index: number): World => createWorld({ levelIndex: index, rng: mulberry32(11) });
const groundedOn = (w: World) => w.platforms.find(p => w.player.isOnGround && Math.abs(w.player.y + w.player.height - p.y) <= 2 && w.player.x + w.player.width > p.x && w.player.x < p.x + p.width);

describe('the springs of the levels', () => {
  it('there are some', () => {
    expect(withSprings.length).toBeGreaterThanOrEqual(2);
  });

  for (const { level, index } of withSprings) {
    level.springs!.forEach((spring, n) => {
      describe(`#${index + 1} ${level.name}, spring ${n + 1}`, () => {
        const width = spring.width ?? 90;

        it('stands on a floor, not in the air', () => {
          const under = level.platforms.find(p => spring.x >= p.x && spring.x + width <= p.x + p.width && Math.abs(spring.y + SPRING_HEIGHT - p.y) < 1);
          expect(under).toBeDefined();
        });

        it('throws her onto a shelf far above the floor if she just keeps a direction pressed until she lands, from the middle of the pad or from either end', () => {
          const padFloor = spring.y + SPRING_HEIGHT;
          const results: string[] = [];
          const fly = (dir: 'left' | 'right', offset: number): number | null => {
            const w = worldOf(index);
            const p = w.player;
            p.x = spring.x + offset;
            p.y = spring.y - p.height - 3;
            p.vy = 4;
            p.vx = 0;
            p.isOnGround = false;
            let bounced = false;
            for (let i = 0; i < 200; i++) {
              w.input.left = dir === 'left' && i >= 2;
              w.input.right = dir === 'right' && i >= 2;
              step(w);
              if (p.vy < -30) bounced = true;
              const g = groundedOn(w);
              if (bounced && g) return Math.round(padFloor - g.y);
            }
            return null;
          };
          // a direction works when all three starting points end up on a shelf at least 400 px above the pad
          for (const dir of ['left', 'right'] as const) {
            const offsets = [8, width / 2 - 27, width - 54 - 8]; // left end, middle, right end of the pad (she is 54 wide)
            const got = offsets.map(o => fly(dir, o));
            results.push(`${dir}: ${got.join(', ')}`);
          }
          const good = results.filter(r => !r.includes('null') && r.split(': ')[1].split(', ').every(n => Number(n) >= 400));
          expect(good.length, results.join(' | ')).toBeGreaterThanOrEqual(1);
        });
      });
    });
  }
});

describe('the moving platforms of the levels', () => {
  it('there are some', () => {
    expect(withMovers.length).toBeGreaterThanOrEqual(2);
  });

  for (const { level, index } of withMovers) {
    level.platforms.forEach((mover, n) => {
      if (!mover.move) return;
      describe(`#${index + 1} ${level.name}, platform ${n + 1} (${mover.move.axis})`, () => {
        it('carries a passenger across to the ledge beyond it (a robot rides it, waits for the right moment and steps off)', () => {
          const ledge = level.platforms
            .map((p, i) => ({ p, i }))
            .filter(({ p, i }) => i !== n && !p.move && Math.abs(p.x - mover.x) < 1400 && Math.abs(p.y - mover.y) < mover.move!.range + 120)
            .sort((a, b) => a.p.x - b.p.x)
            .find(({ p }) => p.x > mover.x + mover.width);
          expect(ledge).toBeDefined();
          let ok = false;
          // she tries every moment of the sweep, with a single jump or with a second one at a few moments
          for (const second of [-1, 10, 24]) {
            for (let wait = 0; wait < mover.move!.period / 16.667 && !ok; wait += 6) {
              const w = worldOf(index);
              w.player.x = 0; // out of the way while the platform swings
              for (let i = 0; i < wait; i++) {
                w.player.y = w.levelHeight - 200;
                w.player.vy = 0;
                step(w);
              }
              // stand on it at whatever point of its sweep it is
              const plat = w.platforms[n];
              const p = w.player;
              p.x = plat.x + plat.width / 2 - p.width / 2;
              p.y = plat.y - p.height;
              p.vy = 0;
              p.vx = 0;
              p.isOnGround = true;
              w.actions.push('jump');
              for (let i = 0; i < 90 && !ok; i++) {
                w.input.right = true;
                if (i === second) w.actions.push('jump');
                step(w);
                if (groundedOn(w) === w.platforms[ledge!.i]) ok = true;
              }
            }
          }
          expect(ok).toBe(true);
        });
      });
    });
  }
});
