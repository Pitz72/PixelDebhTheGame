import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { createWorld, loadLevel, step } from '../engine';
import { mulberry32 } from '../engine/rng';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_LEGACY_HEIGHT } from '../constants';

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

describe('level data sanity', () => {
  levels.forEach((level, i) => {
    describe(`#${i + 1} ${level.name}`, () => {
      it('has a valid player start', () => {
        const start = {
          x: level.playerStart.x,
          y: level.playerStart.y - (PLAYER_HEIGHT - PLAYER_LEGACY_HEIGHT), // same shift as loadLevel
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
        };
        expect(level.platforms.some(p => overlap(start, p))).toBe(false);
      });

      it('does not spawn enemies inside platforms', () => {
        const bad = level.enemies.filter(e =>
          level.platforms.some(p =>
            overlap({ x: e.x + 4, y: e.y + 4, width: e.width - 8, height: e.height - 12 }, p)
          )
        );
        expect(bad.map(e => `${e.type}@${e.x},${e.y}`)).toEqual([]);
      });

      it('does not place items inside platforms', () => {
        const bad = level.items.filter(it => level.platforms.some(p => overlap(it, p)));
        expect(bad.map(it => `${it.type}@${it.x},${it.y}`)).toEqual([]);
      });

      it('has a way out: a goal or a boss (or several)', () => {
        expect(Boolean(level.goal) || Boolean(level.boss) || Boolean(level.bosses?.length)).toBe(true);
      });
    });
  });
});

describe('the order of the game', () => {
  it('is three worlds of three levels and a boss, then the labyrinth, then the final stage', () => {
    expect(levels).toHaveLength(14);
    const bosses = levels.flatMap((l, i) => (l.boss ? [i] : []));
    expect(bosses).toEqual([3, 7, 11]);
    const labyrinth = levels[12];
    expect(labyrinth.maze).toBeDefined();
    expect(labyrinth.isZeroG).toBe(true);
    expect(labyrinth.goal).toBeDefined();
    expect(labyrinth.bosses).toBeUndefined();
    const last = levels[levels.length - 1];
    expect(last.boss).toBeUndefined();
    expect(last.goal).toBeUndefined();
    expect(last.bosses).toHaveLength(3);
  });

  it('numbers the levels in the order they are played', () => {
    levels.forEach((l, i) => expect(l.name.startsWith(`Level ${i + 1}:`) || l.name.startsWith(`Level ${i + 1} `), `#${i + 1} ${l.name}`).toBe(true));
  });

  it('keeps the three bosses in order: frog, chicken eye, shadow head', () => {
    expect(levels.filter(l => l.boss).map(l => l.boss?.type)).toEqual(['frog', 'chickenEye', 'shadowHead']);
  });
});

describe('every level loads and runs', () => {
  levels.forEach((level, i) => {
    it(`#${i + 1} ${level.name}`, () => {
      const w = createWorld({ rng: mulberry32(1) });
      loadLevel(w, i);
      for (let n = 0; n < 180; n++) step(w); // three seconds with nobody at the controls
      expect(w.currentLevelIndex).toBe(i);
      expect(Number.isFinite(w.player.x) && Number.isFinite(w.player.y)).toBe(true);
    });
  });
});

