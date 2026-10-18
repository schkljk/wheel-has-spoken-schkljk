// Every pixel icon as a grid of colors (16x16, drawn in code by art/icons.ts). Pure (no DOM): the Icon component,
// the Pixi textures and the art tools all read it.

import { ICON_ART, ICON_SIZE, drawIcon } from '../art/icons';

/** Colors for tinted icons (gear slots take the rarity color): 'x' main, 'X' highlight. */
export type Tint = { x: string; X: string };
type RGB = [number, number, number];

export const ICON_NAMES = Object.keys(ICON_ART);
export const hasIcon = (name: string) => name in ICON_ART;

/** An icon's pixels: size x size colors (null = transparent) and their alphas. */
export interface IconPixels {
  size: number;
  px: (RGB | null)[];
  a?: Uint8Array;
}
const cache = new Map<string, IconPixels | null>();

export function iconPixels(name: string, tint?: Tint): IconPixels | null {
  const key = tint ? `${name}|${tint.x}` : name;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const art = drawIcon(name, tint?.x);
  const out = art ? { size: ICON_SIZE, px: art.px as (RGB | null)[], a: art.a } : null;
  cache.set(key, out);
  return out;
}
