import type { FrogPose } from './FrogArt';
import type { EyePose } from './ChickenEyeArt';

/**
 * How the two redrawn bosses move, as pure functions of time and speed (no drawing here), so the
 * motion is easy to test and the same at any frame rate.
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** How far the frog's stride advances in one 60 Hz frame (radians): a slow sway when still, a quick kick at speed. */
export const frogPhaseStep = (vx: number, vy: number, frames: number): number =>
  clamp(frames, 0, 4) * (0.05 + Math.hypot(vx, vy) * 0.035);

/**
 * The frog's limbs: arms and legs swing against each other with her speed, and both arms fly up
 * when she throws (`throwAmount` goes from 1 down to 0).
 */
export function frogPose(phase: number, speed: number, throwAmount: number): FrogPose {
  const s = clamp(speed / 4, 0, 1.4);
  const swing = 10 + 18 * s;
  const a = Math.sin(phase);
  const b = Math.sin(phase + Math.PI / 2);
  const raise = 55 * clamp(throwAmount, 0, 1);
  return {
    armL: a * swing * 0.7 + 8 + raise,
    armR: -a * swing * 0.7 + 8 + raise,
    legL: b * swing,
    legR: -b * swing,
  };
}

/** The hen strolls to and fro in the pupil, turns round at each end, and the eye blinks now and then. */
export function eyePose(nowMs: number): EyePose {
  const t = nowMs / 1700;
  const turning = Math.abs(Math.cos(t)) < 0.1;
  return {
    henX: Math.sin(t),
    step: turning ? 0 : Math.sin(nowMs / 150),
    flip: Math.cos(t) < 0,
    blink: Math.sin(nowMs / 1000) > 0.95,
  };
}
