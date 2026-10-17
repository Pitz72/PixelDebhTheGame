/**
 * Keyboard and gamepad -> game input. Pure logic (no DOM access) so it can be unit tested.
 * Fixes: auto-repeat no longer retriggers jump/capture, and `reset()` clears every
 * held key when the window loses focus (no more "stuck" movement after alt-tab).
 *
 * The keys are not fixed: the controller reads them from a `Bindings` table (the player can change it in
 * the options). A key is named the way `normalise` says: the lower-case `key` of the event, or "shift".
 */

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
}

export type Action = 'jump' | 'jumpRelease' | 'capture';

/** What the player can do, and so what can be given keys in the options. */
export type Control = 'left' | 'right' | 'up' | 'down' | 'jump' | 'capture' | 'shoot';
export const CONTROLS: readonly Control[] = ['left', 'right', 'up', 'down', 'jump', 'capture', 'shoot'];

export type Bindings = Record<Control, string[]>;

export const DEFAULT_BINDINGS: Bindings = {
  left: ['a', 'arrowleft'],
  right: ['d', 'arrowright'],
  up: ['w', 'arrowup'],
  down: ['s', 'arrowdown'],
  jump: [' '],
  capture: ['c', 'x'],
  shoot: ['shift'],
};

/** Keys that belong to the game itself (pause, mute, fullscreen, quality, performance, menus): never given to a control. */
export const RESERVED_KEYS: readonly string[] = ['escape', 'enter', 'f', 'm', 'q', 'f3', 'f11', 'f12', 'tab'];

export interface KeyLike {
  key: string;
  code?: string;
  repeat?: boolean;
}

/** The name a key goes by in the bindings. */
export function normaliseKey(e: KeyLike): string {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'shift';
  return e.key.toLowerCase();
}

/** A copy of the default bindings (so nothing edits the shared table). */
export const defaultBindings = (): Bindings => ({
  left: [...DEFAULT_BINDINGS.left],
  right: [...DEFAULT_BINDINGS.right],
  up: [...DEFAULT_BINDINGS.up],
  down: [...DEFAULT_BINDINGS.down],
  jump: [...DEFAULT_BINDINGS.jump],
  capture: [...DEFAULT_BINDINGS.capture],
  shoot: [...DEFAULT_BINDINGS.shoot],
});

/** What a gamepad is doing, already turned into the game's own controls (see gamepad.ts). */
export interface PadState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  jump: boolean;
  capture: boolean;
}

export const emptyPad = (): PadState => ({
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
  jump: false,
  capture: false,
});

export const emptyInput = (): InputState => ({
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
});

export class InputController {
  private held = new Set<string>();
  private queue: Action[] = [];
  private pad: PadState = emptyPad();
  private bindings: Bindings;

  constructor(bindings: Bindings = DEFAULT_BINDINGS) {
    this.bindings = bindings;
  }

  /** Changes the keys (the options, live). Keys held at that moment are forgotten so none stays stuck. */
  setBindings(bindings: Bindings): void {
    this.bindings = bindings;
    this.held.clear();
  }

  private is(control: Control, key: string): boolean {
    return this.bindings[control].includes(key);
  }

  keyDown(e: KeyLike): void {
    const k = normaliseKey(e);
    this.held.add(k);
    if (e.repeat) return;
    if (this.is('jump', k)) this.queue.push('jump');
    else if (this.is('capture', k)) this.queue.push('capture');
  }

  keyUp(e: KeyLike): void {
    const k = normaliseKey(e);
    this.held.delete(k);
    if (this.is('jump', k)) this.queue.push('jumpRelease');
  }

  /**
   * The gamepad, as it is right now (call it every frame). What changed since the last call becomes
   * the same actions a key would give: a press of jump or capture, the release of jump.
   */
  setPad(next: PadState): void {
    const prev = this.pad;
    if (next.jump && !prev.jump) this.queue.push('jump');
    else if (!next.jump && prev.jump) this.queue.push('jumpRelease');
    if (next.capture && !prev.capture) this.queue.push('capture');
    this.pad = { ...next };
  }

  /**
   * Takes the pad as it is without turning it into presses: for the moment a screen opens or the game
   * resumes with a button already down (the A that chose "resume" must not become a jump).
   */
  syncPad(next: PadState): void {
    this.pad = { ...next };
  }

  /** Forget every held key and pending action (window blur, pause, level change). */
  reset(): void {
    this.held.clear();
    this.queue = [];
    this.pad = emptyPad();
  }

  /** Take the edge-triggered actions collected since the last call. */
  drainActions(): Action[] {
    const out = this.queue;
    this.queue = [];
    return out;
  }

  state(): InputState {
    const key = (c: Control) => this.bindings[c].some(k => this.held.has(k));
    const p = this.pad;
    return {
      left: key('left') || p.left,
      right: key('right') || p.right,
      up: key('up') || p.up,
      down: key('down') || p.down,
      shoot: key('shoot') || p.shoot,
    };
  }
}
