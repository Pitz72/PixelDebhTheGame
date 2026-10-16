/**
 * Chip synth: renders short NES-style sounds (pulse, triangle, LFSR noise) into plain
 * Float32Arrays. Everything here is a pure function with no Web Audio, so the same code
 * runs in the game, in the Vitest suite and in the offline WAV export used to inspect
 * the sounds with measurements and spectrograms.
 */

export const SAMPLE_RATE = 48000;

export type Wave = 'pulse' | 'triangle' | 'noise';

export interface Tone {
  wave: Wave;
  /** Seconds from the start of the effect. */
  start: number;
  /** Seconds the voice stays on (the envelope is always closed by then). */
  dur: number;
  /** Frequency in Hz at the start. For noise it is the LFSR clock rate (higher = brighter). */
  f0: number;
  /** Frequency at the end of the tone; the glide is exponential. Defaults to f0. */
  f1?: number;
  /** Peak level, 0..1. */
  vol: number;
  /** Pulse width: 0.125, 0.25, 0.5 or 0.75 like the real chip. Default 0.5. */
  duty?: number;
  /** Noise only: the 93-step register gives a metallic, pitched noise. */
  short?: boolean;
  /** Seconds. Default 2 ms, just enough to avoid a click. */
  attack?: number;
  /** Seconds of the closing ramp for the 'gate' shape. */
  release?: number;
  /**
   * 'decay': fades from the attack to silence over the whole tone (pickups, shots).
   * 'gate': holds the level, then closes with `release` (notes of a jingle).
   */
  shape?: 'decay' | 'gate';
  /** Exponent of the 'decay' fade: 1 linear, 2 and above punchier. Default 1.6. */
  curve?: number;
  /** [rate in Hz, depth in semitones]. */
  vibrato?: [number, number];
  /** Semitone offsets cycled at `arpRate` steps per second (chord arpeggio). */
  arp?: number[];
  arpRate?: number;
  /** One-pole low-pass, cutoff in Hz from -> to over the tone. */
  lp?: [number, number];
  /** Quantisation levels: the real triangle channel has only 16. */
  steps?: number;
}

const SEMITONE_OF: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Frequency of a note name such as 'C5', 'F#4' or 'Bb3' (A4 = 440 Hz). */
export function note(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Bad note name: ${name}`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const semitones = SEMITONE_OF[m[1]] + accidental + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semitones / 12);
}

/** Notes played back to back with the same voice settings. Rests are `null`. */
export function sequence(
  voice: Omit<Tone, 'start' | 'dur' | 'f0' | 'f1'>,
  notes: [string | null, number][],
  start = 0
): Tone[] {
  const tones: Tone[] = [];
  let t = start;
  for (const [name, dur] of notes) {
    if (name) tones.push({ ...voice, start: t, dur, f0: note(name) });
    t += dur;
  }
  return tones;
}

/** Band-limited step: removes most of the aliasing of a naive square wave. */
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

function addTone(out: Float32Array, tone: Tone, sampleRate: number): void {
  const n0 = Math.round(tone.start * sampleRate);
  const n = Math.round(tone.dur * sampleRate);
  if (n <= 0) return;

  const attack = Math.max(1, Math.round((tone.attack ?? 0.002) * sampleRate));
  const release = Math.max(1, Math.round((tone.release ?? Math.min(0.04, tone.dur * 0.4)) * sampleRate));
  const shape = tone.shape ?? 'decay';
  const curve = tone.curve ?? 1.6;
  const f0 = tone.f0;
  const ratio = (tone.f1 ?? tone.f0) / f0;
  const duty = tone.duty ?? 0.5;
  const arpRate = tone.arpRate ?? 60;

  let phase = 0;
  let lfsr = 1;
  let held = 1;
  let noisePhase = 0;
  let lpState = 0;

  for (let i = 0; i < n && n0 + i < out.length; i++) {
    const t = i / sampleRate;
    let f = f0 * Math.pow(ratio, i / n);
    if (tone.vibrato) f *= Math.pow(2, (tone.vibrato[1] * Math.sin(2 * Math.PI * tone.vibrato[0] * t)) / 12);
    if (tone.arp) f *= Math.pow(2, tone.arp[Math.floor(t * arpRate) % tone.arp.length] / 12);

    let x: number;
    if (tone.wave === 'noise') {
      noisePhase += f / sampleRate;
      while (noisePhase >= 1) {
        noisePhase -= 1;
        const feedback = (lfsr & 1) ^ ((lfsr >> (tone.short ? 6 : 1)) & 1);
        lfsr = (lfsr >> 1) | (feedback << 14);
        held = lfsr & 1 ? -1 : 1;
      }
      x = held;
    } else {
      const dt = f / sampleRate;
      phase += dt;
      if (phase >= 1) phase -= 1;
      if (tone.wave === 'pulse') {
        x = phase < duty ? 1 : -1;
        x += polyBlep(phase, dt);
        x -= polyBlep((phase - duty + 1) % 1, dt);
        x -= 2 * duty - 1; // centre the wave: narrow pulses would otherwise carry a DC offset
      } else {
        x = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
        if (tone.steps) {
          const half = tone.steps / 2;
          x = Math.round(x * half) / half;
        }
      }
    }

    if (tone.lp) {
      const cutoff = tone.lp[0] * Math.pow(tone.lp[1] / tone.lp[0], i / n);
      lpState += (1 - Math.exp((-2 * Math.PI * cutoff) / sampleRate)) * (x - lpState);
      x = lpState;
    }

    let env: number;
    if (i < attack) env = i / attack;
    else if (shape === 'decay') env = Math.pow(1 - (i - attack) / (n - attack), curve);
    else env = i < n - release ? 1 : (n - i) / release;

    out[n0 + i] += x * env * tone.vol;
  }
}

/**
 * Mixes the tones into one mono buffer. `gain` scales the whole effect; `tail` is the silence
 * kept after the last tone (0 for exact loops).
 */
export function render(tones: Tone[], gain = 1, sampleRate = SAMPLE_RATE, tail = 0.02): Float32Array {
  const end = tones.reduce((m, t) => Math.max(m, t.start + t.dur), 0);
  const out = new Float32Array(Math.ceil((end + tail) * sampleRate));
  for (const tone of tones) addTone(out, tone, sampleRate);

  // 15 Hz DC blocker, like the console's output stage: the noise channel drifts off centre.
  const r = 1 - (2 * Math.PI * 15) / sampleRate;
  let x1 = 0;
  let y1 = 0;
  for (let i = 0; i < out.length; i++) {
    const x = out[i];
    y1 = x - x1 + r * y1;
    x1 = x;
    out[i] = y1 * gain;
  }
  return out;
}
