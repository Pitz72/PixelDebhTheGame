import { describe, it, expect } from 'vitest';
import { levels } from '../levels';
import { createWorld, loadLevel, step, makeFrame, mulberry32 } from '../engine';
import type { World } from '../engine';
import { BOSS_INITIAL_HP, BOSS_2_HP, BOSS_3_HP, FINAL_BOSS_HP_SHARE, INITIAL_LIVES, PLAYER_SHOOT_COOLDOWN } from '../constants';
import type { Boss } from '../types';

const vaultIndex = levels.length - 1;
const vault = levels[vaultIndex];
const shadowIndex = levels.findIndex(l => l.boss?.type === 'shadowHead');

const vaultWorld = (opts: { lives?: number } = {}): World => createWorld({ levelIndex: vaultIndex, rng: mulberry32(7), ...opts });

/** Puts a player shot right on a boss and lets the engine resolve it. */
const hit = (w: World, boss: Boss) => {
  // a shadow head can only be hit while it shows itself: keep it there for the test
  boss.opacity = 1;
  boss.visibilityState = 'visible';
  boss.teleportTimer = 99999;
  w.playerProjectiles.push({ id: 9000 + w.nextId++, x: boss.x + boss.width / 2, y: boss.y + boss.height / 2, width: 24, height: 24, vx: 0, vy: 0 });
  step(w);
};

describe('the final stage: the three bosses together', () => {
  it('has all three, each with a quarter of the life it has in its own level', () => {
    const w = vaultWorld();
    expect(w.bosses.map(b => b.type)).toEqual(['frog', 'chickenEye', 'shadowHead']);
    expect(w.bosses.map(b => b.maxHp)).toEqual(
      [BOSS_INITIAL_HP, BOSS_2_HP, BOSS_3_HP].map(hp => Math.ceil(hp * FINAL_BOSS_HP_SHARE))
    );
    for (const b of w.bosses) expect(b.hp).toBe(b.maxHp);
    expect(w.boss).toBe(w.bosses[0]);
    expect(makeFrame(w).bosses).toHaveLength(3);
  });

  it('lets her move freely, with no ground and no platforms', () => {
    const w = vaultWorld();
    expect(w.platforms).toHaveLength(0);
    w.input = { ...w.input, up: true };
    const y0 = w.player.y;
    for (let i = 0; i < 20; i++) step(w);
    expect(w.player.y).toBeLessThan(y0 - 50);
  });

  it('sends her in with all her lives and a shield', () => {
    expect(vault.refill).toBe(true);
    const w = vaultWorld({ lives: 1 });
    expect(w.lives).toBe(INITIAL_LIVES);
    expect(w.player.hasShield).toBe(true);
    const keep = vaultWorld({ lives: 5 });
    expect(keep.lives).toBe(5); // never fewer than she had
  });

  it('keeps each boss in its own part of the room', () => {
    const w = vaultWorld();
    w.isGodMode = true;
    for (let i = 0; i < 4000; i++) {
      step(w);
      if (w.status !== 'playing') break;
      for (const b of w.bosses) {
        const a = b.arena!;
        if (b.type === 'shadowHead' && (b.opacity ?? 0) < 0.05) continue; // hidden: about to teleport
        const m = 30;
        expect(b.x, `${b.type} left`).toBeGreaterThanOrEqual(a.left - m);
        expect(b.x + b.width, `${b.type} right`).toBeLessThanOrEqual(a.right + m);
        expect(b.y, `${b.type} top`).toBeGreaterThanOrEqual(a.top - m);
        expect(b.y + b.height, `${b.type} bottom`).toBeLessThanOrEqual(a.bottom + m);
      }
    }
  });

  it('is only won when all three have fallen', () => {
    const w = vaultWorld();
    w.isGodMode = true;
    const [frog, eye, head] = w.bosses;
    for (let n = 0; n < frog.maxHp; n++) hit(w, frog);
    expect(frog.hp).toBe(0);
    expect(w.status).toBe('playing');
    for (let n = 0; n < eye.maxHp; n++) hit(w, eye);
    expect(eye.hp).toBe(0);
    expect(w.status).toBe('playing');
    expect(head.hp).toBe(head.maxHp);
    for (let n = 0; n < head.maxHp; n++) hit(w, head);
    expect(head.hp).toBe(0);
    expect(w.status).toBe('level-cleared');
    expect(makeFrame(w).bosses.every(b => b.hp <= 0)).toBe(true);
  });

  it('ends the game when the last boss falls and the banner is done', () => {
    const w = vaultWorld();
    w.isGodMode = true;
    for (const b of w.bosses) for (let n = 0; n < b.maxHp; n++) hit(w, b);
    expect(w.status).toBe('level-cleared');
    for (let i = 0; i < 400 && w.status === 'level-cleared'; i++) step(w);
    expect(w.status).toBe('completed');
  });

  it('keeps a fallen boss still, and the others fire on', () => {
    const w = vaultWorld();
    w.isGodMode = true;
    const [frog, eye] = w.bosses;
    for (let n = 0; n < frog.maxHp; n++) hit(w, frog);
    const fx = frog.x;
    const fy = frog.y;
    w.projectiles = [];
    let fired = 0;
    for (let i = 0; i < 600; i++) {
      const before = w.projectiles.length;
      step(w);
      if (w.projectiles.length > before) fired++;
    }
    expect(frog.x).toBe(fx);
    expect(frog.y).toBe(fy);
    expect(eye.hp).toBe(eye.maxHp);
    expect(fired).toBeGreaterThan(0);
  });

  it("is reached from the labyrinth's exit", () => {
    const w = createWorld({ levelIndex: vaultIndex - 1, rng: mulberry32(3) });
    w.items = [];
    w.enemies = [];
    const goal = w.goal!;
    w.player.x = goal.x;
    w.player.y = goal.y + 20;
    for (let i = 0; i < 5 && w.status === 'playing'; i++) step(w);
    expect(w.status).toBe('level-cleared');
    for (let i = 0; i < 400 && w.currentLevelIndex === vaultIndex - 1; i++) step(w);
    expect(w.currentLevelIndex).toBe(vaultIndex);
    expect(w.bosses).toHaveLength(3);
  });
});

describe('shooting against the bosses', () => {
  const shoot = (w: World) => {
    w.input = { ...w.input, shoot: true };
    step(w);
    return w.player.shootCooldown;
  };

  it('has the rapid fire only against the last boss alone', () => {
    const alone = createWorld({ levelIndex: shadowIndex, rng: mulberry32(1) });
    expect(alone.bosses).toHaveLength(1);
    expect(shoot(alone)).toBeLessThan(120);
    const together = vaultWorld();
    expect(shoot(together)).toBeGreaterThan(PLAYER_SHOOT_COOLDOWN - 40);
  });

  it('is as it was in the single-boss levels', () => {
    for (const [i, l] of levels.entries()) {
      if (!l.boss) continue;
      const w = createWorld({ rng: mulberry32(1) });
      loadLevel(w, i);
      expect(w.bosses).toHaveLength(1);
      expect(w.boss).toBe(w.bosses[0]);
      expect(w.bosses[0].hp).toBe(l.boss.maxHp);
    }
  });
});
