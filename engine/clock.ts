import { STEP_MS } from './step';

/** The most steps one frame may run: after a stall the game does not try to catch up. */
export const MAX_STEPS_PER_FRAME = 5;

export interface Steps {
  /** How many simulation steps to run now. */
  steps: number;
  /** The time left over (ms), to carry to the next frame. */
  acc: number;
  /** How far the next step is on its way, 0..1: the renderer draws between the last two steps by this much. */
  alpha: number;
}

/**
 * The fixed-timestep clock: `acc` is the time (ms) waiting to be simulated, including this frame's. The simulation always
 * advances in whole steps of STEP_MS (60 a second) whatever the refresh rate of the screen, and the picture is
 * interpolated between steps. So a 144 Hz screen shows 144 different pictures a second of the same 60 steps, and the game
 * plays exactly as at 60 Hz.
 */
export function fixedSteps(acc: number, stepMs = STEP_MS, maxSteps = MAX_STEPS_PER_FRAME): Steps {
  let steps = 0;
  while (acc >= stepMs && steps < maxSteps) {
    acc -= stepMs;
    steps++;
  }
  if (steps === maxSteps) acc = 0; // never try to catch up a long stall
  return { steps, acc, alpha: Math.min(1, acc / stepMs) };
}
