import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
  CONTROLS,
  DEFAULT_BINDINGS,
  InputController,
  MENU_KEY,
  MenuPadRepeater,
  PAD,
  RESERVED_KEYS,
  STICK_DEADZONE,
  defaultBindings,
  emptyPad,
  padControls,
  padMenu,
  padStart,
  type PadSnapshot,
} from '../engine';
import { LEGACY_QUALITY_KEY, SETTINGS_KEY, bindKey, clearKey, defaultSettings, getSettings, keyLabel, parseBindings, parseSettings, updateSettings } from '../services/settings';
import { bindableKey } from '../components/OptionsScreen';
import { it as italian } from '../locales/it';
import * as storage from '../services/storage';

// the tests run without a browser: a plain in-memory localStorage for the saved settings
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
} as Storage;

const pad = (pressed: number[] = [], axes: number[] = [0, 0, 0, 0]): PadSnapshot => {
  const buttons = Array.from({ length: 17 }, () => false);
  for (const b of pressed) buttons[b] = true;
  return { buttons, axes };
};

describe('keys you can change', () => {
  it('start with the usual keys: WASD and arrows, space, C or X, shift', () => {
    const input = new InputController();
    input.keyDown({ key: 'a' });
    input.keyDown({ key: 'ArrowUp' });
    input.keyDown({ key: 'Shift', code: 'ShiftLeft' });
    expect(input.state()).toMatchObject({ left: true, up: true, shoot: true, right: false });
    input.keyDown({ key: 'x' });
    input.keyDown({ key: ' ' });
    expect(input.drainActions()).toEqual(['capture', 'jump']);
  });

  it('follow a table the player made: the new key jumps and space no longer does', () => {
    const bindings = defaultBindings();
    bindings.jump = ['k'];
    const input = new InputController(bindings);
    input.keyDown({ key: ' ' });
    expect(input.drainActions()).toEqual([]);
    input.keyDown({ key: 'k' });
    input.keyUp({ key: 'k' });
    expect(input.drainActions()).toEqual(['jump', 'jumpRelease']);
  });

  it('forget the held keys when the table changes (nothing stays stuck)', () => {
    const input = new InputController();
    input.keyDown({ key: 'd' });
    expect(input.state().right).toBe(true);
    const next = defaultBindings();
    next.right = ['l'];
    input.setBindings(next);
    expect(input.state().right).toBe(false);
    input.keyDown({ key: 'l' });
    expect(input.state().right).toBe(true);
  });

  it('never give the game its own keys to a control', () => {
    for (const k of ['escape', 'enter', 'f', 'm', 'q', 'f3', 'f11']) expect(RESERVED_KEYS).toContain(k);
    for (const c of CONTROLS) for (const k of DEFAULT_BINDINGS[c]) expect(RESERVED_KEYS, `${c}: ${k}`).not.toContain(k);
  });
});

