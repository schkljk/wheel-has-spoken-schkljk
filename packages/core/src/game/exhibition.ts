import { CALLS, type CallKind } from '../data/content/commentary';
import { autoChoice, newBattle, type BattleEvent } from '../battle';
import { mulberry32 } from '../rng';
import { deserFighter, type SerFighter } from '../save/fighter';
import { champsOf, track, type Retired } from './career';
import { addCoins, type Game } from './game';

/**
 * Hall of fame exhibitions (Phase 4, upgrade 24): two legends from the hall of fame fight for nothing but
 * pride, and two commentators call it round by round. Champions keep their fighter in the hall of fame;
 * retirees do too from now on.
 */
export interface Legend {
  key: string;
  n: string;
  e: string;
  /** what they did ("Regional cup. Level 12 elf mage") */
  s: string;
  score: number;
  f: SerFighter;
}
/** A commentator's line: 0 is Rex, 1 is Brenda. */
export interface Call {
  who: 0 | 1;
  txt: string;
}
export interface ExRound {
  r: number;
  /** the fight's own narration, names filled in */
  lines: string[];
  call: Call | null;
  /** HP left, in % */
  hp: [number, number];
}
export interface Exhibition {
  a: Legend;
  b: Legend;
  intro: Call[];
  rounds: ExRound[];
  w: 0 | 1;
  outro: Call[];
}

/** Everyone who can fight an exhibition: champions and retirees whose fighter the hall of fame kept, best first. */
export function exhibitionLegends(g: Game): Legend[] {
  const out = new Map<string, Legend>();
  const add = (l: Legend) => {
    const o = out.get(l.n);
    if (!o || o.score < l.score) out.set(l.n, l);
  };
  for (const c of champsOf(g.save.profile)) if (c && c.fd && deserFighter(c.fd)) add({ key: `c:${c.n}`, n: c.n, e: c.e, s: c.s, score: c.score, f: c.fd });
  for (const r of (g.save.roster.retired || []) as unknown as Retired[])
    if (r && r.fd && deserFighter(r.fd)) add({ key: `r:${r.n}`, n: r.n, e: r.e || '🏛️', s: r.s, score: r.score, f: r.fd });
  return [...out.values()].sort((x, y) => y.score - x.score);
}

/** The most worth-calling moment of a round. */
function moment(ev: BattleEvent[], before: [number, number], after: [number, number], maxHp: [number, number]): { k: CallKind; x: 0 | 1 } | null {
  const by = (e: BattleEvent) => ((e.a && (e.a.by as number)) ?? 0) as 0 | 1;
  const revive = ev.find((e) => e.a?.t === 'revive');
  if (revive) return { k: 'revive', x: ((revive.a!.on as number) ?? 0) as 0 | 1 };
  const ult = ev.find((e) => e.cls === 'ult' && (e.d || 0) > 0);
  if (ult) return { k: 'ult', x: by(ult) };
  const crit = ev.find((e) => e.a && e.a.crit);
  if (crit) return { k: 'crit', x: by(crit) };
  for (const i of [0, 1] as const) if (before[i] >= 25 && after[i] > 0 && after[i] < 25) return { k: 'lowhp', x: i };
  const lead = (h: [number, number]) => Math.sign(h[0] - h[1]);
  if (lead(before) !== 0 && lead(after) !== 0 && lead(before) !== lead(after)) return { k: 'lead', x: lead(after) > 0 ? 0 : 1 };
  const big = ev.find((e) => (e.cls === '' || e.cls === 'hit') && e.a?.t === 'hit' && (e.d || 0) >= 0.3 * maxHp[(e.a.to as number) ?? 1]!);
  if (big) return { k: 'big', x: by(big) };
  const read = ev.find((e) => e.cls === 'read');
  if (read) {
    const m = /\{(\d)\} read it right/.exec(read.text);
    if (m) return { k: 'read', x: Number(m[1]) as 0 | 1 };
  }
  const dodge = ev.find((e) => e.a?.t === 'miss');
  if (dodge) return { k: 'dodge', x: ((dodge.a!.to as number) ?? 1) as 0 | 1 };
  const heal = ev.find((e) => e.cls === 'heal' && (e.d || 0) >= 0.1 * maxHp[(e.a?.on as number) ?? 0]!);
  if (heal) return { k: 'heal', x: ((heal.a!.on as number) ?? 0) as 0 | 1 };
  if (Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]) < 8) return { k: 'quiet', x: 0 };
  return null;
}

/** Plays an exhibition: the same seed always gives the same fight and the same calls. */
export function runExhibition(a: Legend, b: Legend, seed: number): Exhibition {
  const rng = mulberry32(seed);
  // the commentators pick their lines from their own stream, so they never change the fight
  const talk = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const fa = deserFighter(a.f)!;
  const fb = deserFighter(b.f)!;
  // first names in the booth: nobody says the whole title twice a round
  const names = [fa.name || a.n, fb.name || b.n];
  const bt = newBattle(fa, fb, rng, {});
  const fill = (t: string) => t.replace(/\{0\}/g, names[0]!).replace(/\{1\}/g, names[1]!);
  let turn = 0;
  // no line again until the others of its kind have had their turn
  const used = new Set<string>();
  const say = (k: CallKind, x: 0 | 1, w: 0 | 1 = x): Call => {
    const who = (turn++ % 2) as 0 | 1;
    let pool = CALLS[k][who].filter((t) => !used.has(t));
    if (!pool.length) {
      for (const t of CALLS[k][who]) used.delete(t);
      pool = CALLS[k][who];
    }
    const t = pool[Math.floor(talk() * pool.length)]!;
    used.add(t);
    return { who, txt: t.replace(/\{x\}/g, names[x]!).replace(/\{y\}/g, names[1 - x]!).replace(/\{w\}/g, names[w]!).replace(/\{l\}/g, names[1 - w]!) };
  };
  const intro = [say('intro', 0), say('intro', 0)];
  bt.start();
  const maxHp: [number, number] = [bt.P[0].maxHp, bt.P[1].maxHp];
  const rounds: ExRound[] = [];
  let hp: [number, number] = [100, 100];
  for (let i = 0; i < 60 && !bt.over; i++) {
    const ev = bt.step(autoChoice(rng, bt.P[0], bt.P[1], bt.hist[1]));
    const last = ev[ev.length - 1];
    const now: [number, number] = last ? [Math.min(100, Math.round(last.h[0]!)), Math.min(100, Math.round(last.h[1]!))] : hp;
    const m = bt.over ? null : moment(ev, hp, now, maxHp);
    rounds.push({
      r: bt.round,
      lines: ev.filter((e) => e.cls !== 'status' || e.d).slice(0, 5).map((e) => fill(e.text)),
      call: m ? say(m.k, m.x) : null,
      hp: now,
    });
    hp = now;
  }
  const w = (bt.w ?? (bt.P[0].hp >= bt.P[1].hp ? 0 : 1)) as 0 | 1;
  return { a, b, intro, rounds, w, outro: [say('ko', w, w), say('ko', w, w), say('outro', w, w)] };
}

/** Coins for calling an exhibition right (review F8): pride, and a little something for the cab home. */
export const CALL_PAY = 5;
/** Settles the player's call on an exhibition: paid if it came true. */
export function settleCall(g: Game, ex: Exhibition, call: 0 | 1) {
  const right = ex.w === call;
  if (right) {
    addCoins(g, CALL_PAY);
    track(g, 'calls');
  }
  return { right, pay: right ? CALL_PAY : 0 };
}
