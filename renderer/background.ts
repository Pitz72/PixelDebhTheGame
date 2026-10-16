import { Container, Sprite, TilingSprite } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { MusicTheme } from '../types';
import { PALETTES } from './palette';
import { TextureSet } from './textures';

/** Layered parallax backdrop in screen space (it sits under the world container). */
export class Background {
  readonly root = new Container();
  private theme: MusicTheme | null = null;

  private sky: Sprite;
  private starsFar: TilingSprite;
  private sun: Sprite;
  private mountains: TilingSprite;
  private skyline: TilingSprite;
  private skylineLights: TilingSprite;
  private fog: TilingSprite;
  private starsNear: TilingSprite;

  constructor(private textures: TextureSet) {
    const t = textures.themes.adventure;
    this.sky = new Sprite(t.sky);
    this.sky.width = GAME_WIDTH;
    this.sky.height = GAME_HEIGHT;

    this.starsFar = new TilingSprite({ texture: t.starsFar, width: GAME_WIDTH + 8, height: GAME_HEIGHT + 8 });
    this.starsFar.alpha = 0.5;

    this.sun = new Sprite(t.sun);
    this.sun.anchor.set(0.5);
    this.sun.position.set(1420, 420);

    this.mountains = new TilingSprite({ texture: t.mountains, width: GAME_WIDTH + 8, height: 340 });
    this.mountains.position.set(0, GAME_HEIGHT - 112 - 340 + 20);

    this.fog = new TilingSprite({ texture: t.fog, width: GAME_WIDTH + 8, height: 256 });
    this.fog.position.set(0, GAME_HEIGHT - 256);
    this.fog.blendMode = 'add';

    this.skyline = new TilingSprite({ texture: t.skyline, width: GAME_WIDTH + 8, height: 240 });
    this.skyline.position.set(0, GAME_HEIGHT - 240);

    this.skylineLights = new TilingSprite({ texture: t.skylineLights, width: GAME_WIDTH + 8, height: 240 });
    this.skylineLights.position.set(0, GAME_HEIGHT - 240);
    this.skylineLights.blendMode = 'add';

    this.starsNear = new TilingSprite({ texture: t.starsNear, width: GAME_WIDTH + 8, height: GAME_HEIGHT + 8 });
    this.starsNear.blendMode = 'add';

    this.root.addChild(
      this.sky,
      this.starsFar,
      this.sun,
      this.mountains,
      this.fog,
      this.skyline,
      this.skylineLights,
      this.starsNear
    );
  }

  setTheme(theme: MusicTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    const t = this.textures.themes[theme];
    this.sky.texture = t.sky;
    this.starsFar.texture = t.starsFar;
    this.sun.texture = t.sun;
    this.mountains.texture = t.mountains;
    this.fog.texture = t.fog;
    this.skyline.texture = t.skyline;
    this.skylineLights.texture = t.skylineLights;
    this.starsNear.texture = t.starsNear;
    this.fog.tint = PALETTES[theme].neonHex;
  }

  update(camX: number, camY: number, timeMs: number): void {
    const t = timeMs / 1000;
    // stars drift with the camera on both axes, the city only horizontally (it is anchored to the ground)
    this.starsFar.tilePosition.set(-camX * 0.05, -camY * 0.05);
    this.starsFar.alpha = 0.42 + Math.sin(t * 0.9) * 0.1;
    this.sun.position.set(1420 - camX * 0.015, 420 - camY * 0.01);
    const pulse = 1 + Math.sin(t * 0.6) * 0.012;
    this.sun.scale.set(pulse);
    this.mountains.tilePosition.x = -camX * 0.14;
    this.fog.tilePosition.x = -camX * 0.2 + t * 14;
    this.fog.alpha = 0.55 + Math.sin(t * 0.4) * 0.15;
    this.skyline.tilePosition.x = -camX * 0.28;
    this.skylineLights.tilePosition.x = -camX * 0.28;
    this.skylineLights.alpha = 0.6 + Math.sin(t * 1.7) * 0.15 + Math.sin(t * 5.3) * 0.05;
    this.starsNear.tilePosition.set(-camX * 0.4, -camY * 0.4);
    this.starsNear.alpha = 0.55 + Math.sin(t * 1.3 + 1) * 0.2;
  }

  /** The Zero-G boss arena uses a plain dark vortex instead of the city. */
  setArena(on: boolean): void {
    this.sun.visible = !on;
    this.mountains.visible = !on;
    this.skyline.visible = !on;
    this.skylineLights.visible = !on;
    this.fog.visible = !on;
  }
}
