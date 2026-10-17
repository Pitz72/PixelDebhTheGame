import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { createWorld, step, makeFrame, guideFor, damagePlayer, comboMultiplier, bumpCombo, bossPhase, mulberry32, STEP_MS } from '../engine';
import type { World } from '../engine';
import type { LevelData } from '../types';
import { SPRING_FORCE, SPRING_HEIGHT, BOSS_INITIAL_HP, BOSS_PHASE_RATE, COMBO_MAX_MULT, COMBO_STEP, COMBO_WINDOW_MS, ENEMY_DEFEAT_POINTS, GUIDE_MAX_LEFT, GUIDE_MIN_DISTANCE } from '../constants';
import { TROPHIES, TROPHY_COMBO, earnedNow } from '../trophies';
import { createStats } from '../engine';
import { defaultSettings, parseSettings } from '../services/settings';

const FLOOR_Y = 1100;
const makeLevel = (over: Partial<LevelData> = {}): LevelData => ({
  name: 'test',
  musicTheme: 'adventure',
  levelWidth: 6000,
  levelHeight: 1200,
  playerStart: { x: 100, y: FLOOR_Y - 74 },
  platforms: [{ x: 0, y: FLOOR_Y, width: 6000, height: 40 }],
  items: [],
  enemies: [],
  ...over,
});
const enemy = (x: number, y = FLOOR_Y - 50) => ({ type: 'base' as const, x, y, width: 50, height: 50, originalX: x, originalY: y });
const world = (lvls: LevelData[]): World => createWorld({ levels: lvls, rng: mulberry32(7) });
const shotOn = (w: World, x: number, y: number) =>
  w.playerProjectiles.push({ id: 9000 + w.nextId++, x, y, width: 24, height: 24, vx: 0, vy: 0 });

describe('the chain of defeats', () => {
  it('raises the multiplier every three, up to the top', () => {
    const got = Array.from({ length: 15 }, (_, n) => comboMultiplier(n));
    expect(got).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
    expect(comboMultiplier(999)).toBe(COMBO_MAX_MULT);
    expect(COMBO_STEP * (COMBO_MAX_MULT - 1)).toBe(TROPHY_COMBO);
  });

  it('pays more for the defeats of a chain: 500, 500, then 1000 for the third', () => {
    const w = world([makeLevel({ isZeroG: true, enemies: [enemy(600), enemy(800), enemy(1000)] })]);
    for (const e of w.enemies) shotOn(w, e.x + 10, e.y + 10);
    step(w);
    expect(w.stats.enemiesDefeated).toBe(3);
    expect(w.score).toBe(ENEMY_DEFEAT_POINTS * 2 + ENEMY_DEFEAT_POINTS * 2);
    expect(w.combo.count).toBe(3);
    expect(makeFrame(w).combo.mult).toBe(2);
    expect(w.stats.bestCombo).toBe(3);
  });

  it('is written in the floating text, so the player sees it', () => {
    const w = world([makeLevel({ isZeroG: true, enemies: [enemy(600), enemy(800), enemy(1000)] })]);
    for (const e of w.enemies) shotOn(w, e.x + 10, e.y + 10);
    step(w);
    expect(w.floatingTexts.some(t => t.text.includes('x2'))).toBe(true);
  });

  it('breaks when its window runs out', () => {
    const w = world([makeLevel()]);
    bumpCombo(w, 4);
    expect(w.combo.count).toBe(4);
    for (let i = 0; i < Math.floor(COMBO_WINDOW_MS / STEP_MS) - 3; i++) step(w);
    expect(w.combo.count).toBe(4);
    for (let i = 0; i < 8; i++) step(w);
    expect(w.combo.count).toBe(0);
  });

  it('breaks when she loses a life; a blow that the shield absorbs does not break it', () => {
    const shielded = world([makeLevel()]);
    bumpCombo(shielded, 5);
    shielded.player.hasShield = true;
    damagePlayer(shielded);
    expect(shielded.combo.count).toBe(5);

    const w = world([makeLevel()]);
    bumpCombo(w, 5);
    w.player.isInvincible = false;
    damagePlayer(w);
    expect(w.combo.count).toBe(0);
  });

  it('starts again with the next level', () => {
    const w = world([makeLevel(), makeLevel()]);
    bumpCombo(w, 6);
    w.player.x = 400;
    w.status = 'level-cleared';
    w.transitionTimer = 1;
    step(w);
    expect(w.currentLevelIndex).toBe(1);
    expect(w.combo).toEqual({ count: 0, timer: 0 });
  });

  it('earns a trophy for the longest chain', () => {
    const base = { totals: { collected: 0, enemies: 0 }, score: 0, loopCount: 1, levels };
    const short = earnedNow(new Set(), { ...base, stats: { ...createStats(), bestCombo: TROPHY_COMBO - 1 } }).map(t => t.id);
    const long = earnedNow(new Set(), { ...base, stats: { ...createStats(), bestCombo: TROPHY_COMBO } }).map(t => t.id);
    expect(short).not.toContain('combo');
    expect(long).toContain('combo');
    expect(TROPHIES.find(t => t.id === 'combo')?.tier).toBe('rare');
  });
});

