import { describe, it, expect, vi, afterEach } from 'vitest';
import { devProbeAllowed, hashPhrase } from '../services/devAccess';

const PHRASE = 'debh-sonda-retro-2026'; // written in tools/dev/README.md

afterEach(() => vi.unstubAllEnvs());

describe('who may use the test probe (window.__pdGame)', () => {
  it('a dev build always may', () => {
    vi.stubEnv('DEV', true);
    expect(devProbeAllowed({})).toBe(true);
  });

  describe('in a shipped build', () => {
    it('nobody may by default', () => {
      vi.stubEnv('DEV', false);
      expect(devProbeAllowed({})).toBe(false);
      expect(devProbeAllowed(undefined)).toBe(false);
    });

    it('a wrong phrase, or anything that is not a phrase, does not unlock it', () => {
      vi.stubEnv('DEV', false);
      for (const bad of ['', 'god', 'debh', PHRASE.toUpperCase(), ` ${PHRASE}`, true, 1, {}, null]) {
        expect(devProbeAllowed({ __pdUnlock: bad })).toBe(false);
      }
    });

    it('the right phrase unlocks it', () => {
      vi.stubEnv('DEV', false);
      expect(devProbeAllowed({ __pdUnlock: PHRASE })).toBe(true);
    });
  });

  it('keeps only the hash, so the phrase is not in the bundle', () => {
    expect(hashPhrase(PHRASE)).toBe(0xd40ad1a8);
    expect(hashPhrase('')).toBe(0x811c9dc5);
  });
});
