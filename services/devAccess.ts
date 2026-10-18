/**
 * Who may use the test probe `window.__pdGame` (jump to a level, god mode, warp, boss life...).
 *
 * The scripts in tools/dev drive the release build through it, so it cannot simply go. It is installed
 * only in dev builds, or when the page was given the unlock phrase before the game started
 * (`window.__pdUnlock = '<phrase>'`, written in tools/dev/README.md and not in the player docs). That keeps it
 * off the console of a casual player; it is not a lock: the code is open.
 *
 * Only the hash of the phrase is kept here, so the phrase cannot be read out of the shipped bundle.
 */
const UNLOCK_HASH = 0xd40ad1a8;

/** FNV-1a, 32 bits. */
export function hashPhrase(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function devProbeAllowed(scope: { __pdUnlock?: unknown } | undefined = typeof window === 'undefined' ? undefined : (window as unknown as { __pdUnlock?: unknown })): boolean {
  if (import.meta.env.DEV) return true;
  const phrase = scope?.__pdUnlock;
  return typeof phrase === 'string' && hashPhrase(phrase) === UNLOCK_HASH;
}
