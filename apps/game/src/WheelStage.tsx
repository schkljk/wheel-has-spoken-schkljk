import type { Application } from 'pixi.js';
import { useEffect, useRef } from 'preact/hooks';
import { loadPx } from './pixi/usePixi';

// The idle title wheel: the game's own pixel wheel in its colors, slowly turning, its bulbs twinkling and its
// pointer flicking past the pegs.
const SLICES = ['#5b4bb7', '#0e9f8e', '#c62f35', '#d99a2b', '#7a5cc9', '#2bb3a3', '#e0504a', '#f2b544'];
const COUNT = 16;

export function WheelStage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let app: Application | null = null;
    let disposed = false;

    // Pixi comes in its own chunk, after the title screen is already up (upgrade 44)
    void loadPx()
      .then(async (px) => {
        if (disposed) return null;
        const a = (app = new px.Application());
        await a.init({ resizeTo: el, backgroundAlpha: 0, antialias: false, autoDensity: true, resolution: Math.min(devicePixelRatio, 2) });
        return { a, px };
      })
      .then((r) => {
        if (!r) return;
        const { a, px } = r;
        if (disposed) return a.destroy(true);
        el.appendChild(a.canvas);
        const wheel = new px.WheelView();
        wheel.setHub('');
        a.stage.addChild(wheel);
        const items = Array.from({ length: COUNT }, (_, i) => ({ n: '', w: 1, col: SLICES[i % SLICES.length]! }));
        let size = 0;
        const reduced = () => document.documentElement.dataset.motion === 'reduced';
        a.ticker.add((t) => {
          const s = Math.floor(Math.min(a.screen.width, a.screen.height) * 0.9);
          if (s !== size && s > 40) {
            size = s;
            wheel.setItems(items, s);
          }
          wheel.position.set(a.screen.width / 2, a.screen.height / 2 + s * 0.04);
          wheel.reduced = reduced();
          if (!wheel.reduced) wheel.nudge(0.0006 * t.deltaMS);
          wheel.update(t.deltaMS / 1000);
        });
      });

    return () => {
      disposed = true;
      if (app && app.renderer) app.destroy(true);
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
