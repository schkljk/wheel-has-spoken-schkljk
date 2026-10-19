import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROBE_FILE, patchProbe } from './pixi-probe';

// The build puts Pixi's blend-mode check on CPU canvases (tools/build/pixi-probe.ts): it must still find the module
// and its getContext calls in the installed Pixi.
const file = resolve(dirname(createRequire(import.meta.url).resolve('pixi.js')), '../lib/rendering/renderers/canvas/utils/canUseNewCanvasBlendModes.mjs');

describe("Pixi's blend-mode check", () => {
  it('is where the build looks for it', () => {
    expect(PROBE_FILE.test(file)).toBe(true);
  });
  it('gets every 2D context with willReadFrequently', () => {
    const out = patchProbe(readFileSync(file, 'utf8'));
    expect(out).not.toContain('getContext("2d")');
    expect(out.split('willReadFrequently: true').length - 1).toBeGreaterThanOrEqual(2);
  });
  it('refuses code it does not recognise', () => {
    expect(() => patchProbe('const x = 1;')).toThrow(/pixi-probe/);
  });
});
