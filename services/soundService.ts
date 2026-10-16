import * as storage from './storage';
import { SAMPLE_RATE } from '../audio/chip';
import { SFX, SFX_NAMES, isSfxName, renderSfx, type SfxName, type SfxRecipe } from '../audio/sfx';
import { placeholderLoop } from '../audio/placeholderMusic';
import { ONE_SHOT_TRACKS, parseManifest, trackForTheme, type Manifest, type TrackKey } from '../audio/tracks';

/**
 * Audio engine.
 *
 *   sfxBus ----------------------------------.
 *   musicBus -> musicFilter -> musicDuck -----+-> master -> limiter -> speakers
 *
 * Effects are chip-synth recipes rendered once into buffers (audio/sfx.ts). Music is a looping
 * buffer decoded from public/audio/music/ (or a built-in placeholder loop when the file is
 * missing), cross-faded on track changes and resumed from where it stopped after a pause.
 */

export type VolumeKind = 'master' | 'music' | 'sfx';

const MUSIC_URL = '/audio/music/';
const CROSSFADE_S = 0.6;
const MAX_VOICES = 24;

const MUTED_KEY = 'pixelDebhMuted';
const VOLUME_KEYS: Record<VolumeKind, string> = {
  master: 'pixelDebhVolMaster',
  music: 'pixelDebhVolMusic',
  sfx: 'pixelDebhVolSfx',
};
const DEFAULT_VOLUMES: Record<VolumeKind, number> = { master: 0.9, music: 0.8, sfx: 1 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicFilter: BiquadFilterNode | null = null;
let musicDuck: GainNode | null = null;
let probe: AnalyserNode | null = null;

let muted = false;
const volumes: Record<VolumeKind, number> = { ...DEFAULT_VOLUMES };

/** Slider position -> gain: a squared curve feels linear to the ear. */
const gainOf = (v: number) => v * v;

// --- context and buses ---------------------------------------------------------------

export function initAudio() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();

      master = ctx.createGain();
      master.gain.value = muted ? 0 : gainOf(volumes.master);

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      master.connect(limiter);
      limiter.connect(ctx.destination);
      probe = ctx.createAnalyser(); // read by the test probe below, costs nothing otherwise
      probe.fftSize = 2048;
      limiter.connect(probe);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = gainOf(volumes.sfx) * 0.7; // headroom for several effects at once
      sfxBus.connect(master);

      musicFilter = ctx.createBiquadFilter();
      musicFilter.type = 'lowpass';
      musicFilter.frequency.value = 20000;
      musicDuck = ctx.createGain();
      musicBus = ctx.createGain();
      musicBus.gain.value = gainOf(volumes.music);
      musicBus.connect(musicFilter);
      musicFilter.connect(musicDuck);
      musicDuck.connect(master);

      for (const name of SFX_NAMES) bufferFor(name);
      installProbe();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  } catch (e) {
    console.error('Could not initialize audio context', e);
  }
}

