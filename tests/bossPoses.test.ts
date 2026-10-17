import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { frogPose, frogPhaseStep, eyePose } from '../components/bosses/bossPoses';
import { FrogBossArt, FrogDefs, FrogLegShape, FrogArmShape, FROG_PART_BOX } from '../components/bosses/FrogArt';
import { ChickenEyeBossArt, HenShape, HEN_STEPS, HEN_BOX, EYE_REST } from '../components/bosses/ChickenEyeArt';

const el = React.createElement;

describe('the Cyclops Frog moves', () => {
  it('sways when still and kicks harder the faster she goes', () => {
    const slow = Array.from({ length: 200 }, (_, i) => frogPose(i * 0.1, 0, 0).legL);
    const fast = Array.from({ length: 200 }, (_, i) => frogPose(i * 0.1, 4, 0).legL);
    const range = (v: number[]) => Math.max(...v) - Math.min(...v);
    expect(range(slow)).toBeGreaterThan(10);
    expect(range(fast)).toBeGreaterThan(range(slow) + 20);
  });

  it('swings her arms and legs against each other', () => {
    for (const phase of [0.4, 1.1, 2.3, 4]) {
      const p = frogPose(phase, 3, 0);
      expect(p.legL).toBeCloseTo(-p.legR, 9);
      expect(p.armL - 8).toBeCloseTo(-(p.armR - 8), 9);
    }
  });

  it('throws both arms up when she throws, and brings them down again', () => {
    const calm = frogPose(0, 2, 0);
    const throwing = frogPose(0, 2, 1);
    expect(throwing.armL - calm.armL).toBeCloseTo(55, 9);
    expect(throwing.armR - calm.armR).toBeCloseTo(55, 9);
    expect(frogPose(0, 2, 0.5).armL).toBeGreaterThan(calm.armL);
    expect(frogPose(0, 2, 0.5).armL).toBeLessThan(throwing.armL);
    expect(throwing.legL).toBe(calm.legL); // the legs go on as before
  });

  it('advances her stride with her speed, a little even when she is still, and never runs away on a long frame', () => {
    expect(frogPhaseStep(0, 0, 1)).toBeGreaterThan(0);
    expect(frogPhaseStep(3.2, 1.4, 1)).toBeGreaterThan(frogPhaseStep(0, 0, 1) * 2);
    expect(frogPhaseStep(3.2, 1.4, 100)).toBeLessThan(1);
  });
});

describe('LeGallineNellOcchi moves', () => {
  const times = Array.from({ length: 3000 }, (_, i) => i * 7);

  it('keeps the hen strolling inside her range, and she faces the way she walks', () => {
    for (const t of times) {
      const p = eyePose(t);
      expect(Math.abs(p.henX)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.step)).toBeLessThanOrEqual(1);
      const dx = eyePose(t + 5).henX - eyePose(t - 5).henX;
      if (Math.abs(dx) > 0.01) expect(p.flip, `at ${t} ms`).toBe(dx < 0);
    }
  });

  it('walks to both sides and stops her feet when she turns round', () => {
    const xs = times.map(t => eyePose(t).henX);
    expect(Math.min(...xs)).toBeLessThan(-0.95);
    expect(Math.max(...xs)).toBeGreaterThan(0.95);
    const turning = times.map(t => eyePose(t)).filter(p => Math.abs(p.henX) > 0.995);
    expect(turning.length).toBeGreaterThan(0);
    for (const p of turning) expect(p.step).toBe(0);
  });

  it('blinks now and then, and not most of the time', () => {
    const blinking = times.filter(t => eyePose(t).blink).length / times.length;
    expect(blinking).toBeGreaterThan(0.05);
    expect(blinking).toBeLessThan(0.2);
  });

  it('has a hen frame for every leg position, in order', () => {
    expect(HEN_STEPS[0]).toBe(-1);
    expect(HEN_STEPS.at(-1)).toBe(1);
    expect([...HEN_STEPS].sort((a, b) => a - b)).toEqual(HEN_STEPS);
    expect(HEN_STEPS).toContain(0);
  });
});

describe('the boss drawings', () => {
  const markup = (node: React.ReactElement) => renderToStaticMarkup(node);

  it('draw the frog whole and in pieces, with the leg fading from green to red along itself', () => {
    expect(markup(el(FrogBossArt))).toContain('<svg');
    const leg = markup(el('svg', null, el(FrogDefs), el(FrogLegShape)));
    expect(leg).toContain('id="fg-leg"');
    expect(leg).toContain('url(#fg-leg)');
    const arm = markup(el('svg', null, el(FrogDefs), el(FrogArmShape)));
    expect(arm).not.toContain('url(#fg-leg)');
  });

  it('bake each frog piece with room for its outline around the origin it turns on', () => {
    const [bx, by, bw, bh] = FROG_PART_BOX.body;
    // the sphere is centred on (120, 104) with a radius of 80 and a 4.5 outline
    expect(bx).toBeLessThan(120 - 82.25);
    expect(by).toBeLessThan(104 - 82.25);
    expect(bx + bw).toBeGreaterThan(120 + 82.25);
    expect(by + bh).toBeGreaterThan(104 + 82.25);
    for (const [x, y, w, h] of [FROG_PART_BOX.arm, FROG_PART_BOX.leg]) {
      expect(x).toBeLessThan(0); // the shoulder / hip is inside the piece
      expect(x + w).toBeGreaterThan(0);
      expect(y).toBeLessThan(0);
      expect(y + h).toBeGreaterThan(0);
    }
    const [ax, ay, , ah] = FROG_PART_BOX.arm;
    expect(ax).toBeLessThan(-57 - 2); // the fingers reach to -57
    expect(ay).toBeLessThan(-6 - 2);
    expect(ay + ah).toBeGreaterThan(13 + 2);
    const [lx, ly, , lh] = FROG_PART_BOX.leg;
    expect(lx).toBeLessThan(-26 - 3); // the foot sticks out to -26
    expect(ly + lh).toBeGreaterThan(66 + 3); // and down to 66
  });

  it('draw the eye without the hen when asked, and the hen on her own with her bounding box around her', () => {
    const withHen = markup(el(ChickenEyeBossArt));
    const without = markup(el(ChickenEyeBossArt, { hideHen: true }));
    expect(withHen.length).toBeGreaterThan(without.length);
    expect(markup(el(ChickenEyeBossArt, { pose: { ...EYE_REST, blink: true }, hideHen: true }))).toContain('<svg');
    expect(markup(el('svg', null, el(HenShape, { step: 0.5 })))).toContain('<ellipse');
    const [x, y, w, h] = HEN_BOX;
    expect(x).toBeLessThan(-34); // the tail
    expect(x + w).toBeGreaterThan(30); // the beak
    expect(y).toBeLessThan(-26.6); // the comb
    expect(y + h).toBeGreaterThan(28); // the feet
  });
});
