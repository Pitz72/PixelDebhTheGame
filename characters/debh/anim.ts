import {
  ArmPose,
  DebhPose,
  LegPose,
  SHOULDER,
  STAND_GROUND_Y,
  FORE,
  UPPER,
  fk,
  groundLineY,
  ik2,
} from './rig';
import { HeadExpression } from './parts';

/**
 * Procedural animation for Debh. The game tells the animator what she is doing (running, falling,
 * holding an enemy, aiming...) and it returns a pose for the skeleton. Everything is computed from
 * time and speed, so the motion stays smooth at any refresh rate and blends between states.
 */

export interface DebhInput {
  onGround: boolean;
  vx: number;
  vy: number;
  direction: 'left' | 'right';
  jumpCount: number;
  holding: boolean;
  superThrow: boolean;
  speedBoost: boolean;
  /** Milliseconds left of the "I just shot" animation, and the aim direction (screen space, unit vector). */
  shootAnim: number;
  aimX: number;
  aimY: number;
  /** Milliseconds left of the throw / hurt animations. */
  throwAnim: number;
  hurtAnim: number;
  cheer: boolean;
  /** Free-movement level or arena: no gravity, but she still walks (she does not fly or float). */
  zeroG: boolean;
}

export interface DebhOut {
  pose: DebhPose;
  /** Extra rotation of the whole body (somersault, zero-G drift), radians, positive = clockwise. */
  spin: number;
  squashX: number;
  squashY: number;
  /** Rig y of the line that must sit on the hitbox's bottom edge. */
  groundY: number;
}

const THROW_MS = 260;
const LAND_MS = 130;
const FLIP_MS = 460;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => t * t * (3 - 2 * t);

const lerpLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({
  a1: lerp(a.a1, b.a1, t),
  a2: lerp(a.a2, b.a2, t),
  foot: lerp(a.foot, b.foot, t),
});
const lerpArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  a1: lerp(a.a1, b.a1, t),
  a2: lerp(a.a2, b.a2, t),
  hand: b.hand,
});
const lerpPose = (a: DebhPose, b: DebhPose, t: number): DebhPose => ({
  lean: lerp(a.lean, b.lean, t),
  legN: lerpLeg(a.legN, b.legN, t),
  legF: lerpLeg(a.legF, b.legF, t),
  armN: lerpArm(a.armN, b.armN, t),
  armF: lerpArm(a.armF, b.armF, t),
  head: b.head,
  headTilt: lerp(a.headTilt ?? 0, b.headTilt ?? 0, t),
  headDx: lerp(a.headDx ?? 0, b.headDx ?? 0, t),
  headDy: lerp(a.headDy ?? 0, b.headDy ?? 0, t),
  pad: b.pad ?? null,
});

const armTo = (target: [number, number], hand: ArmPose['hand']): ArmPose => ({
  ...ik2(SHOULDER, target, UPPER, FORE),
  hand,
});

// ---------------------------------------------------------------------------
// Pose library
// ---------------------------------------------------------------------------

const STAND_LEGS = { legN: { a1: 4, a2: 0, foot: 0 }, legF: { a1: -5, a2: 0, foot: 0 } };

/** Standing, holding her gamepad like in the logo. */
export const idlePose = (t: number): DebhPose => {
  const breathe = Math.sin(t * 2.1);
  return {
    lean: 2 + breathe * 0.6,
    ...STAND_LEGS,
    armN: armTo([34, 208 + breathe * 2], 'fist'),
    armF: armTo([150, 196 + breathe * 2], 'fist'),
    head: 'smile',
    headDy: breathe * 2.4,
    headTilt: Math.sin(t * 0.7) * 1.2,
    pad: { x: 92, y: 198 + breathe * 2, rotation: -6 },
  };
};

export const runPose = (phase: number, speed: number, boost: boolean): DebhPose => {
  const t = phase * Math.PI * 2;
  const amp = 34 + speed * 9;
  const leg = (ph: number): LegPose => {
    const th = amp * Math.sin(t + ph);
    const swing = Math.max(0, Math.cos(t + ph + 0.35));
    const knee = -(8 + 78 * swing * swing);
    const foot = 16 * Math.max(0, -Math.sin(t + ph + 0.5)) - 12 * Math.max(0, Math.sin(t + ph - 0.6));
    return { a1: th, a2: knee, foot };
  };
  const arm = (ph: number, hand: ArmPose['hand']): ArmPose => ({
    a1: -(40 + speed * 8) * Math.sin(t + ph),
    a2: 62 + 32 * Math.max(0, Math.sin(t + ph)),
    hand,
  });
  return {
    lean: 9 + speed * 7,
    legN: leg(0),
    legF: leg(Math.PI),
    armN: arm(Math.PI, 'fist'),
    armF: arm(0, 'fist'),
    head: boost ? 'grin' : 'smile',
    headDy: 3.5 * Math.cos(2 * t),
    headTilt: -2,
    pad: null,
  };
};

