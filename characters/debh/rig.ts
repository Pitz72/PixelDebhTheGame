import { Container, Graphics, Sprite } from 'pixi.js';
import { C } from './palette';
import { DebhTextures, PartTexture } from './bake';
import { HandKind, HeadExpression, INK } from './parts';

/**
 * Debh as a 2D skeleton. Units are the logo's pixels (head ~290 tall), origin = base of the neck,
 * +x = the way she faces, +y = down. Angles are in degrees: 0 = pointing down, positive = toward +x.
 * The geometry is the one of the intro's approved SideBody rig.
 */

export type P = [number, number];

export const HIP: P = [0, 318];
export const SHOULDER: P = [4, 64];
export const THIGH = 205;
export const SHIN = 195;
export const UPPER = 150;
export const FORE = 140;
/** Distance from the ankle to the sole. */
export const SOLE = 50;
/** Rig y of the sole when the legs are straight: the reference "standing" ground line. */
export const STAND_GROUND_Y = HIP[1] + THIGH + SHIN + SOLE;
/** Rig-space extent used to size her on screen: from the top of the head to the sole. */
export const RIG_TOP = -300;
export const RIG_HEIGHT = STAND_GROUND_Y - RIG_TOP;

const rad = (d: number) => (d * Math.PI) / 180;
export const fk = (o: P, len: number, a: number): P => [o[0] + len * Math.sin(rad(a)), o[1] + len * Math.cos(rad(a))];

/** Two-bone inverse kinematics in the rig's angle convention; the elbow/knee bends downward. */
export const ik2 = (S: P, T: P, l1: number, l2: number): { a1: number; a2: number } => {
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const dist = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const base = Math.atan2(dx, dy);
  const A = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
  const B = Math.acos(Math.min(1, Math.max(-1, (l2 * l2 + dist * dist - l1 * l1) / (2 * l2 * dist))));
  const cand = [1, -1].map(sgn => {
    const a1 = base - sgn * A;
    const fd = base + sgn * B;
    return { a1, a2: fd - a1, ex: S[1] + l1 * Math.cos(a1) };
  });
  const best = cand[0].ex >= cand[1].ex ? cand[0] : cand[1];
  const deg = (r: number) => (r * 180) / Math.PI;
  let a2 = deg(best.a2);
  while (a2 > 180) a2 -= 360;
  while (a2 < -180) a2 += 360;
  return { a1: deg(best.a1), a2 };
};

export interface ArmPose {
  a1: number;
  a2: number;
  hand: HandKind;
}
export interface LegPose {
  a1: number;
  a2: number;
  foot: number;
}
export interface DebhPose {
  /** Torso lean around the hip, degrees, positive = forward. */
  lean: number;
  legN: LegPose;
  legF: LegPose;
  armN: ArmPose;
  armF: ArmPose;
  head: HeadExpression;
  headTilt?: number;
  headDx?: number;
  headDy?: number;
  /** Gamepad held in front of her (rig space), or null. */
  pad?: { x: number; y: number; rotation: number } | null;
}

/** Rig y of the lowest sole: the hip-to-ground distance changes through the stride. */
export const groundLineY = (pose: DebhPose): number => {
  const low = (leg: LegPose) => {
    const K = fk(HIP, THIGH, leg.a1);
    const A = fk(K, SHIN, leg.a1 + leg.a2);
    return A[1] + SOLE;
  };
  return Math.max(low(pose.legN), low(pose.legF));
};

const place = (s: Sprite, part: PartTexture, extraScale = 1): Sprite => {
  s.texture = part.texture;
  s.anchor.set(part.anchorX, part.anchorY);
  s.scale.set(part.unit * extraScale);
  return s;
};

const drawChain = (g: Graphics, pts: P[], widths: number[], fill: string) => {
  g.clear();
  widths.forEach((w, i) => {
    g.moveTo(pts[i][0], pts[i][1]).lineTo(pts[i + 1][0], pts[i + 1][1]).stroke({
      width: w + INK * 2,
      color: C.ink,
      cap: 'round',
      join: 'round',
    });
  });
  widths.forEach((w, i) => {
    g.moveTo(pts[i][0], pts[i][1]).lineTo(pts[i + 1][0], pts[i + 1][1]).stroke({
      width: w,
      color: fill,
      cap: 'round',
      join: 'round',
    });
  });
};

