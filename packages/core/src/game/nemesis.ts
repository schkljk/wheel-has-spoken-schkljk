import { CHAPTERS } from '../data/content/story';
import { BALANCE } from '../data/balance';
import { GEAR, GEAR_SLOTS } from '../data/gear';
import { NEM_AFTER, NEM_TAUNTS, type TauntKind } from '../data/content/nemesis';
import { applyBonus, levelUp } from '../fighter';
import { pick } from '../random';
import { deserFighter, serFighter, type CareerFighter } from '../save/fighter';
import { archiveRival, invalidate, myNemesis, setNemesis, type NemLog, type Nemesis } from './career';
import { pl, slotOf, type Game } from './game';
import { LASTCH, storyOf, type Story } from './story';
import type { FightOutcome } from './fight';

/**
 * The nemesis in the story (Phase 4, upgrade 19). Whoever beat you gets a step on the story map a chapter later,
 * with a speech about your last fight. Beat them and they come back two chapters later, a little stronger;
 * beat them three times and they retire. Story losses make a nemesis too (when you don't have one).
 */

/** A place as the nemesis says it: "the Night Market", "Harbor Docks". */
export const placeName = (n: string) => n.replace(/^The /, 'the ');
/** Story progress as one number: the chapter, plus a whole story per encore. */
const posOf = (S: Story) => (S.ng || 0) * LASTCH + S.ch;
const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

/** Remembers a fight with them (the last six). */
export function nemLog(n: Nemesis, e: NemLog) {
  n.log = [...(n.log || []), e].slice(-6);
}

/** Logs a fight against `O` if they are (now) the nemesis. */
export function nemFought(g: Game, O: CareerFighter, won: boolean, o: FightOutcome, where: string) {
  const n = myNemesis(g);
  if (!BALANCE.storyNemesis || !n || n.f.name !== O.name) return;
  const winner = won ? o.me : o.them;
  nemLog(n, { w: won, where, r: Math.max(1, o.round), hp: Math.max(1, Math.ceil(winner ? winner.hp : 1)) });
}

/**
 * Puts the nemesis on the story map when they are due: one of the next few plain fight steps gets a third
 * option. Also notices when you walked past their step. Returns true when they were just placed.
 */
export function placeNemesis(g: Game): boolean {
  if (!BALANCE.storyNemesis || !g.F || !g.F.story) return false;
  const S = storyOf(g);
  const n = myNemesis(g);
  if (S.nemRow != null && !S.nemOk && S.row > S.nemRow) {
    // they waited, you took another path
    S.nemOk = 1;
    if (n) {
      n.dodged = (n.dodged || 0) + 1;
      n.skip = true;
      n.at = posOf(S) + 1;
    }
    return false;
  }
  if (!n || S.nemRow != null || (n.at || 0) > posOf(S)) return false;
  const rows: number[] = [];
  for (let r = Math.max(2, S.row + 1); r < S.rows.length - 1; r++) if (S.rows[r]!.includes('fight')) rows.push(r);
  if (!rows.length) return false;
  const r = rows[Math.floor(g.rng() * Math.min(3, rows.length))]!;
  S.rows[r] = [...S.rows[r]!, 'nemesis'];
  S.nemRow = r;
  return true;
}

/** The nemesis, ready for the story: at least a level or three over the chapter, and a new piece of gear each time. */
export function nemesisOpponent(g: Game): CareerFighter {
  const n = myNemesis(g)!;
  const S = storyOf(g);
  const met = n.met || 0;
  const o = deserFighter(n.f)!;
  const want = CHAPTERS[S.ch - 1]!.lvl + (S.ng || 0) * 4 + 1 + Math.min(met, 2);
  if ((o.lvl || 1) < want) levelUp(o, want - (o.lvl || 1), g.rng);
  const empty = GEAR_SLOTS.filter((s) => !(o.gear || {})[s]);
  if (empty.length) {
    const s = pick(g.rng, empty);
    o.gear = { ...(o.gear || {}), [s]: pick(g.rng, GEAR.filter((x) => x.slot === s && !x.req && ['common', 'rare', 'epic'].includes(x.r))).k };
  }
  o.aiSkill = 0.06 * (S.ch - 1) + 0.1 + 0.05 * Math.min(met, 3) + (S.ng || 0) * 0.05;
  o.isNem = true;
  invalidate(o);
  n.f = serFighter(o);
  return o;
}

