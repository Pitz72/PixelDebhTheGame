import { Container, Graphics, Renderer, RenderTexture, Sprite, Texture } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

const MAX_LIGHTS = 72;
/** The light map is rendered at half size: lights are soft, so nobody can tell. */
const LIGHT_SCALE = 0.5;

/**
 * 2D dynamic lighting. An ambient colour fills a small render texture, every light adds a soft
 * radial sprite to it, and the result is multiplied over the scene. Where there is no light the
 * scene is tinted/darkened by the ambient colour; where there is a light it returns to full colour.
 */
export class Lighting {
  readonly sprite: Sprite;
  private rt: RenderTexture;
  private root = new Container();
  private ambient = new Graphics();
  private lights: Sprite[] = [];
  private used = 0;
  private ambientColor = 0xffffff;

  constructor(private lightTexture: Texture) {
    this.rt = RenderTexture.create({
      width: Math.round(GAME_WIDTH * LIGHT_SCALE),
      height: Math.round(GAME_HEIGHT * LIGHT_SCALE),
      resolution: 1,
    });
    this.root.addChild(this.ambient);
    this.root.scale.set(LIGHT_SCALE);
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const s = new Sprite(lightTexture);
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.visible = false;
      this.lights.push(s);
      this.root.addChild(s);
    }
    this.sprite = new Sprite(this.rt);
    this.sprite.scale.set(1 / LIGHT_SCALE);
    this.sprite.blendMode = 'multiply';
  }

  setAmbient(color: number): void {
    if (color === this.ambientColor) return;
    this.ambientColor = color;
    this.ambient.clear();
    this.ambient.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(color);
  }

  begin(): void {
    this.used = 0;
  }

  /** x / y are screen coordinates (world position minus camera). */
  add(x: number, y: number, radius: number, color: number, intensity = 1): void {
    if (this.used >= MAX_LIGHTS) return;
    if (x < -radius || x > GAME_WIDTH + radius || y < -radius || y > GAME_HEIGHT + radius) return;
    const s = this.lights[this.used++];
    s.visible = true;
    s.position.set(x, y);
    s.scale.set((radius * 2) / this.lightTexture.width);
    s.tint = color;
    s.alpha = Math.min(1, intensity);
  }

  render(renderer: Renderer): void {
    for (let i = this.used; i < MAX_LIGHTS; i++) this.lights[i].visible = false;
    renderer.render({ container: this.root, target: this.rt, clear: true });
  }

  destroy(): void {
    this.sprite.destroy();
    this.root.destroy({ children: true });
    this.rt.destroy(true);
  }
}
