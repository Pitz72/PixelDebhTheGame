// The app ships with a strict Content-Security-Policy (no 'unsafe-eval'). Pixi normally compiles
// uniform/shader sync code with `new Function`; this module swaps in CSP-safe implementations.
import 'pixi.js/unsafe-eval';
import { Application, Container, Graphics, Rectangle, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { AdvancedBloomFilter } from 'pixi-filters';
import { Boss, Enemy, Item, ItemType, Platform, Projectile, PlayerProjectile, Player, Spring } from '../types';
import { Frame } from '../engine/frame';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { buildTextures, TextureSet } from './textures';
import { BossArt, FrogArt, EyeArt, SpriteArt } from './bossRigs';
import { bakeDebh, DebhTextures } from '../characters/debh/bake';
import { DebhRig, RIG_HEIGHT, STAND_GROUND_Y, HIP } from '../characters/debh/rig';
import { DebhAnimator } from '../characters/debh/anim';
import { PALETTES, ThemePalette } from './palette';
import { Background } from './background';
import { Lighting } from './lighting';
import { ParticleLayer, parseColor } from './particles';

export type Quality = 'high' | 'low';

export interface RendererOptions {
  quality: Quality;
  /** Drop to low quality by itself when the frame rate cannot keep up. */
  autoQuality?: boolean;
  onQualityChange?: (quality: Quality, automatic: boolean) => void;
}

const ITEM_COLOR: Record<ItemType, number> = {
  joystick: 0xff7043,
  floppy: 0x448aff,
  cartridge: 0xffab40,
  cassette: 0xff7043,
  token: 0xffd54f,
  atari2600: 0xd9954a,
  amiga500: 0xffe0b2,
  crt: 0x00e5ff,
  cdrom: 0x80deea,
  nes: 0xe53935,
  sega: 0x42a5f5,
  'speed-boost': 0xffea00,
  shield: 0x00e5ff,
  'super-throw': 0xff6d00,
};

const ENEMY_COLOR: Record<string, number> = {
  base: 0x00e676,
  jumper: 0xff5252,
  flyer: 0x00e5ff,
  bomber: 0xff9100,
  phaser: 0xb388ff,
};

const BOSS_COLOR: Record<string, number> = { frog: 0x66bb6a, chickenEye: 0xff7043, shadowHead: 0xff1744 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ix = (o: { x: number; prevX?: number }, a: number) => (o.prevX === undefined ? o.x : o.prevX + (o.x - o.prevX) * a);
const iy = (o: { y: number; prevY?: number }, a: number) => (o.prevY === undefined ? o.y : o.prevY + (o.y - o.prevY) * a);

/** Little helper: a sprite sized in world pixels. */
const sized = (texture: Texture, w: number, h: number): Sprite => {
  const s = new Sprite(texture);
  s.anchor.set(0.5);
  s.width = w;
  s.height = h;
  return s;
};

const glowSprite = (glow: Texture, size: number, color: number): Sprite => {
  const s = new Sprite(glow);
  s.anchor.set(0.5);
  s.width = size;
  s.height = size;
  s.tint = color;
  s.blendMode = 'add';
  return s;
};

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

class PlatformView {
  readonly root = new Container();
  constructor(p: Platform, tex: TextureSet, pal: ThemePalette, themeTex: TextureSet['themes']['adventure']) {
    const { width: w, height: h } = p;
    const body = new Sprite(themeTex.platformBody);
    body.width = w;
    body.height = h;
    const truss = new TilingSprite({ texture: themeTex.platformTruss, width: w, height: h });
    truss.alpha = 0.3;
    const rail = new Sprite(Texture.WHITE);
    rail.width = w;
    rail.height = Math.min(4, h);
    rail.tint = pal.railHex;
    const highlight = new Sprite(Texture.WHITE);
    highlight.width = Math.max(0, w - 4);
    highlight.height = 2;
    highlight.position.set(2, Math.min(4, h));
    highlight.alpha = 0.16;
    const frame = new Graphics();
    frame.rect(1, 1, w - 2, h - 2).stroke({ width: 2, color: parseInt(pal.border.slice(1), 16), alpha: 0.9 });
    const glow = new Sprite(themeTex.railGlow);
    glow.width = w + 28;
    glow.height = 46;
    glow.position.set(-14, -42);
    glow.tint = pal.railHex;
    glow.alpha = 0.4;
    glow.blendMode = 'add';
    this.root.addChild(body, truss, highlight, rail, frame, glow);
    if (p.move) {
      // a pair of yellow chevrons says "this one moves", along the way it goes
      const arrows = new Graphics();
      const cy = h / 2 + 2;
      const horizontal = p.move.axis === 'x';
      for (const side of [-1, 1]) {
        const cx = w / 2 + side * Math.min(34, w * 0.28);
        if (horizontal) arrows.poly([cx + side * 7, cy, cx - side * 5, cy - 7, cx - side * 5, cy + 7]);
        else arrows.poly([cx, cy + side * 5, cx - 7, cy - side * 3, cx + 7, cy - side * 3]);
      }
      arrows.fill({ color: 0xffd54f, alpha: 0.9 });
      this.root.addChild(arrows);
    }
    this.root.position.set(p.x, p.y);
    void tex;
  }
}

/**
 * A spring pad: a plate on the floor, a steel coil and a neon-green top. After a bounce the coil squashes, springs past its
 * rest length and settles (`pressed` counts down from SPRING_PRESS_MS).
 */
const SPRING_PRESS_MS = 260;
const SPRING_BASE = 5;
const SPRING_CAP = 7;

class SpringView {
  readonly root = new Container();
  private coil = new Graphics();
  private cap = new Container();
  private glow: Sprite;
  private coilH: number;
  private lastF = -1;

  constructor(s: Spring, tex: TextureSet) {
    const { width: w, height: h } = s;
    this.coilH = h - SPRING_BASE - SPRING_CAP;
    const base = new Graphics();
    base.roundRect(0, h - SPRING_BASE, w, SPRING_BASE, 2).fill(0x263238).stroke({ width: 1.5, color: 0x69f0ae, alpha: 0.9 });
    const capBody = new Graphics();
    capBody.roundRect(0, 0, w, SPRING_CAP, 3).fill(0x1b5e20).stroke({ width: 2, color: 0x69f0ae, alpha: 1 });
    capBody.rect(4, 1.5, w - 8, 1.5).fill({ color: 0xffffff, alpha: 0.5 });
    this.glow = glowSprite(tex.glow, w * 1.7, 0x69f0ae);
    this.glow.position.set(w / 2, SPRING_CAP / 2);
    this.glow.alpha = 0.22;
    this.cap.addChild(this.glow, capBody);
    this.coil.position.set(0, h - SPRING_BASE);
    this.drawCoil(w);
    this.root.addChild(base, this.coil, this.cap);
    this.root.position.set(s.x, s.y);
    this.setStretch(1);
  }

  /** The coil is a zig-zag of steel, drawn once at rest length and squashed by scaling it. */
  private drawCoil(w: number): void {
    const segments = 4; // the coil is only ~14 px tall: more turns than this blur into a block
    const top = -this.coilH;
    const pad = 9;
    this.coil.moveTo(pad, 0);
    for (let i = 1; i <= segments; i++) {
      this.coil.lineTo(i % 2 === 1 ? w - pad : pad, (top * i) / segments);
    }
    // dark steel with a thin lighter core: anything brighter is blown out to white by the bloom
    this.coil.stroke({ width: 4.5, color: 0x455a64, alpha: 1, join: 'round', cap: 'round' });
    this.coil.stroke({ width: 1.8, color: 0x8aa0aa, alpha: 0.85, join: 'round', cap: 'round' });
  }

  private setStretch(f: number): void {
    if (f === this.lastF) return;
    this.lastF = f;
    this.coil.scale.y = f;
    this.cap.position.set(0, this.coilH * (1 - f));
  }

  update(s: Spring): void {
    // 0 -> just bounced; 1 -> settled. Squash, overshoot, settle.
    const u = s.pressed > 0 ? 1 - s.pressed / SPRING_PRESS_MS : 1;
    const f = u >= 1 ? 1 : u < 0.2 ? 1 - (0.55 * u) / 0.2 : u < 0.5 ? 0.45 + (0.75 * (u - 0.2)) / 0.3 : 1.2 - (0.2 * (u - 0.5)) / 0.5;
    this.setStretch(f);
    this.glow.alpha = 0.22 + (s.pressed > 0 ? 0.5 * (s.pressed / SPRING_PRESS_MS) : 0);
  }
}

/** A wall of the labyrinth: dark panel with a neon edge, no glow sprite (there are hundreds). */
class WallView {
  readonly root = new Container();
  constructor(p: Platform, pal: ThemePalette, themeTex: TextureSet['themes']['adventure']) {
    const { width: w, height: h } = p;
    const body = new Sprite(themeTex.platformBody);
    body.width = w;
    body.height = h;
    const truss = new TilingSprite({ texture: themeTex.platformTruss, width: w, height: h });
    truss.alpha = 0.22;
    const edge = new Graphics();
    edge.rect(1.5, 1.5, w - 3, h - 3).stroke({ width: 3, color: parseInt(pal.border.slice(1), 16), alpha: 0.95 });
    const core = new Graphics();
    core.rect(7, 7, Math.max(1, w - 14), Math.max(1, h - 14)).stroke({ width: 1.5, color: pal.railHex, alpha: 0.5 });
    this.root.addChild(body, truss, edge, core);
    this.root.position.set(p.x, p.y);
  }
}

/** The floor of the labyrinth: a dark tile with a faint grid, repeated over the whole level. */
function makeFloorTexture(): Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#05031a';
  g.fillRect(0, 0, size, size);
  g.strokeStyle = 'rgba(0, 229, 255, 0.07)';
  g.lineWidth = 2;
  g.strokeRect(1, 1, size - 2, size - 2);
  g.fillStyle = 'rgba(0, 229, 255, 0.13)';
  g.fillRect(size / 2 - 2, size / 2 - 2, 4, 4);
  return Texture.from(canvas);
}

class ItemView {
  readonly root = new Container();
  private halo: Sprite;
  private sprite: Sprite;
  private phase = Math.random() * 6.28;
  constructor(item: Item, tex: TextureSet) {
    this.halo = glowSprite(tex.glow, item.width * 2.6, ITEM_COLOR[item.type]);
    this.sprite = sized(tex.items[item.type], item.width * 1.25, item.height * 1.25);
    this.root.addChild(this.halo, this.sprite);
    this.root.position.set(item.x + item.width / 2, item.y + item.height / 2);
  }
  update(now: number) {
    const t = now / 1000 + this.phase;
    this.sprite.y = Math.sin(t * 2.6) * 5;
    this.halo.y = this.sprite.y;
    this.halo.alpha = 0.45 + Math.sin(t * 3) * 0.15;
    this.sprite.rotation = Math.sin(t * 1.5) * 0.06;
  }
}

class EnemyView {
  readonly root = new Container();
  private glow: Sprite;
  private body: Sprite;
  private ring: Sprite;
  private stars: Sprite[] = [];
  private phase = Math.random() * 10;
  private spin = 0;
  private bsx: number;
  private bsy: number;
  constructor(e: Enemy, private tex: TextureSet) {
    this.glow = glowSprite(tex.glow, e.width * 2.4, ENEMY_COLOR[e.type] ?? 0xffffff);
    this.body = sized(tex.enemies[`${e.type}:active`] ?? tex.enemies['base:active'], e.width, e.height);
    this.bsx = Math.abs(this.body.scale.x);
    this.bsy = Math.abs(this.body.scale.y);
    this.ring = glowSprite(tex.ring, e.width * 1.5, 0xd500f9);
    this.ring.visible = false;
    for (const c of [0xffea00, 0x00e5ff, 0xff4081]) {
      const s = glowSprite(tex.glow, 14, c);
      s.visible = false;
      this.stars.push(s);
    }
    this.root.addChild(this.glow, this.body, this.ring, ...this.stars);
  }
  update(e: Enemy, a: number, now: number, dtF: number) {
    const x = ix(e, a);
    const y = iy(e, a);
    const captured = e.state === 'captured';
    const stunned = e.state === 'stunned';
    const variant = captured ? 'captured' : stunned ? 'stunned' : 'active';
    this.body.texture = this.tex.enemies[`${e.type}:${variant}`] ?? this.tex.enemies[`${e.type}:active`];
    const dir = e.direction === 'left' ? -1 : 1;
    const flying = e.type === 'flyer' || e.type === 'phaser';
    const sq = flying ? 0 : clamp(-e.vy * 0.01, -0.12, 0.16);
    let bob = 0;
    if (e.type === 'flyer') bob = Math.sin(now / 180 + this.phase) * 3;
    else if (e.type === 'phaser') bob = Math.sin(now / 420 + this.phase) * 6;
    else if (e.onGround && Math.abs(e.vx) > 0.1) bob = -Math.abs(Math.sin(now / 95 + this.phase)) * 2.5;
    // the warning before an attack: Hoppy crouches before he jumps, Bomby swells and flickers before the bomb
    let tele = 0;
    if (e.state === 'active') {
      if (e.type === 'bomber' && e.attackCooldown !== undefined) tele = clamp(1 - e.attackCooldown / 500, 0, 1);
      else if (e.type === 'jumper' && e.jumpCooldown !== undefined && e.onGround) tele = clamp(1 - e.jumpCooldown / 380, 0, 1);
    }
    const teleX = e.type === 'jumper' ? 1 + 0.12 * tele : 1 + 0.09 * tele * (0.6 + 0.4 * Math.sin(now / 36));
    const teleY = e.type === 'jumper' ? 1 - 0.2 * tele : 1 + 0.05 * tele;
    this.body.scale.set(dir * this.bsx * (1 - sq * 0.6) * teleX, this.bsy * (1 + sq) * teleY);
    if (e.state === 'launched') {
      this.spin += dtF * 0.32 * (e.vx >= 0 ? 1 : -1);
      this.body.rotation = this.spin;
    } else {
      this.body.rotation = stunned ? Math.sin(now / 55) * 0.14 : e.type === 'phaser' ? Math.sin(now / 500 + this.phase) * 0.08 : 0;
      this.spin = 0;
    }
    this.root.position.set(x + e.width / 2, y + e.height / 2 + bob);
    this.root.alpha = e.type === 'phaser' ? 0.88 + Math.sin(now / 300 + this.phase) * 0.1 : 1;

    this.glow.tint = captured ? 0xd500f9 : e.state === 'launched' ? (e.isSuperLaunched ? 0xff6d00 : 0x00e5ff) : stunned ? 0xffea00 : ENEMY_COLOR[e.type] ?? 0xffffff;
    this.glow.alpha = (captured || e.state === 'launched' ? 0.75 : 0.32) + Math.sin(now / 250 + this.phase) * 0.08;
    if (tele > 0) {
      this.glow.tint = 0xff3d00;
      this.glow.alpha = Math.min(1, this.glow.alpha + 0.55 * tele);
    }
    this.ring.visible = captured;
    if (captured) {
      this.ring.rotation = now / 500;
      this.ring.alpha = 0.8;
    }
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.visible = stunned;
      if (stunned) {
        const ang = now / 190 + i * 2.094;
        s.position.set(Math.cos(ang) * 20, -e.height / 2 - 8 + Math.sin(ang) * 5);
      }
    }
  }
}

