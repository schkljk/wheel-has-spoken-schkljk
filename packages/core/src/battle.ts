import { ULT_WHEEL } from './data/kits';
import type { FightMod } from './data/misc';
import { ULTS } from './data/wheels';
import { kitMoves } from './kits';
import { clamp, pick, pickW, rnd } from './random';
import type { Rng } from './rng';
import { LS, eff, rate, synOf, traitsOf, type GameContext, type Traits } from './stats';
import type { Arena, BuffKey, Fighter, Move, Pet, RoundMod, Stats, StatusKey } from './types';

// The fight engine, ported from the legacy game with exact parity: same rules, same random draws
// in the same order. Everything runs in "engine HP" (100 = a normal fighter); real numbers are
// engine HP x the level scale LS, and damage between fighters is scaled by LS(att)/LS(def).

export const POW_COST = 25;
const TINTS = ['fire', 'ice', 'lightning', 'water', 'shadow', 'light', 'poison', 'gravity', 'mind', 'wind', 'plant', 'sonic'];
const tintOf = (tags: readonly string[]) => tags.find((t) => TINTS.includes(t)) || '';
const DODGE = ['{b} dodges', '{b} sidesteps it', '{a} whiffs completely', '{b} is just not there anymore'];
/** What each basic move beats in the triangle. */
export const BEATS: Record<string, Move> = { strike: 'power', power: 'guard', guard: 'strike' };
export const MOVE_N: Record<string, string> = {
  strike: 'Strike',
  power: 'Power',
  guard: 'Guard',
  ult: 'Signature move',
  feint: 'Feint',
  focus: 'Focus',
  dodge: 'Sidestep',
  fumble: 'Fumble',
};

/** One fighter inside a battle. */
export interface Side {
  i: 0 | 1;
  f: Fighter;
  /** effective stats; fights can change them (gravity, phases, the Wheelmaster) */
  s: Stats;
  tr: Traits;
  mod: FightMod;
  maxHp: number;
  hp: number;
  en: number;
  ls: number;
  rate: number;
  powOn: boolean;
  syn: Set<string>;
  // statuses
  poison: number;
  frozen: number;
  frzFx: string;
  frzTxt: string;
  soaked: number;
  burning: number;
  /** weapon bent by magnetism: -1 weapon level each */
  wdebuff: number;
  buffs: { k: BuffKey; v: number; r: number }[];
  summoned: Record<string, number>;
  // one-shot flags
  acts: number;
  revived: number;
  plot: number;
  rev2: number;
  mir: number;
  uno: number;
  salt?: number;
  snacked: number;
  weakShown: number;
  phased?: number;
  // this round
  guard: number;
  move: Move | null;
  rm: RoundMod;
  opened?: number;
  focused?: number;
  exposed?: number;
  sidestep?: number;
  ultMul?: number;
  /** the signature wheel slice the player landed, forced on their next signature */
  ultSpin?: (typeof ULT_WHEEL)[number] | null;
  mom?: number;
  /** fight stats for achievements and contracts */
  st: { dodges: number; combos: number; rps: number; taken: number; ults: number; guards: number };
}

export interface Snap {
  /** momentum */
  mo: number[];
  /** HP in % of max */
  h: number[];
  /** real HP */
  hr: number[];
  /** real max HP */
  mx: number[];
  en: number[];
  st: { frozen: boolean; poison: boolean; guard: boolean; soaked: boolean; burning: boolean }[];
  /** every status and buff with its counter, for the icons over each fighter (legacy has no such field) */
  sx: StatusChip[][];
  r: number;
}

/** A status or buff shown over a fighter. */
export interface StatusChip {
  k: StatusChipKey;
  /** its counter: rounds left ("2"), damage a round for poison ("−4"), stacks for a bent weapon ("×2"), or none */
  t: string;
  /** hurts its owner (red) or helps them (green) */
  bad: boolean;
}
export type StatusChipKey = 'guard' | 'frozen' | 'burning' | 'poison' | 'soaked' | 'bent' | 'opened' | 'focused' | BuffKey;

/** What is on a fighter right now, in the order the icons show. */
export function statusChips(x: Side): StatusChip[] {
  const out: StatusChip[] = [];
  if (x.guard) out.push({ k: 'guard', t: '', bad: false });
  if (x.opened) out.push({ k: 'opened', t: '', bad: false });
  if (x.focused) out.push({ k: 'focused', t: '', bad: false });
  // a timed buff of the same kind shows once, with the longest counter
  const buffs = new Map<BuffKey, number>();
  for (const b of x.buffs || []) buffs.set(b.k, Math.max(buffs.get(b.k) ?? 0, b.r));
  for (const k of ['dmgX', 'dr', 'critB'] as const) if (buffs.has(k)) out.push({ k, t: String(buffs.get(k)), bad: false });
  if (x.frozen) out.push({ k: 'frozen', t: '1', bad: true });
  if (x.burning > 0) out.push({ k: 'burning', t: String(x.burning), bad: true });
  if (x.poison > 0) out.push({ k: 'poison', t: `−${Math.max(1, Math.round(x.poison * (x.ls || 1)))}`, bad: true });
  if (x.soaked > 0) out.push({ k: 'soaked', t: String(x.soaked), bad: true });
  for (const k of ['vuln', 'weak'] as const) if (buffs.has(k)) out.push({ k, t: String(buffs.get(k)), bad: true });
  if (x.wdebuff > 0) out.push({ k: 'bent', t: `×${x.wdebuff}`, bad: true });
  return out;
}

/** Animation cue for the fight scene. */
export interface Anim {
  t: string;
  /** the synergy that made this happen (a UI cue for its banner; legacy has no such field) */
  syn?: string;
  /** whose synergy it is */
  sb?: number;
  by?: number;
  to?: number;
  on?: number;
  fx?: string;
  kind?: string;
  tint?: string;
  [k: string]: unknown;
}

/**
 * A line of fight narration. `text` is plain text with `{0}` / `{1}` where the fighters' names go;
 * `d` is the real (level-scaled) amount, if any.
 */
export interface BattleEvent extends Snap {
  text: string;
  cls: string;
  d: number | null;
  pills: string[];
  a: Anim | null;
}

export interface BattleOpts {
  arena?: Arena | null;
  mods?: (FightMod | undefined)[];
  /** default 12 */
  maxRounds?: number;
  /** past the limit every hit lands harder until someone falls (bosses) */
  suddenDeath?: boolean;
  /** skip narration (simulations) */
  quiet?: boolean;
  ctx?: GameContext;
}

export interface Battle {
  P: [Side, Side];
  round: number;
  over: boolean;
  /** winner index once over */
  w: 0 | 1 | null;
  hist: [Move[], Move[]];
  planned: Move | null;
  arena: Partial<Arena>;
  maxR: number;
  sdOn: boolean;
  sd?: number;
  snap(): Snap;
  /**
   * Rough damage of one hit by fighter `i` right now, low and high roll, no crit, against no guard: what a
   * combat wheel slice would do (`kind` and its round mod, `ultM` for a signature slice). Draws nothing and
   * changes nothing. Null when the move can't deal damage (no usable power).
   */
  preview(i: 0 | 1, kind: 'strike' | 'power' | 'ult', rm?: RoundMod, ultM?: number): { lo: number; hi: number; weak: boolean } | null;
  /** Rough damage of fighter `i`'s counter when they guard a strike (with a counter slice's round mod). */
  counterPreview(i: 0 | 1, rm?: RoundMod): { lo: number; hi: number };
  /** intro events (arena, taunts, power negation, gravity, time stop) */
  start(): BattleEvent[];
  /** the opponent commits to a move; the player gets a read whose accuracy depends on IQ */
  plan(): { shown: Move; acc: number };
  /** plays a round. Missing moves are chosen by the AI; missing round mods are rolled. */
  step(c0?: Move | null, c1?: Move | null, m0?: RoundMod | null, m1?: RoundMod | null): BattleEvent[];
  checkPhase(x: Side): void;
}

