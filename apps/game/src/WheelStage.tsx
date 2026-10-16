import { Application, Container, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'preact/hooks';

const SLICES = [0xe0504a, 0xf2b84b, 0x2bb3a3, 0x6b5bd6, 0xe0504a, 0xf2b84b, 0x2bb3a3, 0x6b5bd6];

/** Placeholder Pixi scene: one slowly spinning wheel behind the title. */
export function WheelStage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const app = new Application();
    let disposed = false;

    void app
      .init({ resizeTo: el, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: devicePixelRatio })
      .then(() => {
        if (disposed) return app.destroy(true);
        el.appendChild(app.canvas);
        const wheel = new Container();
        const g = new Graphics();
        const step = (Math.PI * 2) / SLICES.length;
        SLICES.forEach((color, i) => g.moveTo(0, 0).arc(0, 0, 100, i * step, (i + 1) * step).fill({ color, alpha: 0.35 }));
        g.circle(0, 0, 100).stroke({ width: 4, color: 0xf2b84b, alpha: 0.6 });
        wheel.addChild(g);
        app.stage.addChild(wheel);

        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        app.ticker.add((t) => {
          const s = Math.min(app.screen.width, app.screen.height) / 260;
          wheel.position.set(app.screen.width / 2, app.screen.height / 2);
          wheel.scale.set(s);
          if (!reduced) wheel.rotation += 0.004 * t.deltaTime;
        });
      });

    return () => {
      disposed = true;
      if (app.renderer) app.destroy(true);
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
