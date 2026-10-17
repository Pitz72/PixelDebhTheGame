import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Boss } from '../types';
import type { PartTexture } from '../characters/debh/bake';
import type { FrogTextures, EyeTextures } from '../components/bosses/bakeBosses';
import { FROG_BOX, FROG_JOINTS } from '../components/bosses/FrogArt';
import { EYE_BOX, HEN_FLOOR, HEN_RANGE, HEN_SCALE, HEN_STEPS, PUPIL_WINDOW } from '../components/bosses/ChickenEyeArt';
import { eyePose, frogPhaseStep, frogPose } from '../components/bosses/bossPoses';

/**
 * The art of a boss as Pixi objects. `body` is the normal picture and `flash` the same picture drawn
 * additively, which the view shows for a moment when the boss is hit. Both are drawn in art units
 * around the middle of the art box, so the view only has to scale them to the boss's hitbox.
 */
export interface BossArt {
  /** Edge of the (square) art box, in art units. */
  readonly box: number;
  readonly body: Container;
  readonly flash: Container;
  update(boss: Boss, nowMs: number, frames: number, throwAmount: number): void;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

function put(sprite: Sprite, part: PartTexture, additive: boolean): Sprite {
  sprite.texture = part.texture;
  sprite.anchor.set(part.anchorX, part.anchorY);
  sprite.scale.set(part.unit);
  if (additive) sprite.blendMode = 'add';
  return sprite;
}

/** The frog: a sphere with two arms and two legs behind it that swing with her speed. */
class FrogLimbs {
  readonly root = new Container();
  private armL = new Sprite();
  private armR = new Sprite();
  private legL = new Sprite();
  private legR = new Sprite();

  constructor(tex: FrogTextures, additive: boolean) {
    const holder = new Container();
    holder.position.set(-FROG_BOX / 2, -FROG_BOX / 2);
    const body = put(new Sprite(), tex.body, additive);
    put(this.armL, tex.arm, additive).position.set(FROG_JOINTS.shoulderL.x, FROG_JOINTS.shoulderL.y);
    put(this.armR, tex.arm, additive).position.set(FROG_JOINTS.shoulderR.x, FROG_JOINTS.shoulderR.y);
    put(this.legL, tex.leg, additive).position.set(FROG_JOINTS.hipL.x, FROG_JOINTS.hipL.y);
    put(this.legR, tex.leg, additive).position.set(FROG_JOINTS.hipR.x, FROG_JOINTS.hipR.y);
    // the right limbs are mirrored: the same turn looks the other way round
    this.armR.scale.x *= -1;
    this.legR.scale.x *= -1;
    holder.addChild(this.legL, this.legR, this.armL, this.armR, body);
    this.root.addChild(holder);
  }

  pose(p: { armL: number; armR: number; legL: number; legR: number }) {
    this.armL.rotation = rad(p.armL);
    this.armR.rotation = -rad(p.armR);
    this.legL.rotation = rad(p.legL);
    this.legR.rotation = -rad(p.legR);
  }
}

export class FrogArt implements BossArt {
  readonly box = FROG_BOX;
  private main: FrogLimbs;
  private glow: FrogLimbs;
  private phase = 0;

  constructor(tex: FrogTextures) {
    this.main = new FrogLimbs(tex, false);
    this.glow = new FrogLimbs(tex, true);
  }

  get body() {
    return this.main.root;
  }
  get flash() {
    return this.glow.root;
  }

  update(boss: Boss, _now: number, frames: number, throwAmount: number) {
    this.phase += frogPhaseStep(boss.vx, boss.vy, frames);
    const pose = frogPose(this.phase, Math.hypot(boss.vx, boss.vy), throwAmount);
    this.main.pose(pose);
    this.glow.pose(pose);
  }
}

/** LeGallineNellOcchi: the eyeball, and a hen that walks about in the pupil (she is only seen inside it). */
class EyeLayers {
  readonly root = new Container();
  private eye = new Sprite();
  private hen = new Sprite();
  private mask = new Graphics();
  private open: PartTexture;
  private shut: PartTexture;
  private frames: PartTexture[];

  constructor(tex: EyeTextures, private additive: boolean) {
    this.open = tex.eye;
    this.shut = tex.eyeBlink;
    this.frames = tex.hen;
    const holder = new Container();
    holder.position.set(-EYE_BOX / 2, -EYE_BOX / 2);
    put(this.eye, this.open, additive);
    this.mask.circle(PUPIL_WINDOW.x, PUPIL_WINDOW.y, PUPIL_WINDOW.r).fill(0xffffff);
    this.hen.mask = this.mask;
    this.pose(0);
    holder.addChild(this.eye, this.mask, this.hen);
    this.root.addChild(holder);
  }

  pose(nowMs: number) {
    const p = eyePose(nowMs);
    this.eye.texture = (p.blink ? this.shut : this.open).texture;
    this.hen.visible = !p.blink;
    const s = Math.max(-1, Math.min(1, p.step));
    const frame = this.frames[Math.round(((s + 1) / 2) * (HEN_STEPS.length - 1))];
    put(this.hen, frame, this.additive);
    // she faces right in the drawing; the unit and her size come from the baked piece
    this.hen.scale.set(frame.unit * HEN_SCALE * (p.flip ? -1 : 1), frame.unit * HEN_SCALE);
    this.hen.position.set(HEN_FLOOR.x + p.henX * HEN_RANGE, HEN_FLOOR.y + Math.abs(p.step) * -1.6);
  }
}

export class EyeArt implements BossArt {
  readonly box = EYE_BOX;
  private main: EyeLayers;
  private glow: EyeLayers;

  constructor(tex: EyeTextures) {
    this.main = new EyeLayers(tex, false);
    this.glow = new EyeLayers(tex, true);
  }

  get body() {
    return this.main.root;
  }
  get flash() {
    return this.glow.root;
  }

  update(_boss: Boss, nowMs: number) {
    this.main.pose(nowMs);
    this.glow.pose(nowMs);
  }
}

/** Bosses that are one picture (CapocciaNelBuio). */
export class SpriteArt implements BossArt {
  readonly box: number;
  readonly body = new Container();
  readonly flash = new Container();

  constructor(texture: Texture) {
    this.box = texture.width;
    const a = new Sprite(texture);
    const b = new Sprite(texture);
    a.anchor.set(0.5);
    b.anchor.set(0.5);
    b.blendMode = 'add';
    this.body.addChild(a);
    this.flash.addChild(b);
  }

  update() {}
}