export const JUMP_UP: DebhPose = {
  lean: 8,
  legN: { a1: 58, a2: -98, foot: 22 },
  legF: { a1: 6, a2: -44, foot: 12 },
  armN: { a1: 148, a2: 14, hand: 'open' },
  armF: { a1: 118, a2: 24, hand: 'open' },
  head: 'grin',
  headDy: -3,
  headTilt: -4,
  pad: null,
};

export const JUMP_APEX: DebhPose = {
  lean: 4,
  legN: { a1: 44, a2: -80, foot: 16 },
  legF: { a1: 16, a2: -46, foot: 10 },
  armN: { a1: 104, a2: 18, hand: 'open' },
  armF: { a1: 82, a2: 26, hand: 'open' },
  head: 'smile',
  headTilt: 0,
  pad: null,
};

export const FALL: DebhPose = {
  lean: 3,
  legN: { a1: 14, a2: -22, foot: 6 },
  legF: { a1: -12, a2: -12, foot: 4 },
  armN: { a1: 158, a2: 4, hand: 'open' },
  armF: { a1: -148, a2: -6, hand: 'open' },
  head: 'wow',
  headDy: -4,
  headTilt: 3,
  pad: null,
};

export const LAND: DebhPose = {
  lean: 17,
  legN: { a1: 46, a2: -92, foot: 6 },
  legF: { a1: 28, a2: -72, foot: 4 },
  armN: { a1: 40, a2: 40, hand: 'fist' },
  armF: { a1: 22, a2: 44, hand: 'fist' },
  head: 'effort',
  headDy: 5,
  headTilt: 4,
  pad: null,
};

export const TUCK: DebhPose = {
  lean: 22,
  legN: { a1: 92, a2: -150, foot: 20 },
  legF: { a1: 86, a2: -144, foot: 20 },
  armN: { a1: 70, a2: 100, hand: 'fist' },
  armF: { a1: 56, a2: 104, hand: 'fist' },
  head: 'grin',
  pad: null,
};

export const HURT: DebhPose = {
  lean: -15,
  legN: { a1: 22, a2: -26, foot: 10 },
  legF: { a1: -16, a2: -16, foot: 6 },
  armN: { a1: 128, a2: 18, hand: 'open' },
  armF: { a1: -118, a2: -10, hand: 'open' },
  head: 'ouch',
  headDy: 2,
  headTilt: -8,
  pad: null,
};

export const CARRY: DebhPose = {
  lean: 4,
  legN: STAND_LEGS.legN,
  legF: STAND_LEGS.legF,
  armN: armTo([252, 108], 'fist'),
  armF: armTo([268, 74], 'fist'),
  head: 'effort',
  headTilt: 2,
  pad: null,
};

export const CHEER = (t: number): DebhPose => ({
  lean: -3,
  ...STAND_LEGS,
  armN: armTo([210, -48 + Math.sin(t * 9) * 8], 'thumbsUp'),
  armF: { a1: -24, a2: 66, hand: 'fist' },
  head: 'wink',
  headDy: Math.sin(t * 9) * 3,
  headTilt: -6,
  pad: null,
});

export const throwPose = (t01: number, base: DebhPose): DebhPose => {
  const e = ease(clamp(t01, 0, 1));
  return {
    ...base,
    lean: lerp(-8, 15, e),
    armN: { a1: lerp(-132, 104, e), a2: lerp(46, 6, e), hand: e < 0.55 ? 'fist' : 'open' },
    armF: { a1: lerp(-40, 70, e), a2: 30, hand: 'fist' },
    head: 'effort',
    pad: null,
  };
};

/** Aiming with the gamepad as a blaster: both hands on it, pointing along (ax, ay) (facing-relative). */
export const aimPose = (base: DebhPose, ax: number, ay: number): DebhPose => {
  const len = Math.hypot(ax, ay) || 1;
  const dx = ax / len;
  const dy = ay / len;
  const wrist = fk(SHOULDER, UPPER + FORE - 30, (Math.atan2(dx, dy) * 180) / Math.PI);
  const padPos: [number, number] = [wrist[0] + dx * 55, wrist[1] + dy * 55];
  const back: [number, number] = [padPos[0] - dx * 62, padPos[1] - dy * 62];
  return {
    ...base,
    lean: 5 + clamp(-dy * 6, -4, 4),
    armN: armTo(wrist, 'fist'),
    armF: armTo(back, 'fist'),
    head: 'effort',
    headTilt: clamp(dy * -8, -8, 8),
    pad: { x: padPos[0], y: padPos[1], rotation: (Math.atan2(dy, dx) * 180) / Math.PI },
  };
};

// ---------------------------------------------------------------------------
// Animator
// ---------------------------------------------------------------------------