describe('the phases of a boss', () => {
  const frogLevel = levels.findIndex(l => l.boss?.type === 'frog');
  const frog = () => {
    const w = createWorld({ levelIndex: frogLevel, rng: mulberry32(3) });
    w.isGodMode = true; // the test is about the boss, not about staying alive
    return w;
  };

  it('are one at full life, two at or below half, three at or below a quarter', () => {
    expect(bossPhase({ hp: 30, maxHp: 30 })).toBe(1);
    expect(bossPhase({ hp: 16, maxHp: 30 })).toBe(1);
    expect(bossPhase({ hp: 15, maxHp: 30 })).toBe(2);
    expect(bossPhase({ hp: 8, maxHp: 30 })).toBe(2);
    expect(bossPhase({ hp: 7, maxHp: 30 })).toBe(3);
    expect(bossPhase({ hp: 1, maxHp: 30 })).toBe(3);
  });

  it('announce themselves when the boss gets worse (a ring, a shake, the words), and not at the start', () => {
    const w = frog();
    step(w);
    expect(w.bosses[0].phase).toBe(1);
    expect(w.floatingTexts.some(t => t.text.startsWith('PHASE'))).toBe(false);
    w.bosses[0].hp = 14;
    step(w);
    expect(w.bosses[0].phase).toBe(2);
    expect(w.floatingTexts.some(t => t.text === 'PHASE 2!')).toBe(true);
    w.bosses[0].hp = 6;
    step(w);
    expect(w.bosses[0].phase).toBe(3);
    expect(w.floatingTexts.some(t => t.text === 'PHASE 3!')).toBe(true);
  });

  it('make it attack sooner: the wait after a shot shrinks with the phase', () => {
    const wait = (hp: number) => {
      const w = frog();
      w.bosses[0].hp = hp;
      w.bosses[0].attackCooldown = 0;
      step(w);
      return w.bosses[0].attackCooldown;
    };
    expect(BOSS_PHASE_RATE[1]).toBe(1);
    expect(BOSS_PHASE_RATE[2]).toBeLessThan(1);
    expect(BOSS_PHASE_RATE[3]).toBeLessThan(BOSS_PHASE_RATE[2]);
    const longest = 1800 + 1200;
    expect(wait(BOSS_INITIAL_HP)).toBeGreaterThan(1800 * BOSS_PHASE_RATE[1] - 20);
    expect(wait(12)).toBeLessThanOrEqual(longest * BOSS_PHASE_RATE[2]);
    expect(wait(4)).toBeLessThanOrEqual(longest * BOSS_PHASE_RATE[3]);
  });
});

describe('the arrow towards the last collectibles', () => {
  const item = (x: number, y = FLOOR_Y - 60, type: 'joystick' | 'shield' = 'joystick') => ({ type, x, y, width: 40, height: 40 });
  const goal = { x: 5800, y: FLOOR_Y - 150, width: 90, height: 150 };

  it('shows the way to the nearest one when few are left and it is far', () => {
    const w = world([makeLevel({ goal, items: [item(3100), item(5000)] })]);
    const g = guideFor(w)!;
    expect(g).not.toBeNull();
    expect(g.dist).toBeGreaterThan(2900);
    expect(g.dx).toBeGreaterThan(0.99); // straight ahead
    expect(Math.hypot(g.dx, g.dy)).toBeCloseTo(1, 6);
    expect(makeFrame(w).guide).toEqual(g);
  });

  it('is quiet while there are many left, when the nearest is close, and in a boss fight', () => {
    const many = world([makeLevel({ goal, items: [3000, 3200, 3400, 3600, 3800].map(x => item(x)) })]);
    expect(GUIDE_MAX_LEFT).toBeLessThan(5);
    expect(guideFor(many)).toBeNull();
    const near = world([makeLevel({ goal, items: [item(100 + GUIDE_MIN_DISTANCE - 100)] })]);
    expect(guideFor(near)).toBeNull();
    const boss = createWorld({ levelIndex: levels.findIndex(l => l.boss), rng: mulberry32(1) });
    expect(guideFor(boss)).toBeNull();
  });

  it('is gone when nothing is left (the portal is open)', () => {
    const w = world([makeLevel({ goal })]);
    expect(guideFor(w)).toBeNull();
  });

  it('does not point at power-ups in an ordinary level (they are optional)', () => {
    const w = world([makeLevel({ goal, items: [item(3000, FLOOR_Y - 60, 'shield'), item(4000)] })]);
    const g = guideFor(w)!;
    expect(g.dist).toBeGreaterThan(3800); // the joystick at 4000, not the shield at 3000
  });

  it('can be turned off in the settings', () => {
    expect(defaultSettings().guide).toBe(true);
    expect(parseSettings('{"guide":false}').guide).toBe(false);
    expect(parseSettings('{"guide":"no"}').guide).toBe(true);
  });
});

