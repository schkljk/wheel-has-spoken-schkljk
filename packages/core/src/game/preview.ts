import { BOSSES, CHAPTERS } from '../data/content/story';
import { BALANCE } from '../data/balance';
import type { Game } from './game';
import { myNemesis } from './career';
import { storyPay } from './fight';
import { merchantOf, nodeOf, storyOf, type NodeKind } from './story';

/**
 * Story map previews (Phase 4, upgrade 34): tap any step to see what it holds before you get there. The
 * numbers are the same ones the fight pays (before talent and legacy bonuses).
 */
export interface NodePreview {
  e: string;
  n: string;
  sub: string;
  lines: string[];
}
/** The level a chapter's boss expects (hard runs expect three more). */
export const recLevel = (g: Game) => CHAPTERS[storyOf(g).ch - 1]!.lvl + (storyOf(g).hard ? 3 : 0);

/** The level range a story fight or elite at this point of the story is drawn at (storyOpponent). */
export function foeLevels(g: Game, kind: 'fight' | 'elite'): [number, number] {
  const S = storyOf(g);
  const base = CHAPTERS[S.ch - 1]!.lvl + (S.ng || 0) * 4 + (kind === 'elite' ? 2 : 0) + (S.hard ? 3 : 0);
  return [Math.max(1, base - 1), Math.max(1, base)];
}
/** How many steps from row `from` to the next campfire (0: that row has one), or null if none is left. */
export function nextRest(g: Game, from: number): number | null {
  const S = storyOf(g);
  for (let r = from; r < S.rows.length; r++) if (S.rows[r]!.includes('rest')) return r - from;
  return null;
}

/** What a step holds. `row` is the step's row on the map, for the distance to the next campfire. */
export function nodePreview(g: Game, kind: NodeKind, row?: number): NodePreview {
  const p = basePreview(g, kind);
  const lines = [...p.lines];
  // fights say who you are up against, level for level
  if (kind === 'fight' || kind === 'elite') {
    const lvl = g.F!.lvl || 1;
    const [a, b] = foeLevels(g, kind);
    const tag = lvl < a ? `: ${a - lvl} below them` : lvl > b ? `: ${lvl - b} above them` : '';
    lines.unshift(`Their level: ${a === b ? a : `${a}–${b}`}. You are level ${lvl}${tag}`);
  }
  // and every step says where the next campfire is, counting from the row after it
  if (row != null && kind !== 'rest') {
    const d = nextRest(g, row + 1);
    lines.push(`🔥 ${d == null ? 'No campfire left before the boss' : d === 0 ? 'A campfire right after this' : `Next campfire: ${d + 1} steps on`}`);
  }
  return { ...p, lines };
}

function basePreview(g: Game, kind: NodeKind): NodePreview {
  const S = storyOf(g);
  const ch = S.ch;
  const hard = !!S.hard;
  const N = nodeOf(kind);
  const win = (k: 'fight' | 'elite' | 'boss' | 'nemesis') => {
    const p = storyPay(k, ch);
    return `Win: about ${p.xp} XP, ${hard ? Math.round(p.coins * 1.5) : p.coins} 🪙 and ${p.fame} fame`;
  };
  const lose = 'Lose: a grit, and you carry on at 60% HP';
  switch (kind) {
    case 'fight':
      return { e: N.e, n: N.n, sub: 'An opponent around your level', lines: [win('fight'), 'Then pick a reward: a loot spin, 25% HP back, or prize money', lose] };
    case 'elite':
      return {
        e: N.e,
        n: N.n,
        sub: 'Tougher: from higher up the ranks, two levels up, with better gear',
        lines: [win('elite'), `Plus a gem and a guaranteed ${hard ? 'boss' : 'elite'} loot spin, then a reward`, lose],
      };
    case 'nemesis': {
      const NM = myNemesis(g);
      return {
        e: N.e,
        n: NM ? NM.f.name : N.n,
        sub: NM ? `Your nemesis. They have beaten you ${NM.beats === 1 ? 'once' : `${NM.beats} times`}` : 'Your nemesis, if you have one by then',
        lines: [win('nemesis'), 'Plus elite loot, +6 🪙 and +10 XP for the revenge. Three story wins and they retire for good', 'Walk past and they come back next chapter'],
      };
    }
    case 'boss': {
      const B = BOSSES[ch - 1]!;
      const lvl = g.F!.lvl || 1;
      const rec = recLevel(g);
      return {
        e: B.e,
        n: B.name,
        sub: B.title,
        lines: [
          `Recommended level ${rec}. You are level ${lvl}${lvl < rec ? `: ${rec - lvl} short` : ''}`,
          `${win('boss')}, ${2 + Math.floor(ch / 3) + (hard ? 3 : 0)} gems and a boss loot spin${hard ? ', plus a treasure spin' : ''}`,
          'Lose: a grit, and the boss waits for you',
        ],
      };
    }
    case 'rest':
      return { e: N.e, n: N.n, sub: 'Pick one', lines: ['Sleep: heal 45% HP', 'Train: a training spin for a permanent stat point, for 10% HP', 'Patch up: heal every injury and 20% HP'] };
    case 'shop': {
      const [e, n, d] = merchantOf(g);
      const rs = ch >= 7 ? 'rare to legendary' : ch >= 3 ? 'common to epic' : 'common or rare';
      return { e, n, sub: d, lines: ["Four supplies for the road and two pieces of gear you don't have", `Gear here is ${rs}`, 'One haggle per visit'] };
    }
    case 'treasure':
      return { e: N.e, n: N.n, sub: N.d, lines: ['A loot spin from the treasure table: better odds than a normal spin', 'No fight, no catch. Probably'] };
    case 'event':
      return {
        e: N.e,
        n: N.n,
        sub: N.d,
        lines: [BALANCE.themedEvents ? `Something happens, often something from this chapter, and you pick what to do` : 'Something happens, and you pick what to do', 'Some choices risk HP or coins; each option says what it does'],
      };
    default:
      return { e: N.e, n: N.n, sub: N.d, lines: [] };
  }
}