const isPhys = (x: Side) => (x.f.arch.k === 'brawler' && x.f.weapon.fists ? 3 : x.f.weapon.l) + x.tr.wlvl - x.wdebuff;
export const physOff = (x: Side) => 0.6 * x.s.str + 0.4 * x.s.wm + 0.5 * isPhys(x) + (x.f.ench.l || 0);
export const powOff = (x: Side) => (x.powOn && !x.f.power.passive ? 0.75 * x.s.pm + 0.25 * x.s.iq + 0.5 * x.f.power.l : -99);
const physTags = (x: Side) => [...x.f.weapon.t, ...(x.f.ench.t || []), ...(x.tr.breath ? [x.tr.breath] : [])];
const hitsWeak = (def: Side, tags: readonly string[]) => !!(def.f.weak.trig && tags.some((t) => def.f.weak.trig!.includes(t)));
export const canPower = (x: Side) => x.powOn && !x.f.power.passive && x.en >= POW_COST;
const isUnholy = (x: Side) => !!(x.f.race.unholy || x.tr.unholy);
const isImmune = (x: Side) => !!(x.f.race.immune || x.tr.immune);
/** Stat gaps matter with diminishing returns: the first 5 points fully, the rest at a third. */
export const softGap = (d: number) => {
  const a = Math.abs(d);
  return Math.sign(d) * (a <= 5 ? a : 5 + (a - 5) / 3);
};
const baseDmg = (rng: Rng, off: number, def: number) => 10 * Math.pow(1.17, softGap(off - def)) * rnd(rng, 0.8, 1.2);
const gxOf = (x: Side) => (x.syn.has('tank2') ? 0.15 : clamp(x.tr.guardX + x.tr.guardAdd, 0.1, 0.9));
/** Tags an event with the synergy behind it, when the fighter has it (no effect on the fight). */
const synCue = (x: Side, k: string) => (x.syn.has(k) ? { syn: k, sb: x.i } : null);

/** How a fighter flavors a move: heavy or quick strikes, counters, overcharged powers, the odd fumble. */
export function aiFlavor(rng: Rng, me: Side, c: Move): [Move, RoundMod] {
  const r = rng();
  if (!me.f.isBoss && rng() < Math.max(0.01, 0.05 - me.s.iq * 0.003)) return ['fumble', {}];
  if (c === 'strike') {
    const h = 0.15 + me.s.str * 0.012;
    const j = 0.12 + me.s.spd * 0.012;
    if (r < h) return ['strike', { dmgX: 1.45, slow: 1, label: 'Heavy blow' }];
    if (r < h + j) return ['strike', { dmgX: 0.75, first: 1, label: 'Quick jab' }];
  }
  if (c === 'guard') {
    if (r < 0.12 + me.s.iq * 0.012) return ['guard', { counterX: 1.7, label: 'Counter' }];
    if (r < 0.2 + me.s.spd * 0.01) return ['dodge', { dodge: 0.45 }];
  }
  if (c === 'power' && me.en >= 40 && r < 0.2 + me.s.pm * 0.01) return ['power', { dmgX: 1.4, enCost: 15, label: 'Overcharge' }];
  return [c, {}];
}

/** Who wins the read: the triangle, plus feints that bait guards and get punished by attacks. */
export function beatsMove(a: Move, b: Move): boolean {
  if (BEATS[a] === b) return true;
  if (a === 'feint' && b === 'guard') return true;
  if ((a === 'strike' || a === 'power') && (b === 'feint' || b === 'focus')) return true;
  return false;
}

/** Signature wheel weights: mastery tilts it toward the big slices. */
export function ultWeights(x: Side): number[] {
  const pm = Math.max(x.s.pm, x.s.wm);
  return [Math.max(0.35, 2 - pm * 0.12), 3, 2.4 + pm * 0.1, 1 + pm * 0.08, 0.3 + pm * 0.04];
}
export function ultRoll(rng: Rng, x: Side) {
  const w = ultWeights(x);
  return ULT_WHEEL[pickW(rng, w.map((v) => ({ w: v })))]!;
}

/** AI move choice: plays to its strengths and adapts to the opponent's recent habits. */
export function autoChoice(rng: Rng, me: Side, op: Side, hist: Move[] | undefined): Move {
  if (me.en >= 100 && rng() < 0.85) return 'ult';
  const w: Record<string, number> = { strike: 1, power: 0, guard: 0.45, feint: 0.18, focus: me.en >= 55 && me.en < 100 ? 0.35 : 0.1 };
  if (canPower(me)) {
    const po = physOff(me);
    const wo = powOff(me);
    const dpw = wo + (hitsWeak(op, me.f.power.t) ? 2 : 0) - (po + (hitsWeak(op, physTags(me)) ? 2 : 0));
    w.power = clamp(1 + dpw * 0.35, 0.25, 3);
  }
  if (me.hp / me.maxHp < 0.4) w.guard! *= 1.6;
  if (op.en >= 100) w.guard! *= 1.8;
  if (hist && hist.length >= 2) {
    const smart = clamp(0.15 + me.s.iq * 0.05 + me.tr.readB + (me.f.aiSkill || 0), 0, 0.92);
    const c: Record<string, number> = { strike: 0, power: 0, guard: 0 };
    hist.slice(-3).forEach((m) => {
      if (c[m] != null) c[m]++;
    });
    const fav = Object.keys(c).sort((a, b) => c[b]! - c[a]!)[0]!;
    if (c[fav]! >= 2 && rng() < smart) {
      const ctr = Object.keys(BEATS).find((k) => BEATS[k] === fav)!;
      if (w[ctr]! > 0) w[ctr]! *= 3.5;
      if (fav === 'guard') w.feint! *= 4;
    }
  }
  const ai = (me.f.stance && me.f.stance.ai) || {};
  for (const k in ai) if (w[k]! > 0) w[k]! *= ai[k as keyof typeof ai]!;
  const arr = Object.keys(w)
    .filter((k) => w[k]! > 0)
    .map((k) => ({ k, w: w[k]! }));
  return arr[pickW(rng, arr)]!.k as Move;
}

