/** A random source returning floats in [0, 1), like Math.random. */
export type Rng = () => number;

/**
 * mulberry32: small, fast, seedable 32-bit PRNG.
 * The parity harness injects the same function into the legacy engine,
 * so both engines see the identical random stream.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