/** On-screen height of Debh (feet to the top of her hair), in game pixels. The hitbox is 90 tall. */
const DEBH_HEIGHT = 122;
const RIG_SCALE = DEBH_HEIGHT / RIG_HEIGHT;

class PlayerView {
  readonly root = new Container();
  private holder = new Container(); // origin = feet, scaled to game pixels, flipped by facing
  private shifted = new Container(); // rig space, shifted so the ground line sits on the feet
  private rig: DebhRig;
  private animator = new DebhAnimator();
  private aura: Sprite;
  private shield: Sprite;
  private handGlow: Sprite;
  cx = 0;
  cy = 0;
  feetY = 0;
  facing = 1;
  /** Where the gamepad / muzzle is, in game pixels relative to the hitbox centre (set while aiming). */
  constructor(tex: TextureSet, debh: DebhTextures) {
    this.rig = new DebhRig(debh);
    this.aura = glowSprite(tex.glow, 200, 0xffea00);
    this.aura.visible = false;
    this.shield = sized(tex.shield, 96, 128);
    this.shield.visible = false;
    this.handGlow = glowSprite(tex.glow, 380, 0xff9e2c); // rig units: it lives inside the scaled holder
    this.handGlow.visible = false;

    this.shifted.addChild(this.rig.root, this.handGlow);
    this.holder.scale.set(RIG_SCALE);
    this.holder.addChild(this.shifted);
    this.root.addChild(this.aura, this.holder, this.shield);
  }

