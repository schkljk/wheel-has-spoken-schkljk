// Pixi checks once whether the 2D canvas can blend with "multiply" (for its canvas renderer, which the game never
// uses): it draws two 6x1 canvases into a third and reads a pixel back. On a phone those canvases live on the
// GPU, and the readback waits for it: a 2.3 to 3.9 s freeze when the Pixi chunk loaded, 6 s into the game. The
// same check on CPU-backed canvases (willReadFrequently) gives the same answer at once. node_modules is shared
// and stays untouched: the build patches the module as it bundles it.
import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

/** The module that runs the check (pixi.js/lib/.../canUseNewCanvasBlendModes.mjs). */
export const PROBE_FILE = /pixi\.js[\\/]lib[\\/]rendering[\\/]renderers[\\/]canvas[\\/]utils[\\/]canUseNewCanvasBlendModes\.mjs$/;
const PLAIN = 'getContext("2d")';
const CPU = 'getContext("2d", { willReadFrequently: true })';

/** The module's code with every 2D canvas on the CPU. Throws if Pixi changed it, so the patch can't quietly stop working. */
export function patchProbe(code: string): string {
  const n = code.split(PLAIN).length - 1;
  if (n < 2) throw new Error(`pixi-probe: expected the blend-mode check's getContext("2d") calls in ${PROBE_FILE}, found ${n}: update tools/build/pixi-probe.ts`);
  return code.split(PLAIN).join(CPU);
}

/** The Vite side: the build (Rollup) and the dev server's dependency bundling (esbuild). */
export function pixiCpuProbe(): Plugin {
  return {
    name: 'whs:pixi-cpu-probe',
    enforce: 'pre',
    transform(code, id) {
      if (!PROBE_FILE.test(id.split('?')[0]!)) return null;
      return { code: patchProbe(code), map: null };
    },
    config: () => ({
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            {
              name: 'whs:pixi-cpu-probe',
              setup(b) {
                b.onLoad({ filter: PROBE_FILE }, async (a) => ({ contents: patchProbe(await readFile(a.path, 'utf8')), loader: 'js' }));
              },
            },
          ],
        },
      },
    }),
  };
}
