/**
 * Gamepad -> controls. Pure logic: it works on a snapshot of the pad (which buttons are pressed, how far the
 * sticks are pushed), so it can be tested without a pad and without a browser. `services/gamepadService.ts`
 * reads the real pad and gives snapshots to this.
 *
 * The layout is the "standard" one (Xbox / PlayStation / most modern pads):
 *   A (bottom)        jump, and "confirm" in the menus
 *   X (left)          capture / launch an enemy      Y (top)   the same
 *   B (right)         shoot                          RB, RT, LT  shoot too
 *   D-pad, left stick move (and aim when shooting)
 *   Start             pause (and back out of a menu)   B   back in the menus
 */
import { emptyPad, type PadState } from './input';

export interface PadSnapshot {
  /** Standard layout, index = button number; true when pressed. */
  buttons: boolean[];
  /** Standard layout: 0 and 1 are the left stick (x, y), 2 and 3 the right stick. */
  axes: number[];
}

export const PAD = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

/** How far a stick has to be pushed before it counts as a direction. */
export const STICK_DEADZONE = 0.45;

const down = (s: PadSnapshot, ...buttons: number[]): boolean => buttons.some(b => s.buttons[b] === true);
const axis = (s: PadSnapshot, i: number): number => (Number.isFinite(s.axes[i]) ? s.axes[i] : 0);

/** The four directions of the D-pad and the left stick together. */
export function padDirections(s: PadSnapshot): { left: boolean; right: boolean; up: boolean; down: boolean } {
  const x = axis(s, 0);
  const y = axis(s, 1);
  return {
    left: down(s, PAD.LEFT) || x < -STICK_DEADZONE,
    right: down(s, PAD.RIGHT) || x > STICK_DEADZONE,
    up: down(s, PAD.UP) || y < -STICK_DEADZONE,
    down: down(s, PAD.DOWN) || y > STICK_DEADZONE,
  };
}

/** What the pad does in the game. */
export function padControls(s: PadSnapshot | null): PadState {
  if (!s) return emptyPad();
  return {
    ...padDirections(s),
    jump: down(s, PAD.A),
    capture: down(s, PAD.X, PAD.Y),
    shoot: down(s, PAD.B, PAD.RB, PAD.RT, PAD.LT),
  };
}

export type MenuKey = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back';

/** What the pad does in the menus. */
export function padMenu(s: PadSnapshot | null): Record<MenuKey, boolean> {
  if (!s) return { up: false, down: false, left: false, right: false, confirm: false, back: false };
  const d = padDirections(s);
  return {
    ...d,
    confirm: down(s, PAD.A),
    back: down(s, PAD.B, PAD.START),
  };
}

/** True while Start is down (the game turns its press into a pause). */
export const padStart = (s: PadSnapshot | null): boolean => (s ? down(s, PAD.START) : false);

/** The keyboard key each menu action is turned into, so the existing screens need no change. */
export const MENU_KEY: Record<MenuKey, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  confirm: 'Enter',
  back: 'Escape',
};

/**
 * Turns the changes of the pad between two looks into menu key presses: a direction, when it is first held
 * and again after `repeatDelay` ms, then every `repeatEvery` ms; confirm and back once per press.
 */
export class MenuPadRepeater {
  private prev: Record<MenuKey, boolean> = { up: false, down: false, left: false, right: false, confirm: false, back: false };
  private since: Partial<Record<MenuKey, number>> = {};
  private lastFire: Partial<Record<MenuKey, number>> = {};

  constructor(
    private repeatDelay = 420,
    private repeatEvery = 130
  ) {}

  /** Keys to press now, for the pad as it is at time `now` (ms). */
  step(pad: Record<MenuKey, boolean>, now: number): MenuKey[] {
    const fire: MenuKey[] = [];
    for (const key of Object.keys(pad) as MenuKey[]) {
      const isDown = pad[key];
      if (isDown && !this.prev[key]) {
        fire.push(key);
        this.since[key] = now;
        this.lastFire[key] = now;
      } else if (isDown && (key === 'up' || key === 'down' || key === 'left' || key === 'right')) {
        const held = now - (this.since[key] ?? now);
        const last = this.lastFire[key] ?? now;
        if (held >= this.repeatDelay && now - last >= this.repeatEvery) {
          fire.push(key);
          this.lastFire[key] = now;
        }
      }
      this.prev[key] = isDown;
    }
    return fire;
  }

  /** Forget what was held (the pad changed, or the game took over). */
  reset(): void {
    for (const key of Object.keys(this.prev) as MenuKey[]) this.prev[key] = false;
    this.since = {};
    this.lastFire = {};
  }
}