function ensureContext(): AudioContext | null {
  if (!ctx) initAudio();
  else if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

function toAudioBuffer(data: Float32Array, rate: number): AudioBuffer {
  const b = (ctx as AudioContext).createBuffer(1, data.length, rate);
  b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
  return b;
}

// --- sound effects -----------------------------------------------------------------

const sfxBuffers = new Map<SfxName, AudioBuffer>();
const lastPlayed = new Map<SfxName, number>();
let activeVoices = 0;
let duckFloor = 1;
let duckUntil = 0;

function bufferFor(name: SfxName): AudioBuffer {
  let b = sfxBuffers.get(name);
  if (!b) {
    b = toAudioBuffer(renderSfx(name, SAMPLE_RATE), SAMPLE_RATE);
    sfxBuffers.set(name, b);
  }
  return b;
}

/** Lowers the music for a moment so a big effect is heard clearly. */
function duckMusic(fraction: number, ms: number) {
  if (!ctx || !musicDuck) return;
  const now = ctx.currentTime;
  const floor = 1 - fraction;
  const end = now + ms / 1000;
  const currentFloor = now < duckUntil ? duckFloor : 1;
  if (end <= duckUntil && floor >= currentFloor) return; // already covered by a stronger duck
  duckFloor = Math.min(floor, currentFloor);
  duckUntil = Math.max(end, duckUntil);
  const g = musicDuck.gain;
  g.cancelScheduledValues(now);
  g.setTargetAtTime(duckFloor, now, 0.02);
  g.setTargetAtTime(1, duckUntil, 0.25);
}

export function playSound(name: string) {
  if (!isSfxName(name)) return;
  if (!ensureContext() || !ctx || !sfxBus) return;
  const recipe: SfxRecipe = SFX[name];

  const now = performance.now();
  const last = lastPlayed.get(name);
  if (recipe.minGapMs && last !== undefined && now - last < recipe.minGapMs) return;
  if (activeVoices >= MAX_VOICES) return;
  lastPlayed.set(name, now);

  try {
    const src = ctx.createBufferSource();
    src.buffer = bufferFor(name);
    if (recipe.jitter) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * recipe.jitter;
    src.connect(sfxBus);
    activeVoices++;
    src.onended = () => {
      activeVoices--;
      src.disconnect();
    };
    src.start();
    if (recipe.duck) duckMusic(recipe.duck[0], recipe.duck[1]);
  } catch (e) {
    console.error(`Could not play sound: ${name}`, e);
  }
}

/** Stingers live in the same bank as the effects. */
export function playJingle(name: 'levelStart' | 'respawn' | 'extraLife') {
  playSound(name);
}

// --- music ----------------------------------------------------------------------

interface TrackBuffer {
  /** 'file' when decoded from public/audio/music, 'placeholder' for the built-in loop. */
  origin: 'file' | 'placeholder';
  buffer: AudioBuffer;
  loopStart: number;
  loopEnd: number;
  gain: number;
}

interface Playing {
  key: TrackKey;
  loop: boolean;
  track: TrackBuffer;
  source: AudioBufferSourceNode;
  fade: GainNode;
  startedAt: number; // ctx.currentTime when the source started
  offset: number; // position in the buffer when it started
}

let manifestPromise: Promise<Manifest> | null = null;
const trackCache = new Map<TrackKey, Promise<TrackBuffer | null>>();
let current: Playing | null = null;
let wanted: { key: TrackKey; loop: boolean } | null = null;
let held: { track: TrackBuffer; key: TrackKey; loop: boolean; pos: number } | null = null;
let holding = false; // pauseMusic() is in effect
let loadToken = 0;

function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${MUSIC_URL}manifest.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(parseManifest)
      .catch(() => ({}) as Manifest);
  }
  return manifestPromise;
}

async function decodeTrack(key: TrackKey): Promise<TrackBuffer | null> {
  const c = ctx;
  if (!c) return null;
  try {
    const entry = (await loadManifest())[key];
    if (entry) {
      const res = await fetch(MUSIC_URL + entry.file);
      if (res.ok) {
        const buffer = await c.decodeAudioData(await res.arrayBuffer());
        const loopEnd = entry.loopEnd > 0 ? Math.min(entry.loopEnd, buffer.duration) : buffer.duration;
        return { origin: 'file', buffer, loopStart: Math.min(entry.loopStart, loopEnd), loopEnd, gain: Math.pow(10, entry.gainDb / 20) };
      }
    }
  } catch (e) {
    console.warn(`Music track "${key}" unavailable, using the placeholder`, e);
  }
  const loop = ONE_SHOT_TRACKS.has(key) ? null : placeholderLoop(key, SAMPLE_RATE);
  if (!loop) return null;
  const buffer = toAudioBuffer(loop, SAMPLE_RATE);
  return { origin: 'placeholder', buffer, loopStart: 0, loopEnd: buffer.duration, gain: 1 };
}

function loadTrack(key: TrackKey): Promise<TrackBuffer | null> {
  let p = trackCache.get(key);
  if (!p) {
    p = decodeTrack(key);
    trackCache.set(key, p);
  }
  return p;
}

function positionOf(p: Playing): number {
  if (!ctx) return p.offset;
  const pos = p.offset + (ctx.currentTime - p.startedAt);
  if (!p.loop) return Math.min(pos, p.track.buffer.duration);
  const { loopStart, loopEnd } = p.track;
  return pos < loopEnd ? pos : loopStart + ((pos - loopStart) % (loopEnd - loopStart));
}

function fadeOutAndStop(p: Playing, seconds: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  p.fade.gain.cancelScheduledValues(now);
  p.fade.gain.setValueAtTime(p.fade.gain.value, now);
  p.fade.gain.linearRampToValueAtTime(0, now + seconds);
  try {
    p.source.stop(now + seconds + 0.02);
  } catch {
    // already stopped
  }
  p.source.onended = () => {
    p.source.disconnect();
    p.fade.disconnect();
  };
}

function begin(key: TrackKey, loop: boolean, track: TrackBuffer, offset: number, fadeS: number) {
  if (!ctx || !musicBus) return;
  const previous = current;
  if (previous) fadeOutAndStop(previous, fadeS);

  const fade = ctx.createGain();
  const now = ctx.currentTime;
  fade.gain.setValueAtTime(0, now);
  fade.gain.linearRampToValueAtTime(track.gain, now + fadeS);
  fade.connect(musicBus);

  const source = ctx.createBufferSource();
  source.buffer = track.buffer;
  source.loop = loop;
  if (loop) {
    source.loopStart = track.loopStart;
    source.loopEnd = track.loopEnd;
  }
  source.connect(fade);
  source.start(0, offset);

  const playing: Playing = { key, loop, track, source, fade, startedAt: now, offset };
  current = playing;
  if (!loop) {
    source.onended = () => {
      if (current === playing) current = null;
      source.disconnect();
      fade.disconnect();
    };
  }
}

