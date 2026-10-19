import { useEffect, useRef } from 'preact/hooks';
import { bulb, wheelFace, wheelHub, wheelPointer, wheelRim, type Rgba } from './art/wheel-art';

// The idle title wheel: the game's own pixel wheel in its colors, slowly turning, its bulbs twinkling and its
// pointer flicking past the pegs. Drawn once into a few canvases and turned by CSS: the WebGL version kept the
// GPU busy (81 ms of every second on a mid-range phone) just to idle on the title screen.
const SLICES = ['#5b4bb7', '#0e9f8e', '#c62f35', '#d99a2b', '#7a5cc9', '#2bb3a3', '#e0504a', '#f2b544'];
const COUNT = 16;
/** the wheel across, in art pixels (the canvases scale up whole) */
const N = 128;
/** room around the wheel for the pointer and the bulbs' glow */
const M = 12;
const S = N + 2 * M;
const TAU = Math.PI * 2;

function put(x: CanvasRenderingContext2D, a: Rgba, cx: number, cy: number) {
  const id = x.createImageData(a.w, a.h);
  id.data.set(a.d);
  // composited over what's there (putImageData would replace it)
  const c = document.createElement('canvas');
  c.width = a.w;
  c.height = a.h;
  c.getContext('2d')!.putImageData(id, 0, 0);
  x.drawImage(c, Math.round(cx - a.w / 2), Math.round(cy - a.h / 2));
}
function layer(draw: (x: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  draw(cv.getContext('2d')!);
  return cv;
}

/** The four layers: the turning face, the rim with every other bulb lit (and the other half), and the hub. */
function layers() {
  const rw = Math.max(4, Math.round(N * 0.06));
  const faceN = N - 2 * (rw - 1);
  const hubN = Math.max(9, Math.round(N * 0.22));
  const c = S / 2;
  const face = layer((x) =>
    put(
      x,
      wheelFace(faceN, Array.from({ length: COUNT }, () => TAU / COUNT), Array.from({ length: COUNT }, (_, i) => SLICES[i % SLICES.length]!), hubN / faceN),
      c,
      c,
    ),
  );
  const bs = Math.max(2, Math.round(rw * 0.55));
  const on = bulb(true, bs),
    off = bulb(false, bs);
  const rim = (odd: boolean) =>
    layer((x) => {
      put(x, wheelRim(N, rw), c, c);
      for (let k = 0; k < 16; k++) {
        const ang = (k / 16) * TAU + TAU / 32;
        const r = N / 2 - rw / 2;
        put(x, k % 2 === (odd ? 1 : 0) ? on : off, c + Math.sin(ang) * r, c - Math.cos(ang) * r);
      }
    });
  const hub = layer((x) => put(x, wheelHub(hubN), c, c));
  const pt = wheelPointer(Math.max(8, Math.round(N * 0.115)));
  const pointer = layer((x) => {
    const id = x.createImageData(pt.w, pt.h);
    id.data.set(pt.d);
    // the pivot (the cap's middle) sits just inside the rim at the top
    x.putImageData(id, Math.round(c - pt.px), Math.round(c - N / 2 + rw * 0.15 - pt.py));
  });
  // the pointer flicks around its cap
  const pivot = `${(c / S) * 100}% ${((c - N / 2 + rw * 0.15) / S) * 100}%`;
  return { face, rimA: rim(false), rimB: rim(true), hub, pointer, pivot };
}

export function WheelStage() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    const L = layers();
    const box = document.createElement('div');
    box.className = 'tw-box';
    const add = (cv: HTMLCanvasElement, cls: string) => {
      cv.className = `tw ${cls}`;
      box.appendChild(cv);
      return cv;
    };
    add(L.face, 'tw-face');
    add(L.rimA, 'tw-rim');
    add(L.rimB, 'tw-rim tw-blink');
    add(L.hub, 'tw-hub');
    add(L.pointer, 'tw-ptr').style.transformOrigin = L.pivot;
    el.appendChild(box);
    // a square as big as the space allows (90% of its smaller side, as before)
    const fit = () => {
      const s = Math.floor(Math.min(el.clientWidth, el.clientHeight) * 0.9 * (S / N));
      box.style.width = box.style.height = `${s}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      box.remove();
    };
  }, []);
  return <div ref={host} class="title-wheel" />;
}
