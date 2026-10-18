// Every pixel icon as a grid of colors (16x16, drawn in code by art/icons.ts). Pure (no DOM): the Icon component,
// the Pixi textures and the art tools all read it.

import { ICON_ART, drawIcon } from '../art/icons';

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

/** `s` real pixels per art pixel (2 for big, finer pictures). */
export function iconPixels(name: string, tint?: Tint, s = 1): IconPixels | null {
  const key = (tint ? `${name}|${tint.x}` : name) + (s > 1 ? `|x${s}` : '');
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const art = drawIcon(name, tint?.x, s);
  const out = art ? { size: art.size, px: art.px as (RGB | null)[], a: art.a } : null;
  cache.set(key, out);
  return out;
}
