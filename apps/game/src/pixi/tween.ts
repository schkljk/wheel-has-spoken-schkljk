/** Tiny tween runner driven by the Pixi ticker. */
export type Ease = (k: number) => number;
export const ease = {
  linear: (k: number) => k,
  out: (k: number) => 1 - Math.pow(1 - k, 3),
  in: (k: number) => k * k,
  inOut: (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  back: (k: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  },
};

interface Job {
  t: number;
  dur: number;
  fn: (k: number) => void;
  ease: Ease;
  done: () => void;
}

export class Tweens {
  private jobs: Job[] = [];
  /** Runs fn(k) for k from 0 to 1 over dur ms. */
  run(dur: number, fn: (k: number) => void, e: Ease = ease.linear): Promise<void> {
    return new Promise((done) => {
      if (dur <= 0) {
        fn(1);
        done();
        return;
      }
      this.jobs.push({ t: 0, dur, fn, ease: e, done });
    });
  }
  /** Keyframes: values at evenly spaced (or given) offsets, eased between. */
  keys(dur: number, frames: number[], set: (v: number) => void, e: Ease = ease.inOut, offsets?: number[]) {
    const n = frames.length - 1;
    const at = offsets ?? frames.map((_, i) => i / n);
    return this.run(dur, (k) => {
      let i = 0;
      while (i < n - 1 && k > at[i + 1]!) i++;
      const a = at[i]!;
      const b = at[i + 1]!;
      const u = b > a ? Math.min(1, Math.max(0, (k - a) / (b - a))) : 1;
      set(frames[i]! + (frames[i + 1]! - frames[i]!) * e(u));
    });
  }
  wait(ms: number) {
    return this.run(ms, () => {});
  }
  update(ms: number) {
    if (!this.jobs.length) return;
    const cur = this.jobs;
    this.jobs = [];
    const keep: Job[] = [];
    for (const j of cur) {
      j.t += ms;
      const k = Math.min(1, j.t / j.dur);
      try {
        j.fn(j.ease(k));
      } catch {
        // the thing being animated is gone: finish the job so nothing waits on it forever
        j.done();
        continue;
      }
      if (k >= 1) j.done();
      else keep.push(j);
    }
    // jobs started during this update are already in this.jobs
    this.jobs = keep.concat(this.jobs);
  }
  clear() {
    for (const j of this.jobs) j.done();
    this.jobs = [];
  }
}
