import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { note, render, sequence, SAMPLE_RATE } from '../audio/chip';
import { SFX, SFX_NAMES, isSfxName, renderSfx, type SfxRecipe } from '../audio/sfx';
import { measure } from '../audio/measure';
import { ONE_SHOT_TRACKS, TRACK_KEYS, parseManifest, trackForTheme } from '../audio/tracks';
import { placeholderLoop } from '../audio/placeholderMusic';
import { levels } from '../levels';

describe('chip synth', () => {
  it('maps note names to the equal-tempered scale', () => {
    expect(note('A4')).toBeCloseTo(440, 6);
    expect(note('C4')).toBeCloseTo(261.6256, 3);
    expect(note('C5')).toBeCloseTo(523.2511, 3);
    expect(note('F#3')).toBeCloseTo(185.0, 1);
    expect(note('Bb3')).toBeCloseTo(233.0819, 3);
    expect(() => note('H2')).toThrow();
  });

  it('renders the same samples every time', () => {
    const tones = sequence({ wave: 'noise', vol: 0.5 }, [['C5', 0.1]]);
    expect(render(tones)).toEqual(render(tones));
  });

  it('puts the pitch where it says: a 1 kHz pulse crosses zero about 2000 times a second', () => {
    const buf = render([{ wave: 'pulse', duty: 0.5, start: 0, dur: 1, f0: 1000, vol: 0.5, shape: 'gate' }]);
    let crossings = 0;
    for (let i = 1; i < buf.length; i++) if (buf[i - 1] < 0 !== buf[i] < 0) crossings++;
    expect(crossings).toBeGreaterThan(1990);
    expect(crossings).toBeLessThan(2010);
  });

  it('quantises the triangle: 16 levels leave the error of a 4-bit converter', () => {
    const tone = { wave: 'triangle' as const, start: 0, dur: 0.5, f0: 220, vol: 1, shape: 'gate' as const, attack: 0.001 };
    const smooth = render([tone]);
    const coarse = render([{ ...tone, steps: 16 }]);
    let err = 0;
    for (let i = 4800; i < 19200; i++) err += (coarse[i] - smooth[i]) ** 2;
    const rms = Math.sqrt(err / 14400);
    // a quantiser with step 2/16 adds noise of step / sqrt(12) = 0.036 RMS
    expect(rms).toBeGreaterThan(0.025);
    expect(rms).toBeLessThan(0.045);
  });

  it('keeps the 93-step noise register periodic and the long one random', () => {
    const run = (short: boolean) =>
      render([{ wave: 'noise', short, start: 0, dur: 0.5, f0: 4000, vol: 1, shape: 'gate', attack: 0.001 }]);
    const sample = (b: Float32Array) => Array.from({ length: 400 }, (_, k) => Math.sign(b[2400 + k * 12] || 1));
    const autocorr = (s: number[], lag: number) => s.slice(0, s.length - lag).reduce((a, v, i) => a + v * s[i + lag], 0);
    // 4000 Hz clock at 48 kHz = one register step every 12 samples
    const periodic = sample(run(true));
    expect(autocorr(periodic, 93)).toBeGreaterThan(autocorr(periodic, 50) + 100);
    const random = sample(run(false));
    expect(Math.abs(autocorr(random, 93)) / 300).toBeLessThan(0.5);
  });
});

