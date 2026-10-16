import { Container, Sprite, Texture } from 'pixi.js';
import { Particle } from '../types';

const POOL_SIZE = 1600;

interface FxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  maxLife: number;
  size: number;
  growth: number;
  color: number;
  alpha: number;
}

/**
 * GPU particles: one pooled additive sprite per particle.
 *  - engine particles (gameplay-relevant effects) are drawn from the simulation state every frame;
 *  - renderer-only particles (ambient motes, trails, sparkles) live here and cost the simulation nothing.
 */
export class ParticleLayer {
  readonly root = new Container();
  private sprites: Sprite[] = [];
  private fx: FxParticle[] = [];
  private used = 0;
  private maxFx: number;

  constructor(private glow: Texture, maxFx = 900) {
    this.maxFx = maxFx;
    for (let i = 0; i < POOL_SIZE; i++) {
      const s = new Sprite(glow);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.visible = false;
      this.sprites.push(s);
      this.root.addChild(s);
    }
  }

  setBudget(maxFx: number): void {
    this.maxFx = maxFx;
    if (this.fx.length > maxFx) this.fx.length = maxFx;
  }

  emit(p: Partial<FxParticle> & { x: number; y: number; color: number }): void {
    if (this.fx.length >= this.maxFx) return;
    this.fx.push({
      x: p.x,
      y: p.y,
      vx: p.vx ?? 0,
      vy: p.vy ?? 0,
      gravity: p.gravity ?? 0,
      life: p.life ?? 600,
      maxLife: p.life ?? 600,
      size: p.size ?? 6,
      growth: p.growth ?? 0,
      color: p.color,
      alpha: p.alpha ?? 0.9,
    });
  }

  /** Radial burst helper. */
  burst(x: number, y: number, color: number, count: number, speed = 4, life = 500, size = 6): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravity: 0.05, life: life * (0.6 + Math.random() * 0.6), size, growth: -0.004, color });
    }
  }

  get count(): number {
    return this.used;
  }

  /**
   * @param engine   simulation particles
   * @param alpha    interpolation factor between the last two simulation steps
   * @param dtFrames elapsed time in 60 Hz frames (for the renderer-only particles)
   */
  update(engine: Particle[], alpha: number, dtFrames: number, camX: number, camY: number, margin = 80): void {
    let i = 0;
    const minX = camX - margin;
    const maxX = camX + 1920 + margin;
    const minY = camY - margin;
    const maxY = camY + 1080 + margin;

    for (const p of engine) {
      if (i >= POOL_SIZE) break;
      const x = p.x + p.vx * alpha;
      const y = p.y + p.vy * alpha;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      const s = this.sprites[i++];
      s.visible = true;
      s.position.set(x, y);
      s.scale.set((p.size * 3.2) / 128);
      s.tint = parseColor(p.color);
      s.alpha = Math.max(0, Math.min(1, p.life * 1.2));
    }

    const dtMs = dtFrames * 16.667;
    for (let k = this.fx.length - 1; k >= 0; k--) {
      const f = this.fx[k];
      f.life -= dtMs;
      if (f.life <= 0) {
        this.fx[k] = this.fx[this.fx.length - 1];
        this.fx.pop();
        continue;
      }
      f.vy += f.gravity * dtFrames;
      f.x += f.vx * dtFrames;
      f.y += f.vy * dtFrames;
      f.size = Math.max(0.5, f.size + f.growth * dtMs);
      if (i >= POOL_SIZE) continue;
      if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) continue;
      const s = this.sprites[i++];
      const t = f.life / f.maxLife;
      s.visible = true;
      s.position.set(f.x, f.y);
      s.scale.set((f.size * 3.2) / 128);
      s.tint = f.color;
      s.alpha = f.alpha * Math.min(1, t * 1.6);
    }

    for (let k = i; k < this.used; k++) this.sprites[k].visible = false;
    this.used = i;
  }
}

const colorCache = new Map<string, number>();
export function parseColor(css: string): number {
  let n = colorCache.get(css);
  if (n !== undefined) return n;
  if (css.startsWith('#')) {
    n = parseInt(css.length === 4 ? css.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3').slice(1) : css.slice(1), 16);
  } else {
    n = 0xffffff;
  }
  colorCache.set(css, n);
  return n;
}
