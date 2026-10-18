import type { Application } from 'pixi.js';
import { useEffect, useRef } from 'preact/hooks';
import { loadPx } from './pixi/usePixi';

// The idle title wheel: legacy wheel colors, a gold rim with pegs, slowly turning.
const SLICES = [0x5b4bb7, 0x0e9f8e, 0xc62f35, 0xd99a2b, 0x7a5cc9, 0x2bb3a3, 0xe0504a, 0xf2b544];
const COUNT = 16;

export function WheelStage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let app: Application | null = null;
    let disposed = false;

    // Pixi comes in its own chunk, after the title screen is already up (upgrade 44)
    void loadPx()
      .then(async ({ Application, Container, Graphics }) => {
        if (disposed) return null;
        const a = (app = new Application());
        await a.init({ resizeTo: el, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio, 2) });
        return { a, Container, Graphics };
      })
      .then((r) => {
        if (!r) return;
        const { a, Container, Graphics } = r;
        if (disposed) return a.destroy(true);
        el.appendChild(a.canvas);
        const wheel = new Container();
        const g = new Graphics();
        const step = (Math.PI * 2) / COUNT;
        for (let i = 0; i < COUNT; i++) {
          g.moveTo(0, 0)
            .arc(0, 0, 100, i * step, (i + 1) * step)
            .closePath()
            .fill({ color: SLICES[i % SLICES.length]! });
          // a soft highlight toward the rim of every other slice
          if (i % 2 === 0) g.moveTo(0, 0).arc(0, 0, 100, i * step, (i + 1) * step).closePath().fill({ color: 0xffffff, alpha: 0.08 });
        }
        g.circle(0, 0, 100).stroke({ width: 7, color: 0xd99a2b });
        g.circle(0, 0, 103).stroke({ width: 2, color: 0x8e5e10, alpha: 0.6 });
        for (let i = 0; i < COUNT; i++) {
          const a = i * step;
          g.circle(Math.cos(a) * 100, Math.sin(a) * 100, 3.2).fill({ color: 0xfff3c4 });
        }
        g.circle(0, 0, 17).fill({ color: 0xfff3c4 }).stroke({ width: 4, color: 0xd99a2b });
        wheel.addChild(g);

        // the pointer at the top
        const pointer = new Graphics().poly([-10, -112, 10, -112, 0, -92]).fill({ color: 0xc62f35 }).stroke({ width: 2, color: 0x8e1d22 });
        a.stage.addChild(wheel, pointer);

        const reduced = () => document.documentElement.dataset.motion === 'reduced';
        a.ticker.add((t) => {
          const s = (Math.min(a.screen.width, a.screen.height) / 240) * 0.98;
          wheel.position.set(a.screen.width / 2, a.screen.height / 2 + 6 * s);
          wheel.scale.set(s);
          pointer.position.copyFrom(wheel.position);
          pointer.scale.set(s);
          if (!reduced()) wheel.rotation += 0.003 * t.deltaTime;
        });
      });

    return () => {
      disposed = true;
      if (app && app.renderer) app.destroy(true);
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
