/**
 * Built-in stand-ins for the music: the short melodies the game shipped with, now rendered
 * into exact loops by the chip synth. They play only when a track's audio file is missing
 * or cannot be decoded, so the game is never silent.
 */
import { render, SAMPLE_RATE, type Tone } from './chip';
import type { TrackKey } from './tracks';

type Voice = 'square' | 'triangle' | 'sawtooth' | 'sine';
// [frequency Hz (0 = rest), seconds, voice, volume]
type Step = [number, number, Voice, number];

const MELODIES: Record<string, Step[]> = {
  title: [
    [220.0, 0.15, 'square', 0.08], [220.0, 0.15, 'square', 0.08], [440.0, 0.15, 'square', 0.08],
    [329.63, 0.15, 'square', 0.08], [261.63, 0.15, 'square', 0.08], [392.0, 0.15, 'square', 0.08],
    [329.63, 0.3, 'triangle', 0.09],
  ],
  adventure: [
    [261.63, 0.18, 'square', 0.07], [329.63, 0.18, 'square', 0.07], [392.0, 0.18, 'square', 0.07],
    [523.25, 0.18, 'square', 0.07], [392.0, 0.18, 'square', 0.07], [329.63, 0.18, 'square', 0.07],
    [440.0, 0.36, 'triangle', 0.08], [349.23, 0.36, 'triangle', 0.08], [293.66, 0.18, 'square', 0.07],
    [392.0, 0.18, 'square', 0.07],
  ],
  industrial: [
    [110.0, 0.15, 'sawtooth', 0.08], [110.0, 0.15, 'sawtooth', 0.08], [0, 0.1, 'sawtooth', 0],
    [146.83, 0.2, 'square', 0.07], [110.0, 0.2, 'sawtooth', 0.08], [82.41, 0.35, 'sawtooth', 0.09],
    [123.47, 0.2, 'square', 0.07], [130.81, 0.2, 'square', 0.07],
  ],
  ethereal: [
    [659.25, 0.45, 'sine', 0.07], [587.33, 0.45, 'sine', 0.07], [523.25, 0.45, 'sine', 0.07],
    [783.99, 0.45, 'sine', 0.07], [1046.5, 0.55, 'triangle', 0.06], [0, 0.15, 'sine', 0],
    [880.0, 0.55, 'sine', 0.06],
  ],
  boss: [
    [110.0, 0.16, 'sawtooth', 0.09], [103.83, 0.16, 'sawtooth', 0.09], [110.0, 0.16, 'sawtooth', 0.09],
    [123.47, 0.16, 'sawtooth', 0.09], [87.31, 0.16, 'sawtooth', 0.1], [82.41, 0.16, 'sawtooth', 0.1],
  ],
};

const MELODY_OF: Partial<Record<TrackKey, keyof typeof MELODIES>> = {
  title: 'title',
  highscore: 'title',
  'world-adventure': 'adventure',
  'world-industrial': 'industrial',
  'world-ethereal': 'ethereal',
  'boss-frog': 'boss',
  'boss-chicken-eye': 'boss',
  'boss-shadow-head': 'boss',
};

const TARGET_RMS = Math.pow(10, -17.5 / 20);

function toTones(steps: Step[]): Tone[] {
  const tones: Tone[] = [];
  let t = 0;
  for (const [freq, dur, voice, vol] of steps) {
    if (freq > 0 && vol > 0) {
      const level = vol * 4; // the old volumes were for raw oscillators
      if (voice === 'square') tones.push({ wave: 'pulse', duty: 0.25, start: t, dur, f0: freq, vol: level, shape: 'gate', release: 0.02 });
      else if (voice === 'sawtooth') tones.push({ wave: 'pulse', duty: 0.125, start: t, dur, f0: freq, vol: level, shape: 'gate', release: 0.02 });
      else tones.push({ wave: 'triangle', start: t, dur, f0: freq, vol: level * 1.2, shape: 'gate', release: 0.02 });
    }
    t += dur;
  }
  return tones;
}

/** An exact-length loop for the track, or null when there is no placeholder for it. */
export function placeholderLoop(key: TrackKey, sampleRate = SAMPLE_RATE): Float32Array | null {
  const melody = MELODY_OF[key];
  if (!melody) return null;
  const steps = MELODIES[melody];
  const length = steps.reduce((sum, s) => sum + s[1], 0);
  const buf = render(toTones(steps), 1, sampleRate, 0).subarray(0, Math.round(length * sampleRate));

  // Same loudness for every loop (about -18 LUFS, like the music files are normalised to).
  let sq = 0;
  for (let i = 0; i < buf.length; i++) sq += buf[i] * buf[i];
  const scale = TARGET_RMS / Math.max(Math.sqrt(sq / buf.length), 1e-6);
  for (let i = 0; i < buf.length; i++) buf[i] *= scale;
  return buf;
}
