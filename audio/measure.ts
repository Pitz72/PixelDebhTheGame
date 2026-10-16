/**
 * Level measurements for rendered buffers (tests and the offline export). Nothing here is
 * used by the game itself.
 */
import { SAMPLE_RATE } from './chip';

export interface Stats {
  durationS: number;
  /** Highest sample, in dBFS. */
  peakDb: number;
  /** RMS over the whole buffer, in dBFS. */
  rmsDb: number;
  /** RMS over the stretches where the sound is actually playing, in dBFS. */
  activeRmsDb: number;
  /** K-weighted loudness of the whole buffer (ITU-R BS.1770 without gating), in LUFS. */
  lufs: number;
  /** Mean sample value: a constant offset wastes headroom and clicks at the edges. */
  dc: number;
  /** |first sample| and |last sample|: anything but ~0 is a click when the buffer starts or ends. */
  edgeStart: number;
  edgeEnd: number;
  nonFinite: number;
}

const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));

type Biquad = { b: [number, number, number]; a: [number, number] };

// BS.1770 K-weighting filters, coefficients for 48 kHz.
const K_STAGES: Biquad[] = [
  { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] },
  { b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621] },
];

function biquad(x: Float32Array | Float64Array, f: Biquad): Float64Array {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = f.b[0] * x[i] + f.b[1] * x1 + f.b[2] * x2 - f.a[0] * y1 - f.a[1] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
}

export function measure(buf: Float32Array, sampleRate = SAMPLE_RATE): Stats {
  if (sampleRate !== 48000) throw new Error('measure() K-weighting is tuned for 48 kHz');
  let peak = 0, sum = 0, sq = 0, nonFinite = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    if (!Number.isFinite(v)) { nonFinite++; continue; }
    peak = Math.max(peak, Math.abs(v));
    sum += v;
    sq += v * v;
  }

  // Active RMS: 10 ms windows whose own RMS is within 40 dB of the loudest window.
  const win = Math.round(sampleRate * 0.01);
  const winRms: number[] = [];
  for (let s = 0; s + win <= buf.length; s += win) {
    let w = 0;
    for (let i = s; i < s + win; i++) w += buf[i] * buf[i];
    winRms.push(Math.sqrt(w / win));
  }
  const loudest = Math.max(...winRms, 1e-9);
  const active = winRms.filter(r => r > loudest * 0.01);
  const activeRms = Math.sqrt(active.reduce((a, r) => a + r * r, 0) / Math.max(1, active.length));

  let k: Float64Array = Float64Array.from(buf);
  for (const stage of K_STAGES) k = biquad(k, stage);
  let ks = 0;
  for (let i = 0; i < k.length; i++) ks += k[i] * k[i];

  const edgeStart = Math.abs(buf[0] ?? 0);
  const edgeEnd = Math.abs(buf[buf.length - 1] ?? 0);

  return {
    durationS: buf.length / sampleRate,
    peakDb: db(peak),
    rmsDb: db(Math.sqrt(sq / buf.length)),
    activeRmsDb: db(activeRms),
    lufs: -0.691 + 10 * Math.log10(Math.max(ks / buf.length, 1e-12)),
    dc: sum / buf.length,
    edgeStart,
    edgeEnd,
    nonFinite,
  };
}

/** 16-bit PCM mono WAV, for listening to and inspecting a buffer outside the game. */
export function toWav(buf: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const out = new Uint8Array(44 + buf.length * 2);
  const view = new DataView(out.buffer);
  const text = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) out[offset + i] = s.charCodeAt(i); };
  text(0, 'RIFF'); view.setUint32(4, 36 + buf.length * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, buf.length * 2, true);
  for (let i = 0; i < buf.length; i++) {
    view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), true);
  }
  return out;
}
