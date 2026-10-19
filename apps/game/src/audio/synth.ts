// The synthesizer behind every sound and the music: a sound is a list of voices (a tone or filtered noise
// with an envelope, a pitch glide, and optional vibrato, chorus, flutter, drive and pan), rendered into any
// Web Audio context, live or offline (the loudness check renders every sound offline).

/** Waves: the four built in, pulse waves at 12.5% and 25% duty (the chiptune leads), white noise. */
export type Wave = OscillatorType | 'p12' | 'p25' | 'n';

export interface Spec {
  w: Wave;
  /** start frequency in Hz (tones) or filter cutoff (noise) */
  f: number;
  /** glide to this by the end */
  to?: number;
  /** length in seconds, attack to silence */
  d: number;
  /** peak level, 0 to 1 */
  v: number;
  /** start, seconds after the sound starts */
  at?: number;
  /** attack, seconds (default 4 ms) */
  a?: number;
  /** hold at the peak before the decay, seconds */
  h?: number;
  /** noise filter (default band-pass) and its Q */
  ft?: 'lp' | 'hp' | 'bp';
  q?: number;
  /** vibrato: rate in Hz, depth in semitones, and how long before it starts */
  vib?: [number, number, number?];
  /** a second voice this many cents off, for width */
  det?: number;
  /** flutter: the level wobbling at this rate (motors, purrs, rattles) */
  trem?: number;
  /** distortion, 0 to 1 */
  drv?: number;
  /** -1 left to 1 right */
  pan?: number;
  /** a low-pass on a tone, to soften square and saw waves */
  lp?: number;
  /** glide in a straight line instead of by ratio */
  lin?: boolean;
}

export interface RenderOpts {
  /** pitch multiplier (tones and noise filters) */
  pitch?: number;
  /** level multiplier */
  gain?: number;
}

// per context: one second of noise and the pulse waves, made once
const noiseOf = new WeakMap<BaseAudioContext, AudioBuffer>();
const pulseOf = new WeakMap<BaseAudioContext, Map<number, PeriodicWave>>();
const shapers = new Map<number, Float32Array>();

function noiseBuf(ctx: BaseAudioContext) {
  let b = noiseOf.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = b.getChannelData(0);
    // a fixed seed: the same noise every time, so renders are repeatable
    let s = 0x2545f491;
    for (let i = 0; i < ch.length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      ch[i] = ((s >>> 0) / 4294967295) * 2 - 1;
    }
    noiseOf.set(ctx, b);
  }
  return b;
}
function pulse(ctx: BaseAudioContext, duty: number) {
  let m = pulseOf.get(ctx);
  if (!m) pulseOf.set(ctx, (m = new Map()));
  let p = m.get(duty);
  if (!p) {
    const n = 48;
    const re = new Float32Array(n),
      im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = ((2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty)) * 0.9;
    p = ctx.createPeriodicWave(re, im);
    m.set(duty, p);
  }
  return p;
}
function shaper(k: number) {
  const key = Math.round(k * 20);
  let c = shapers.get(key);
  if (!c) {
    const amt = 1 + key * 2;
    c = new Float32Array(1024);
    for (let i = 0; i < c.length; i++) {
      const x = (i / (c.length - 1)) * 2 - 1;
      c[i] = Math.tanh(x * amt) / Math.tanh(amt);
    }
    shapers.set(key, c);
  }
  return c;
}
const FT: Record<string, BiquadFilterType> = { lp: 'lowpass', hp: 'highpass', bp: 'bandpass' };
const clampF = (f: number) => Math.max(20, Math.min(20000, f));

function oscOf(ctx: BaseAudioContext, w: Wave) {
  const o = ctx.createOscillator();
  if (w === 'p12' || w === 'p25') o.setPeriodicWave(pulse(ctx, w === 'p12' ? 0.125 : 0.25));
  else if (w !== 'n') o.type = w;
  return o;
}

