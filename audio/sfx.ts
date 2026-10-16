/**
 * Sound effects and jingles as chip-synth recipes.
 *
 * Every effect is built from the same palette the real console had: two pulse channels
 * (12.5 / 25 / 50 % duty), a triangle and the LFSR noise channel. They are rendered once
 * into buffers (see render()), so playback is just a buffer source with a tiny random
 * pitch change and the effects are plain data that tests can measure.
 */
import { note, render, sequence, SAMPLE_RATE, type Tone } from './chip';

export interface SfxRecipe {
  tones: Tone[];
  /** Level of the whole effect, 0..1. */
  gain: number;
  /** Random pitch change at play time, as a fraction (0.03 = +/-3 %). */
  jitter?: number;
  /** A repeat of the same effect inside this window is dropped. */
  minGapMs?: number;
  /** [fraction, ms]: the music is lowered by this fraction for this long. */
  duck?: [number, number];
}

const pulse = (duty: number): Pick<Tone, 'wave' | 'duty'> => ({ wave: 'pulse', duty });

export const SFX = {
  // --- movement -------------------------------------------------------------
  jump: {
    tones: [{ ...pulse(0.25), start: 0, dur: 0.14, f0: 330, f1: 700, vol: 0.6, curve: 1.4 }],
    gain: 0.5,
    jitter: 0.02,
    minGapMs: 30,
  },
  doubleJump: {
    tones: [
      { ...pulse(0.5), start: 0, dur: 0.11, f0: 520, f1: 1000, vol: 0.55 },
      { ...pulse(0.25), start: 0.06, dur: 0.12, f0: 780, f1: 1560, vol: 0.45 },
    ],
    gain: 0.5,
    jitter: 0.02,
    minGapMs: 30,
  },

  // --- pickups --------------------------------------------------------------
  collect: {
    tones: [
      { ...pulse(0.5), start: 0, dur: 0.06, f0: note('B5'), vol: 0.5, shape: 'gate', release: 0.008 },
      { ...pulse(0.5), start: 0.06, dur: 0.26, f0: note('E6'), vol: 0.5, curve: 2 },
    ],
    gain: 0.5,
    jitter: 0.01,
    minGapMs: 40,
  },
  powerup: {
    tones: [
      ...sequence({ ...pulse(0.5), vol: 0.4, shape: 'gate', release: 0.01 }, [
        ['C5', 0.045], ['E5', 0.045], ['G5', 0.045], ['C6', 0.045], ['E6', 0.045], ['G6', 0.045],
      ]),
      { ...pulse(0.125), start: 0.27, dur: 0.32, f0: note('C7'), vol: 0.35, curve: 2, vibrato: [10, 0.3] },
    ],
    gain: 0.55,
    duck: [0.3, 500],
  },
  checkpoint: {
    tones: [
      ...sequence({ ...pulse(0.25), vol: 0.45, shape: 'gate', release: 0.015 }, [
        ['C5', 0.07], ['E5', 0.07], ['G5', 0.07],
      ]),
      { ...pulse(0.25), start: 0.21, dur: 0.45, f0: note('C6'), vol: 0.5, curve: 2, vibrato: [6, 0.15] },
      { wave: 'triangle', start: 0, dur: 0.66, f0: note('C4'), vol: 0.6, curve: 1.2 },
    ],
    gain: 0.55,
    duck: [0.3, 600],
  },

  // --- Debh's moves with enemies -------------------------------------------------
  capture: {
    tones: [
      { ...pulse(0.5), start: 0, dur: 0.13, f0: 560, f1: 170, vol: 0.55, curve: 1.3 },
      { wave: 'noise', start: 0, dur: 0.05, f0: 7000, vol: 0.35, curve: 2 },
      { wave: 'triangle', start: 0.03, dur: 0.1, f0: 330, f1: 110, vol: 0.5 },
    ],
    gain: 0.55,
    minGapMs: 40,
  },
  launch: {
    tones: [
      { ...pulse(0.125), start: 0, dur: 0.2, f0: 150, f1: 950, vol: 0.5, curve: 1.2 },
      { wave: 'noise', start: 0, dur: 0.18, f0: 3000, f1: 12000, vol: 0.3, curve: 1.5, lp: [2500, 9000] },
    ],
    gain: 0.65,
    jitter: 0.02,
    minGapMs: 40,
  },
  playerShoot: {
    tones: [
      { ...pulse(0.125), start: 0, dur: 0.09, f0: 1900, f1: 420, vol: 0.5, curve: 1.5 },
      { wave: 'noise', start: 0, dur: 0.03, f0: 9000, vol: 0.2, curve: 2 },
    ],
    gain: 0.6,
    jitter: 0.03,
    minGapMs: 40,
  },

  // --- impacts ------------------------------------------------------------------
  hit: {
    tones: [
      { wave: 'noise', short: true, start: 0, dur: 0.06, f0: 3800, f1: 2200, vol: 0.6, curve: 1.8 },
      { ...pulse(0.25), start: 0, dur: 0.09, f0: 240, f1: 100, vol: 0.5 },
    ],
    gain: 0.55,
    jitter: 0.05,
    minGapMs: 35,
  },
  damage: {
    tones: [
      { ...pulse(0.5), start: 0, dur: 0.3, f0: 330, f1: 70, vol: 0.6, curve: 1.2, vibrato: [28, 0.6] },
      { wave: 'noise', start: 0, dur: 0.22, f0: 5500, f1: 600, vol: 0.5, curve: 1.5 },
      { wave: 'triangle', start: 0, dur: 0.32, f0: 120, f1: 45, vol: 0.6 },
    ],
    gain: 0.5,
    minGapMs: 120,
    duck: [0.5, 300],
  },

  // --- enemies and bosses ----------------------------------------------------------
  bossShoot: {
    tones: [
      { wave: 'triangle', start: 0, dur: 0.22, f0: 200, f1: 55, vol: 0.7, curve: 1.3 },
      { wave: 'noise', start: 0, dur: 0.2, f0: 2600, f1: 500, vol: 0.45, curve: 1.6 },
      { ...pulse(0.25), start: 0, dur: 0.12, f0: 420, f1: 110, vol: 0.3 },
    ],
    gain: 0.45,
    jitter: 0.03,
    minGapMs: 60,
  },
  bomberShoot: {
    tones: [
      { ...pulse(0.25), start: 0, dur: 0.26, f0: 700, f1: 210, vol: 0.4, curve: 1.1, vibrato: [18, 0.4] },
      { wave: 'noise', start: 0, dur: 0.08, f0: 1800, f1: 800, vol: 0.3 },
    ],
    gain: 0.6,
    jitter: 0.03,
    minGapMs: 60,
  },
  bossHit: {
    tones: [
      { wave: 'noise', start: 0, dur: 0.16, f0: 4200, f1: 1400, vol: 0.6, curve: 1.6 },
      { ...pulse(0.5), start: 0, dur: 0.22, f0: 440, f1: 130, vol: 0.55, curve: 1.4 },
      { ...pulse(0.125), start: 0, dur: 0.06, f0: 1760, vol: 0.35, curve: 2 },
    ],
    gain: 0.42,
    minGapMs: 80,
    duck: [0.35, 150],
  },
  bossDefeat: {
    tones: [
      { wave: 'noise', start: 0, dur: 1.4, f0: 9000, f1: 250, vol: 0.7, curve: 1.8, lp: [8000, 400] },
      { wave: 'triangle', start: 0, dur: 1.5, f0: 110, f1: 32, vol: 0.8, curve: 1.2 },
      { wave: 'noise', short: true, start: 0.18, dur: 0.3, f0: 5000, f1: 1500, vol: 0.4, curve: 2 },
      { wave: 'noise', start: 0.4, dur: 0.35, f0: 6000, f1: 900, vol: 0.45, curve: 2 },
      { wave: 'noise', start: 0.72, dur: 0.45, f0: 7000, f1: 700, vol: 0.5, curve: 2 },
      ...sequence({ ...pulse(0.5), vol: 0.3, shape: 'gate', release: 0.02 }, [
        ['C6', 0.07], ['E6', 0.07], ['G6', 0.07],
      ], 1.0),
      { ...pulse(0.5), start: 1.21, dur: 0.4, f0: note('C7'), vol: 0.3, curve: 2 },
    ],
    gain: 0.5,
    duck: [0.7, 1600],
  },

  // --- user interface ----------------------------------------------------------
  start: {
    tones: [
      { ...pulse(0.5), start: 0, dur: 0.2, f0: 220, f1: 880, vol: 0.5, curve: 1.2 },
      { ...pulse(0.25), start: 0.09, dur: 0.2, f0: 440, f1: 1760, vol: 0.4 },
    ],
    gain: 0.5,
  },
  menuMove: {
    tones: [{ ...pulse(0.5), start: 0, dur: 0.035, f0: note('A5'), vol: 0.5, shape: 'gate', release: 0.01 }],
    gain: 0.4,
    minGapMs: 20,
  },
  menuSelect: {
    tones: sequence({ ...pulse(0.5), vol: 0.5, shape: 'gate', release: 0.012 }, [['A5', 0.04], ['E6', 0.09]]),
    gain: 0.45,
  },
  pause: {
    tones: sequence({ ...pulse(0.25), vol: 0.45, shape: 'gate', release: 0.015 }, [['E5', 0.06], ['A4', 0.1]]),
    gain: 0.45,
  },
  resume: {
    tones: sequence({ ...pulse(0.25), vol: 0.45, shape: 'gate', release: 0.015 }, [['A4', 0.06], ['E5', 0.1]]),
    gain: 0.45,
  },

  // --- stingers (short musical phrases) ---------------------------------------------
  levelStart: {
    tones: [
      ...sequence({ ...pulse(0.25), vol: 0.4, shape: 'gate', release: 0.02 }, [
        ['C5', 0.1], ['E5', 0.1], ['G5', 0.18],
      ]),
      ...sequence({ wave: 'triangle', vol: 0.5, shape: 'gate', release: 0.02 }, [
        ['C4', 0.1], ['E4', 0.1], ['G4', 0.18],
      ]),
    ],
    gain: 0.5,
  },
  respawn: {
    tones: [
      ...sequence({ ...pulse(0.5), vol: 0.4, shape: 'gate', release: 0.02 }, [['G4', 0.1], ['C5', 0.2]]),
      ...sequence({ wave: 'triangle', vol: 0.5, shape: 'gate', release: 0.02 }, [['G3', 0.1], ['C4', 0.2]]),
      { ...pulse(0.125), start: 0.1, dur: 0.3, f0: note('C7'), vol: 0.2, curve: 2, vibrato: [8, 0.3] },
    ],
    gain: 0.6,
  },
  extraLife: {
    tones: [
      ...sequence({ ...pulse(0.5), vol: 0.4, shape: 'gate', release: 0.015 }, [
        ['C5', 0.09], ['E5', 0.09], ['G5', 0.09], ['C6', 0.09], ['E6', 0.09],
      ]),
      { ...pulse(0.5), start: 0.45, dur: 0.4, f0: note('G6'), vol: 0.4, curve: 2, vibrato: [7, 0.2] },
      ...sequence({ wave: 'triangle', vol: 0.5, shape: 'gate', release: 0.02 }, [['C4', 0.225], ['G4', 0.225]]),
    ],
    gain: 0.6,
    duck: [0.4, 800],
  },
  levelClear: {
    tones: [
      ...sequence({ ...pulse(0.25), vol: 0.45, shape: 'gate', release: 0.015 }, [
        ['C5', 0.1], ['E5', 0.1], ['G5', 0.1], ['C6', 0.18], ['G5', 0.1], ['C6', 0.1],
      ]),
      { ...pulse(0.125), start: 0.68, dur: 0.7, f0: note('C6'), vol: 0.3, curve: 1.6, vibrato: [6, 0.15] },
      { ...pulse(0.25), start: 0.68, dur: 0.7, f0: note('E6'), vol: 0.3, curve: 1.6, vibrato: [6, 0.15] },
      { ...pulse(0.5), start: 0.68, dur: 0.7, f0: note('G6'), vol: 0.3, curve: 1.6, vibrato: [6, 0.15] },
      { wave: 'triangle', start: 0, dur: 0.68, f0: note('C3'), vol: 0.7, shape: 'gate', release: 0.03 },
      { wave: 'triangle', start: 0.68, dur: 0.8, f0: note('C3'), vol: 0.7, curve: 1.4 },
    ],
    gain: 0.42,
    duck: [0.8, 1500],
  },
  gameOver: {
    tones: [
      ...sequence({ ...pulse(0.25), vol: 0.5, shape: 'gate', release: 0.03, vibrato: [5, 0.2] }, [
        ['E4', 0.22], ['D4', 0.22], ['C4', 0.22], ['A3', 0.8],
      ]),
      ...sequence({ wave: 'triangle', vol: 0.6, shape: 'gate', release: 0.04 }, [
        ['E3', 0.22], ['D3', 0.22], ['C3', 0.22], ['A2', 0.8],
      ]),
    ],
    gain: 0.45,
    duck: [0.9, 1600],
  },
} satisfies Record<string, SfxRecipe>;

export type SfxName = keyof typeof SFX;

export const SFX_NAMES = Object.keys(SFX) as SfxName[];

export function isSfxName(name: string): name is SfxName {
  return Object.prototype.hasOwnProperty.call(SFX, name);
}

export function renderSfx(name: SfxName, sampleRate = SAMPLE_RATE): Float32Array {
  const recipe: SfxRecipe = SFX[name];
  return render(recipe.tones, recipe.gain, sampleRate);
}
