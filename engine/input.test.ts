import { describe, it, expect } from 'vitest';
import { InputController } from './input';

describe('InputController (audit H1, H2)', () => {
  it('ignores key auto-repeat for jump and capture', () => {
    const input = new InputController();
    input.keyDown({ key: ' ', code: 'Space' });
    input.keyDown({ key: ' ', code: 'Space', repeat: true });
    input.keyDown({ key: ' ', code: 'Space', repeat: true });
    input.keyDown({ key: 'c', code: 'KeyC' });
    input.keyDown({ key: 'c', code: 'KeyC', repeat: true });
    expect(input.drainActions()).toEqual(['jump', 'capture']);
  });

  it('queues a jumpRelease when Space is let go', () => {
    const input = new InputController();
    input.keyDown({ key: ' ', code: 'Space' });
    input.drainActions();
    input.keyUp({ key: ' ', code: 'Space' });
    expect(input.drainActions()).toEqual(['jumpRelease']);
  });

  it('reset() clears held keys, as on window blur', () => {
    const input = new InputController();
    input.keyDown({ key: 'd', code: 'KeyD' });
    input.keyDown({ key: 'Shift', code: 'ShiftLeft' });
    expect(input.state().right).toBe(true);
    expect(input.state().shoot).toBe(true);
    input.reset();
    expect(input.state()).toEqual({ left: false, right: false, up: false, down: false, shoot: false });
    expect(input.drainActions()).toEqual([]);
  });

  it('treats the upper-case letters produced while Shift is held as the same key', () => {
    const input = new InputController();
    input.keyDown({ key: 'D', code: 'KeyD' });
    expect(input.state().right).toBe(true);
    input.keyUp({ key: 'd', code: 'KeyD' });
    expect(input.state().right).toBe(false);
  });

  it('maps both WASD and arrows', () => {
    const input = new InputController();
    input.keyDown({ key: 'ArrowLeft', code: 'ArrowLeft' });
    input.keyDown({ key: 'w', code: 'KeyW' });
    expect(input.state()).toMatchObject({ left: true, up: true, right: false, down: false });
  });
});