/** Renders one voice into `out`, starting at context time t0. Returns when it ends (context time). */
export function voice(ctx: BaseAudioContext, s: Spec, out: AudioNode, t0: number, o: RenderOpts = {}): number {
  const p = o.pitch ?? 1;
  const t = t0 + (s.at ?? 0);
  const a = Math.min(s.a ?? 0.004, s.d * 0.9);
  const h = s.h ?? 0;
  const end = t + s.d;
  const v = Math.max(0.0002, s.v * (o.gain ?? 1));
  // the envelope
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  if (h > 0) g.gain.setValueAtTime(v, Math.min(end - 0.005, t + a + h));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  let tail: AudioNode = g;
  if (s.pan && 'createStereoPanner' in ctx) {
    const pn = ctx.createStereoPanner();
    pn.pan.value = s.pan;
    g.connect(pn);
    tail = pn;
  }
  tail.connect(out);
  let head: AudioNode = g;
  if (s.trem) {
    const tg = ctx.createGain();
    tg.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = s.trem;
    const lg = ctx.createGain();
    lg.gain.value = 0.45;
    lfo.connect(lg);
    lg.connect(tg.gain);
    tg.connect(head);
    head = tg;
    lfo.start(t);
    lfo.stop(end + 0.05);
  }
  if (s.drv) {
    const ws = ctx.createWaveShaper();
    ws.curve = shaper(s.drv) as Float32Array<ArrayBuffer>;
    ws.connect(head);
    head = ws;
  }
  const glide = (param: AudioParam, from: number, to: number | undefined) => {
    param.setValueAtTime(from, t);
    if (to === undefined) return;
    if (s.lin) param.linearRampToValueAtTime(to, end);
    else param.exponentialRampToValueAtTime(to, end);
  };
  if (s.w === 'n') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf(ctx);
    src.loop = true;
    const fl = ctx.createBiquadFilter();
    fl.type = FT[s.ft ?? 'bp']!;
    fl.Q.value = s.q ?? (s.ft === 'bp' || !s.ft ? 1.4 : 0.7);
    glide(fl.frequency, clampF(s.f * p), s.to !== undefined ? clampF(s.to * p) : undefined);
    src.connect(fl);
    fl.connect(head);
    // start somewhere different in the noise each time a sound repeats
    src.start(t, (t * 7.31) % 0.9);
    src.stop(end + 0.05);
    return end;
  }
  let dst: AudioNode = head;
  if (s.lp) {
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = s.lp;
    fl.connect(head);
    dst = fl;
  }
  const oscs = [oscOf(ctx, s.w)];
  if (s.det) {
    const o2 = oscOf(ctx, s.w);
    o2.detune.value = s.det;
    oscs.push(o2);
  }
  const lvl = oscs.length > 1 ? 0.6 : 1;
  for (const os of oscs) {
    glide(os.frequency, clampF(s.f * p), s.to !== undefined ? clampF(s.to * p) : undefined);
    if (s.vib) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = s.vib[0];
      const dg = ctx.createGain();
      const delay = s.vib[2] ?? 0;
      dg.gain.setValueAtTime(0, t);
      dg.gain.linearRampToValueAtTime(s.f * p * (Math.pow(2, s.vib[1] / 12) - 1), t + delay + 0.05);
      lfo.connect(dg);
      dg.connect(os.frequency);
      lfo.start(t);
      lfo.stop(end + 0.05);
    }
    if (lvl < 1) {
      const lg = ctx.createGain();
      lg.gain.value = lvl;
      os.connect(lg);
      lg.connect(dst);
    } else os.connect(dst);
    os.start(t);
    os.stop(end + 0.05);
  }
  return end;
}

/** Renders a whole sound (its voices) into `out`. Returns when the last voice ends. */
export function render(ctx: BaseAudioContext, specs: readonly Spec[], out: AudioNode, t0: number, o: RenderOpts = {}): number {
  let end = t0;
  for (const s of specs) end = Math.max(end, voice(ctx, s, out, t0, o));
  return end;
}

/** How long a sound lasts, in seconds. */
export const lengthOf = (specs: readonly Spec[]) => specs.reduce((m, s) => Math.max(m, (s.at ?? 0) + s.d), 0);
export const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