function startTrack(key: TrackKey, loop: boolean) {
  if (!ensureContext()) return;
  // The same track again (the next level of the same world) keeps playing without a restart.
  if (wanted?.key === key && (current || held || holding)) return;
  wanted = { key, loop };
  held = null;
  const token = ++loadToken;
  void loadTrack(key).then(track => {
    if (token !== loadToken || !track) return;
    if (holding) held = { track, key, loop, pos: 0 };
    else begin(key, loop, track, 0, current ? CROSSFADE_S : 0.05);
  });
}

/** Starts the music for a theme name used by the engine or the screens. Loops unless it is a jingle. */
export function playMusicLoop(name: string) {
  const key = trackForTheme(name);
  if (key) startTrack(key, !ONE_SHOT_TRACKS.has(key));
}

/** Plays a track once from its start (victory, game over). */
export function playMusicOnce(name: string) {
  const key = trackForTheme(name);
  if (!key) return;
  wanted = null; // a one-shot always restarts
  startTrack(key, false);
}

/** Pause = fade out and remember the position, so resumeMusic() continues from the same spot. */
export function pauseMusic() {
  if (holding) return;
  holding = true;
  if (!current) return;
  held = { track: current.track, key: current.key, loop: current.loop, pos: positionOf(current) };
  fadeOutAndStop(current, 0.08);
  current = null;
}

export function resumeMusic() {
  if (!holding) return;
  holding = false;
  const h = held;
  held = null;
  if (h) begin(h.key, h.loop, h.track, h.pos, 0.12);
}

export function stopMusic() {
  loadToken++;
  wanted = null;
  held = null;
  holding = false;
  if (current) fadeOutAndStop(current, 0.3);
  current = null;
}

// --- volume, mute and saved settings ---------------------------------------------------

function applyVolumes() {
  if (!ctx || !master || !sfxBus || !musicBus) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(muted ? 0 : gainOf(volumes.master), t, 0.015);
  sfxBus.gain.setTargetAtTime(gainOf(volumes.sfx) * 0.7, t, 0.015);
  musicBus.gain.setTargetAtTime(gainOf(volumes.music), t, 0.015);
}

export function isMuted(): boolean {
  return muted;
}

/** Restore the saved audio settings (call once after initStorage). */
export function loadAudioSettings() {
  muted = storage.getItem(MUTED_KEY) === '1';
  for (const kind of Object.keys(VOLUME_KEYS) as VolumeKind[]) {
    const raw = storage.getItem(VOLUME_KEYS[kind]);
    const saved = raw === null ? NaN : Number(raw);
    volumes[kind] = Number.isFinite(saved) ? Math.max(0, Math.min(1, saved / 100)) : DEFAULT_VOLUMES[kind];
  }
}

export function setMuted(value: boolean) {
  muted = value;
  storage.setItem(MUTED_KEY, muted ? '1' : '0');
  applyVolumes();
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function getVolume(kind: VolumeKind): number {
  return volumes[kind];
}

/** Slider position 0..1. Saved right away so an interrupted session keeps it. */
export function setVolume(kind: VolumeKind, value: number) {
  volumes[kind] = Math.max(0, Math.min(1, value));
  storage.setItem(VOLUME_KEYS[kind], String(Math.round(volumes[kind] * 100)));
  applyVolumes();
}

// --- test probe ------------------------------------------------------------------------

/**
 * window.__pdAudio lets the test scripts (tools/dev) see what the engine is doing in the
 * real app: context state, the track that is playing and where, and the level at the output.
 */
function installProbe() {
  (window as unknown as { __pdAudio?: unknown }).__pdAudio = {
    state: () => ctx?.state ?? null,
    time: () => ctx?.currentTime ?? 0,
    voices: () => activeVoices,
    music: () =>
      current
        ? {
            key: current.key,
            origin: current.track.origin,
            loop: current.loop,
            position: positionOf(current),
            duration: current.track.buffer.duration,
            loopStart: current.track.loopStart,
            loopEnd: current.track.loopEnd,
          }
        : null,
    level: () => {
      if (!probe) return null;
      const data = new Float32Array(probe.fftSize);
      probe.getFloatTimeDomainData(data);
      let peak = 0;
      let sq = 0;
      for (const v of data) {
        peak = Math.max(peak, Math.abs(v));
        sq += v * v;
      }
      const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));
      return { peakDb: db(peak), rmsDb: db(Math.sqrt(sq / data.length)) };
    },
  };
}