export class DebhAnimator {
  private current: DebhPose = idlePose(0);
  private runPhase = 0;
  private idleClock = 0;
  private wasOnGround = true;
  private lastVy = 0;
  private landT = 0;
  private lastJumpCount = 0;
  private flipT = 0;
  private squash = 0;
  private blinkIn = 3 + Math.random() * 2;
  private blinkFor = 0;
  private winkIn = 8 + Math.random() * 4;
  private winkFor = 0;
  private groundSmooth = STAND_GROUND_Y;

  reset() {
    this.current = idlePose(0);
    this.flipT = 0;
    this.landT = 0;
    this.squash = 0;
  }

  update(s: DebhInput, dtSec: number): DebhOut {
    const dt = clamp(dtSec, 0.001, 0.05);
    this.idleClock += dt;

    // With free movement (no gravity) she walks in every direction, up and down included, with
    // the same side-view stride; only her speed counts, not which way it points.
    const grounded = s.onGround || s.zeroG;
    const pace = s.zeroG ? Math.hypot(s.vx, s.vy) : Math.abs(s.vx);
    const speed = clamp(pace / 9, 0, 1.6);
    const moving = pace > 0.6;

    // landing / jump bookkeeping
    if (grounded && !this.wasOnGround && this.lastVy > 7) {
      this.landT = LAND_MS / 1000;
      this.squash = clamp(this.lastVy / 22, 0.35, 1);
    }
    if (!grounded && s.jumpCount === 2 && this.lastJumpCount < 2) this.flipT = FLIP_MS / 1000;
    this.wasOnGround = grounded;
    this.lastVy = s.zeroG ? 0 : s.vy;
    this.lastJumpCount = s.jumpCount;
    this.landT = Math.max(0, this.landT - dt);
    this.flipT = Math.max(0, this.flipT - dt);
    this.squash = Math.max(0, this.squash - dt * 5.5);
    if (grounded) this.flipT = 0;

    // base pose from locomotion
    let target: DebhPose;
    let spin = 0;
    const flipping = this.flipT > 0 && !grounded;
    if (!grounded) {
      target = flipping ? TUCK : s.vy < -5 ? JUMP_UP : s.vy < 5 ? JUMP_APEX : FALL;
      if (flipping) spin = (1 - this.flipT / (FLIP_MS / 1000)) * Math.PI * 2 * (s.direction === 'right' ? 1 : 1);
    } else if (this.landT > 0) {
      target = LAND;
    } else if (moving) {
      this.runPhase += (pace * dt * 60) / 150 * (s.speedBoost ? 1.1 : 1);
      target = runPose(this.runPhase, speed, s.speedBoost);
    } else {
      target = idlePose(this.idleClock);
    }

    // actions that take over the arms and the face
    if (s.hurtAnim > 0) {
      target = { ...HURT };
    } else if (s.cheer) {
      target = CHEER(this.idleClock);
    } else if (s.throwAnim > 0) {
      target = throwPose(1 - s.throwAnim / THROW_MS, target);
    } else if (s.shootAnim > 0) {
      const facing = s.direction === 'right' ? 1 : -1;
      target = aimPose(target, s.aimX * facing, s.aimY);
    } else if (s.holding) {
      target = { ...target, armN: CARRY.armN, armF: CARRY.armF, head: CARRY.head, pad: null, lean: target.lean + 2 };
    }

    // blink and the occasional wink, only when the face is otherwise calm
    if (target.head === 'smile') {
      this.blinkIn -= dt;
      this.winkIn -= dt;
      if (this.blinkFor > 0) this.blinkFor -= dt;
      if (this.winkFor > 0) this.winkFor -= dt;
      if (this.blinkIn <= 0) {
        this.blinkIn = 2.6 + Math.random() * 3.4;
        this.blinkFor = 0.11;
      }
      if (this.winkIn <= 0 && grounded && !moving) {
        this.winkIn = 9 + Math.random() * 6;
        this.winkFor = 0.5;
      }
      const expr: HeadExpression = this.winkFor > 0 ? 'wink' : this.blinkFor > 0 ? 'blink' : 'smile';
      target = { ...target, head: expr };
    }

    // smooth towards the target (fast enough to keep the stride crisp)
    const k = grounded && moving ? 1 - Math.exp(-dt * 48) : 1 - Math.exp(-dt * 26);
    this.current = lerpPose(this.current, target, k);

    // squash & stretch
    const stretch = grounded ? 0 : clamp(-s.vy * 0.004, -0.05, 0.07);
    const sy = 1 + stretch - this.squash * 0.15;
    const sx = 1 - stretch * 0.6 + this.squash * 0.1;

    // keep the planted foot on the ground while she walks; in the air hang from the standing reference
    const wantGround = grounded ? groundLineY(this.current) : STAND_GROUND_Y;
    this.groundSmooth += (wantGround - this.groundSmooth) * (1 - Math.exp(-dt * 30));

    return {
      pose: this.current,
      spin,
      squashX: sx,
      squashY: sy,
      groundY: this.groundSmooth,
    };
  }
}

