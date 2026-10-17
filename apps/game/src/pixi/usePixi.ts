import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A Pixi application that fills its host element and lives as long as the component.
 * `setup` runs once the renderer is ready; whatever it returns runs on teardown.
 */
export function usePixi(setup: (app: Application, host: HTMLDivElement) => void | (() => void)) {
  const host = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);
  useEffect(() => {
    const el = host.current!;
    const a = new Application();
    let disposed = false;
    let cleanup: void | (() => void);
    void a
      .init({ resizeTo: el, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2) })
      .then(() => {
        if (disposed) return a.destroy(true, { children: true });
        a.canvas.style.display = 'block';
        el.appendChild(a.canvas);
        cleanup = setup(a, el);
        setApp(a);
      });
    return () => {
      disposed = true;
      if (cleanup) cleanup();
      if (a.renderer) a.destroy(true, { children: true });
    };
  }, []);
  return { host, app };
}
