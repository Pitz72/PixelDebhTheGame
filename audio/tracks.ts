/**
 * The music the game asks for, and the manifest that says where each track's file and loop
 * points are. The tracks themselves are audio files in public/audio/music/ (generated
 * outside the game, see docs/MUSIC_BRIEF.md); when a file is missing the game falls back to
 * the built-in placeholder loops.
 */

export const TRACK_KEYS = [
  'title',
  'world-adventure',
  'world-industrial',
  'world-ethereal',
  'boss-frog',
  'boss-chicken-eye',
  'boss-shadow-head',
  'highscore',
  'victory',
  'gameover',
] as const;

export type TrackKey = (typeof TRACK_KEYS)[number];

/** Played once from the start instead of looping. */
export const ONE_SHOT_TRACKS: ReadonlySet<TrackKey> = new Set<TrackKey>(['victory', 'gameover']);

/** Theme names used by the engine (LevelData.musicTheme) and by the screens -> track. */
const THEME_TO_TRACK: Record<string, TrackKey> = {
  startScreenTheme: 'title',
  adventure: 'world-adventure',
  industrial: 'world-industrial',
  ethereal: 'world-ethereal',
  boss: 'boss-frog',
  bossFrog: 'boss-frog',
  bossChickenEye: 'boss-chicken-eye',
  bossShadowHead: 'boss-shadow-head',
  highscore: 'highscore',
  victory: 'victory',
  gameover: 'gameover',
};

export function trackForTheme(name: string): TrackKey | null {
  return Object.prototype.hasOwnProperty.call(THEME_TO_TRACK, name) ? THEME_TO_TRACK[name] : null;
}

export interface TrackInfo {
  /** File name inside /audio/music/. */
  file: string;
  /** Loop region in seconds. loopEnd 0 means "until the end of the file". */
  loopStart: number;
  loopEnd: number;
  /** Trim applied on top of the loudness the file was normalised to. */
  gainDb: number;
}

export type Manifest = Partial<Record<TrackKey, TrackInfo>>;

const isTrackKey = (k: string): k is TrackKey => (TRACK_KEYS as readonly string[]).includes(k);

/** Reads manifest.json defensively: a bad entry is dropped, never an exception. */
export function parseManifest(json: unknown): Manifest {
  const out: Manifest = {};
  const tracks = (json as { tracks?: unknown } | null)?.tracks;
  if (!tracks || typeof tracks !== 'object') return out;
  for (const [key, raw] of Object.entries(tracks as Record<string, unknown>)) {
    if (!isTrackKey(key) || !raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;
    if (typeof e.file !== 'string' || !/^[\w.-]+$/.test(e.file)) continue;
    const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
    const loopStart = Math.max(0, num(e.loopStart, 0));
    const loopEnd = Math.max(0, num(e.loopEnd, 0));
    if (loopEnd !== 0 && loopEnd <= loopStart) continue;
    out[key] = { file: e.file, loopStart, loopEnd, gainDb: Math.max(-24, Math.min(12, num(e.gainDb, 0))) };
  }
  return out;
}
