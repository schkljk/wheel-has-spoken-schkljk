import type { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'preact/hooks';

/** The Pixi side of the game, loaded on first use (upgrade 44). */
export type Px = typeof import('./stage');
let px: Promise<Px> | null = null;
export const loadPx = () => (px ??= import('./stage'));

// Pixi applications are kept and handed from screen to screen. Each is a WebGL context: making one per screen
// (49 in 16 fights) and throwing it away stalled the phone for up to 1.5 s at a time.
const idle: Application[] = [];
const MAX_IDLE = 2;
const OPTS = { backgroundAlpha: 0, antialias: true, autoDensity: true } as const;

async function acquire(P: Px, el: HTMLDivElement): Promise<Application> {
  for (let a = idle.pop(); a; a = idle.pop()) {
    if (!a.renderer) continue;
    a.resizeTo = el;
    a.start();
    return a;
  }
  const a = new P.Application();
  await a.init({ ...OPTS, resizeTo: el, resolution: Math.min(devicePixelRatio || 1, 2) });
  return a;
}
/** Back to the pool: the screen's things and per-frame work go, the WebGL context stays. */
function release(P: Px, a: Application) {
  if (!a.renderer) return;
  // a fresh ticker: every callback the screen added goes with the old one
  const old = a.ticker;
  a.ticker = new P.Ticker();
  old.destroy();
  a.stop();
  for (const c of a.stage.removeChildren()) c.destroy({ children: true });
  a.stage.position.set(0, 0);
  a.stage.scale.set(1);
  a.stage.filters = null;
  a.resizeTo = null as unknown as HTMLElement;
  a.canvas.remove();
  if (idle.length < MAX_IDLE) idle.push(a);
  else a.destroy(true, { children: true });
}

/**
 * A Pixi application that fills its host element for as long as the component lives (taken from the pool and
 * given back). `setup` runs once the renderer is ready; whatever it returns runs on teardown.
 */
export function usePixi(setup: (app: Application, host: HTMLDivElement, px: Px) => void | (() => void)) {
  const host = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);
  useEffect(() => {
    const el = host.current!;
    let a: Application | null = null;
    let P: Px | null = null;
    let disposed = false;
    let cleanup: void | (() => void);
    let ro: ResizeObserver | null = null;
    void loadPx().then(async (px) => {
      if (disposed) return;
      P = px;
      const app = (a = await acquire(px, el));
      if (disposed) return release(px, app);
      app.canvas.style.display = 'block';
      el.appendChild(app.canvas);
      // Pixi's resizeTo only follows the window; the host also changes size when the content around it does
      // (an odds row appears, a result grows), and a canvas that kept its old size would cover that content
      ro = new ResizeObserver(() => app.renderer && app.resize());
      ro.observe(el);
      if (location.search.includes('perf')) timeFrames(app);
      cleanup = setup(app, el, px);
      setApp(app);
    });
    return () => {
      disposed = true;
      ro?.disconnect();
      if (cleanup) cleanup();
      if (a && P) release(P, a);
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