describe('sound effects', () => {
  it('has a recipe for every sound and jingle the engine emits', () => {
    const step = readFileSync('engine/step.ts', 'utf8');
    const world = readFileSync('engine/world.ts', 'utf8');
    const emitted = new Set<string>();
    for (const m of step.matchAll(/sound\(w, '(\w+)'\)/g)) emitted.add(m[1]);
    for (const m of (step + world).matchAll(/type: 'jingle', name: '(\w+)'/g)) emitted.add(m[1]);
    expect(emitted.size).toBeGreaterThan(15);
    for (const name of emitted) expect(isSfxName(name), `missing recipe: ${name}`).toBe(true);
  });

  it('has a recipe for every sound the screens play', () => {
    for (const file of ['components/StartScreen.tsx', 'components/EnterHighscoreScreen.tsx', 'components/HighscoreScreen.tsx']) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/playSound\('(\w+)'\)/g)) expect(isSfxName(m[1]), `${file}: ${m[1]}`).toBe(true);
    }
  });

  for (const name of SFX_NAMES) {
    describe(name, () => {
      const recipe: SfxRecipe = SFX[name];
      const buf = renderSfx(name);
      const s = measure(buf);

      it('is well formed', () => {
        expect(s.nonFinite).toBe(0);
        for (const t of recipe.tones) {
          expect(t.dur).toBeGreaterThan(0);
          expect(t.f0).toBeGreaterThan(0);
          expect(t.f1 ?? t.f0).toBeGreaterThan(0);
          expect(t.vol).toBeGreaterThan(0);
          expect(t.vol).toBeLessThanOrEqual(1);
        }
      });

      it('is short enough to be an effect', () => {
        expect(s.durationS).toBeGreaterThan(0.03);
        expect(s.durationS).toBeLessThan(2);
      });

      it('never clips and is not buried', () => {
        expect(s.peakDb).toBeLessThan(-0.5);
        expect(s.peakDb).toBeGreaterThan(-16);
      });

      it('sits in the loudness range of the set', () => {
        expect(s.activeRmsDb).toBeGreaterThan(-23);
        expect(s.activeRmsDb).toBeLessThan(-10);
        expect(s.lufs).toBeGreaterThan(-24);
        expect(s.lufs).toBeLessThan(-9);
      });

      it('has no offset and no click at either end', () => {
        expect(Math.abs(s.dc)).toBeLessThan(0.005);
        expect(s.edgeStart).toBeLessThan(0.005);
        expect(s.edgeEnd).toBeLessThan(0.005);
      });

      it('has a sane pitch jitter and duck setting', () => {
        const r = recipe;
        if (r.jitter !== undefined) expect(r.jitter).toBeLessThanOrEqual(0.06);
        if (r.duck) {
          expect(r.duck[0]).toBeGreaterThan(0);
          expect(r.duck[0]).toBeLessThanOrEqual(1);
          expect(r.duck[1]).toBeLessThan(2500);
        }
        if (r.minGapMs !== undefined) expect(r.minGapMs).toBeLessThan(250);
      });
    });
  }

  it('renders at the expected sample rate', () => {
    expect(SAMPLE_RATE).toBe(48000);
  });
});

describe('music tracks', () => {
  it('maps every level to a track', () => {
    for (const level of levels) {
      const theme = level.musicTrack || level.musicTheme;
      expect(trackForTheme(theme), `${level.name}: ${theme}`).not.toBeNull();
    }
  });

  it('gives each of the three bosses its own track', () => {
    const bossTracks = levels.filter(l => l.boss).map(l => trackForTheme(l.musicTrack || l.musicTheme));
    expect(bossTracks).toHaveLength(3);
    expect(new Set(bossTracks).size).toBe(3);
  });

  it('knows the screen themes and ignores unknown names', () => {
    expect(trackForTheme('startScreenTheme')).toBe('title');
    expect(trackForTheme('highscore')).toBe('highscore');
    expect(trackForTheme('nonsense')).toBeNull();
    expect(trackForTheme('toString')).toBeNull();
  });

  it('reads a manifest and drops what is wrong', () => {
    const m = parseManifest({
      tracks: {
        title: { file: 'title.ogg', loopStart: 1.5, loopEnd: 61.5, gainDb: -2 },
        victory: { file: 'victory.ogg' },
        'boss-frog': { file: '../escape.ogg' },
        'world-ethereal': { file: 'e.ogg', loopStart: 10, loopEnd: 5 },
        'world-adventure': { file: 'a.ogg', gainDb: 99 },
        bogus: { file: 'x.ogg' },
      },
    });
    expect(m.title).toEqual({ file: 'title.ogg', loopStart: 1.5, loopEnd: 61.5, gainDb: -2 });
    expect(m.victory).toEqual({ file: 'victory.ogg', loopStart: 0, loopEnd: 0, gainDb: 0 });
    expect(m['boss-frog']).toBeUndefined();
    expect(m['world-ethereal']).toBeUndefined();
    expect(m['world-adventure']?.gainDb).toBe(12);
    expect(Object.keys(m)).toHaveLength(3);
    expect(parseManifest(null)).toEqual({});
    expect(parseManifest('<html>')).toEqual({});
    expect(parseManifest({ tracks: 5 })).toEqual({});
  });

  describe('placeholder loops', () => {
    for (const key of TRACK_KEYS) {
      if (ONE_SHOT_TRACKS.has(key)) {
        it(`${key} has none (it is a one-shot jingle)`, () => {
          expect(placeholderLoop(key)).toBeNull();
        });
        continue;
      }
      it(`${key} is an exact, quiet, clean loop`, () => {
        const loop = placeholderLoop(key);
        expect(loop).not.toBeNull();
        const s = measure(loop as Float32Array);
        expect(s.nonFinite).toBe(0);
        expect(s.durationS).toBeGreaterThan(0.8);
        expect(s.peakDb).toBeLessThan(-3);
        expect(s.lufs).toBeGreaterThan(-20);
        expect(s.lufs).toBeLessThan(-16.5);
        expect(Math.abs(s.dc)).toBeLessThan(0.005);
        expect(s.edgeStart).toBeLessThan(0.01);
        expect(s.edgeEnd).toBeLessThan(0.01);
      });
    }
  });
});
