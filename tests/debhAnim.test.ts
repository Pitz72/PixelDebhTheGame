import { describe, it, expect } from 'vitest';
import { DebhAnimator, DebhInput } from '../characters/debh/anim';

const base: DebhInput = {
  onGround: false,
  vx: 0,
  vy: 0,
  direction: 'right',
  jumpCount: 0,
  holding: false,
  superThrow: false,
  speedBoost: false,
  shootAnim: 0,
  aimX: 1,
  aimY: 0,
  throwAnim: 0,
  hurtAnim: 0,
  cheer: false,
  zeroG: false,
};

/** Feeds the animator `frames` frames at 60 Hz and returns every output. */
const play = (a: DebhAnimator, s: Partial<DebhInput>, frames: number) => {
  const outs = [];
  for (let i = 0; i < frames; i++) outs.push(a.update({ ...base, ...s }, 1 / 60));
  return outs;
};

describe('Debh with free movement (no gravity)', () => {
  it('never spins or leans into a swim: she walks upright whichever way she goes', () => {
    for (const [vx, vy] of [[9, 0], [0, 9], [0, -9], [6.4, 6.4], [-9, 5]]) {
      const outs = play(new DebhAnimator(), { zeroG: true, vx, vy }, 40);
      for (const o of outs) expect(o.spin).toBe(0);
    }
  });

  it('strides in every direction, up and down included', () => {
    for (const [vx, vy] of [[9, 0], [0, 9], [0, -9]]) {
      const outs = play(new DebhAnimator(), { zeroG: true, vx, vy }, 60);
      const swing = outs.map(o => o.pose.legN.a1);
      expect(Math.max(...swing) - Math.min(...swing), `legs at v=(${vx},${vy})`).toBeGreaterThan(40);
    }
  });

  it('stands still with her legs under her when she stops, and keeps her feet on the body line', () => {
    const a = new DebhAnimator();
    play(a, { zeroG: true, vx: 9, vy: 0 }, 30);
    const still = play(a, { zeroG: true }, 60).at(-1)!;
    expect(Math.abs(still.pose.legN.a1 - 4)).toBeLessThan(2);
    expect(still.spin).toBe(0);
    expect(still.squashY).toBeCloseTo(1, 5);
  });

  it('does not use the jump or landing poses: no gravity, no jump', () => {
    const outs = play(new DebhAnimator(), { zeroG: true, vx: 0, vy: 12 }, 40);
    for (const o of outs) {
      expect(o.squashY).toBeCloseTo(1, 5);
      expect(o.squashX).toBeCloseTo(1, 5);
    }
  });

  it('is unchanged where there is gravity: she still jumps and somersaults', () => {
    const up = play(new DebhAnimator(), { vy: -14, jumpCount: 1 }, 30).at(-1)!;
    expect(up.pose.legN.a1).toBeGreaterThan(40); // the jump pose
    const a = new DebhAnimator();
    const flip = play(a, { vy: -8, jumpCount: 2 }, 12);
    expect(Math.max(...flip.map(o => o.spin))).toBeGreaterThan(1); // the somersault turns
  });
});
