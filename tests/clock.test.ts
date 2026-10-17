import { describe, it, expect } from 'vitest';
import { fixedSteps, MAX_STEPS_PER_FRAME, STEP_MS, createWorld, step, mulberry32 } from '../engine';

/** Plays `seconds` of frames at a refresh rate: [total steps, the largest steps in one frame, the alphas seen]. */
function play(hz: number, seconds: number, jitterMs = 0) {
  const rng = mulberry32(3);
  let acc = 0;
  let total = 0;
  let most = 0;
  let minAlpha = 1;
  let maxAlpha = 0;
  let t = 0;
  const frames: number[] = [];
  while (t < seconds * 1000) {
    const delta = 1000 / hz + (jitterMs ? (rng() - 0.5) * 2 * jitterMs : 0);
    t += delta;
    const c = fixedSteps(acc + delta);
    acc = c.acc;
    total += c.steps;
    most = Math.max(most, c.steps);
    minAlpha = Math.min(minAlpha, c.alpha);
    maxAlpha = Math.max(maxAlpha, c.alpha);
    frames.push(c.alpha);
  }
  return { total, most, minAlpha, maxAlpha, frames, elapsed: t };
}

describe('the fixed-step clock', () => {
  for (const hz of [30, 60, 75, 120, 144, 165, 240]) {
    it(`runs 60 steps a second on a ${hz} Hz screen`, () => {
      const r = play(hz, 10);
      // as many steps as the time that went by (to within the one that is still waiting)
      expect(Math.abs(r.total - r.elapsed / STEP_MS)).toBeLessThan(1.5);
      expect(r.total).toBeGreaterThanOrEqual(598);
      expect(r.total).toBeLessThanOrEqual(602);
    });
  }

  it('never runs more than one step in a frame on a fast screen, and at most two on a slow one', () => {
    expect(play(144, 5).most).toBe(1);
    expect(play(240, 5).most).toBe(1);
    expect(play(60, 5).most).toBeLessThanOrEqual(2);
    expect(play(30, 5).most).toBeLessThanOrEqual(3);
  });

  it('hands the renderer an alpha between 0 and 1 that climbs from step to step', () => {
    const r = play(144, 5);
    expect(r.minAlpha).toBeGreaterThanOrEqual(0);
    expect(r.maxAlpha).toBeLessThanOrEqual(1);
    expect(r.maxAlpha).toBeGreaterThan(0.8); // the picture really does get close to the next step before it comes
    // between two steps the alpha only grows; it drops only when a step has just been taken
    let drops = 0;
    for (let i = 1; i < r.frames.length; i++) if (r.frames[i] < r.frames[i - 1]) drops++;
    expect(Math.abs(drops - 5 * 60)).toBeLessThanOrEqual(3); // 60 steps a second for 5 seconds: one drop per step
  });

  it('copes with an uneven frame time (a screen that cannot keep its rate)', () => {
    const r = play(144, 10, 3);
    expect(r.total).toBeGreaterThanOrEqual(595);
    expect(r.total).toBeLessThanOrEqual(605);
  });

  it('does not try to catch up after a stall: it runs the most it may and forgets the rest', () => {
    const c = fixedSteps(5000);
    expect(c.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(c.acc).toBe(0);
    expect(c.alpha).toBe(0);
  });

  it('leaves the time it could not use for the next frame', () => {
    const c = fixedSteps(STEP_MS * 1.4);
    expect(c.steps).toBe(1);
    expect(c.acc).toBeCloseTo(STEP_MS * 0.4, 6);
    expect(c.alpha).toBeCloseTo(0.4, 6);
  });

  it('plays the same game on any screen: the same world after the same 10 seconds, to within the last frame', () => {
    const run = (hz: number) => {
      const w = createWorld({ levelIndex: 0, rng: mulberry32(5) });
      w.input.right = true;
      let acc = 0;
      for (let t = 0; t < 10000; t += 1000 / hz) {
        const c = fixedSteps(acc + 1000 / hz);
        acc = c.acc;
        for (let i = 0; i < c.steps; i++) step(w);
      }
      return { x: w.player.x, y: w.player.y, score: w.score, steps: Math.round(w.elapsed / STEP_MS) };
    };
    const base = run(60);
    for (const hz of [120, 144, 240]) {
      const r = run(hz);
      // the runs end on a different frame, so they can differ by the steps of one frame (at 60 Hz that is one or two)
      expect(Math.abs(r.steps - base.steps), `${hz} Hz steps`).toBeLessThanOrEqual(2);
      expect(Math.abs(r.x - base.x), `${hz} Hz x`).toBeLessThanOrEqual(2 * 14); // at most two steps of her top speed
      expect(r.y).toBe(base.y);
      expect(r.score).toBe(base.score);
    }
  });
});