describe('springs', () => {
  const PAD_Y = FLOOR_Y - SPRING_HEIGHT;
  const withSpring = (extra: Partial<LevelData> = {}) =>
    world([makeLevel({ springs: [{ x: 600, y: PAD_Y }], ...extra })]);
  /** Drops the player onto the pad: feet a few px above it, falling. */
  const dropOn = (w: World, vy = 6) => {
    const p = w.player;
    p.x = 600 + 45 - p.width / 2;
    p.y = PAD_Y - p.height - 4;
    p.vy = vy;
    p.vx = 0;
    p.isOnGround = false;
  };

  it('is built from the level and drawn with the size in the constants', () => {
    const w = withSpring();
    expect(w.springs).toHaveLength(1);
    expect(w.springs[0]).toMatchObject({ x: 600, y: PAD_Y, width: 90, height: SPRING_HEIGHT, pressed: 0 });
    expect(makeFrame(w).springs).toHaveLength(1);
  });

  it('throws her up when she lands on it, much higher than a jump', () => {
    const w = withSpring();
    dropOn(w);
    step(w);
    expect(w.player.vy).toBe(-SPRING_FORCE);
    expect(w.player.isOnGround).toBe(false);
    expect(w.springs[0].pressed).toBeGreaterThan(0);
    let top = w.player.y;
    for (let i = 0; i < 90; i++) {
      step(w);
      top = Math.min(top, w.player.y);
    }
    const rise = PAD_Y - w.player.height - top;
    expect(rise).toBeGreaterThan(600); // a plain jump rises 312
    expect(rise).toBeLessThan(700);
  });

  it('counts as her first jump: one more is left in the air, and not two', () => {
    const w = withSpring();
    dropOn(w);
    step(w);
    expect(w.player.jumpCount).toBe(1);
    w.actions.push('jump');
    step(w);
    expect(w.player.jumpCount).toBe(2);
  });

  it('also throws her when she walks onto it along the floor', () => {
    const w = withSpring();
    const p = w.player;
    p.x = 600 - p.width - 40; // on the floor, left of the pad
    p.y = FLOOR_Y - p.height;
    p.isOnGround = true;
    w.input.right = true;
    let bounced = false;
    for (let i = 0; i < 60 && !bounced; i++) {
      step(w);
      bounced = w.springs[0].pressed > 0;
    }
    expect(bounced).toBe(true);
    expect(p.vy).toBeLessThan(-30);
  });

  it('does nothing when she hits it from below, jumps over it or stands beside it', () => {
    const below = withSpring();
    below.player.x = 600 + 45 - below.player.width / 2;
    below.player.y = PAD_Y + SPRING_HEIGHT - 4; // under the pad, going up
    below.player.vy = -10;
    step(below);
    expect(below.player.vy).not.toBe(-SPRING_FORCE);
    expect(below.springs[0].pressed).toBe(0);

    const beside = withSpring();
    dropOn(beside);
    beside.player.x = 600 + 90 + 20; // clear of the pad
    step(beside);
    expect(beside.springs[0].pressed).toBe(0);
  });

  it('squashes for a moment after a bounce, then rests', () => {
    const w = withSpring();
    dropOn(w);
    step(w);
    expect(w.springs[0].pressed).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) step(w);
    expect(w.springs[0].pressed).toBe(0);
  });
});

