import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants';

const overlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

describe('level data sanity', () => {
  levels.forEach((level, i) => {
    describe(`#${i + 1} ${level.name}`, () => {
      it('has a valid player start', () => {
        const start = { ...level.playerStart, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
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

      it('has a way out: a goal or a boss', () => {
        expect(Boolean(level.goal) || Boolean(level.boss)).toBe(true);
      });
    });
  });
});