describe('the gamepad in the game', () => {
  it('uses the standard layout: A jumps, X or Y captures, B / RB / RT / LT shoot, the D-pad and the stick move', () => {
    expect(padControls(pad([PAD.A]))).toMatchObject({ jump: true, capture: false, shoot: false });
    expect(padControls(pad([PAD.X]))).toMatchObject({ capture: true });
    expect(padControls(pad([PAD.Y]))).toMatchObject({ capture: true });
    for (const b of [PAD.B, PAD.RB, PAD.RT, PAD.LT]) expect(padControls(pad([b])).shoot, String(b)).toBe(true);
    expect(padControls(pad([PAD.LEFT, PAD.UP]))).toMatchObject({ left: true, up: true, right: false, down: false });
    expect(padControls(pad([], [0.9, -0.9]))).toMatchObject({ right: true, up: true });
    expect(padControls(pad([], [-0.9, 0.9]))).toMatchObject({ left: true, down: true });
  });

  it('ignores a stick that is barely off centre, and a missing pad', () => {
    expect(padControls(pad([], [STICK_DEADZONE - 0.05, STICK_DEADZONE - 0.05]))).toEqual(emptyPad());
    expect(padControls(null)).toEqual(emptyPad());
    expect(padControls({ buttons: [], axes: [] })).toEqual(emptyPad());
  });

  it('turns presses and releases into the same actions as keys', () => {
    const input = new InputController();
    input.setPad(padControls(pad([PAD.A])));
    input.setPad(padControls(pad([PAD.A]))); // still held: no second jump
    input.setPad(padControls(pad([PAD.A, PAD.X])));
    input.setPad(padControls(pad([])));
    expect(input.drainActions()).toEqual(['jump', 'capture', 'jumpRelease']);
  });

  it('adds to the keyboard and is cleared by reset', () => {
    const input = new InputController();
    input.keyDown({ key: 'a' });
    input.setPad(padControls(pad([PAD.RIGHT, PAD.B])));
    expect(input.state()).toEqual({ left: true, right: true, up: false, down: false, shoot: true });
    input.reset();
    expect(input.state()).toEqual({ left: false, right: false, up: false, down: false, shoot: false });
  });

  it('can be taken as it is without a press (the A that chose "resume" is not a jump)', () => {
    const input = new InputController();
    input.syncPad(padControls(pad([PAD.A])));
    input.setPad(padControls(pad([PAD.A])));
    expect(input.drainActions()).toEqual([]);
    input.setPad(padControls(pad([])));
    expect(input.drainActions()).toEqual(['jumpRelease']);
  });

  it('pauses with Start', () => {
    expect(padStart(pad([PAD.START]))).toBe(true);
    expect(padStart(pad([PAD.A]))).toBe(false);
    expect(padStart(null)).toBe(false);
  });
});

