// Canvases that get read back (toDataURL, toBlob, getImageData) live on the CPU. A GPU-backed 2D canvas has to
// wait for the GPU on every readback, and while Pixi's WebGL is busy that stalled the main thread for whole
// seconds (3.2 s opening an arena's info card on a mid-range phone). With willReadFrequently, 20 readbacks
// went from 1.9 s to 18 ms.

/** A new canvas of w x h with a CPU-backed 2D context. */
export function cpuCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true });
  if (!x) throw new Error('2d canvas unavailable');
  return [cv, x];
}
