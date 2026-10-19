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

const resolution = () => Math.min(devicePixelRatio || 1, 2);
/** apps made so far (a screen that needed one before the warm-up ran already did the warming) */
let made = 0;
/**
 * Apps on screen. Pixi's system ticker (its renderers' scheduler) runs every frame once any renderer exists, even
 * with every app in the pool: 15 ms of every second on the idle hub on a mid-range phone. It only runs while one
 * is out.
 */
let active = 0;
const inUse = (P: Px, d: number) => {
  active = Math.max(0, active + d);
  if (active) P.Ticker.system.start();
  else P.Ticker.system.stop();
};

// The first app (three WebGL contexts made, the shaders compiled) is made while the game is idle, before
// anything needs it; a wheel that comes up meanwhile waits for it instead of making its own.
let warming: Promise<void> | null = null;
/** Makes an app, draws one frame of everything (pixi/warm.ts) and puts it in the pool. Once. */
export function warmPixi(): Promise<void> {
  return (warming ??= loadPx()
    .then(async (P) => {
      if (made) return;
      made++;
      inUse(P, 1);
      const a = new P.Application();
      await a.init({ ...OPTS, width: 64, height: 64, resolution: resolution() });
      a.stop();
      P.warmUp(a);
      release(P, a);
    })
    .catch(() => {
      // warming up is optional: the first wheel makes its app as before
    }));
}

async function acquire(P: Px, el: HTMLDivElement): Promise<Application> {
  if (warming) await warming;
  inUse(P, 1);
  for (let a = idle.pop(); a; a = idle.pop()) {
    if (!a.renderer) continue;
    a.resizeTo = el;
    a.start();
    return a;
  }
  made++;
  const a = new P.Application();
  try {
    await a.init({ ...OPTS, resizeTo: el, resolution: resolution() });
  } catch (e) {
    inUse(P, -1);
    throw e;
  }
  return a;
}
/** Back to the pool: the screen's things and per-frame work go, the WebGL context stays. */
function release(P: Px, a: Application) {
  if (!a.renderer) return inUse(P, -1);
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
  inUse(P, -1);
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
    let ro: { disconnect(): void } | null = null;
    void loadPx().then(async (px) => {
      if (disposed) return;
      P = px;
      const app = (a = await acquire(px, el));
      if (disposed) return release(px, app);
      app.canvas.style.display = 'block';
      el.appendChild(app.canvas);
      // Pixi's resizeTo only follows the window; the host also changes size when the content around it does
      // (an odds row appears, a result grows), and a canvas that kept its old size would cover that content
      ro = followHost(app, el);
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

/** A host size change smaller than this (CSS px, either way) is a wobble: it waits for the layout to settle. */
export const SMALL_RESIZE = 40;
const SETTLE_MS = 250;
/**
 * Keeps the drawing buffer the host's size. Every resize reallocates the WebGL buffer (a whole frame's work on a
 * phone), so a small change waits until the layout has settled, the canvas stretched to the host meanwhile; a
 * big one (a new layout) resizes at once. Window resizes and rotation go through Pixi's own resizeTo.
 */
function followHost(app: Application, el: HTMLElement): { disconnect(): void } {
  let timer = 0;
  // how far the host is from the size the buffer was made for
  const off = () => (app.renderer ? Math.max(Math.abs(el.clientWidth - app.screen.width), Math.abs(el.clientHeight - app.screen.height)) : 0);
  const settle = () => {
    timer = 0;
    if (off()) app.resize();
  };
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = 0;
    const d = off();
    if (d >= SMALL_RESIZE) app.resize();
    else if (d) timer = window.setTimeout(settle, SETTLE_MS);
  });
  ro.observe(el);
  return {
    disconnect() {
      clearTimeout(timer);
      ro.disconnect();
    },
  };
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
