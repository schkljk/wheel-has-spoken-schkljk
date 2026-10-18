import type { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'preact/hooks';

/** The Pixi side of the game, loaded on first use (upgrade 44). */
export type Px = typeof import('./stage');
let px: Promise<Px> | null = null;
export const loadPx = () => (px ??= import('./stage'));

/**
 * A Pixi application that fills its host element and lives as long as the component.
 * `setup` runs once the renderer is ready; whatever it returns runs on teardown.
 */
export function usePixi(setup: (app: Application, host: HTMLDivElement, px: Px) => void | (() => void)) {
  const host = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);
  useEffect(() => {
    const el = host.current!;
    let a: Application | null = null;
    let disposed = false;
    let cleanup: void | (() => void);
    let ro: ResizeObserver | null = null;
    void loadPx().then(async (P) => {
      if (disposed) return;
      const app = (a = new P.Application());
      await app.init({ resizeTo: el, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2) });
      if (disposed) return app.destroy(true, { children: true });
      app.canvas.style.display = 'block';
      el.appendChild(app.canvas);
      // Pixi's resizeTo only follows the window; the host also changes size when the content around it does
      // (an odds row appears, a result grows), and a canvas that kept its old size would cover that content
      ro = new ResizeObserver(() => app.renderer && app.resize());
      ro.observe(el);
      if (location.search.includes('perf')) timeFrames(app);
      cleanup = setup(app, el, P);
      setApp(app);
    });
    return () => {
      disposed = true;
      ro?.disconnect();
      if (cleanup) cleanup();
      if (a && a.renderer) a.destroy(true, { children: true });
    };
  }, []);
  return { host, app };
}

/** `?perf`: records how long each frame's Pixi work takes (updates and drawing), for tools/dev/fps.ts. */
function timeFrames(a: Application) {
  const w = window as unknown as { __pixiFrames?: number[] };
  const out = (w.__pixiFrames ??= []);
  const update = a.ticker.update.bind(a.ticker);
  a.ticker.update = (t?: number) => {
    const s = performance.now();
    update(t);
    out.push(performance.now() - s);
  };
}
