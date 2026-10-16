import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Texture } from 'pixi.js';
import { extractSvg, svgToCanvas } from '../../renderer/svgTexture';
import {
  BBOX,
  HEAD_EXPRESSIONS,
  HeadExpression,
  HandKind,
  HeadPart,
  TorsoPart,
  SleevePart,
  HandPart,
  ShoePart,
  ShortsPart,
  PadPart,
} from './parts';

/** Texels per rig unit when baking. The character is shown at ~0.11 px per unit, so this leaves room to zoom. */
const BAKE = 0.5;

export interface PartTexture {
  texture: Texture;
  /** Position of the rig origin inside the texture, 0..1 (use as sprite anchor). */
  anchorX: number;
  anchorY: number;
  /** Rig units per texel: scale the sprite by this to place it in rig space. */
  unit: number;
}

export interface DebhTextures {
  head: Record<HeadExpression, PartTexture>;
  torso: PartTexture;
  sleeve: PartTexture;
  sleeveDark: PartTexture;
  hand: Record<string, PartTexture>;
  shoe: PartTexture;
  shoeDark: PartTexture;
  shorts: PartTexture;
  shortsDark: PartTexture;
  pad: PartTexture;
}

async function bake(el: React.ReactElement, box: readonly [number, number, number, number]): Promise<PartTexture> {
  const [x, y, w, h] = box;
  const markup = renderToStaticMarkup(
    <svg viewBox={`${x} ${y} ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {el}
    </svg>
  );
  const canvas = await svgToCanvas(extractSvg(markup), w, h, BAKE);
  const texture = Texture.from(canvas);
  texture.source.autoGenerateMipmaps = true;
  return { texture, anchorX: -x / w, anchorY: -y / h, unit: 1 / BAKE };
}

let cached: Promise<DebhTextures> | null = null;

export function bakeDebh(): Promise<DebhTextures> {
  cached ??= bakeUncached().catch(error => {
    cached = null;
    throw error;
  });
  return cached;
}

async function bakeUncached(): Promise<DebhTextures> {
  const head = {} as Record<HeadExpression, PartTexture>;
  const handKinds: Array<[string, HandKind, boolean]> = [];
  for (const k of ['open', 'fist', 'thumbsUp'] as HandKind[]) {
    handKinds.push([k, k, false]);
    handKinds.push([`${k}Dark`, k, true]);
  }
  const hand: Record<string, PartTexture> = {};

  const [torso, sleeve, sleeveDark, shoe, shoeDark, shorts, shortsDark, pad] = await Promise.all([
    bake(<TorsoPart />, BBOX.torso),
    bake(<SleevePart />, BBOX.sleeve),
    bake(<SleevePart dark />, BBOX.sleeve),
    bake(<ShoePart />, BBOX.shoe),
    bake(<ShoePart dark />, BBOX.shoe),
    bake(<ShortsPart />, BBOX.shorts),
    bake(<ShortsPart dark />, BBOX.shorts),
    bake(<PadPart />, BBOX.pad),
    ...HEAD_EXPRESSIONS.map(async e => {
      head[e] = await bake(<HeadPart expression={e} />, BBOX.head);
    }),
    ...handKinds.map(async ([key, kind, dark]) => {
      hand[key] = await bake(<HandPart kind={kind} dark={dark} />, BBOX.hand);
    }),
  ]);

  return { head, torso, sleeve, sleeveDark, hand, shoe, shoeDark, shorts, shortsDark, pad };
}
