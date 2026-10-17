/**
 * Debh for the title screen's parade, from the waist up (a half-length portrait in a square, like the enemies' boxes, so
 * the names under the parade line up and she is not tiny): the same skeleton and the same parts as in the game, drawn once into pictures.
 * The title screen is plain HTML, so the pictures are PNG data URLs: one still (idle) and a strip of run frames to
 * play with CSS `steps()`. A throwaway Pixi renderer does the drawing and is destroyed straight after; the baked
 * parts (`bakeDebh`) are the game's own and stay cached.
 */
import { Application, Container, Rectangle } from 'pixi.js';
import { bakeDebh } from './bake';
import { DebhRig, DebhPose } from './rig';
import { idlePose, runPose } from './anim';

/** One frame is a square of this many px: twice the size she has in the parade, so it stays sharp on a big screen. */
export const PARADE_FRAME = 144;
export const PARADE_RUN_FRAMES = 8;
/** The part of the rig that is shown, in rig units: from just above the hair down to the chest (the rest is cut off and fades out). */
const BUST_TOP = -312;
const BUST_BOTTOM = 276;

export interface DebhParadeFrames {
  /** A still of her standing, smiling. */
  idle: string;
  /** PARADE_RUN_FRAMES run frames side by side. */
  run: string;
}

let cached: Promise<DebhParadeFrames> | null = null;
let ready: DebhParadeFrames | null = null;

/** The pictures if they are already baked (the title screen starts with them when it can), else null. */
export const paradeIfReady = (): DebhParadeFrames | null => ready;

export function bakeParade(): Promise<DebhParadeFrames> {
  cached ??= bakeParadeUncached()
    .then(frames => (ready = frames))
    .catch(error => {
      cached = null;
      throw error;
    });
  return cached;
}

async function bakeParadeUncached(): Promise<DebhParadeFrames> {
  const debh = await bakeDebh();
  const app = new Application();
  await app.init({
    width: PARADE_FRAME,
    height: PARADE_FRAME,
    backgroundAlpha: 0,
    antialias: true,
    autoStart: false,
    preference: 'webgl',
  });
  try {
    const scale = PARADE_FRAME / (BUST_BOTTOM - BUST_TOP);
    const frame = new Rectangle(0, 0, PARADE_FRAME, PARADE_FRAME);
    const draw = (pose: DebhPose): HTMLCanvasElement => {
      const stage = new Container();
      const rig = new DebhRig(debh);
      rig.apply(pose);
      rig.root.scale.set(scale);
      rig.root.position.set(PARADE_FRAME * 0.5, -BUST_TOP * scale);
      stage.addChild(rig.root);
      app.renderer.render({ container: stage, clear: true });
      const out = app.renderer.extract.canvas({ target: stage, frame, resolution: 1, antialias: true }) as HTMLCanvasElement;
      stage.destroy({ children: true });
      return out;
    };

    const idle = draw(idlePose(0.4)).toDataURL('image/png');

    const strip = document.createElement('canvas');
    strip.width = PARADE_FRAME * PARADE_RUN_FRAMES;
    strip.height = PARADE_FRAME;
    const ctx = strip.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    for (let i = 0; i < PARADE_RUN_FRAMES; i++) {
      ctx.drawImage(draw(runPose(i / PARADE_RUN_FRAMES, 1, false)), i * PARADE_FRAME, 0);
    }
    return { idle, run: strip.toDataURL('image/png') };
  } finally {
    app.destroy({ removeView: true }, { children: true });
  }
}