  update(p: Player, a: number, now: number, dtF: number, frame: Frame) {
    const x = ix(p, a);
    const y = iy(p, a);
    this.cx = x + p.width / 2;
    this.cy = y + p.height / 2;
    this.feetY = y + p.height;
    const dir = p.direction === 'left' ? -1 : 1;
    this.facing = dir;

    const out = this.animator.update(
      {
        onGround: p.isOnGround,
        vx: p.vx,
        vy: p.vy,
        direction: p.direction,
        jumpCount: p.jumpCount,
        holding: p.capturedEnemyId !== null,
        superThrow: p.activePowerUp === 'super-throw',
        speedBoost: p.activePowerUp === 'speed-boost',
        shootAnim: p.shootAnim ?? 0,
        aimX: p.aimX ?? 1,
        aimY: p.aimY ?? 0,
        throwAnim: p.throwAnim ?? 0,
        hurtAnim: p.hurtAnim ?? 0,
        cheer: frame.status === 'level-cleared' && !frame.boss && p.isOnGround,
        zeroG: frame.zeroG,
      },
      (dtF * 16.667) / 1000
    );

    this.rig.apply(out.pose);
    this.root.position.set(this.cx, this.feetY);
    // the whole figure (aura and shield too) shrinks about her feet, which sit on the body's bottom
    this.root.scale.set(frame.playerScale);
    this.holder.scale.set(dir * RIG_SCALE * out.squashX, RIG_SCALE * out.squashY);
    // rotate about the hip (somersault), keeping the planted foot where it is
    this.shifted.pivot.set(HIP[0], HIP[1]);
    this.shifted.position.set(HIP[0], HIP[1] - out.groundY);
    this.shifted.rotation = out.spin;
    this.holder.alpha = p.isInvincible && Math.floor(now / 90) % 2 === 0 ? 0.45 : 1;

    const boost = p.activePowerUp === 'speed-boost';
    const power = boost || p.activePowerUp === 'super-throw';
    this.aura.visible = power;
    this.aura.position.set(0, -DEBH_HEIGHT * 0.45);
    if (power) {
      this.aura.tint = boost ? 0xffea00 : 0xff6d00;
      this.aura.alpha = 0.5 + Math.sin(now / 130) * 0.15;
    }

    this.shield.visible = p.hasShield;
    this.shield.position.set(0, -DEBH_HEIGHT * 0.44);
    if (p.hasShield) {
      this.shield.alpha = 0.7 + Math.sin(now / 160) * 0.2;
      this.shield.rotation = now / 1400;
    }

    const holding = p.capturedEnemyId !== null || p.activePowerUp === 'super-throw';
    this.handGlow.visible = holding;
    if (holding) {
      this.handGlow.position.set(250, 96 + out.groundY - STAND_GROUND_Y + 0);
      this.handGlow.alpha = 0.55 + Math.sin(now / 90) * 0.2;
    }
  }
}

