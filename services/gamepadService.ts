/**
 * The gamepad, on the browser side (the mapping and the logic are in engine/gamepad.ts and are tested there).
 *
 * Two jobs:
 *  - in the menus (title, options, pause...) the pad is turned into the keys those screens already understand
 *    (arrows, Enter, Escape), so every screen works with a pad without knowing about it. `startMenuPad()` runs
 *    for the whole life of the app; while a game is running `suppressMenuPad(true)` mutes it, because then the
 *    game reads the pad itself (`readPad()` every frame).
 *  - `usePadConnected()` tells the screens whether there is a pad, to show its hints.
 * Browsers (and the WebView) only report a pad after one of its buttons has been pressed once.
 */
import { useSyncExternalStore } from 'react';
import { MENU_KEY, MenuPadRepeater, padMenu, type PadSnapshot } from '../engine/gamepad';

/** The first connected pad, as a snapshot, or null. */
export function readPad(): PadSnapshot | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  for (const pad of navigator.getGamepads()) {
    if (pad && pad.connected) {
      return { buttons: pad.buttons.map(b => b.pressed || b.value > 0.55), axes: Array.from(pad.axes) };
    }
  }
  return null;
}

let menuSuppressed = false;

/** True while the game itself reads the pad (a game running and not paused): the menu keys stay quiet. */
export function suppressMenuPad(on: boolean): void {
  menuSuppressed = on;
}

/** Starts turning the pad into menu keys. Returns the function that stops it. */
export function startMenuPad(): () => void {
  const repeater = new MenuPadRepeater();
  let raf = 0;
  const loop = (now: number) => {
    // always look, even when muted, so a button held when the menus come back does not count as a new press
    const fire = repeater.step(padMenu(readPad()), now);
    if (!menuSuppressed) {
      for (const key of fire) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: MENU_KEY[key], bubbles: true, cancelable: true }));
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

const connectedListeners = new Set<() => void>();
let installed = false;

function installConnectionEvents(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const notify = () => connectedListeners.forEach(l => l());
  window.addEventListener('gamepadconnected', notify);
  window.addEventListener('gamepaddisconnected', notify);
}

/** True while a pad is connected (and has been touched once). Redraws the component when that changes. */
export function usePadConnected(): boolean {
  installConnectionEvents();
  return useSyncExternalStore(
    cb => {
      connectedListeners.add(cb);
      return () => connectedListeners.delete(cb);
    },
    () => readPad() !== null,
    () => false
  );
}
