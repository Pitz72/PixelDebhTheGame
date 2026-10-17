import { Container, Sprite, TilingSprite } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { MusicTheme } from '../types';
import { PALETTES } from './palette';
import { TextureSet } from './textures';
import { ART_SCALE, FAR_H, NEAR_H } from './worldArt';

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

  // the Collector's Vault (the final stage) has a hall of its own instead of the night sky
  private vaultRoot = new Container();
  private vaultShelves: TilingSprite;
  private vaultLights: Sprite[] = [];
  private arenaOn = false;
  private backdrop: 'vault' | null = null;

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

    // the far and near strips are drawn at ART_SCALE times their size, so they stay sharp on a big screen
    this.mountains = new TilingSprite({ texture: t.mountains, width: GAME_WIDTH + 8, height: FAR_H });
    this.mountains.tileScale.set(1 / ART_SCALE);
    this.mountains.position.set(0, GAME_HEIGHT - 112 - FAR_H + 20);

    this.fog = new TilingSprite({ texture: t.fog, width: GAME_WIDTH + 8, height: 256 });
    this.fog.position.set(0, GAME_HEIGHT - 256);
    this.fog.blendMode = 'add';

    this.skyline = new TilingSprite({ texture: t.skyline, width: GAME_WIDTH + 8, height: NEAR_H });
    this.skyline.tileScale.set(1 / ART_SCALE);
    this.skyline.position.set(0, GAME_HEIGHT - NEAR_H);

    this.skylineLights = new TilingSprite({ texture: t.skylineLights, width: GAME_WIDTH + 8, height: NEAR_H });
    this.skylineLights.tileScale.set(1 / ART_SCALE);
    this.skylineLights.position.set(0, GAME_HEIGHT - NEAR_H);
    this.skylineLights.blendMode = 'add';

    this.starsNear = new TilingSprite({ texture: t.starsNear, width: GAME_WIDTH + 8, height: GAME_HEIGHT + 8 });
    this.starsNear.blendMode = 'add';

    const v = textures.vault;
    const wall = new Sprite(v.wall);
    wall.width = GAME_WIDTH;
    wall.height = GAME_HEIGHT;
    this.vaultShelves = new TilingSprite({ texture: v.shelves, width: GAME_WIDTH + 8, height: GAME_HEIGHT + 8 });
    this.vaultRoot.addChild(wall, this.vaultShelves);
    for (let i = 0; i < 4; i++) {
      const light = new Sprite(v.light);
      light.anchor.set(0.5, 0);
      light.position.set(250 + i * 470, 0);
      light.blendMode = 'add';
      light.tint = i % 2 === 0 ? 0xfff0c8 : 0xc8d8ff;
      this.vaultLights.push(light);
      this.vaultRoot.addChild(light);
    }
    this.vaultRoot.visible = false;

    this.root.addChild(
      this.sky,
      this.starsFar,
      this.sun,
      this.mountains,
      this.fog,
      this.skyline,
      this.skylineLights,
      this.starsNear,
      this.vaultRoot
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

    if (this.backdrop === 'vault') {
      // the shelves slide a little as the camera moves, the spotlights sway and flicker
      this.vaultShelves.tilePosition.set(-camX * 0.16, -camY * 0.08);
      this.vaultLights.forEach((l, i) => {
        l.alpha = 0.16 + Math.sin(t * 0.8 + i * 1.7) * 0.04 + (Math.sin(t * 7 + i * 3) > 0.98 ? 0.06 : 0);
        l.rotation = Math.sin(t * 0.35 + i) * 0.05;
      });
    }
  }

  /** The Zero-G boss arena uses a plain dark vortex instead of the city. */
  setArena(on: boolean): void {
    this.arenaOn = on;
    this.applyVisibility();
  }

  /** The final stage's hall instead of the night sky; null goes back to the sky of the theme. */
  setBackdrop(kind: 'vault' | null): void {
    this.backdrop = kind;
    this.applyVisibility();
  }

  private applyVisibility(): void {
    const vault = this.backdrop === 'vault';
    this.vaultRoot.visible = vault;
    this.sky.visible = !vault;
    this.starsFar.visible = !vault;
    this.starsNear.visible = !vault;
    const city = !vault && !this.arenaOn;
    this.sun.visible = city;
    this.mountains.visible = city;
    this.skyline.visible = city;
    this.skylineLights.visible = city;
    this.fog.visible = city;
  }
}