class BossView {
  readonly root = new Container();
  private art: BossArt;
  private glow: Sprite;
  private throwAnim = 0;
  constructor(boss: Boss, tex: TextureSet) {
    this.glow = glowSprite(tex.glow, boss.width * 2.1, BOSS_COLOR[boss.type]);
    this.art =
      boss.type === 'frog'
        ? new FrogArt(tex.bosses.frog)
        : boss.type === 'chickenEye'
          ? new EyeArt(tex.bosses.chickenEye)
          : new SpriteArt(tex.bosses.shadowHead);
    this.art.flash.visible = false;
    this.root.addChild(this.glow, this.art.body, this.art.flash);
  }
  update(b: Boss, a: number, now: number, dtF: number) {
    const x = ix(b, a);
    const y = iy(b, a);
    const defeated = b.hp <= 0;
    let bob = 0;
    if (b.type === 'frog') bob = Math.sin(now / 420) * 6;
    else if (b.type === 'chickenEye') bob = Math.sin(now / 700) * 4;
    else bob = Math.sin(now / 520) * 8;
    if (b.isThrowing) this.throwAnim = 1;
    this.throwAnim = Math.max(0, this.throwAnim - dtF * 0.07);
    const sx = 1 + 0.08 * this.throwAnim;
    const sy = 1 - 0.08 * this.throwAnim;
    // before it attacks the frog and the eye swell and brighten (the shadow head fires too fast for a warning)
    const tele = !defeated && b.type !== 'shadowHead' && b.attackCooldown > 0 && b.attackCooldown < 480 ? 1 - b.attackCooldown / 480 : 0;
    const pulse = 1 + 0.05 * tele * (0.6 + 0.4 * Math.sin(now / 40));
    this.art.body.scale.set((b.width / this.art.box) * sx * pulse, (b.height / this.art.box) * sy * pulse);
    this.art.flash.scale.copyFrom(this.art.body.scale);
    this.art.update(b, now, dtF, this.throwAnim);
    this.root.position.set(x + b.width / 2, y + b.height / 2 + bob);
    const opacity = b.opacity ?? 1;
    this.root.alpha = defeated ? 0.55 + Math.sin(now / 45) * 0.45 : opacity;
    this.art.flash.visible = b.isHit || defeated;
    this.art.flash.alpha = defeated ? 0.5 + Math.sin(now / 60) * 0.3 : 0.75;
    this.glow.alpha = Math.min(1, 0.3 + Math.sin(now / 350) * 0.1 + (b.isHit ? 0.4 : 0) + 0.5 * tele);
    // the glow turns orange and then red as the boss gets worse
    this.glow.tint = tele > 0.2 ? 0xffffff : (b.phase ?? 1) >= 3 ? 0xff1744 : (b.phase ?? 1) === 2 ? 0xff9100 : BOSS_COLOR[b.type];
    this.root.rotation = defeated ? Math.sin(now / 33) * 0.03 : 0;
  }
}

interface ShotView {
  root: Container;
  kind: 'bomb' | 'egg' | 'fireball' | 'cdrom' | 'shot';
  sprite: Sprite;
}

// ---------------------------------------------------------------------------
// The renderer
// ---------------------------------------------------------------------------

export class GameRenderer {
  private stage: Container;
  private scene = new Container();
  private world = new Container();
  private overlay = new Container();
  private platformLayer = new Container();
  private decorLayer = new Container();
  private itemLayer = new Container();
  private enemyLayer = new Container();
  private bossLayer = new Container();
  private playerLayer = new Container();
  private projLayer = new Container();
  private shockG = new Graphics();
  private textLayer = new Container();

  private background: Background;
  private lighting: Lighting;
  private particles: ParticleLayer;
  private vignette: Sprite;
  private flash = new Graphics();
  private debugText: Text;
  private bloom: AdvancedBloomFilter;

  private platformViews = new Map<number, { root: Container }>();
  private springViews: SpringView[] = [];
  private floor: TilingSprite | null = null;
  private zoomApplied = 1;
  private itemViews = new Map<number, ItemView>();
  private enemyViews = new Map<number, EnemyView>();
  private projViews = new Map<number, ShotView>();
  private checkpointSprites: Sprite[] = [];
  private goal: { root: Container; sprite: Sprite; rings: Sprite[]; remaining: Text; label: Text; w: number; h: number } | null = null;
  private bossViews: BossView[] = [];
  private player: PlayerView;
  private texts = new Map<number, Text>();

  private levelSerial = -1;
  private pal: ThemePalette = PALETTES.adventure;
  private themeTex: TextureSet['themes']['adventure'];
  private arena = false;
  private flashAlpha = 0;
  /** The player's comfort settings: how much the screen shakes (0..1) and whether the boss-defeat flash shows. */
  private shakeScale = 1;
  private flashesOn = true;
  private bossFlashDone = -1;
  private lastNow = 0;
  private quality: Quality;
  private debug = false;
  private moteClock = 0;
  private runDust = 0;
  private cssScale = 1;
  private dpr = 1;

  // frame statistics
  private statStart = 0;
  private statFrames = 0;
  private statMax = 0;
  private slowWindows = 0;
  private fps = 0;
  private avgMs = 0;
  private cpuAcc = 0;
  private cpuMs = 0;

  private constructor(
    private app: Application,
    private tex: TextureSet,
    debh: DebhTextures,
    private opts: RendererOptions
  ) {
    this.quality = opts.quality;
    this.stage = app.stage;
    this.themeTex = tex.themes.adventure;

    this.background = new Background(tex);
    this.lighting = new Lighting(tex.light);
    this.particles = new ParticleLayer(tex.glow);
    this.player = new PlayerView(tex, debh);

    this.world.addChild(
      this.platformLayer,
      this.decorLayer,
      this.itemLayer,
      this.enemyLayer,
      this.bossLayer,
      this.playerLayer,
      this.projLayer
    );
    this.playerLayer.addChild(this.player.root);
    this.shockG.blendMode = 'add';
    this.overlay.addChild(this.shockG, this.particles.root, this.textLayer);
    this.scene.addChild(this.background.root, this.world, this.lighting.sprite, this.overlay);
    this.scene.filterArea = new Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.bloom = new AdvancedBloomFilter({ threshold: 0.62, bloomScale: 0.55, brightness: 1, blur: 5, quality: 3 });

    this.vignette = new Sprite(tex.vignette);
    this.vignette.width = GAME_WIDTH;
    this.vignette.height = GAME_HEIGHT;

    this.flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0xffffff);
    this.flash.alpha = 0;

    this.debugText = new Text({
      text: '',
      style: { fontFamily: 'monospace', fontSize: 22, fill: '#a5ffb0', stroke: { color: '#000000', width: 4 } },
    });
    this.debugText.position.set(GAME_WIDTH - 20, 150);
    this.debugText.anchor.set(1, 0);
    this.debugText.visible = false;

