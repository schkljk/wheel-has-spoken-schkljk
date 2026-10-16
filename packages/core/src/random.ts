import type { Rng } from './rng';

// Random helpers. Each one draws from the RNG exactly like its legacy counterpart, in the same
// order and the same number of times: battle parity depends on it.

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** A float in [a, b). */
export const rnd = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

export const pick = <T>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng() * a.length)]!;

/** Weighted pick; returns the index. */
export function pickW(rng: Rng, items: readonly { w: number }[]): number {
  let t = 0;
  for (const it of items) t += it.w;
  let r = rng() * t;
  for (let i = 0; i < items.length; i++) {
    r -= items[i]!.w;
    if (r <= 0) return i;
  }
  return items.length - 1;
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
