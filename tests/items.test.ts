import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ItemSprite } from '../services/assetService';
import { levels } from '../levels';
import { createWorld, collectiblesLeft, isCollectible } from '../engine';
import { COLLECTIBLE_TYPES } from '../constants';
import type { ItemType, LevelData } from '../types';

const POWER_UPS: ItemType[] = ['speed-boost', 'shield', 'super-throw'];
const ALL_ITEMS: ItemType[] = [...COLLECTIBLE_TYPES, ...POWER_UPS];

/** The level where each new collectible makes its debut. */
const DEBUT: Record<string, number> = { cassette: 2, token: 3, webcam: 5, microphone: 6, crt: 7, ringlight: 9 };

const levelNumber = (l: LevelData) => Number(/^Level (\d+)/.exec(l.name)?.[1]);

describe('item sprites', () => {
  for (const type of ALL_ITEMS) {
    it(`${type} has a drawn sprite`, () => {
      const markup = renderToStaticMarkup(React.createElement(ItemSprite, { type }));
      expect(markup).toContain('<svg');
      expect(markup).toContain('viewBox="0 0 64 64"');
    });
  }

  it('gives every sprite its own gradient ids, so two sprites on a page never share one', () => {
    const ids = ALL_ITEMS.flatMap(type =>
      Array.from(renderToStaticMarkup(React.createElement(ItemSprite, { type })).matchAll(/ id="([^"]+)"/g)).map(m => m[1])
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('collectibles', () => {
  it('are the nine things to collect, and the power-ups are not among them', () => {
    expect(COLLECTIBLE_TYPES).toHaveLength(9);
    for (const t of POWER_UPS) expect(isCollectible(t)).toBe(false);
    for (const t of COLLECTIBLE_TYPES) expect(isCollectible(t)).toBe(true);
  });

  it('are all counted by the engine to open the exit, power-ups are not', () => {
    const w = createWorld({ levels: [levels[0]] });
    w.items = [...COLLECTIBLE_TYPES, ...POWER_UPS].map((type, i) => ({ id: i + 1, type, x: 0, y: 0, width: 50, height: 50 }));
    expect(collectiblesLeft(w)).toBe(COLLECTIBLE_TYPES.length);
  });

  describe('arrive a few at a time', () => {
    const platformLevels = levels.filter(l => !l.boss && !l.maze);
    for (const [type, debut] of Object.entries(DEBUT)) {
      it(`${type} debuts in level ${debut} and keeps turning up after it`, () => {
        for (const level of platformLevels) {
          const n = levelNumber(level);
          const has = level.items.some(it => it.type === type);
          if (n < debut) expect(has, `${type} must not appear before level ${debut} (found in level ${n})`).toBe(false);
          else expect(has, `${type} must appear in level ${n}`).toBe(true);
        }
      });

      it(`${type} is met early in its debut level`, () => {
        const level = platformLevels.find(l => levelNumber(l) === debut) as LevelData;
        expect(level.items.some(it => it.type === type && it.x < 6000)).toBe(true);
      });
    }

    it('give the first level only the three classic ones', () => {
      const first = levels[0];
      const kinds = new Set(first.items.filter(it => isCollectible(it.type)).map(it => it.type));
      expect([...kinds].sort()).toEqual(['cartridge', 'floppy', 'joystick']);
    });
  });

  it('are all in the labyrinth: two of each, plus six power-ups', () => {
    const maze = levels.find(l => l.maze) as LevelData;
    for (const t of COLLECTIBLE_TYPES) {
      expect(maze.items.filter(it => it.type === t), t).toHaveLength(2);
    }
    expect(maze.items.filter(it => POWER_UPS.includes(it.type))).toHaveLength(6);
    expect(maze.items).toHaveLength(24);
  });
});
