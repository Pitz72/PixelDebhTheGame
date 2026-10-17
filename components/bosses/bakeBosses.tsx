import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Texture } from 'pixi.js';
import { extractSvg, svgToCanvas } from '../../renderer/svgTexture';
import type { PartTexture } from '../../characters/debh/bake';
import { FrogDefs, FrogBodyGroup, FrogArmShape, FrogLegShape, FROG_PART_BOX } from './FrogArt';
import { ChickenEyeBossArt, EYE_BOX, EYE_REST, HenShape, HEN_BOX, HEN_STEPS } from './ChickenEyeArt';

/** Texels per art unit. A boss is drawn at about 1.3 game pixels per unit, so this keeps it sharp when zoomed or on a 4K screen. */
const BAKE = 3;

export interface FrogTextures {
  body: PartTexture;
  arm: PartTexture;
  leg: PartTexture;
}

export interface EyeTextures {
  /** The eye with an empty pupil: the hen is a separate sprite. */
  eye: PartTexture;
  /** The eye shut: the lid hides the pupil and the hen. */
  eyeBlink: PartTexture;
  /** The hen, facing right, with her legs at each of `HEN_STEPS`. */
  hen: PartTexture[];
}

function toTexture(canvas: HTMLCanvasElement): Texture {
  const texture = Texture.from(canvas);
  texture.source.autoGenerateMipmaps = true;
  return texture;
}

/** Bakes a piece drawn around its own origin (a shoulder, a hip...) so the origin ends up at the sprite's anchor. */
async function bakePart(el: React.ReactElement, box: readonly [number, number, number, number]): Promise<PartTexture> {
  const [x, y, w, h] = box;
  const markup = renderToStaticMarkup(
    <svg viewBox={`${x} ${y} ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {el}
    </svg>
  );
  const canvas = await svgToCanvas(extractSvg(markup), w, h, BAKE);
  return { texture: toTexture(canvas), anchorX: -x / w, anchorY: -y / h, unit: 1 / BAKE };
}

/** Bakes a whole 240 x 240 drawing, its top-left corner at the anchor. */
async function bakeBox(el: React.ReactElement): Promise<PartTexture> {
  const canvas = await svgToCanvas(extractSvg(renderToStaticMarkup(el)), EYE_BOX, EYE_BOX, BAKE);
  return { texture: toTexture(canvas), anchorX: 0, anchorY: 0, unit: 1 / BAKE };
}

export async function bakeFrog(): Promise<FrogTextures> {
  const [body, arm, leg] = await Promise.all([
    bakePart(
      <>
        <FrogDefs />
        <FrogBodyGroup />
      </>,
      FROG_PART_BOX.body
    ),
    bakePart(
      <>
        <FrogDefs />
        <FrogArmShape />
      </>,
      FROG_PART_BOX.arm
    ),
    bakePart(
      <>
        <FrogDefs />
        <FrogLegShape />
      </>,
      FROG_PART_BOX.leg
    ),
  ]);
  return { body, arm, leg };
}

export async function bakeEye(): Promise<EyeTextures> {
  const [eye, eyeBlink, ...hen] = await Promise.all([
    bakeBox(<ChickenEyeBossArt hideHen />),
    bakeBox(<ChickenEyeBossArt pose={{ ...EYE_REST, blink: true }} hideHen />),
    ...HEN_STEPS.map(step => bakePart(<HenShape step={step} />, HEN_BOX)),
  ]);
  return { eye, eyeBlink, hen };
}
