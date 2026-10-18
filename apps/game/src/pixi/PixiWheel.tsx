import { useEffect, useRef } from 'preact/hooks';
import { G, reducedMotion } from '../state/game';
import { tick } from '../ui/sound';
import { usePixi } from './usePixi';
import type { WheelEvents, WheelSlice, WheelView } from './wheel';

export interface WheelHandle {
  view: WheelView;
}

/**
 * A wheel in its own Pixi canvas that fills the host. Drag or flick it with a finger; the parent
 * decides what a flick or a tap does (spin with physics, or pick a slice and spin to it).
 */
export function PixiWheel(props: {
  items: WheelSlice[];
  hi?: number | null;
  hub?: string;
  /** may the player flick it right now */
  live: boolean;
  onFlick?: (w: number) => void;
  onTap?: () => void;
  events: WheelEvents;
  handle?: { current: WheelHandle | null };
  /** the wheel is drawn and can spin (Pixi loads on first use, so a tap can come before this) */
  onReady?: () => void;
  label?: string;
}) {
  const view = useRef<WheelView | null>(null);
  const p = useRef(props);
  p.current = props;

  const { host } = usePixi((app, el, px) => {
    const v = new px.WheelView();
    v.rng = G.rng;
    view.current = v;
    if (props.handle) props.handle.current = { view: v };
    app.stage.addChild(v);
    let size = 0;
    const fit = () => {
      const s = Math.max(60, Math.floor(Math.min(app.screen.width, app.screen.height) * 0.94));
      v.position.set(app.screen.width / 2, app.screen.height / 2 + s * 0.02);
      if (s !== size) {
        size = s;
        v.setItems(p.current.items, s * 0.95, p.current.hi ?? null);
      }
    };
    fit();
    v.setHub(p.current.hub ?? '?');
    v.events = {
      tick: (heavy) => {
        tick(heavy);
        p.current.events.tick?.(heavy);
      },
      suspense: () => p.current.events.suspense?.(),
      land: (i, info) => p.current.events.land?.(i, info),
      tooGentle: (t) => p.current.events.tooGentle?.(t),
    };
    app.ticker.add((t) => {
      v.reduced = reducedMotion();
      fit();
      v.update(t.deltaMS / 1000);
    });
    // finger flicks
    const TAU = Math.PI * 2;
    let drag: { id: number; a: number; samples: { t: number; r: number }[]; moved: number } | null = null;
    const center = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + v.x, y: r.top + v.y };
    };
    const angleAt = (e: PointerEvent) => {
      const c = center();
      return Math.atan2(e.clientY - c.y, e.clientX - c.x);
    };
    const down = (e: PointerEvent) => {
      if (!p.current.live || v.spinning) return;
      const c = center();
      const d = Math.hypot(e.clientX - c.x, e.clientY - c.y);
      if (d > v.size / 2 + 12) return;
      e.preventDefault();
      // the hub is a button: a tap there never starts a drag
      drag = { id: e.pointerId, a: angleAt(e), samples: [{ t: performance.now(), r: v.rot }], moved: 0 };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // not supported
      }
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const a = angleAt(e);
      let d = a - drag.a;
      d = ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
      drag.a = a;
      drag.moved += Math.abs(d);
      v.nudge(d);
      const now = performance.now();
      drag.samples.push({ t: now, r: v.rot });
      while (drag.samples.length > 2 && now - drag.samples[0]!.t > 100) drag.samples.shift();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const s = drag.samples;
      const moved = drag.moved;
      drag = null;
      if (moved < 0.08) {
        p.current.onTap?.();
        return;
      }
      const a = s[0]!;
      const b = s[s.length - 1]!;
      const dt = (b.t - a.t) / 1000;
      if (performance.now() - b.t > 120 || dt <= 0) return;
      let w = (b.r - a.r) / dt;
      if (Math.abs(w) < 1.2) return;
      w = Math.sign(w) * Math.min(Math.abs(w), 36);
      p.current.onFlick?.(w);
    };
    const cancel = () => (drag = null);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    p.current.onReady?.();
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      view.current = null;
      if (props.handle) props.handle.current = null;
    };
  });

  // new slices: redraw; a new highlight only marks the slice
  useEffect(() => {
    const v = view.current;
    if (v) v.setItems(props.items, v.size, props.hi ?? null);
  }, [props.items]);
  useEffect(() => {
    view.current?.highlight(props.hi ?? null);
  }, [props.hi]);
  useEffect(() => {
    view.current?.setHub(props.hub ?? '?');
  }, [props.hub]);

  return <div ref={host} class={`pixiwheel${props.live ? ' live' : ''}`} role="img" aria-label={props.label ?? 'Wheel'} style={{ touchAction: 'none' }} />;
}