    this.stage.addChild(this.scene, this.vignette, this.flash, this.debugText);
    this.applyQuality();
  }

  static async create(mount: HTMLElement, opts: RendererOptions): Promise<GameRenderer> {
    const app = new Application();
    await app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      background: 0x04010c,
      antialias: true,
      resolution: 1,
      autoDensity: true,
      powerPreference: 'high-performance',
      preference: 'webgl',
      autoStart: false,
      sharedTicker: false,
    });
    app.ticker.stop();
    app.canvas.style.display = 'block';
    mount.appendChild(app.canvas);
    try {
      await document.fonts.load('900 18px "Orbitron Variable"');
    } catch {
      // the fallback font is fine
    }
    const loadStart = performance.now();
    const [tex, debh] = await Promise.all([buildTextures(), bakeDebh()]);
    (window as unknown as { __pdLoadMs?: number }).__pdLoadMs = Math.round(performance.now() - loadStart);
    return new GameRenderer(app, tex, debh, opts);
  }

  get rendererName(): string {
    return this.app.renderer.name;
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.applyQuality();
    this.applyResolution();
  }

  getQuality(): Quality {
    return this.quality;
  }

  /** What the player chose in the options, which can change while playing. */
  setPreferences(p: { autoQuality: boolean; shake: number; flashes: boolean }): void {
    this.opts.autoQuality = p.autoQuality;
    this.shakeScale = Math.max(0, Math.min(1, p.shake));
    this.flashesOn = p.flashes;
  }

  setDebug(on: boolean): void {
    this.debug = on;
    this.debugText.visible = on;
  }

  /** `cssScale` is how much the page scales the 1920x1080 stage; keeps the canvas sharp on any screen. */
  resize(cssScale: number, dpr: number): void {
    this.cssScale = cssScale;
    this.dpr = dpr;
    this.applyResolution();
  }

  private applyResolution(): void {
    const cap = this.quality === 'high' ? 1.5 : 0.75; // Low also renders fewer pixels, for weak or software GPUs
    const res = clamp(this.cssScale * this.dpr, 0.5, cap);
    if (Math.abs(res - this.app.renderer.resolution) > 0.01) {
      this.app.renderer.resize(GAME_WIDTH, GAME_HEIGHT, res);
    }
  }

  /**
   * The labyrinth zooms in on the player: the whole scene (world, lights, particles) is scaled around
   * the middle of the screen, where the camera keeps the player. The bloom only needs the part of the
   * scene that stays on screen.
   */
  private applyZoom(zoom: number): void {
    if (zoom === this.zoomApplied) return;
    this.zoomApplied = zoom;
    this.scene.pivot.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.scene.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.scene.scale.set(zoom);
    const w = GAME_WIDTH / zoom;
    const h = GAME_HEIGHT / zoom;
    this.scene.filterArea = new Rectangle((GAME_WIDTH - w) / 2, (GAME_HEIGHT - h) / 2, w, h);
  }

  private applyQuality(): void {
    const high = this.quality === 'high';
    this.scene.filters = high ? [this.bloom] : [];
    this.lighting.sprite.visible = high;
    this.particles.setBudget(high ? 900 : 260);
  }

  destroy(): void {
    this.app.destroy({ removeView: true }, { children: true });
  }

  // -------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------

  render(frame: Frame, alpha: number, now: number): void {
    const cpuStart = performance.now();
    const dt = clamp(now - this.lastNow, 0, 50);
    this.lastNow = now;
    const dtF = dt / 16.667;
    this.recordStats(now, dt);

    if (frame.levelSerial !== this.levelSerial) this.buildLevel(frame);

    const camX = frame.prevCameraX + (frame.cameraX - frame.prevCameraX) * alpha;
    const camY = frame.prevCameraY + (frame.cameraY - frame.prevCameraY) * alpha;
    const shake = frame.screenShake > 0.2 ? frame.screenShake * 1.8 * this.shakeScale : 0;
    const shx = shake ? (Math.random() - 0.5) * shake : 0;
    const shy = shake ? (Math.random() - 0.5) * shake : 0;
    this.applyZoom(frame.zoom);
    this.world.position.set(-camX + shx, -camY + shy);
    this.overlay.position.set(-camX + shx, -camY + shy);

    this.background.update(camX, camY, now);
    this.lighting.begin();

    this.syncPlatforms(frame, alpha, camX, camY);
    this.syncSprings(frame);
    this.syncDecor(frame, camX, camY, now, dtF);
    this.syncItems(frame, camX, camY, now);
    this.syncEnemies(frame, alpha, camX, camY, now, dtF);
    this.syncBoss(frame, alpha, camX, camY, now, dtF);
    this.syncPlayer(frame, alpha, camX, camY, now, dtF);
    this.syncProjectiles(frame, alpha, camX, camY);
    this.drawShockwaves(frame, camX, camY);
    this.syncTexts(frame);
    this.ambientFx(frame, camX, camY, dt, now);
    this.particles.update(frame.particles, alpha, dtF, camX, camY);

    // boss defeat: one big white flash
    const bossDown = frame.status === 'level-cleared' && frame.bosses.length > 0 && frame.bosses.every(b => b.hp <= 0);
    if (bossDown && this.bossFlashDone !== frame.levelSerial) {
      this.bossFlashDone = frame.levelSerial;
      this.flashAlpha = this.flashesOn ? 0.9 : 0;
    }
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.0022);
    this.flash.alpha = this.flashAlpha;

    if (this.quality === 'high') this.lighting.render(this.app.renderer);
    this.app.renderer.render({ container: this.stage });
    this.cpuAcc += performance.now() - cpuStart;

    if (this.debug) {
      this.debugText.text =
        `${this.rendererName.toUpperCase()}  ${this.fps} fps  ${this.avgMs.toFixed(1)} ms (max ${this.statMax.toFixed(0)})\n` +
        `cpu ${this.cpuMs.toFixed(2)} ms/frame  quality ${this.quality}  res ${this.app.renderer.resolution.toFixed(2)}  particles ${this.particles.count}\n` +
        `platforms ${this.platformViews.size}  enemies ${this.enemyViews.size}  shots ${this.projViews.size}`;
    }
  }

  // -------------------------------------------------------------------------
  // Level setup
  // -------------------------------------------------------------------------

  private buildLevel(frame: Frame): void {
    this.levelSerial = frame.levelSerial;
    this.pal = PALETTES[frame.theme];
    this.themeTex = this.tex.themes[frame.theme];
    for (const v of this.platformViews.values()) v.root.destroy({ children: true });
    this.platformViews.clear();
    for (const v of this.springViews) v.root.destroy({ children: true });
    this.springViews = [];
    this.floor?.destroy();
    this.floor = null;
    for (const v of this.itemViews.values()) v.root.destroy({ children: true });
    this.itemViews.clear();
    for (const v of this.enemyViews.values()) v.root.destroy({ children: true });
    this.enemyViews.clear();
    for (const v of this.projViews.values()) v.root.destroy({ children: true });
    this.projViews.clear();
    this.checkpointSprites.forEach(s => s.destroy());
    this.checkpointSprites = [];
    this.goal?.root.destroy({ children: true });
    this.goal = null;
    for (const v of this.bossViews) v.root.destroy({ children: true });
    this.bossViews = [];
    for (const t of this.texts.values()) t.destroy();
    this.texts.clear();

    // the dark arena of the last boss alone; the final stage has a set of its own
    this.arena = frame.bosses.length === 1 && frame.bosses[0].type === 'shadowHead';
    this.background.setTheme(frame.theme);
    this.background.setArena(this.arena);
    this.background.setBackdrop(frame.backdrop);
    this.lighting.setAmbient(this.arena ? 0x6a5870 : frame.backdrop === 'vault' ? 0x7a6a98 : frame.maze ? 0x4a4f86 : this.pal.ambient);

    if (frame.maze) {
      this.floor = new TilingSprite({ texture: makeFloorTexture(), width: frame.levelWidth, height: frame.levelHeight });
      this.platformLayer.addChildAt(this.floor, 0);
    }

    if (frame.backdrop === 'vault') {
      // the polished floor of the hall: a band at the bottom she walks about on
      const band = 140;
      this.floor = new TilingSprite({ texture: this.tex.vault.floor, width: frame.levelWidth, height: band });
      this.floor.position.set(0, frame.levelHeight - band);
      this.platformLayer.addChildAt(this.floor, 0);
    }

    for (const s of frame.springs) {
      const view = new SpringView(s, this.tex);
      this.springViews.push(view);
      this.platformLayer.addChild(view.root);
    }

    for (const cp of frame.checkpoints) {
      const s = sized(this.tex.checkpointOff, cp.width, cp.height);
      s.position.set(cp.x + cp.width / 2, cp.y + cp.height / 2);
      this.decorLayer.addChild(s);
      this.checkpointSprites.push(s);
    }

    if (frame.goal) {
      const g = frame.goal;
      const root = new Container();
      root.position.set(g.x, g.y);
      const sprite = sized(this.tex.goalLocked, g.width, g.height);
      sprite.position.set(g.width / 2, g.height / 2);
      const rings = [0, 1].map(i => {
        const r = glowSprite(this.tex.ring, i === 0 ? g.width * 0.62 : g.width * 0.38, i === 0 ? 0x84ffff : 0xffffff);
        r.position.set(g.width / 2, g.height * 0.566);
        r.scale.y *= i === 0 ? 1.7 : 1.7;
        return r;
      });
      const style = { fontFamily: 'Orbitron Variable, Orbitron, sans-serif', fontWeight: '900' as const, fontSize: 13 };
      const remaining = new Text({ text: '', style: { ...style, fill: '#ffeb3b', stroke: { color: '#000000', width: 3 } } });
      remaining.anchor.set(0.5);
      remaining.position.set(g.width / 2, g.height * 0.79);
      remaining.resolution = 3;
      const label = new Text({ text: 'EXIT OPEN', style: { ...style, fontSize: 10, fill: '#00e676', stroke: { color: '#000000', width: 3 } } });
      label.anchor.set(0.5);
      label.position.set(g.width / 2, g.height * 0.12);
      label.resolution = 3;
      root.addChild(sprite, ...rings, remaining, label);
      this.decorLayer.addChild(root);
      this.goal = { root, sprite, rings, remaining, label, w: g.width, h: g.height };
    }

    for (const b of frame.bosses) {
      const view = new BossView(b, this.tex);
      this.bossViews.push(view);
      this.bossLayer.addChild(view.root);
    }
  }

  // -------------------------------------------------------------------------
  // Sync helpers (create on first sight, update every frame, remove when gone)
  // -------------------------------------------------------------------------

  private inView(x: number, y: number, w: number, h: number, camX: number, camY: number, m = 260): boolean {
    return x + w >= camX - m && x <= camX + GAME_WIDTH + m && y + h >= camY - m && y <= camY + GAME_HEIGHT + m;
  }

  private syncSprings(frame: Frame): void {
    for (let i = 0; i < this.springViews.length; i++) {
      const s = frame.springs[i];
      if (s) this.springViews[i].update(s);
    }
  }

  private syncPlatforms(frame: Frame, alpha: number, camX: number, camY: number): void {
    const list = frame.platforms;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      // a moving platform is drawn between its last two simulated positions
      const px = p.move ? ix(p, alpha) : p.x;
      const py = p.move ? iy(p, alpha) : p.y;
      const visible = this.inView(px, py, p.width, p.height + 40, camX, camY, 120);
      let v = this.platformViews.get(i);
      if (visible) {
        if (!v) {
          v = p.wall ? new WallView(p, this.pal, this.themeTex) : new PlatformView(p, this.tex, this.pal, this.themeTex);
          this.platformViews.set(i, v);
          this.platformLayer.addChild(v.root);
        }
        v.root.visible = true;
        if (p.move) v.root.position.set(px, py);
        // rail light: cheap strip lights along visible platforms (a few segments each)
        if (!p.wall && p.width < 1400) {
          const lx = clamp(camX + GAME_WIDTH / 2, px, px + p.width);
          this.lighting.add(lx - camX, py - camY - 6, Math.min(240, 60 + p.width * 0.35), p.move ? 0xffd54f : this.pal.railHex, p.move ? 0.5 : 0.35);
        }
      } else if (v) {
        v.root.visible = false;
      }
    }
  }

  private syncDecor(frame: Frame, camX: number, camY: number, now: number, dtF: number): void {
    frame.checkpoints.forEach((cp, i) => {
      const s = this.checkpointSprites[i];
      if (!s) return;
      s.texture = cp.activated ? this.tex.checkpointOn : this.tex.checkpointOff;
      const lit = cp.activated;
      this.lighting.add(cp.x + cp.width / 2 - camX, cp.y + 20 - camY, lit ? 190 : 90, lit ? 0x00e676 : 0xff9e2c, lit ? 0.85 : 0.35);
      if (lit && Math.random() < 0.06 * dtF) {
        this.particles.emit({ x: cp.x + cp.width / 2 + (Math.random() - 0.5) * 24, y: cp.y + 18, vy: -0.8, vx: (Math.random() - 0.5) * 0.4, life: 900, size: 5, color: 0x69f0ae, alpha: 0.8 });
      }
    });

    const g = this.goal;
    if (g && frame.goal) {
      const open = frame.collectiblesLeft === 0;
      g.sprite.texture = open ? this.tex.goalUnlocked : this.tex.goalLocked;
      g.rings.forEach((r, i) => {
        r.visible = open;
        r.rotation = (now / 1600) * (i === 0 ? 1 : -1.6);
        r.alpha = 0.7;
      });
      g.label.visible = open;
      g.remaining.visible = !open;
      if (!open) g.remaining.text = `-${frame.collectiblesLeft}`;
      const pulse = 1 + Math.sin(now / 220) * 0.12;
      this.lighting.add(
        frame.goal.x + g.w / 2 - camX,
        frame.goal.y + g.h / 2 - camY,
        (open ? 320 : 150) * pulse,
        open ? 0x84ffff : 0xff3d00,
        open ? 1 : 0.55
      );
      if (open && this.inView(frame.goal.x, frame.goal.y, g.w, g.h, camX, camY)) {
        if (Math.random() < 0.5 * dtF) {
          const ang = Math.random() * Math.PI * 2;
          const r = 56 + Math.random() * 20;
          const cx = frame.goal.x + g.w / 2;
          const cy = frame.goal.y + g.h * 0.56;
          this.particles.emit({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * 1.4, vx: -Math.cos(ang) * 1.1, vy: -Math.sin(ang) * 1.5, life: 600, size: 5, color: Math.random() < 0.5 ? 0x84ffff : 0xffffff, alpha: 0.9 });
        }
      }
    }
  }

  private syncItems(frame: Frame, camX: number, camY: number, now: number): void {
    const seen = new Set<number>();
    for (const it of frame.items) {
      seen.add(it.id);
      if (!this.inView(it.x, it.y, it.width, it.height, camX, camY)) {
        this.itemViews.get(it.id)?.root.removeFromParent();
        continue;
      }
      let v = this.itemViews.get(it.id);
      if (!v) {
        v = new ItemView(it, this.tex);
        this.itemViews.set(it.id, v);
      }
      if (!v.root.parent) this.itemLayer.addChild(v.root);
      v.update(now);
      this.lighting.add(it.x + it.width / 2 - camX, it.y + it.height / 2 - camY, 130, ITEM_COLOR[it.type], 0.8);
      if (Math.random() < 0.012) {
        this.particles.emit({ x: it.x + Math.random() * it.width, y: it.y + Math.random() * it.height, vy: -0.5, life: 700, size: 4, color: ITEM_COLOR[it.type], alpha: 0.9 });
      }
    }
    for (const [id, v] of this.itemViews) {
      if (!seen.has(id)) {
        v.root.destroy({ children: true });
        this.itemViews.delete(id);
      }
    }
  }

  private syncEnemies(frame: Frame, a: number, camX: number, camY: number, now: number, dtF: number): void {
    const seen = new Set<number>();
    for (const e of frame.enemies) {
      if (e.state === 'defeated') continue;
      seen.add(e.id);
      const x = ix(e, a);
      const y = iy(e, a);
      if (!this.inView(x, y, e.width, e.height, camX, camY)) {
        this.enemyViews.get(e.id)?.root.removeFromParent();
        continue;
      }
      let v = this.enemyViews.get(e.id);
      if (!v) {
        v = new EnemyView(e, this.tex);
        this.enemyViews.set(e.id, v);
      }
      if (!v.root.parent) this.enemyLayer.addChild(v.root);
      v.update(e, a, now, dtF);
      const hot = e.state === 'launched' || e.state === 'captured';
      this.lighting.add(
        x + e.width / 2 - camX,
        y + e.height / 2 - camY,
        hot ? 190 : 100,
        e.state === 'captured' ? 0xd500f9 : e.state === 'launched' ? (e.isSuperLaunched ? 0xff6d00 : 0x00e5ff) : ENEMY_COLOR[e.type] ?? 0xffffff,
        hot ? 0.9 : 0.5
      );
      if (e.state === 'launched' && Math.random() < 0.9) {
        this.particles.emit({ x: x + e.width / 2, y: y + e.height / 2, vx: -e.vx * 0.05, vy: (Math.random() - 0.5) * 0.6, life: 360, size: 9, growth: -0.01, color: e.isSuperLaunched ? 0xff6d00 : 0x00e5ff, alpha: 0.8 });
      }
    }
    for (const [id, v] of this.enemyViews) {
      if (!seen.has(id)) {
        v.root.destroy({ children: true });
        this.enemyViews.delete(id);
      }
    }
  }

  private syncBoss(frame: Frame, a: number, camX: number, camY: number, now: number, dtF: number): void {
    frame.bosses.forEach((b, i) => {
      const view = this.bossViews[i];
      if (!view) return;
      view.update(b, a, now, dtF);
      const x = ix(b, a) + b.width / 2;
      const y = iy(b, a) + b.height / 2;
      const strength = b.type === 'shadowHead' ? (b.opacity ?? 1) : 1;
      this.lighting.add(x - camX, y - camY, 520, BOSS_COLOR[b.type], 0.8 * strength + (b.isHit ? 0.2 : 0));
      if (b.hp > 0 && Math.random() < 0.35 * dtF * strength) {
        this.particles.emit({ x: x + (Math.random() - 0.5) * b.width * 0.8, y: y + b.height * 0.35, vx: (Math.random() - 0.5) * 0.6, vy: -0.9 - Math.random(), life: 900, size: 7, color: BOSS_COLOR[b.type], alpha: 0.7 });
      }
    });
  }

  private syncPlayer(frame: Frame, a: number, camX: number, camY: number, now: number, dtF: number): void {
    const p = frame.player;
    if (!p.width) return;
    this.player.update(p, a, now, dtF, frame);
    // screen position of the character (game pixels), read by the test tooling
    const probe = ((window as unknown as { __pdPlayer?: { x: number; y: number } }).__pdPlayer ??= { x: 0, y: 0 });
    probe.x = this.player.cx - camX;
    probe.y = this.player.feetY - camY;
    const boost = p.activePowerUp === 'speed-boost';
    const color = boost ? 0xffee58 : p.activePowerUp === 'super-throw' ? 0xff9e2c : p.hasShield ? 0x80deea : 0xfff1dc;
    this.lighting.add(this.player.cx - camX, this.player.cy - camY, 360, color, 0.95);

    // dust while running / landing
    if (p.isOnGround && Math.abs(p.vx) > 3) {
      this.runDust += dtF;
      if (this.runDust > 3.2) {
        this.runDust = 0;
        this.particles.emit({ x: this.player.cx - Math.sign(p.vx) * 10, y: p.y + p.height - 2, vx: -p.vx * 0.06, vy: -0.35, life: 320, size: 6, growth: 0.004, color: 0xcfd8dc, alpha: 0.35 });
      }
    }
  }

  private syncProjectiles(frame: Frame, a: number, camX: number, camY: number): void {
    const seen = new Set<number>();
    const handle = (pr: Projectile | PlayerProjectile, mine: boolean) => {
      const id = mine ? -pr.id : pr.id;
      seen.add(id);
      const x = ix(pr, a);
      const y = iy(pr, a);
      if (!this.inView(x, y, pr.width, pr.height, camX, camY)) {
        this.projViews.get(id)?.root.removeFromParent();
        return;
      }
      const ep = pr as Projectile;
      const kind: ShotView['kind'] = mine ? 'shot' : ep.isBomb ? 'bomb' : ep.isEgg ? 'egg' : ep.isFireball ? 'fireball' : 'cdrom';
      let v = this.projViews.get(id);
      if (!v) {
        const t = this.tex.projectiles[kind];
        const sprite = sized(t, pr.width, kind === 'egg' ? pr.height : pr.height);
        const root = new Container();
        const glowColor = kind === 'fireball' ? 0xff6d00 : kind === 'bomb' ? 0xff9100 : kind === 'egg' ? 0xffe082 : kind === 'cdrom' ? 0x00e5ff : 0xff9e2c;
        root.addChild(glowSprite(this.tex.glow, pr.width * 3.2, glowColor), sprite);
        v = { root, kind, sprite };
        this.projViews.set(id, v);
      }
      if (!v.root.parent) this.projLayer.addChild(v.root);
      const cx = x + pr.width / 2;
      const cy = y + pr.height / 2;
      v.root.position.set(cx, cy);
      const t = this.lastNow / 1000;
      if (v.kind === 'cdrom') v.sprite.rotation = t * 9;
      else if (v.kind === 'bomb') v.sprite.rotation = Math.atan2(pr.vy, pr.vx) * 0.3 + t * 3;
      else if (v.kind === 'egg') v.sprite.rotation = Math.atan2(pr.vy, pr.vx) - Math.PI / 2 + Math.sin(t * 12) * 0.25;
      else if (v.kind === 'fireball') v.sprite.rotation = t * 6;
      else v.sprite.rotation = Math.atan2(pr.vy, pr.vx);
      const lightColor = v.kind === 'fireball' ? 0xff6d00 : v.kind === 'bomb' ? 0xff9100 : v.kind === 'egg' ? 0xffe082 : v.kind === 'cdrom' ? 0x00e5ff : 0xff9e2c;
      this.lighting.add(cx - camX, cy - camY, v.kind === 'fireball' ? 190 : v.kind === 'shot' ? 140 : 100, lightColor, v.kind === 'fireball' ? 0.95 : 0.7);
      if (v.kind === 'fireball' || v.kind === 'shot') {
        this.particles.emit({ x: cx, y: cy, vx: -pr.vx * 0.04, vy: -pr.vy * 0.04, life: 320, size: v.kind === 'fireball' ? 12 : 8, growth: -0.02, color: lightColor, alpha: 0.7 });
      } else if (v.kind === 'bomb' && Math.random() < 0.4) {
        this.particles.emit({ x: cx + 6, y: cy - 10, vy: -0.6, vx: (Math.random() - 0.5) * 0.8, life: 280, size: 4, color: 0xffea00, alpha: 0.9 });
      }
    };
    for (const p of frame.projectiles) handle(p, false);
    for (const p of frame.playerProjectiles) handle(p, true);
    for (const [id, v] of this.projViews) {
      if (!seen.has(id)) {
        v.root.destroy({ children: true });
        this.projViews.delete(id);
      }
    }
  }

  private drawShockwaves(frame: Frame, camX: number, camY: number): void {
    const g = this.shockG;
    g.clear();
    for (const sw of frame.shockwaves) {
      const color = parseColor(sw.color);
      g.circle(sw.x, sw.y, sw.radius).stroke({ width: sw.strokeWidth * 2.4, color, alpha: sw.life * 0.28 });
      g.circle(sw.x, sw.y, sw.radius).stroke({ width: sw.strokeWidth * 0.8, color: 0xffffff, alpha: sw.life * 0.75 });
      this.lighting.add(sw.x - camX, sw.y - camY, sw.radius * 1.9, color, sw.life * 0.9);
    }
  }

  private syncTexts(frame: Frame): void {
    const seen = new Set<number>();
    for (const ft of frame.floatingTexts) {
      seen.add(ft.id);
      let t = this.texts.get(ft.id);
      if (!t) {
        t = new Text({
          text: ft.text,
          style: {
            fontFamily: 'Orbitron Variable, Orbitron, sans-serif',
            fontWeight: '900',
            fontSize: 20,
            letterSpacing: 1.2,
            fill: ft.color,
            stroke: { color: '#090318', width: 5 },
            dropShadow: { color: ft.color, blur: 8, distance: 0, alpha: 0.8 },
          },
        });
        t.anchor.set(0.5);
        t.resolution = 2;
        this.texts.set(ft.id, t);
        this.textLayer.addChild(t);
      }
      t.position.set(ft.x, ft.y);
      t.scale.set(ft.scale);
      t.alpha = clamp(ft.life * 1.4, 0, 1);
    }
    for (const [id, t] of this.texts) {
      if (!seen.has(id)) {
        t.destroy();
        this.texts.delete(id);
      }
    }
  }

  private ambientFx(frame: Frame, camX: number, camY: number, dtMs: number, now: number): void {
    if (this.arena && frame.boss) {
      // vortex of embers around the dark arena
      this.moteClock += dtMs;
      while (this.moteClock > 70) {
        this.moteClock -= 70;
        this.particles.emit({ x: camX + Math.random() * GAME_WIDTH, y: camY + GAME_HEIGHT + 10, vx: (Math.random() - 0.5) * 0.7, vy: -1 - Math.random() * 1.4, life: 2400, size: 5 + Math.random() * 5, color: Math.random() < 0.7 ? 0xff1744 : 0xff6d00, alpha: 0.55 });
      }
      return;
    }
    this.moteClock += dtMs;
    const interval = this.quality === 'high' ? 260 : 700;
    while (this.moteClock > interval) {
      this.moteClock -= interval;
      const c = this.pal.motes[Math.floor(Math.random() * this.pal.motes.length)];
      this.particles.emit({
        x: camX + Math.random() * GAME_WIDTH,
        y: camY + Math.random() * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 0.35 + Math.sin(now / 3000) * 0.1,
        vy: -0.15 - Math.random() * 0.3,
        life: 4200,
        size: 2 + Math.random() * 2.5,
        color: c,
        alpha: 0.4,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Statistics / adaptive quality
  // -------------------------------------------------------------------------

  private recordStats(now: number, dt: number): void {
    if (!this.statStart) this.statStart = now;
    this.statFrames++;
    this.statMax = Math.max(this.statMax, dt);
    if (now - this.statStart >= 1000) {
      const secs = (now - this.statStart) / 1000;
      this.fps = Math.round(this.statFrames / secs);
      this.avgMs = (now - this.statStart) / this.statFrames;
      this.cpuMs = this.cpuAcc / this.statFrames;
      this.cpuAcc = 0;
      (window as unknown as { __pdPerf?: unknown }).__pdPerf = {
        fps: this.fps,
        avgMs: this.avgMs,
        maxMs: this.statMax,
        cpuMs: this.cpuMs,
        quality: this.quality,
        renderer: this.rendererName,
        resolution: this.app.renderer.resolution,
        particles: this.particles.count,
      };
      if (this.opts.autoQuality && this.quality === 'high' && this.fps < 40) {
        this.slowWindows++;
        if (this.slowWindows >= 3) {
          this.slowWindows = 0;
          this.setQuality('low');
          this.opts.onQualityChange?.('low', true);
        }
      } else {
        this.slowWindows = 0;
      }
      this.statStart = now;
      this.statFrames = 0;
      this.statMax = 0;
    }
  }
}