describe('moving platforms', () => {
  const lift = { x: 500, y: FLOOR_Y - 500, width: 300, height: 30, move: { axis: 'y' as const, range: 400, period: 4000 } };
  const ferry = { x: 500, y: FLOOR_Y - 300, width: 300, height: 30, move: { axis: 'x' as const, range: 600, period: 5000 } };
  const base = { x: 0, y: FLOOR_Y, width: 6000, height: 40 };
  const standOn = (w: World, plat = w.platforms[1]) => {
    const p = w.player;
    p.x = plat.x + plat.width / 2 - p.width / 2;
    p.y = plat.y - p.height;
    p.vx = 0;
    p.vy = 0;
    p.isOnGround = true;
  };

  it('sweeps between the place it is given and `range` further on, and back', () => {
    const w = world([makeLevel({ platforms: [base, lift] })]);
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < Math.ceil(lift.move.period / STEP_MS) + 5; i++) {
      step(w);
      lo = Math.min(lo, w.platforms[1].y);
      hi = Math.max(hi, w.platforms[1].y);
    }
    expect(lo).toBeGreaterThanOrEqual(lift.y - 0.01);
    expect(lo).toBeLessThan(lift.y + 2);
    expect(hi).toBeLessThanOrEqual(lift.y + lift.move.range + 0.01);
    expect(hi).toBeGreaterThan(lift.y + lift.move.range - 2);
    expect(w.platforms[1].x).toBe(lift.x); // a lift does not drift sideways
  });

  it('keeps the level data untouched (each world gets its own copy)', () => {
    const data = makeLevel({ platforms: [base, lift] });
    const w = world([data]);
    for (let i = 0; i < 120; i++) step(w);
    expect(data.platforms[1].y).toBe(lift.y);
    expect(data.platforms[1].baseY).toBeUndefined();
  });

  it('carries her up and down without letting her fall through', () => {
    const w = world([makeLevel({ platforms: [base, lift] })]);
    standOn(w);
    let moved = 0;
    for (let i = 0; i < Math.ceil((lift.move.period * 1.5) / STEP_MS); i++) {
      step(w);
      const plat = w.platforms[1];
      moved = Math.max(moved, Math.abs(plat.y - lift.y));
      expect(w.player.isOnGround).toBe(true);
      expect(Math.abs(w.player.y + w.player.height - plat.y)).toBeLessThanOrEqual(1);
    }
    expect(moved).toBeGreaterThan(150); // it really did move
  });

  it('carries her sideways on a ferry', () => {
    const w = world([makeLevel({ platforms: [base, ferry] })]);
    standOn(w);
    const startX = w.player.x;
    let far = 0;
    for (let i = 0; i < Math.ceil(ferry.move.period / 2 / STEP_MS); i++) {
      step(w);
      far = Math.max(far, Math.abs(w.player.x - startX));
      expect(w.player.isOnGround).toBe(true);
    }
    expect(far).toBeGreaterThan(250);
    const plat = w.platforms[1];
    expect(w.player.x).toBeGreaterThan(plat.x - 1);
    expect(w.player.x + w.player.width).toBeLessThan(plat.x + plat.width + 1);
  });

  it('leaves her behind when she jumps off', () => {
    const w = world([makeLevel({ platforms: [base, ferry] })]);
    standOn(w);
    w.actions.push('jump');
    step(w);
    const x0 = w.player.x;
    const plat0 = w.platforms[1].x;
    for (let i = 0; i < 10; i++) step(w);
    // in the air she is not moved by the platform: only her own speed (none) acts on x
    expect(w.player.x).toBeCloseTo(x0, 3);
    expect(Math.abs(w.platforms[1].x - plat0)).toBeGreaterThan(0);
  });

  it('is already where its sweep has it when the level loads: nothing jumps at the first step', () => {
    const w = world([makeLevel({ platforms: [base, lift] })]);
    const before = w.platforms[1].y;
    step(w);
    expect(Math.abs(w.platforms[1].y - before)).toBeLessThan(6); // its fastest: ~5 px a step, not the 200 px of a jump from the placed end
    expect(before).toBeGreaterThan(lift.y + lift.move.range * 0.45); // mid-sweep at the start, not at the placed end
    expect(before).toBeLessThan(lift.y + lift.move.range * 0.55);
  });

  it('remembers the last position so the renderer can interpolate', () => {
    const w = world([makeLevel({ platforms: [base, ferry] })]);
    for (let i = 0; i < 30; i++) step(w);
    const plat = w.platforms[1];
    expect(plat.prevX).toBeDefined();
    expect(plat.prevX).not.toBe(plat.x);
    expect(Math.abs((plat.x as number) - (plat.prevX as number))).toBeLessThan(15);
  });
});