export function newBattle(A: Fighter, B: Fighter, rng: Rng, opts: BattleOpts = {}): Battle {
  const quiet = !!opts.quiet;
  const ctx = opts.ctx ?? {};
  const AR: Partial<Arena> = opts.arena || {};
  const MAXR = opts.maxRounds || 12;
  const SD = !!opts.suddenDeath;
  let sdMult = 1;
  const mods = opts.mods || [{}, {}];

  const mk = (f: Fighter, i: 0 | 1): Side => {
    const s = eff(f, ctx);
    const tr = traitsOf(f);
    if (AR.stat) for (const k in AR.stat) s[k as keyof Stats] = clamp(s[k as keyof Stats] + AR.stat[k as keyof Stats]!, 1, 20);
    const mod = mods[i] || {};
    const hp0 = (mods[i] && mods[i]!.maxHp) || f.maxHp || 100;
    const x: Side = {
      i, f, s, tr, mod, maxHp: hp0, hp: hp0,
      poison: 0, frozen: 0, frzFx: '', frzTxt: '', soaked: AR.soak ? 3 : 0, burning: 0, wdebuff: 0, acts: 0,
      revived: 0, plot: 0, rev2: 0, mir: 0, uno: 0, powOn: f.power.k !== 'none', weakShown: 0, rate: rate(f, ctx), en: 50,
      guard: 0, move: null, syn: new Set(synOf(f).map((q) => q.k)),
      st: { dodges: 0, combos: 0, rps: 0, taken: 0, ults: 0, guards: 0 }, snacked: 0,
      buffs: [], summoned: {}, ls: 1, rm: {},
    };
    if (AR.unholyMod && isUnholy(x)) for (const k in AR.unholyMod) s[k as keyof Stats] = clamp(s[k as keyof Stats] + AR.unholyMod[k as keyof Stats]!, 1, 20);
    if (f.chaos.k === 'sponsor') x.en = 100;
    if (x.mod.en) x.en = x.mod.en;
    if (x.mod.hp) x.hp = x.mod.hp;
    if (tr.startEn) x.en = Math.min(100, x.en + tr.startEn);
    if ((s.cha || 5) > 6) x.en = Math.min(100, x.en + Math.round(((s.cha || 5) - 6) * 1.5));
    x.ls = LS(f);
    return x;
  };
  const bsum = (x: Side, k: BuffKey) => (x.buffs ? x.buffs.reduce((a, b) => a + (b.k === k ? b.v : 0), 0) : 0);
  const P: [Side, Side] = [mk(A, 0), mk(B, 1)];
  let ev: BattleEvent[] = [];
  const N = (x: Side) => `{${x.i}}`;
  const fill = (tpl: string | undefined, a: Side, b?: Side) =>
    String(tpl || '{a} hesitates')
      .replace(/\{a\}/g, N(a))
      .replace(/\{b\}/g, b ? N(b) : '')
      .replace(/\{x\}/g, N(a));
  const alive = (x: Side) => x.hp > 0;
  const both = () => alive(P[0]) && alive(P[1]);
  const gain = (x: Side, n: number) => {
    x.en = clamp(x.en + n, 0, 100);
  };
  const hurt = (x: Side, d: number) => {
    x.hp -= d;
    x.st.taken += Math.max(0, d);
  };
  const freeze = (x: Side, fx: string, txt: string) => {
    x.frozen = 1;
    x.frzFx = fx;
    x.frzTxt = txt;
  };
  const real = (x: Side, v: number) => Math.round(v * (x.ls || 1));
  const snap = (): Snap => ({
    mo: P.map((x) => x.mom || 0),
    h: P.map((x) => Math.max(0, Math.ceil((x.hp / x.maxHp) * 100))),
    hr: P.map((x) => (x.hp <= 0 ? 0 : Math.max(1, Math.round(x.hp * (x.ls || 1))))),
    mx: P.map((x) => Math.round(x.maxHp * (x.ls || 1))),
    en: P.map((x) => Math.round(x.en)),
    st: P.map((x) => ({ frozen: !!x.frozen, poison: x.poison > 0, guard: !!x.guard, soaked: x.soaked > 0, burning: x.burning > 0 })),
    sx: P.map(statusChips),
    r: bt.round,
  });
  function log(text: string, cls?: string, d?: number | null, pills?: string[], a?: Anim) {
    if (quiet) return;
    const ti = a && (a.to != null ? a.to : a.on);
    const k = ti != null && P[ti] ? P[ti]!.ls || 1 : 1;
    ev.push({ text, cls: cls || '', d: d == null ? null : Math.max(1, Math.round(d * k)), pills: pills || [], a: a || null, ...snap() });
  }
  const flush = () => {
    const o = ev;
    ev = [];
    return o;
  };

  function checkDown(t: Side) {
    if (t.hp > 0) return;
    if (t.mod.revive && !t.salt) {
      t.salt = 1;
      t.hp = t.mod.revive;
      log(`🧂 Smelling salts! ${N(t)} is back with ${real(t, t.hp)} HP`, 'special', null, [], { t: 'revive', on: t.i, fx: '🧂' });
      return;
    }
    if (t.f.chaos.k === 'plot' && !t.plot) {
      t.plot = 1;
      t.hp = 1;
      log(`📜 Plot armor! ${N(t)} refuses to go down`, 'special', null, [], { t: 'revive', on: t.i, fx: '📜' });
    } else if (t.f.arch.k === 'necro' && !t.revived) {
      t.revived = 1;
      t.hp = t.syn.has('bonelord') ? 60 : 35;
      log(`⚰️ ${N(t)} rises from the dead with ${real(t, t.hp)} HP`, 'special', null, [], { t: 'revive', on: t.i, fx: '⚰️', ...synCue(t, 'bonelord') });
    } else if (t.tr.revive && !t.rev2) {
      t.rev2 = 1;
      t.hp = t.tr.revive;
      log(`🪦 ${N(t)} gets back up with ${real(t, t.hp)} HP`, 'special', null, [], { t: 'revive', on: t.i, fx: '🪦' });
    } else if (t.powOn && t.f.power.k === 'miracle' && !t.mir) {
      t.mir = 1;
      t.hp = 50;
      log(`🙏 A miracle! ${N(t)} is back with ${real(t, 50)} HP`, 'special', null, [], { t: 'revive', on: t.i, fx: '🙏' });
    }
  }

  type Kind = 'strike' | 'power' | 'ult' | Move;
  /** One hit's damage. `fix` (a base roll, 0.8 to 1.2) makes it a preview: no draws, no crit, nothing used up. */
  function calc(att: Side, def: Side, off: number, tags: readonly string[], kind: Kind, fix?: number) {
    let defL = def.s.dur;
    const note: string[] = [];
    let mult = 1;
    let combo: string | null = null;
    if (kind === 'power' && att.f.power.k === 'reality' && fix == null && rng() < 0.3) {
      defL = 2;
      note.push('reality');
    }
    const d = fix == null ? baseDmg(rng, off, defL) : 10 * Math.pow(1.17, softGap(off - defL)) * fix;
    if (hitsWeak(def, tags)) {
      mult *= 1.8;
      note.push('weak');
    } else if (kind === 'power' && def.f.weak.magicWeak) {
      mult *= 1.4;
      note.push('weak');
    }
    if (def.f.weak.cocky && def.hp / def.maxHp > 0.7) mult *= 1.25;
    if (def.tr.bluntDR && tags.includes('blunt')) mult *= 1 - def.tr.bluntDR;
    if (tags.includes('lightning') && def.soaked) {
      mult *= 2;
      combo = 'Electrocuted';
    } else if (tags.includes('blunt') && def.frozen) {
      mult *= 2;
      combo = 'Shatter';
    } else if (tags.includes('wind') && def.burning) {
      mult *= 1.6;
      combo = 'Fanned flames';
    } else if (tags.includes('sonic') && def.frozen) {
      mult *= 1.8;
      combo = 'Resonance';
    } else if (tags.includes('plant') && def.soaked) {
      mult *= 1.4;
      combo = 'Overgrowth';
    } else if (tags.includes('ice') && def.soaked && !def.frozen) {
      combo = 'Flash freeze';
    } else if (tags.includes('fire') && def.soaked) {
      mult *= 0.6;
      note.push('fizzle');
    }
    const cc =
      att.f.chaos.k === 'badluck'
        ? 0
        : 0.06 + ((att.rm && att.rm.critPlus) || 0) + bsum(att, 'critB') + att.s.iq * 0.008 + ((att.s.cha || 5) - 6) * 0.004 +
          (att.f.arch.k === 'assassin' ? 0.12 : 0) + (att.powOn && att.f.power.k === 'luck' ? 0.1 : 0) + (att.syn.has('backstab') ? 0.15 : 0) +
          (kind === 'ult' ? 0.15 : 0) + att.tr.critB + (att.f.ench.k === 'lucky' ? 0.1 : 0) + (AR.critB || 0);
    if (fix == null && rng() < cc) {
      mult *= def.f.weak.k === 'jaw' ? 2.2 : 1.6;
      note.push('crit');
    }
    let th = att.tr.rage;
    if (att.f.arch.k === 'berserker') th = Math.max(th, att.tr.rageAt != null ? att.tr.rageAt : att.syn.has('feral') ? 70 : 50);
    if ((att.hp / att.maxHp) * 100 < th) mult *= 1.35;
    if ((att.f.arch.k === 'slayer' || att.f.ench.k === 'godslayer') && def.rate > att.rate) mult *= 1.4;
    if (att.f.arch.k === 'paladin' && isUnholy(def)) mult *= 1.5;
    const ac = att.f.chaos.k;
    const dc = def.f.chaos.k;
    if (ac === 'main') mult *= 1.12;
    if (ac === 'cooked') mult *= 0.88;
    if (ac === 'unhinged') mult *= fix == null ? rnd(rng, 0.4, 2.2) : 1.3;
    if (att.syn.has('comedy') && fix == null && rng() < 0.1) {
      mult *= 3;
      note.push('comedy');
    }
    mult *= att.tr.dmgX * (att.mod.dmgX || 1) * ((att.rm && att.rm.dmgX) || 1) * sdMult;
    mult *= (att.ls || 1) / (def.ls || 1);
    mult *= (1 + bsum(att, 'dmgX')) * Math.max(0.3, 1 - bsum(att, 'weak')) * (1 + bsum(def, 'vuln')) * Math.max(0.3, 1 - bsum(def, 'dr'));
    {
      const r = att.rm || {};
      if (r.unholyX && isUnholy(def)) mult *= r.unholyX;
      if (r.behindBonus && att.hp / att.maxHp < def.hp / def.maxHp) mult *= 1 + r.behindBonus;
      if (r.lowBonus && att.hp / att.maxHp < 0.5) mult *= 1 + r.lowBonus;
      if (r.lowTargetBonus && def.hp / def.maxHp < 0.5) mult *= 1 + r.lowTargetBonus;
    }
    if (AR.dark) mult *= att.tr.darkX;
    if (att.hp / att.maxHp < def.hp / def.maxHp) mult *= att.tr.behindX;
    if (att.hp / att.maxHp < 0.25) mult *= att.tr.clutchX;
    if (kind === 'strike') mult *= att.tr.strikeX;
    if (kind === 'ult') mult *= att.tr.ultX * (AR.ultX || 1) * (att.ultMul || 1);
    // (legacy guarded this with an "is it an extra hit" check that can never be true: extra hits
    // arrive as strikes, so feint openers and focus apply to whichever hit lands next)
    {
      if (att.opened) {
        mult *= 1.4;
        if (fix == null) att.opened = 0;
      }
      if (att.focused) {
        mult *= 1.25;
        if (fix == null) att.focused = 0;
      }
    }
    if (def.exposed) mult *= 1 + def.exposed;
    if (att.mom) mult *= 1 + 0.1 * att.mom;
    let am = 1;
    if (AR.tag) for (const t of new Set(tags)) if (AR.tag[t]) am *= AR.tag[t]!;
    if (kind === 'power' && AR.powX && AR.powX[att.f.power.k]) am *= AR.powX[att.f.power.k]!;
    if (kind === 'strike' && AR.weaponX && AR.weaponX[att.f.weapon.n]) am *= AR.weaponX[att.f.weapon.n]!;
    if (AR.raceX && AR.raceX[att.f.race.n]) am *= AR.raceX[att.f.race.n]!;
    if (AR.allX) am *= AR.allX;
    mult *= am;
    if (dc === 'main') mult *= 0.9;
    if (dc === 'cooked') mult *= 1.1;
    mult *= clamp(1 - def.tr.dr, 0.3, 1.5);
    if (def.powOn && def.f.power.k === 'ward') mult *= 0.8;
    if (def.guard && !(att.rm && att.rm.pierce)) {
      mult *= kind === 'strike' ? gxOf(def) * 0.5 : gxOf(def);
      note.push('guard');
    }
    return { d: d * mult, note, combo };
  }

  function act(att: Side, def: Side, kind: Kind, extra?: boolean): void {
    if (!both()) return;
    const pw = kind === 'power';
    const ult = kind === 'ult';
    const po = physOff(att);
    const wo = powOff(att);
    let off: number;
    let tags: readonly string[];
    let fx: string;
    let tpl: string | undefined;
    let ak: string;
    if (ult) {
      const usePw = wo > po;
      off = Math.max(po, wo) + 2;
      tags = usePw ? att.f.power.t : physTags(att);
      fx = att.f.arch.e;
      ak = 'ult';
    } else if (pw) {
      off = wo;
      tags = att.f.power.t;
      fx = att.f.power.e;
      tpl = att.f.power.v;
      ak = 'power';
    } else {
      off = po;
      tags = physTags(att);
      fx = att.f.weapon.proj || att.f.weapon.e;
      tpl = att.f.weapon.v;
      ak = att.f.weapon.ranged ? 'ranged' : 'melee';
    }
    if (!ult && att.syn.has('selfown') && hitsWeak(att, tags) && rng() < 0.15) {
      const d = baseDmg(rng, off, att.s.dur) * 0.6;
      hurt(att, d);
      log(`🫵 ${N(att)}'s attack backfires. Allergic to their own kit`, 'miss', d, [], { t: 'self', on: att.i, fx: '🫵', syn: 'selfown', sb: att.i });
      checkDown(att);
      return;
    }
    if (pw && att.f.power.k === 'mind') {
      const c = clamp(0.25 + 0.04 * (att.s.pm - def.s.iq) + (def.f.weak.k === 'mind' ? 0.2 : 0), 0.05, 0.65);
      if (rng() < c) {
        const d = baseDmg(rng, physOff(def), def.s.dur);
        hurt(def, d);
        log(`🌀 ${N(att)} takes over ${N(def)}'s mind. ${N(def)} punches themself`, 'special', d, [], { t: 'self', on: def.i, fx: '🌀', tint: 'mind' });
        checkDown(def);
        return;
      }
    }
    if (!ult) {
      const ill = def.powOn && def.f.power.k === 'illusion';
      const dg =
        clamp(0.04 + (def.s.spd - att.s.spd) * 0.05, 0, 0.35) + (def.f.arch.k === 'trickster' ? 0.15 : 0) + (def.powOn && def.f.power.k === 'tele' ? 0.12 : 0) +
        (def.powOn && def.f.power.k === 'luck' ? 0.08 : 0) + (ill ? 0.15 : 0) + def.tr.dodgeB + (AR.dodgeB || 0) - (ak === 'ranged' ? 0.1 : 0) + (def.sidestep || 0);
      if (!(att.rm && att.rm.nododge) && rng() < clamp(dg, 0, def.sidestep ? 0.85 : 0.6)) {
        def.st.dodges++;
        // the narration line is picked even when nobody reads it: it draws from the RNG
        const line = ill && rng() < 0.6 ? `🪞 ${N(att)} attacks an illusion of ${N(def)}` : fill(pick(rng, DODGE), att, def);
        log(line, 'miss', null, [], { t: 'miss', by: att.i, to: def.i, fx, kind: ak });
        return;
      }
    }
    let breaking = false;
    if (pw && def.guard) {
      breaking = true;
      def.guard = 0;
      def.en = Math.max(0, def.en - 25);
    }
    const r = calc(att, def, off, tags, kind);
    let d = r.d;
    const note = r.note;
    if (!ult) {
      if (kind === 'strike' && def.move === 'power') {
        d *= 1.35;
        note.push('caught');
      }
      if (pw && def.move === 'strike') {
        d *= 0.3;
        note.push('interrupted');
      }
      if (breaking) {
        d *= 1.35;
        note.push('broke');
      }
    }
    if (!ult && def.f.weapon.uno && !def.uno && d >= 8) {
      def.uno = 1;
      hurt(att, d);
      log(`🃏 ${N(def)} plays the Uno reverse card. ${N(att)} eats their own attack`, 'special', d, [], { t: 'uno', by: def.i, to: att.i, fx: '🃏' });
      checkDown(att);
      return;
    }
    hurt(def, d);
    gain(def, 8);
    if (r.combo) att.st.combos++;
    const pills: string[] = [];
    for (const p of ['crit', 'weak', 'guard', 'broke', 'interrupted', 'caught']) if (note.includes(p) && !(p === 'guard' && breaking)) pills.push(p);
    if (r.combo) pills.push('combo:' + r.combo);
    let line = ult ? `💥 ${N(att)} unleashes ${ULTS[att.f.arch.k]} on ${N(def)}` : fill(tpl, att, def) + (extra ? ' again' : '');
    if (note.includes('reality')) line += '. Reality bends';
    if (note.includes('comedy')) line += '. The bit kills';
    if (note.includes('fizzle')) line += '. The water puts it out';
    const tint = ult
      ? tintOf(tags) || 'ult'
      : pw
        ? tintOf(tags) || (['time', 'reality', 'arcane'].includes(att.f.power.k) ? att.f.power.k : '')
        : tintOf(tags);
    log(line, ult ? 'ult' : '', d, pills, {
      t: ult ? 'ult' : 'hit', by: att.i, to: def.i, fx, kind: ak, spin: !!(pw && att.f.power.spin), tint, crit: note.includes('crit'),
      weak: note.includes('weak'), guarded: note.includes('guard') && !breaking, combo: r.combo, broke: breaking, name: ult ? ULTS[att.f.arch.k] : '',
      ...(note.includes('comedy')
        ? synCue(att, 'comedy')
        : extra && (att.syn.has('speed') || att.syn.has('storm2'))
          ? synCue(att, att.syn.has('speed') ? 'speed' : 'storm2')
          : note.includes('crit')
            ? synCue(att, 'backstab')
            : note.includes('guard') && !breaking
              ? synCue(def, 'tank2')
              : null),
    });
    if (r.combo === 'Flash freeze' && alive(def)) freeze(def, '🧊', 'is frozen solid');
    if (r.combo === 'Shatter') def.frozen = 0;
    if (r.combo === 'Electrocuted') def.soaked = 0;
    if (note.includes('fizzle')) def.soaked = 0;
    else if (alive(def)) {
      if (tags.includes('water')) def.soaked = Math.max(def.soaked, 2);
      if (tags.includes('fire') && (pw || ult || rng() < 0.5)) {
        if (!def.burning) log(`🔥 ${N(def)} catches fire`, 'special', null, [], { t: 'status', on: def.i, fx: '🔥', tint: 'fire' });
        def.burning = 2;
      }
    }
    if (note.includes('weak') && !def.weakShown) {
      def.weakShown = 1;
      log(`${def.f.weak.e} ${N(att)} found ${N(def)}'s weakness: ${def.f.weak.n.toLowerCase()}`, 'special', null, [], { t: 'status', on: def.i, fx: def.f.weak.e });
    }
    const fb = AR.freezeB || 0;
    if (pw) {
      const k = att.f.power.k;
      const stun = (p: number, fxs: string, txt: string) => {
        if (alive(def) && !def.frozen && rng() < p) {
          freeze(def, fxs, txt);
          log(`${fxs} ${N(def)} ${txt}`, 'special', null, [], { t: 'status', on: def.i, fx: fxs, tint: k === 'ice' ? 'ice' : '', ...(k === 'ice' ? synCue(att, 'zero') : null) });
        }
      };
      if (k === 'ice') stun((att.syn.has('zero') ? 0.35 : 0.15) + fb, '🧊', 'is frozen solid');
      if (k === 'chains') stun(0.2, '⛓️', 'is locked in chains');
      if (k === 'earth') stun(0.15, '💫', 'is staggered');
      if (k === 'sonic') stun(0.15, '😵', 'is stunned');
      if (k === 'vines') stun(0.25, '🌿', 'is tangled in vines');
      if (k === 'lightning' && alive(def) && rng() < (att.syn.has('storm') ? 0.36 : 0.12)) {
        const d2 = d * 0.4;
        hurt(def, d2);
        log(`⚡ The lightning chains for more`, '', d2, [], { t: 'hit', by: att.i, to: def.i, fx: '⚡', kind: 'power', tint: 'lightning', ...synCue(att, 'storm') });
      }
      if (k === 'drain') {
        const h = Math.min(att.maxHp - att.hp, d * 0.5);
        if (h >= 3) {
          att.hp += h;
          log(`🩸 ${N(att)} drinks ${real(att, h)} HP`, 'heal', h, [], { t: 'heal', on: att.i });
        }
      }
      if (k === 'poison' && !isImmune(def)) def.poison = Math.min(20, def.poison + (2 + att.s.pm * 0.4) * (def.f.weak.k === 'stomach' ? 2 : 1));
      if (k === 'boom' && rng() < 0.15) {
        const sd = d * 0.3;
        hurt(att, sd);
        log(`💣 ${N(att)} gets caught in the blast`, 'miss', sd, [], { t: 'self', on: att.i, fx: '💣', tint: 'fire' });
        checkDown(att);
      }
      if (k === 'magnet' && def.wdebuff < 3 && alive(def)) {
        def.wdebuff++;
        log(`🧲 ${N(def)}'s weapon gets bent out of shape`, 'special', null, [], { t: 'status', on: def.i, fx: '🧲' });
      }
      if (k === 'time' && alive(def) && rng() < 0.25) {
        checkDown(def);
        if (both()) {
          log(`⏱️ ${N(att)} stops time again`, 'special', null, [], { t: 'timestop', by: att.i });
          act(att, def, 'power', true);
        }
        return;
      }
    } else if (!ult) {
      const e = att.f.ench.k;
      if (e === 'vamp') {
        const h = Math.min(att.maxHp - att.hp, d * (att.syn.has('blood') ? 0.6 : 0.3));
        if (h >= 3) {
          att.hp += h;
          log(`🩸 ${N(att)} drains ${real(att, h)} HP back`, 'heal', h, [], { t: 'heal', on: att.i, ...synCue(att, 'blood') });
        }
      }
      if (e === 'frost' && alive(def) && !def.frozen && rng() < (att.syn.has('zero') ? 0.25 : 0.1) + fb) {
        freeze(def, '🧊', 'is frozen solid');
        log(`❄️ ${N(def)} is frozen solid`, 'special', null, [], { t: 'status', on: def.i, fx: '🧊', tint: 'ice', ...synCue(att, 'zero') });
      }
      if (e === 'cursed' && rng() < 0.1) {
        hurt(att, 6);
        log(`🕳️ The cursed weapon bites ${N(att)} back`, '', 6, [], { t: 'self', on: att.i, fx: '🕳️' });
        checkDown(att);
      }
      const vn = att.tr.venom + (e === 'venom' ? 3 : 0);
      if (vn && !isImmune(def)) def.poison = Math.min(20, def.poison + vn);
      if (att.tr.drain) {
        const s = Math.min(def.en, att.tr.drain);
        def.en -= s;
        gain(att, s / 2);
      }
      if (e === 'echo' && alive(def) && rng() < 0.2) {
        const ed = d * 0.5;
        hurt(def, ed);
        log(`🔁 The hit echoes`, '', ed, [], { t: 'hit', by: att.i, to: def.i, fx: '🔁', kind: 'power' });
      }
    }
    checkDown(def);
    if (def.guard && !ult && both()) {
      const cd = baseDmg(rng, physOff(def), att.s.dur) * (1 + def.tr.counterB) * ((def.rm && def.rm.counterX) || 1);
      hurt(att, cd);
      log(`↩️ ${N(def)} counters`, '', cd, [], { t: 'hit', by: def.i, to: att.i, fx: def.f.weapon.e, kind: 'melee' });
      checkDown(att);
    }
  }

  function turn(att: Side, def: Side, choice: Move) {
    if (!both()) return;
    att.acts++;
    if (att.frozen) {
      att.frozen = 0;
      log(`${att.frzFx || '🧊'} ${N(att)} ${att.frzTxt || 'is frozen'} and loses a turn`, 'miss', null, [], { t: 'skip', on: att.i, fx: att.frzFx || '🧊' });
      return;
    }
    rmPre(att, def, choice);
    if (choice === 'guard') return;
    const w = att.f.weak;
    if (w.firstSkip && att.acts === 1) {
      log(`🎤 ${N(att)} freezes up in front of the crowd`, 'miss', null, [], { t: 'skip', on: att.i, fx: '🎤' });
      return;
    }
    if (w.skip! > 0 && w.skip! < 1 && rng() < w.skip!) {
      log(fill(w.st, att), 'miss', null, [], { t: 'skip', on: att.i, fx: w.sfx });
      return;
    }
    const rz = (def.f.chaos.k === 'rizz' ? 0.12 : 0) + def.tr.rizz;
    if (rz > 0 && rng() < rz) {
      log(`😏 ${N(att)} gets distracted by ${N(def)}`, 'miss', null, [], { t: 'skip', on: att.i, fx: '😍' });
      return;
    }
    if (w.selfhit && rng() < w.selfhit) {
      hurt(att, 5);
      log(`❓ ${N(att)} forgets their own name and walks into a wall`, 'miss', 5, [], { t: 'self', on: att.i, fx: '❓' });
      checkDown(att);
      return;
    }
    if (att.f.chaos.k === 'lag' && rng() < 0.08) {
      log(`📶 ${N(att)} lags out`, 'miss', null, [], { t: 'skip', on: att.i, fx: '📶' });
      return;
    }
    if (choice === 'feint' || choice === 'focus' || choice === 'dodge' || choice === 'fumble') return;
    if (choice === 'ult') {
      att.en = 0;
      att.st.ults++;
      const u = att.ultSpin || ultRoll(rng, att);
      att.ultSpin = null;
      att.ultMul = u.m;
      log(`${u.e} ${N(att)}'s signature wheel lands on ${u.n.toLowerCase()} (×${u.m})`, u.k === 'whiff' ? 'miss' : 'special', null, [], {
        t: 'status', on: att.i, fx: u.e,
      });
    } else if (choice === 'power') att.en = Math.max(0, att.en - POW_COST - ((att.rm && att.rm.enCost) || 0));
    else gain(att, 25);
    const r = att.rm || {};
    if (r.gamble) {
      if (rng() < 0.5) {
        r.dmgX = 3;
        log(`🪙 Heads! ${N(att)} goes all out`, 'special', null, [], { t: 'status', on: att.i, fx: '🪙' });
      } else {
        log(`🪙 Tails. ${N(att)} whiffs`, 'miss', null, [], { t: 'miss', on: att.i });
        return;
      }
    }
    if (r.miss && rng() < r.miss) {
      log(`💨 ${N(att)} tries ${r.label || 'it'} and misses`, 'miss', null, [], { t: 'miss', on: att.i });
      return;
    }
    const hp0 = def.hp;
    const nh = r.hits || 1;
    for (let h = 0; h < nh && both(); h++) act(att, def, choice, h > 0);
    const dealt = hp0 - def.hp;
    if (dealt > 0) {
      if (r.drainX) {
        const hh = Math.min(att.maxHp - att.hp, Math.round(dealt * r.drainX));
        if (hh > 0) {
          att.hp += hh;
          log(`🩸 ${N(att)} drains ${real(att, hh)} HP`, 'heal', hh, [], { t: 'heal', on: att.i });
        }
      }
      if (r.apply) applyStatus(att, def, r.apply);
      if (r.debuff) applyDebuff(att, def, r.debuff, r.label);
      if (r.steal) stealEn(att, def, r.steal);
      if (r.petNow && att.tr.pets.length)
        for (let k = 0; k < r.petNow && both(); k++) {
          const p = att.tr.pets[k % att.tr.pets.length]!;
          // left to right, exactly as legacy: the float rounding has to match
          const d = Math.max(1, Math.round((7 * (p.x || 1) * rnd(rng, 0.8, 1.2) * (att.ls || 1)) / (def.ls || 1)));
          hurt(def, d);
          log(`${p.e} ${N(att)}'s ${p.n} attacks`, 'hit', d, [], { t: 'pet', by: att.i, to: def.i, fx: p.e });
          checkDown(def);
        }
    }
    checkPhase(def);
    checkPhase(att);
    const ex =
      (att.s.spd > def.s.spd ? (att.s.spd - def.s.spd) * 0.08 : 0) + (att.syn.has('speed') ? 0.2 : 0) + att.tr.extra + (att.f.ench.k === 'swift' ? 0.15 : 0) +
      (att.syn.has('storm2') ? 0.15 : 0) + (att.f.chaos.k === 'lag' ? 0.1 : 0);
    if (choice !== 'ult' && both() && rng() < Math.min(0.6, ex)) act(att, def, 'strike', true);
  }

  function applyStatus(_att: Side, def: Side, a: { s: StatusKey; ch: number }) {
    if (!def || def.hp <= 0 || rng() >= (a.ch == null ? 1 : a.ch)) return;
    let st = a.s;
    if (st === 'random') st = pick(rng, ['burn', 'freeze', 'poison', 'soak'] as const);
    if (st === 'burn') {
      def.burning = Math.max(def.burning || 0, 2);
      log(`🔥 ${N(def)} catches fire`, 'special', null, [], { t: 'status', on: def.i, fx: '🔥' });
    } else if (st === 'poison' || st === 'bleed') {
      if (st === 'bleed' || !isImmune(def)) {
        def.poison = Math.min(20, (def.poison || 0) + 4);
        log(`${st === 'bleed' ? '🩸' : '🧪'} ${N(def)} is ${st === 'bleed' ? 'bleeding' : 'poisoned'}`, 'special', null, [], {
          t: 'status', on: def.i, fx: st === 'bleed' ? '🩸' : '🧪',
        });
      }
    } else if (st === 'freeze' || st === 'stun') {
      if (!def.frozen) {
        freeze(def, st === 'stun' ? '💫' : '🧊', st === 'stun' ? 'is stunned' : 'is frozen solid');
        log(`${st === 'stun' ? '💫' : '🧊'} ${N(def)} ${st === 'stun' ? 'is stunned' : 'freezes over'}`, 'special', null, [], {
          t: 'status', on: def.i, fx: st === 'stun' ? '💫' : '🧊',
        });
      }
    } else if (st === 'soak') {
      def.soaked = Math.max(def.soaked || 0, 2);
      log(`💧 ${N(def)} is soaked`, 'special', null, [], { t: 'status', on: def.i, fx: '💧' });
    }
  }
  function applyDebuff(_att: Side, def: Side, d: { k: BuffKey; v: number; r: number }, label?: string) {
    def.buffs.push({ k: d.k, v: d.v, r: d.r });
    log(`${d.k === 'vuln' ? '🎯' : '🌀'} ${N(def)} ${d.k === 'vuln' ? 'is exposed' : 'is weakened'}${label ? ` by ${label}` : ''}`, 'special', null, [], {
      t: 'status', on: def.i, fx: d.k === 'vuln' ? '🎯' : '🌀',
    });
  }
  function stealEn(att: Side, def: Side, n: number) {
    const t = Math.min(def.en, n);
    if (t > 0) {
      def.en -= t;
      gain(att, t);
      log(`⚡ ${N(att)} steals ${t} energy`, 'special', null, [], { t: 'status', on: att.i, fx: '⚡' });
    }
  }
  /** Effects of a named move that happen before it lands (heals, buffs, summons, wishes). */
  function rmPre(att: Side, def: Side, choice: Move) {
    const r = att.rm;
    if (!r || !r.label) return;
    if (r.selfDmg) {
      hurt(att, r.selfDmg);
      log(`🩸 ${N(att)} pays ${real(att, r.selfDmg)} HP for ${r.label}`, 'miss', r.selfDmg, [], { t: 'self', on: att.i, fx: '🩸' });
    }
    if (r.heal || r.healMissing) {
      const h = Math.round(Math.min(att.maxHp - att.hp, (r.heal || 0) + (r.healMissing ? (att.maxHp - att.hp) * r.healMissing : 0)));
      if (h > 0) {
        att.hp += h;
        log(`💚 ${N(att)} uses ${r.label}`, 'heal', h, [], { t: 'heal', on: att.i });
      }
    }
    if (r.en) gain(att, r.en);
    if (r.cleanse) {
      att.burning = 0;
      att.poison = 0;
    }
    if (r.buff) {
      att.buffs.push({ k: r.buff.k, v: r.buff.v, r: r.buff.r });
      if (r.buff.k !== 'vuln') log(`✨ ${N(att)} uses ${r.label}`, 'special', null, [], { t: 'status', on: att.i, fx: '✨' });
    }
    if (r.summon && !att.summoned[r.label]) {
      att.summoned[r.label] = 1;
      att.tr.pets.push(r.summon);
      log(`${r.summon.e} ${N(att)} calls ${r.summon.n} into the fight`, 'special', null, [], { t: 'status', on: att.i, fx: r.summon.e });
    }
    if (r.wish) {
      const k = Math.floor(rng() * 3);
      if (k === 0) {
        const h = Math.min(att.maxHp - att.hp, 30);
        att.hp += h;
        log(`🧞 A wish: +${real(att, h)} HP`, 'heal', h, [], { t: 'heal', on: att.i });
      } else if (k === 1) {
        gain(att, 100);
        log('🧞 A wish: full energy', 'special', null, [], { t: 'status', on: att.i, fx: '🧞' });
      } else {
        att.buffs.push({ k: 'critB', v: 0.5, r: 2 });
        log('🧞 A wish: +50% crit', 'special', null, [], { t: 'status', on: att.i, fx: '🧞' });
      }
    }
    if (!['strike', 'power'].includes(choice)) {
      if (r.debuff) applyDebuff(att, def, r.debuff, r.label);
      if (r.apply) applyStatus(att, def, r.apply);
      if (r.steal) stealEn(att, def, r.steal);
    }
  }
  /** Bosses power up once, the first time they drop to half HP. */
  function checkPhase(x: Side) {
    const ph = x.f.phase;
    if (!ph || x.phased || x.hp <= 0 || x.hp > x.maxHp * 0.5) return;
    x.phased = 1;
    if (ph.m) for (const k in ph.m) x.s[k as keyof Stats] = clamp(x.s[k as keyof Stats] + ph.m[k as keyof Stats]!, 1, 20);
    if (ph.fx)
      for (const k in ph.fx) {
        const v = ph.fx[k]!;
        const tr = x.tr as unknown as Record<string, number>;
        if (['strikeX', 'dmgX', 'ultX'].includes(k)) tr[k]! *= v;
        else if (typeof v === 'number') tr[k] = (tr[k] || 0) + v;
      }
    const h = Math.round(x.maxHp * 0.12);
    x.hp = Math.min(x.maxHp, x.hp + h);
    log(`${ph.txt}`, 'special', null, [], { t: 'phase', on: x.i, text: 'Phase two' });
  }
  function finish() {
    bt.over = true;
    let w: 0 | 1;
    if (alive(P[0]) && !alive(P[1])) w = 0;
    else if (alive(P[1]) && !alive(P[0])) w = 1;
    else if (!alive(P[0]) && !alive(P[1])) {
      w = P[0].hp / P[0].maxHp >= P[1].hp / P[1].maxHp ? 0 : 1;
      P[w].hp = 1;
      log(`💥 Double knockout. ${N(P[w])} gets up first`, 'special', null, [], { t: 'revive', on: w, fx: '💥' });
    } else {
      w = P[0].hp / P[0].maxHp >= P[1].hp / P[1].maxHp ? 0 : 1;
      log(`🔔 Time! The judges give it to ${N(P[w])}`, 'special', null, [], { t: 'status', on: w, fx: '🔔' });
    }
    bt.w = w;
    if (!alive(P[1 - w]!)) log(`${N(P[1 - w]!)} is down. ${N(P[w])} wins`, 'ko', null, [], { t: 'ko', on: 1 - w, win: w });
    else log(`${N(P[w])} wins on points`, 'ko', null, [], { t: 'win', on: w });
  }

  const bt: Battle = {
    P,
    round: 0,
    over: false,
    w: null,
    hist: [[], []],
    planned: null,
    arena: AR,
    maxR: MAXR,
    sdOn: SD,
    snap,
    preview(i, kind, rm = {}, ultM = 1) {
      const att = P[i];
      const def = P[1 - i]!;
      const po = physOff(att);
      const wo = powOff(att);
      if (kind === 'power' && wo < 0) return null;
      const off = kind === 'ult' ? Math.max(po, wo) + 2 : kind === 'power' ? wo : po;
      const tags = kind === 'ult' ? (wo > po ? att.f.power.t : physTags(att)) : kind === 'power' ? att.f.power.t : physTags(att);
      const keep = { rm: att.rm, ultMul: att.ultMul, guard: def.guard };
      att.rm = rm;
      att.ultMul = ultM;
      def.guard = 0;
      try {
        // an unhinged fighter's hits swing from 0.4x to 2.2x (calc's preview uses the middle)
        const wild = att.f.chaos.k === 'unhinged' ? [0.4 / 1.3, 2.2 / 1.3] : [1, 1];
        const lo = calc(att, def, off, tags, kind, 0.8).d * wild[0]!;
        const hi = calc(att, def, off, tags, kind, 1.2).d * wild[1]!;
        const k = def.ls || 1;
        return { lo: Math.max(1, Math.round(lo * k)), hi: Math.max(1, Math.round(hi * k)), weak: hitsWeak(def, tags) };
      } finally {
        att.rm = keep.rm;
        att.ultMul = keep.ultMul;
        def.guard = keep.guard;
      }
    },
    counterPreview(i, rm = {}) {
      const me = P[i];
      const op = P[1 - i]!;
      const base = 10 * Math.pow(1.17, softGap(physOff(me) - op.s.dur)) * (1 + me.tr.counterB) * (rm.counterX || 1);
      const k = op.ls || 1;
      return { lo: Math.max(1, Math.round(base * 0.8 * k)), hi: Math.max(1, Math.round(base * 1.2 * k)) };
    },
    checkPhase,
    plan() {
      const m = autoChoice(rng, P[1], P[0], bt.hist[0]);
      bt.planned = m;
      const acc = clamp(
        0.68 + 0.05 * (P[0].s.iq - P[1].s.iq) + 0.012 * ((P[0].s.cha || 5) - (P[1].s.cha || 5)) + P[0].tr.readB + (P[0].mod.readB || 0) -
          (P[1].f.arch.k === 'trickster' ? 0.12 : 0) - (P[1].f.stance && P[1].f.stance.k === 'balanced' ? 0.1 : 0) - (P[1].tr.taunt ? 0.15 : 0) -
          (P[1].f.aiSkill || 0) * 0.3,
        0.3,
        0.95,
      );
      let shown = m;
      if (rng() > acc) {
        const others = (['strike', 'power', 'guard', 'ult', 'feint', 'focus'] as Move[]).filter(
          (x) => x !== m && (x !== 'ult' || P[1].en >= 100) && (x !== 'power' || canPower(P[1])),
        );
        if (others.length) shown = pick(rng, others);
      }
      return { shown, acc };
    },
    start() {
      if (AR.k) log(`${AR.e} ${AR.n}`, 'special', null, [], { t: 'banner', text: AR.n });
      const pairs: [Side, Side][] = [
        [P[0], P[1]],
        [P[1], P[0]],
      ];
      for (const [me, op] of pairs)
        if (me.tr.taunt) {
          op.en = Math.max(0, op.en - 15);
          log(`🗯️ ${N(me)} talks trash. ${N(op)} loses 15 energy`, 'special', null, [], { t: 'status', on: op.i, fx: '🗯️' });
        }
      for (const [me, op] of pairs) {
        if (me.f.power.k === 'negate' && op.powOn && op.f.power.k !== 'none' && op.f.power.k !== 'negate') {
          op.powOn = false;
          log(`🚫 ${N(me)} shuts off ${N(op)}'s ${op.f.power.n.toLowerCase()}. Powerless now 💀`, 'special', null, [], { t: 'status', on: op.i, fx: '🚫' });
        }
      }
      for (const [me, op] of pairs) {
        if (me.powOn && me.f.power.k === 'gravity') {
          op.s.spd = Math.max(1, op.s.spd - 2);
          log(`🪐 ${N(me)} cranks up the gravity. ${N(op)} slows down`, 'special', null, [], { t: 'status', on: op.i, fx: '🪐', tint: 'gravity' });
        }
        if (me.powOn && me.f.power.k === 'shape' && op.s.str > me.s.str) {
          me.s.str = op.s.str;
          log(`🦎 ${N(me)} shapeshifts and copies ${N(op)}'s strength`, 'special', null, [], { t: 'status', on: me.i, fx: '🦎' });
        }
      }
      for (const [me, op] of pairs) {
        if (me.powOn && me.f.power.k === 'time' && both()) {
          log(`⏱️ ${N(me)} stops time before the bell`, 'special', null, [], { t: 'timestop', by: me.i });
          act(me, op, 'power');
        }
      }
      if (!both()) finish();
      return flush();
    },
    step(c0, c1, m0, m1) {
      if (bt.over) return [];
      bt.round++;
      const ch: [Move, Move] = [c0 || autoChoice(rng, P[0], P[1], bt.hist[1]), c1 || bt.planned || autoChoice(rng, P[1], P[0], bt.hist[0])];
      bt.planned = null;
      // moves come with a flavor: the player's from their wheel, the AI's rolled here
      const aiKit = (me: Side, c: Move): [Move, RoundMod] | null => {
        const fam = ({ strike: 'atk', feint: 'atk', guard: 'def', power: 'pow', focus: 'pow' } as Record<string, string>)[c];
        if (!fam) return null;
        const ks = kitMoves(me.f).filter((m) => m.fam === fam && (m.c !== 'power' || (canPower(me) && me.en >= POW_COST)));
        if (!(ks.length && rng() < 0.4)) return null;
        const m = pick(rng, ks);
        return [m.c, { ...m.rm }];
      };
      if (!m0) {
        const k = aiKit(P[0], ch[0]);
        if (k) [ch[0], m0] = k;
        else [ch[0], m0] = aiFlavor(rng, P[0], ch[0]);
      }
      if (!m1) {
        const k = aiKit(P[1], ch[1]);
        if (k) [ch[1], m1] = k;
        else [ch[1], m1] = aiFlavor(rng, P[1], ch[1]);
      }
      P[0].rm = m0;
      P[1].rm = m1;
      for (const i of [0, 1] as const) {
        if (ch[i] === 'ult' && P[i].en < 100) ch[i] = 'strike';
        if (ch[i] === 'power' && !canPower(P[i])) ch[i] = 'strike';
      }
      bt.hist[0].push(ch[0]);
      bt.hist[1].push(ch[1]);
      P[0].move = ch[0];
      P[1].move = ch[1];
      const [a, b] = ch;
      // reads build momentum (up to +30% damage); losing a read wipes yours
      const win: 0 | 1 | null = beatsMove(a, b) ? 0 : beatsMove(b, a) ? 1 : null;
      if (win !== null) {
        const W = P[win];
        const Lo = P[1 - win]!;
        W.st.rps++;
        gain(W, 15);
        W.mom = Math.min(3, (W.mom || 0) + 1);
        Lo.mom = 0;
        log(`🎯 ${MOVE_N[ch[win]!]} beats ${MOVE_N[ch[1 - win]!]!.toLowerCase()}. ${N(W)} read it right${W.mom > 1 ? `, momentum ×${W.mom}` : ''}`, 'read', null, [], {
          t: 'read', on: win, mom: W.mom,
        });
      }
      for (const i of [0, 1] as const) {
        const me = P[i];
        const op = P[1 - i]!;
        if (ch[i] === 'feint') {
          if (ch[1 - i] === 'guard') {
            me.opened = 1;
            gain(me, 30);
            log(`🎭 ${N(me)} feints and ${N(op)} bites. The next hit lands 40% harder`, 'special', null, [], { t: 'status', on: op.i, fx: '🎭' });
          } else {
            me.exposed = 0.2;
            log(`🎭 ${N(me)} feints, but ${N(op)} doesn't buy it`, 'miss', null, [], { t: 'status', on: me.i, fx: '🎭' });
          }
        }
        if (ch[i] === 'fumble') log(`🤦 ${N(me)} fumbles and wastes the turn`, 'miss', null, [], { t: 'status', on: i, fx: '🤦' });
        if (ch[i] === 'dodge') {
          me.sidestep = (me.rm && me.rm.dodge) || 0.45;
          log(`💨 ${N(me)} gets light on their feet`, '', null, [], { t: 'status', on: i, fx: '💨' });
        }
        if (me.rm && me.rm.label && ch[i] !== 'fumble') {
          const icon = ch[i] === 'guard' ? '🔁' : ch[i] === 'power' ? '🌩️' : me.rm.first ? '⚡' : '🔨';
          log(`${me.rm.e || icon} ${N(me)}: ${me.rm.label}`, '', null, [], { t: 'status', on: i, fx: icon });
        }
        if (ch[i] === 'focus') {
          me.focused = 1;
          me.exposed = Math.max(me.exposed || 0, 0.15);
          gain(me, 30);
          log(`🧘 ${N(me)} focuses: +30 energy, the next hit lands 25% harder`, 'special', null, [], { t: 'status', on: me.i, fx: '🧘' });
        }
      }
      for (const i of [0, 1] as const) {
        if (ch[i] === 'guard' && !P[i].frozen) {
          P[i].guard = 1;
          P[i].st.guards++;
          gain(P[i], 40 + P[i].tr.guardEn);
          log(`🛡️ ${N(P[i])} raises their guard`, '', null, [], { t: 'guard', on: i });
        }
      }
      const fs = (i: 0 | 1) => bt.round === 1 && (P[i].f.arch.k === 'assassin' || P[i].tr.firstStrike);
      let order: [0 | 1, 0 | 1];
      if (fs(0) && !fs(1)) order = [0, 1];
      else if (fs(1) && !fs(0)) order = [1, 0];
      else order = P[0].s.spd + rnd(rng, 0, 2) >= P[1].s.spd + rnd(rng, 0, 2) ? [0, 1] : [1, 0];
      {
        const fq = (i: 0 | 1) => P[i].rm && P[i].rm.first;
        const sl = (i: 0 | 1) => P[i].rm && P[i].rm.slow;
        if (fq(0) && !fq(1)) order = [0, 1];
        else if (fq(1) && !fq(0)) order = [1, 0];
        else if (sl(0) && !sl(1)) order = [1, 0];
        else if (sl(1) && !sl(0)) order = [0, 1];
      }
      for (const i of order) {
        turn(P[i], P[1 - i]!, ch[i]);
        if (!both()) break;
      }
      if (both()) {
        for (const i of [0, 1] as const) {
          const me = P[i];
          const op = P[1 - i]!;
          if (me.burning > 0) {
            me.burning--;
            hurt(me, 4);
            log(`🔥 ${N(me)} is burning`, '', 4, [], { t: 'dot', on: i, fx: '🔥', tint: 'fire' });
            checkDown(me);
            if (!both()) break;
          }
          if (me.poison > 0) {
            hurt(me, me.poison);
            log(`🧪 Poison eats at ${N(me)}`, '', me.poison, [], { t: 'dot', on: i, fx: '🫧', tint: 'poison' });
            checkDown(me);
            if (!both()) break;
          }
          if (AR.sunBurn && me.f.weak.k === 'sun') {
            hurt(me, AR.sunBurn);
            log(`☀️ The sun burns ${N(me)}`, '', AR.sunBurn, [], { t: 'dot', on: i, fx: '☀️', tint: 'light' });
            checkDown(me);
            if (!both()) break;
          }
          if (AR.hazard && !AR.hazard.one) {
            hurt(me, AR.hazard.dmg);
            log(fill(AR.hazard.txt, me), '', AR.hazard.dmg, [], { t: 'dot', on: i, fx: AR.hazard.fx, tint: AR.hazard.tint });
            checkDown(me);
            if (!both()) break;
          }
          const rg = (me.powOn && me.f.power.k === 'regen' ? 3 + me.s.pm * 0.7 : 0) + me.tr.regen + (me.f.chaos.k === 'crowd' ? 3 : 0);
          if (me.tr.enRegen) gain(me, me.tr.enRegen);
          if (me.tr.snack && !me.snacked && me.hp / me.maxHp < 0.3) {
            me.snacked = 1;
            const sh = Math.min(me.maxHp - me.hp, me.tr.snack);
            me.hp += sh;
            log(`🍔 ${N(me)} takes a snack break`, 'heal', sh, [], { t: 'heal', on: i });
          }
          if (rg > 0 && me.hp < me.maxHp) {
            const h = Math.min(me.maxHp - me.hp, rg);
            me.hp += h;
            log(`💚 ${N(me)} ${me.f.chaos.k === 'crowd' && !me.tr.regen ? 'feeds off the crowd' : 'regenerates'}`, 'heal', h, [], { t: 'heal', on: i });
          }
          const pets: Pet[] = me.tr.pets.slice();
          if (me.powOn && me.f.power.k === 'summon') pets.push({ e: '🔯', n: 'summoned spirit', x: 0.5 + me.s.pm * 0.06 });
          for (const pet of pets) {
            if (!both()) break;
            let d = ((3 + rng() * 3) * pet.x * Math.pow(1.15, (me.s.wm + me.s.iq) / 2 - op.s.dur) * (me.ls || 1)) / (op.ls || 1);
            if (hitsWeak(op, ['pet'])) d *= 1.8;
            hurt(op, d);
            log(`${pet.e} ${N(me)}'s ${pet.n} attacks ${N(op)}`, '', d, [], { t: 'pet', by: i, to: 1 - i, fx: pet.e });
            checkDown(op);
          }
          if (!both()) break;
          if (me.powOn && me.f.power.k === 'clones') {
            const d = 0.35 * baseDmg(rng, physOff(me), op.s.dur);
            hurt(op, d);
            log(`👥 ${N(me)}'s clones dogpile ${N(op)}`, '', d, [], { t: 'pet', by: i, to: 1 - i, fx: '👥' });
            checkDown(op);
            if (!both()) break;
          }
          if (me.f.chaos.k === 'glitch' && rng() < 0.25) {
            const g = Math.floor(rng() * 3);
            if (g === 0) {
              const h = Math.min(me.maxHp - me.hp, 10);
              me.hp += h;
              log(`👾 ${N(me)} glitches and restores some HP`, 'heal', h, [], { t: 'heal', on: i });
            } else if (g === 1) {
              hurt(me, 6);
              log(`👾 ${N(me)} glitches into the floor`, 'miss', 6, [], { t: 'self', on: i, fx: '👾' });
              checkDown(me);
              if (!both()) break;
            } else {
              gain(me, 30);
              log(`👾 ${N(me)} glitches and gains energy`, 'special', null, [], { t: 'status', on: i, fx: '👾' });
            }
          }
        }
        if (both() && AR.hazard && AR.hazard.one && rng() < AR.hazard.chance!) {
          const v = P[rng() < 0.5 ? 0 : 1];
          hurt(v, AR.hazard.dmg);
          log(fill(AR.hazard.txt, v), '', AR.hazard.dmg, [], { t: 'dot', on: v.i, fx: AR.hazard.fx, tint: AR.hazard.tint });
          checkDown(v);
        }
      }
      for (const x of P) {
        if (x.f.wheelBoss && both() && rng() < 0.35) {
          const o = P[1 - x.i]!;
          const r = Math.floor(rng() * 4);
          if (r === 0) {
            const h = Math.round(x.maxHp * 0.08);
            x.hp = Math.min(x.maxHp, x.hp + h);
            log(`🎡 ${N(x)} spins his wheel: a free heal`, 'heal', h, [], { t: 'heal', on: x.i });
          } else if (r === 1) {
            gain(x, 50);
            log(`🎡 ${N(x)} spins his wheel: +50 energy`, 'special', null, [], { t: 'status', on: x.i, fx: '🎡' });
          } else if (r === 2 && !o.frozen) {
            o.frozen = 1;
            o.frzFx = '🎡';
            o.frzTxt = 'is stuck on the wheel';
            log(`🎡 ${N(x)} spins his wheel: ${N(o)} loses a turn`, 'special', null, [], { t: 'status', on: o.i, fx: '🎡' });
          } else {
            x.s.str = clamp(x.s.str + 1, 1, 20);
            log(`🎡 ${N(x)} spins his wheel: +1 strength`, 'special', null, [], { t: 'status', on: x.i, fx: '🎡' });
          }
        }
        checkPhase(x);
      }
      for (const x of P) {
        x.guard = 0;
        x.move = null;
        x.exposed = 0;
        x.ultMul = 1;
        x.sidestep = 0;
        x.rm = {};
        x.buffs = (x.buffs || []).filter((b) => --b.r > 0);
        if (AR.soak) x.soaked = Math.max(x.soaked, 1);
        else if (x.soaked > 0) x.soaked--;
      }
      if (!both()) finish();
      else if (bt.round >= MAXR) {
        // boss fights never go to the judges: past the limit every hit lands harder until someone falls
        if (SD && bt.round < MAXR + 25) {
          if (!bt.sd) {
            bt.sd = 1;
            log('☠️ Sudden death! Every hit lands harder until someone falls', 'special', null, [], { t: 'banner', text: 'Sudden death' });
          }
          sdMult = 1.8 + 0.4 * (bt.round - MAXR + 1);
        } else finish();
      }
      return flush();
    },
  };
  return bt;
}

/** A full AI-vs-AI fight; returns the winner index. */
export function simulate(A: Fighter, B: Fighter, rng: Rng, opts: Omit<BattleOpts, 'quiet'> = {}): 0 | 1 {
  const b = newBattle(A, B, rng, { ...opts, quiet: true });
  b.start();
  while (!b.over) b.step();
  return b.w!;
}

/** Win rate of a against b over n simulated fights. */
export function headToHead(a: Fighter, b: Fighter, rng: Rng, n = 200, opts: Omit<BattleOpts, 'quiet'> = {}): number {
  let w = 0;
  for (let i = 0; i < n; i++) if (simulate(a, b, rng, opts) === 0) w++;
  return w / n;
}

export function verdict(w: number): { t: string; q: 0 | 1 | 2 | 3 } {
  if (w < 0.15) return { t: 'Cooked', q: 0 };
  if (w < 0.35) return { t: 'Mid', q: 1 };
  if (w < 0.55) return { t: 'Decent', q: 1 };
  if (w < 0.75) return { t: 'Cracked', q: 2 };
  if (w < 0.9) return { t: 'Goated', q: 3 };
  return { t: 'Absolute menace', q: 3 };
}
