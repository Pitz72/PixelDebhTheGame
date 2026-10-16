/**
 * Keyboard -> game input. Pure logic (no DOM access) so it can be unit tested.
 * Fixes: auto-repeat no longer retriggers jump/capture, and `reset()` clears every
 * held key when the window loses focus (no more "stuck" movement after alt-tab).
 */

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
}

export type Action = 'jump' | 'jumpRelease' | 'capture';

export interface KeyLike {
  key: string;
  code?: string;
  repeat?: boolean;
}

const LEFT = ['a', 'arrowleft'];
const RIGHT = ['d', 'arrowright'];
const UP = ['w', 'arrowup'];
const DOWN = ['s', 'arrowdown'];

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

  private normalise(e: KeyLike): string {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'shift';
    return e.key.toLowerCase();
  }

  keyDown(e: KeyLike): void {
    const k = this.normalise(e);
    this.held.add(k);
    if (e.repeat) return;
    if (k === ' ') this.queue.push('jump');
    else if (k === 'c' || k === 'x') this.queue.push('capture');
  }

  keyUp(e: KeyLike): void {
    const k = this.normalise(e);
    this.held.delete(k);
    if (k === ' ') this.queue.push('jumpRelease');
  }

  /** Forget every held key and pending action (window blur, pause, level change). */
  reset(): void {
    this.held.clear();
    this.queue = [];
  }

  /** Take the edge-triggered actions collected since the last call. */
  drainActions(): Action[] {
    const out = this.queue;
    this.queue = [];
    return out;
  }

  state(): InputState {
    const any = (keys: string[]) => keys.some(k => this.held.has(k));
    return {
      left: any(LEFT),
      right: any(RIGHT),
      up: any(UP),
      down: any(DOWN),
      shoot: this.held.has('shift'),
    };
  }
}