describe('the gamepad in the menus', () => {
  it('means: A confirms, B and Start go back, direction go up, down, left, right', () => {
    expect(padMenu(pad([PAD.A])).confirm).toBe(true);
    expect(padMenu(pad([PAD.B])).back).toBe(true);
    expect(padMenu(pad([PAD.START])).back).toBe(true);
    expect(padMenu(pad([PAD.DOWN])).down).toBe(true);
    expect(padMenu(pad([], [0, -1])).up).toBe(true);
    expect(MENU_KEY).toEqual({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', back: 'Escape' });
  });

  it('presses a key once for a press, repeats a held direction after a delay, never repeats confirm', () => {
    const rep = new MenuPadRepeater(400, 100);
    const down = padMenu(pad([PAD.DOWN, PAD.A]));
    expect(rep.step(down, 0).sort()).toEqual(['confirm', 'down']);
    expect(rep.step(down, 200)).toEqual([]);
    expect(rep.step(down, 410)).toEqual(['down']);
    expect(rep.step(down, 450)).toEqual([]);
    expect(rep.step(down, 520)).toEqual(['down']);
    expect(rep.step(padMenu(pad()), 600)).toEqual([]);
    expect(rep.step(down, 700).sort()).toEqual(['confirm', 'down']); // pressed again
  });

  it('does not press anything for a button that was already down when it started watching', () => {
    const rep = new MenuPadRepeater();
    const held = padMenu(pad([PAD.A]));
    rep.step(held, 0); // seen
    rep.reset();
    // after a reset the held button counts as new: the game calls reset only when the menus have the pad
    expect(rep.step(held, 10)).toEqual(['confirm']);
  });
});

describe('the settings', () => {
  beforeEach(() => memory.clear());

  it('are complete even when nothing was saved or what was saved is garbage', () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
    expect(parseSettings('not json')).toEqual(defaultSettings());
    expect(parseSettings('{"shake":7,"flashes":"yes","quality":"ultra","bindings":5}')).toEqual(defaultSettings());
  });

  it('keep what was saved, and the old quality key from before the settings file', () => {
    const s = parseSettings('{"shake":50,"flashes":false,"hitStop":false,"reduceMotion":true,"autoQuality":false,"quality":"low"}');
    expect(s).toMatchObject({ shake: 50, flashes: false, hitStop: false, reduceMotion: true, autoQuality: false, quality: 'low' });
    expect(parseSettings(null, 'low').quality).toBe('low');
    expect(parseSettings('{"quality":"high"}', 'low').quality).toBe('high'); // the new file wins
    expect(LEGACY_QUALITY_KEY).toBe('pixelDebhQuality');
  });

  it('repair a saved key table: reserved keys out, a control left with nothing gets its default, two keys at most', () => {
    const fixed = parseBindings({ left: ['escape', 'enter'], right: ['l', 'p', 'o'], jump: 'space', bogus: ['x'], shoot: [] });
    expect(fixed.left).toEqual(DEFAULT_BINDINGS.left);
    expect(fixed.right).toEqual(['l', 'p']);
    expect(fixed.jump).toEqual(DEFAULT_BINDINGS.jump);
    expect(fixed.shoot).toEqual(DEFAULT_BINDINGS.shoot);
  });

  it('save and come back through updateSettings', () => {
    const before = getSettings();
    updateSettings({ shake: 0 });
    expect(JSON.parse(storage.getItem(SETTINGS_KEY)!).shake).toBe(0);
    expect(getSettings().shake).toBe(0);
    updateSettings({ shake: before.shake });
  });

  it('give a key to a control, swapping with the control that had it', () => {
    const b = defaultBindings();
    const next = bindKey(b, 'jump', 0, 'c')!; // c was capture's first key, jump gives up space
    expect(next.jump).toEqual(['c']);
    expect(next.capture).toEqual([' ', 'x']); // the swap
    expect(next).not.toBe(b);
    expect(b.jump).toEqual([' ']); // the original is untouched
  });

  it('refuse a reserved key and a key that is the only one of another control', () => {
    const b = defaultBindings();
    expect(bindKey(b, 'jump', 0, 'escape')).toBeNull();
    expect(bindKey(b, 'jump', 0, 'f')).toBeNull();
    // shoot has the single key shift; a second slot on jump cannot take it away
    expect(bindKey(b, 'jump', 1, 'shift')).toBeNull();
    // but a free key is fine for a second slot
    expect(bindKey(b, 'jump', 1, 'k')!.jump).toEqual([' ', 'k']);
  });

  it('let a control keep at least one key when one is removed', () => {
    const b = defaultBindings();
    expect(clearKey(b, 'left', 1).left).toEqual(['a']);
    expect(clearKey(b, 'jump', 0).jump).toEqual([' ']);
  });

  it('write keys the way they are read', () => {
    expect(keyLabel(' ')).toBe('SPAZIO');
    expect(keyLabel('arrowleft')).toBe('←');
    expect(keyLabel('shift')).toBe('SHIFT');
    expect(keyLabel('k')).toBe('K');
    expect(bindableKey('k')).toBe(true);
    expect(bindableKey('arrowup')).toBe(true);
    expect(bindableKey('dead')).toBe(false);
    expect(bindableKey('f5')).toBe(false);
  });
});

describe('the texts on screen', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) return ['node_modules', 'dist', 'src-tauri', 'tests', 'public', 'log', 'exe', 'tools', 'docs'].includes(e.name) || e.name.startsWith('.') ? [] : walk(p);
      return /\.(tsx?)$/.test(e.name) ? [p] : [];
    });

  it('only ask for keys that exist in the Italian table (and so, by its type, in the English one)', () => {
    const missing: string[] = [];
    for (const file of walk('.')) {
      if (/locales\//.test(file)) continue;
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\bt\('([\w.]+)'/g)) {
        if (!(m[1] in italian)) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('give every control a label and every tab a name', () => {
    for (const c of CONTROLS) expect(italian[`options.ctrl.${c}` as keyof typeof italian], c).toBeTruthy();
    for (const tab of ['audio', 'graphics', 'controls', 'language', 'access']) expect(italian[`options.tab.${tab}` as keyof typeof italian], tab).toBeTruthy();
    for (const n of [0, 50, 100]) expect(italian[`options.access.shake${n}` as keyof typeof italian], String(n)).toBeTruthy();
  });
});