class ArmNode {
  readonly root = new Container();
  private g = new Graphics();
  private hand = new Sprite();
  private sleeve = new Sprite();
  constructor(private tex: DebhTextures, private far: boolean) {
    // the sleeve sits on top of the arm, the hand on top of the forearm
    this.root.addChild(this.g, this.hand, this.sleeve);
  }
  set(arm: ArmPose) {
    const E = fk(SHOULDER, UPPER, arm.a1);
    const W = fk(E, FORE, arm.a1 + arm.a2);
    drawChain(this.g, [SHOULDER, E, W], [44, 38], this.far ? C.skinShade : C.skin);
    place(this.hand, this.tex.hand[arm.hand + (this.far ? 'Dark' : '')], 1.15);
    this.hand.position.set(W[0], W[1]);
    this.hand.rotation = rad(-(arm.a1 + arm.a2));
    place(this.sleeve, this.far ? this.tex.sleeveDark : this.tex.sleeve);
    this.sleeve.position.set(SHOULDER[0], SHOULDER[1]);
    this.sleeve.rotation = rad(-arm.a1);
  }
  wrist(arm: ArmPose): P {
    const E = fk(SHOULDER, UPPER, arm.a1);
    return fk(E, FORE, arm.a1 + arm.a2);
  }
}

class LegNode {
  readonly root = new Container();
  private g = new Graphics();
  private shoe = new Sprite();
  private shorts = new Sprite();
  constructor(private tex: DebhTextures, private far: boolean) {
    this.root.addChild(this.g, this.shoe, this.shorts);
  }
  set(leg: LegPose) {
    const K = fk(HIP, THIGH, leg.a1);
    const A = fk(K, SHIN, leg.a1 + leg.a2);
    drawChain(this.g, [HIP, K, A], [72, 54], this.far ? C.skinShade : C.skin);
    place(this.shoe, this.far ? this.tex.shoeDark : this.tex.shoe);
    this.shoe.position.set(A[0], A[1]);
    this.shoe.rotation = rad(leg.foot);
    place(this.shorts, this.far ? this.tex.shortsDark : this.tex.shorts);
    this.shorts.position.set(HIP[0], HIP[1]);
    this.shorts.rotation = rad(-leg.a1);
  }
}

export class DebhRig {
  /** Origin = base of the neck. Scale and position it from outside. */
  readonly root = new Container();
  private farArm: ArmNode;
  private nearArm: ArmNode;
  private legF: LegNode;
  private legN: LegNode;
  private farLayer = new Container();
  private upper = new Container();
  private torso = new Sprite();
  private head = new Sprite();
  private pad = new Sprite();

  constructor(private tex: DebhTextures) {
    this.farArm = new ArmNode(tex, true);
    this.nearArm = new ArmNode(tex, false);
    this.legF = new LegNode(tex, true);
    this.legN = new LegNode(tex, false);

    this.farLayer.pivot.set(HIP[0], HIP[1]);
    this.farLayer.position.set(HIP[0], HIP[1]);
    this.farLayer.addChild(this.farArm.root);

    this.upper.pivot.set(HIP[0], HIP[1]);
    this.upper.position.set(HIP[0], HIP[1]);
    place(this.torso, tex.torso);
    place(this.pad, tex.pad);
    this.pad.visible = false;
    this.upper.addChild(this.torso, this.head, this.pad, this.nearArm.root);

    this.root.addChild(this.farLayer, this.legF.root, this.legN.root, this.upper);
  }

  apply(pose: DebhPose) {
    const lean = rad(pose.lean);
    this.upper.rotation = lean;
    this.farLayer.rotation = lean;
    this.farArm.set(pose.armF);
    this.nearArm.set(pose.armN);
    this.legF.set(pose.legF);
    this.legN.set(pose.legN);

    place(this.head, this.tex.head[pose.head]);
    this.head.position.set(4 + (pose.headDx ?? 0), -2 + (pose.headDy ?? 0));
    this.head.rotation = rad(pose.headTilt ?? 0);

    if (pose.pad) {
      this.pad.visible = true;
      this.pad.position.set(pose.pad.x, pose.pad.y);
      this.pad.rotation = rad(pose.pad.rotation);
    } else {
      this.pad.visible = false;
    }
  }

  /** Where the near/far wrists end up in rig space (before the torso lean), for IK-built poses. */
  wrist(arm: ArmPose): P {
    return this.nearArm.wrist(arm);
  }
}
