import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deserFighter, mulberry32, randomFighter, serFighter, type CareerFighter, type SerFighter } from '../../packages/core/src';
import { evalLegacy, openLegacyPage } from './browser';
import { decorate, randomExtras } from './fixtures';

// The fighter save format (serFighter / deserFighter live in the legacy UI files) matches the
// legacy game, checked against the real game running in Chromium.

const MULBERRY = `(seed)=>{let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}`;
const N = 400;
const career = (seed: number) => ({ ...randomExtras(seed), fame: seed % 50, xp: seed % 20, rec: { w: seed % 9, l: seed % 4 }, cid: 'c' + seed, armory: ['vest'] });

let legacy: { page: Awaited<ReturnType<typeof openLegacyPage>>['page']; close: () => Promise<void> };
beforeAll(async () => {
  const { page, browser } = await openLegacyPage();
  legacy = { page, close: () => browser.close() };
});
afterAll(async () => legacy?.close());

describe('fighter save format matches the legacy game', () => {
  it(`serializes and rebuilds ${N} career fighters identically`, async () => {
    const extras = Array.from({ length: N }, (_, i) => career(i + 1));
    const out = await evalLegacy<{ ser: SerFighter; back: SerFighter }[]>(
      legacy.page,
      `(() => { const mk = ${MULBERRY}; const X = ${JSON.stringify(extras)}; const real = Math.random; const out = [];
        for (let i = 0; i < X.length; i++) { Math.random = mk(i + 1); const f = Object.assign(randomFighter('Saved ' + (i + 1)), JSON.parse(JSON.stringify(X[i])));
          const ser = serFighter(f); out.push({ ser, back: serFighter(deserFighter(JSON.parse(JSON.stringify(ser)))) }); }
        Math.random = real; return out; })()`,
    );
    for (let i = 0; i < N; i++) {
      const f = decorate(randomFighter('Saved ' + (i + 1), mulberry32(i + 1)), extras[i]!) as CareerFighter;
      const ser = serFighter(f);
      expect(JSON.parse(JSON.stringify(ser)), `fighter ${i + 1}`).toEqual(out[i]!.ser);
      expect(JSON.parse(JSON.stringify(serFighter(deserFighter(JSON.parse(JSON.stringify(ser)))!))), `fighter ${i + 1} rebuilt`).toEqual(out[i]!.back);
    }
  });

  it('rebuilds saved fighters from real and old saves identically', async () => {
    const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../packages/core/test/fixtures', n), 'utf8')) as Record<string, unknown>;
    const played = fx('legacy-played.json');
    const careers: SerFighter[] = [
      ...(played.slots as { career: SerFighter }[]).map((s) => s.career),
      ...(played.retired as SerFighter[]),
      fx('legacy-old-single.json').career as SerFighter,
    ];
    const out = await evalLegacy<(SerFighter | null)[]>(
      legacy.page,
      `${JSON.stringify(careers)}.map((c) => { const f = deserFighter(c); return f ? serFighter(f) : null; })`,
    );
    careers.forEach((c, i) => {
      const f = deserFighter(c);
      expect(f ? JSON.parse(JSON.stringify(serFighter(f))) : null, c.name).toEqual(out[i]);
    });
  });
});
