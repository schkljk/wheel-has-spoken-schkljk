import { mulberry32 } from '../rng';
import { randomFighter } from '../fighter';
import { simulate } from '../battle';
import type { GameContext } from '../stats';
import type { Fighter } from '../types';

// A fixed pool of random opponents makes ratings fast and consistent on phones (legacy RPOOL).
// Legacy rolled the pool with Math.random once per session; here it is the same pool every time.
let RPOOL: Fighter[] | null = null;
const randPool = () => (RPOOL ??= Array.from({ length: 160 }, (_, i) => randomFighter('x', mulberry32(0x5eed + i))));

/** Share of fights won against random level 1 fighters, cached on the fighter until their build changes. */
export function winRate(f: Fighter & { _win?: number | null }, ctx: GameContext = {}, n = 160): number {
  if (f._win != null) return f._win;
  const pool = randPool();
  const rng = mulberry32(0xc0ffee);
  let w = 0;
  for (let i = 0; i < n; i++) if (simulate(f, pool[i % pool.length]!, rng, { ctx }) === 0) w++;
  f._win = w / n;
  return f._win;
}

/** Indirection so tests can pin ratings (the legacy rating pool drew from the game's random source). */
export const rating = { winRate };
