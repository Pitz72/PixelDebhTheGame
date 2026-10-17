import { MusicTheme } from '../types';

export interface ThemePalette {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  sunTop: string;
  sunBot: string;
  mountain: string;
  neon: string;
  neonHex: number;
  platformTop: string;
  platformBot: string;
  rail: string;
  railHex: number;
  border: string;
  /** Light-map ambient colour: multiplied over the scene, lights add brightness back. */
  ambient: number;
  /** Colours of the floating ambient particles. */
  motes: number[];
}

export const PALETTES: Record<MusicTheme, ThemePalette> = {
  adventure: {
    skyTop: '#050114',
    skyMid: '#160836',
    skyBot: '#311056',
    sunTop: '#ffea00',
    sunBot: '#ff0055',
    mountain: '#14072b',
    neon: '#00e5ff',
    neonHex: 0x00e5ff,
    platformTop: '#1e1b4b',
    platformBot: '#0f0a2c',
    rail: '#00e5ff',
    railHex: 0x00e5ff,
    border: '#7c4dff',
    ambient: 0xb9b3ea,
    motes: [0x00e5ff, 0xff4081, 0xffea00],
  },
  industrial: {
    skyTop: '#060a12',
    skyMid: '#121d2b',
    skyBot: '#263849',
    sunTop: '#ff9100',
    sunBot: '#d50000',
    mountain: '#0d1520',
    neon: '#ff9100',
    neonHex: 0xff9100,
    platformTop: '#263238',
    platformBot: '#11171a',
    rail: '#ff9100',
    railHex: 0xff9100,
    border: '#546e7a',
    ambient: 0xa59a92,
    motes: [0xff9100, 0xffd180, 0xff5722],
  },
  ethereal: {
    skyTop: '#020916',
    skyMid: '#09203f',
    skyBot: '#1b4f72',
    sunTop: '#84ffff',
    sunBot: '#651fff',
    mountain: '#07162c',
    neon: '#84ffff',
    neonHex: 0x84ffff,
    platformTop: '#0d3b66',
    platformBot: '#061a33',
    rail: '#84ffff',
    railHex: 0x84ffff,
    border: '#00b0ff',
    ambient: 0x8fa6d6,
    motes: [0x84ffff, 0xb388ff, 0xffffff],
  },
  boss: {
    skyTop: '#0f0008',
    skyMid: '#260314',
    skyBot: '#4a071c',
    sunTop: '#ff1744',
    sunBot: '#4a001f',
    mountain: '#1a020c',
    neon: '#ff1744',
    neonHex: 0xff1744,
    platformTop: '#3b0a1e',
    platformBot: '#1a030c',
    rail: '#ff1744',
    railHex: 0xff1744,
    border: '#d50000',
    ambient: 0x8a5d6c,
    motes: [0xff1744, 0xff6d00, 0xffd180],
  },
};