const fill = (s: string, t: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (t[k] != null ? String(t[k]) : m));

/** Their pre-fight speech: what happened last time, angrier every meeting. */
export function nemesisTaunt(g: Game): { line: string; kind: TauntKind; record: string; meeting: number } {
  const n = myNemesis(g)!;
  const met = n.met || 0;
  const beats = n.beats || 1;
  const lost = n.lost || 0;
  const last = n.log && n.log[n.log.length - 1];
  const kind: TauntKind = lost >= 2 ? 'final' : n.skip ? 'dodged' : !last ? 'first' : last.w ? 'revenge' : beats >= 3 ? 'streak' : 'gloat';
  const line = fill(pick(g.rng, NEM_TAUNTS[kind][Math.min(met, 2)]!), {
    where: last ? last.where : 'that alley',
    round: last ? last.r : 1,
    hp: last ? last.hp : 1,
    beats,
    wins: lost,
    you: g.F!.name,
  });
  const record = `They beat you ${times(beats)}${lost ? `, you beat them ${times(lost)}` : ''}.`;
  return { line, kind, record, meeting: met + 1 };
}

/**
 * The story side of a fight's end: a story loss makes a nemesis (if you have none), and a fight on the nemesis
 * step settles a round of the rivalry. Returns the extra XP, coins and fame.
 */
export function storyNemesisEnd(g: Game, node: string, O: CareerFighter, o: FightOutcome, lines: string[], keys: string[]) {
  const add = { xp: 0, coins: 0, fame: 0 };
  if (!BALANCE.storyNemesis) return add;
  const S = storyOf(g);
  const won = o.w === 0;
  const where = placeName(CHAPTERS[S.ch - 1]!.n);
  if (node !== 'nemesis') {
    if (!won && node !== 'boss' && !myNemesis(g)) {
      setNemesis(g, O);
      const n = myNemesis(g)!;
      n.at = posOf(S) + 1;
      nemFought(g, O, false, o, where);
      lines.push(`😈 ${O.name} is now your nemesis. They will find you next chapter`);
    }
    return add;
  }
  const n = myNemesis(g);
  S.nemOk = 1;
  if (!n) return add;
  n.met = (n.met || 0) + 1;
  n.skip = false;
  const tier = Math.min(n.met - 1, 2);
  if (!won) {
    setNemesis(g, O);
    const m = myNemesis(g)!;
    m.at = posOf(S) + 1;
    nemFought(g, O, false, o, where);
    lines.push(`😈 ${fill(NEM_AFTER.won[tier]!, { beats: m.beats || 1 })}`);
    return add;
  }
  nemFought(g, O, true, o, where);
  n.lost = (n.lost || 0) + 1;
  keys.push('revenge');
  add.coins += 6;
  add.xp += 10;
  if (n.lost >= 3) {
    archiveRival(g, n.f, n.beats);
    slotOf(g)!.nemesis = null;
    add.coins += 15;
    add.xp += 20;
    add.fame += 10;
    lines.push(`😈 ${fill(pick(g.rng, NEM_AFTER.retired), { name: O.name })} +21 🪙, +30 XP, +10 fame`);
    return add;
  }
  // they go off to train: +1 to everything, back in two chapters
  const f = deserFighter(n.f)!;
  applyBonus(f, { k: 'all1', n: '+1 to everything', e: '💪' });
  n.f = serFighter(f);
  n.at = posOf(S) + 2;
  lines.push(`😈 ${NEM_AFTER.lost[tier]} +6 🪙, +10 XP`);
  lines.push(`🎯 ${pl(3 - n.lost, 'more win', 'more wins')} and they retire`);
  return add;
}
