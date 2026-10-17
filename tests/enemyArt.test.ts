import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnemySprite } from '../services/assetService';

const TYPES = ['base', 'jumper', 'flyer', 'bomber', 'phaser'];
const STATES = ['active', 'captured', 'stunned'];
const markup = (type: string, state: string) => renderToStaticMarkup(React.createElement(EnemySprite, { type, state }));
const all = TYPES.flatMap(type => STATES.map(state => ({ type, state, svg: markup(type, state) })));

describe('enemy sprites', () => {
  for (const { type, state, svg } of all) {
    it(`${type} (${state}) is drawn in the box of its hitbox`, () => {
      expect(svg).toContain('<svg');
      expect(svg).toContain(type === 'flyer' ? 'viewBox="0 0 60 44"' : 'viewBox="0 0 50 50"');
    });

    it(`${type} (${state}) only points at gradients and clips it defines, and carries no text`, () => {
      const ids = new Set(Array.from(svg.matchAll(/ id="([^"]+)"/g)).map(m => m[1]));
      const used = Array.from(svg.matchAll(/url\(#([^)]+)\)/g)).map(m => m[1]);
      for (const u of used) expect(ids.has(u), `${u} in ${type}:${state}`).toBe(true);
      expect(svg).not.toContain('<text');
    });
  }

  it('gives every sprite its own ids, so two enemies on one page never pick up each other\'s colours', () => {
    const ids = all.flatMap(({ svg }) => Array.from(svg.matchAll(/ id="([^"]+)"/g)).map(m => m[1]));
    expect(ids.length).toBeGreaterThan(40);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shows the three states differently (purple while held, dizzy eyes when stunned)', () => {
    for (const type of TYPES) {
      expect(markup(type, 'captured'), type).not.toBe(markup(type, 'active'));
      if (type !== 'flyer') expect(markup(type, 'stunned'), type).not.toBe(markup(type, 'active'));
    }
  });

  it('falls back to the slime for a type it does not know', () => {
    expect(markup('mystery', 'active')).toBe(markup('base', 'active'));
  });
});
