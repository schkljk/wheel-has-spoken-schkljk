// Wording fixes laid over the ported tables when they load. The tables stay a faithful port of the legacy game
// (the parity tests lay the same fixes over the legacy tables before comparing); only the words a player reads
// change here, never a number the engine uses.
import * as wheels from './wheels';
import * as gear from './gear';
import * as synergies from './synergies';
import * as arenas from './arenas';
import * as kits from './kits';
import * as talents from './talents';
import * as misc from './misc';
import * as story from './content/story';
import * as progression from './content/progression';
import * as economy from './content/economy';
import * as text from './content/text';

/** Whole sentences that changed with a rule (they must match the legacy text exactly). */
const EXACT: [from: string, to: string][] = [
  // the daily streak counts wins in a row, not calendar days (no punishment for skipping a day)
  ['Win the daily challenge five days in a row', 'Win five daily challenges in a row'],
  [
    'Win for coins, XP, fame and an elite loot spin. Win on consecutive days to grow your streak bonus. You get one attempt a day.',
    'Win for coins, XP, fame and an elite loot spin. Wins in a row grow your streak bonus, and skipping a day never breaks it. You get one attempt a day.',
  ],
  // a mutator that sets 150 engine HP: half again as much as anyone
  ['They have 150 HP', 'They have 50% more HP'],
  ['you get 25 back after each win', 'you get 25% HP back after each win'],
  // the coins help still told the legacy prices (G15)
  [
    'Every win pays 3, every loss pays 1, and gauntlet wins pay 2.',
    'A story fight pays 2 coins, an elite 4 and a boss 14, a little more each chapter. Cup wins pay 2, gauntlet wins 1, and a loss pays nothing.',
  ],
  ['Winning a tournament pays a bonus: 8, 15 or 30 depending on the tier.', 'Winning a cup pays a bonus: 3, 6 or 10 depending on the tier.'],
  [
    'Spend them in the shop, or on rerolls (2 each) while spinning a new fighter.',
    'Spend them in the shops, on gear upgrades in the forge, or at the fight club. Building a fighter comes with one free reroll.',
  ],
];

/**
 * HP in descriptions is in engine units, where 100 is a full bar: "below 45 HP" means below 45% of max HP, and
 * "heals 25" heals a quarter of a normal bar. A level 12 fighter has about 220 HP, so the old wording read as a
 * tiny amount. Write them as percentages.
 */
export function reword(s: string): string {
  for (const [a, b] of EXACT) if (s.includes(a)) s = s.split(a).join(b);
  return rewordReads(s)
    .replace(/(?<![\d%.])(\d+) ?HP\b/g, '$1% HP')
    .replace(/\b([Hh]eal(?:s|ing)?) (\d+)(?![\d%.])(?! ?HP)/g, '$1 $2% HP');
}

/**
 * Reads are words, never percentages (review G15): a read bonus is told in steps up the clue scale. The clue
 * words sit 10 points of accuracy apart (Maybe, Probably, Pretty sure…), so +0.2 is two steps clearer, to the
 * nearest half step.
 */
export function readSteps(v: number): string {
  const h = Math.max(1, Math.round(Math.abs(v) * 20));
  const W = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
  if (h === 1) return 'half a step';
  if (h === 2) return 'a step';
  if (h === 3) return 'a step and a half';
  return h % 2 === 0 ? `${W[h / 2]} steps` : `${W[(h - 1) / 2]} and a half steps`;
}
const READ = /\b([Rr]eads?)((?: opponents| the next opponent| your next opponent| them)?) (\d+)% (better|worse)/g;
/** A read bonus in a description, in steps: from the number the engine really uses when there is one. */
function rewordReads(s: string, value?: number): string {
  return s.replace(READ, (_m, r: string, who: string, n: string, bw: string) => `${r}${who} ${readSteps(value ?? Number(n) / 100)} ${bw === 'better' ? 'clearer' : 'murkier'}`);
}

/** Rewords every string in a value, in place. Returns the value. */
export function rewordDeep<T>(v: T, seen = new Set<unknown>()): T {
  if (!v || typeof v !== 'object' || seen.has(v)) return v;
  seen.add(v);
  // a pick with a read bonus says what it really does (several legacy descriptions said two thirds of it)
  const row = v as { d?: unknown; fx?: { readB?: number }; mods?: { readB?: number }[] };
  const rb = row.fx?.readB ?? row.mods?.[0]?.readB;
  if (typeof row.d === 'string' && typeof rb === 'number') row.d = rewordReads(row.d, rb);
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const x = v[i];
      if (typeof x === 'string') v[i] = reword(x);
      else rewordDeep(x, seen);
    }
    return v;
  }
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    const x = o[k];
    if (typeof x === 'string') o[k] = reword(x);
    else if (typeof x !== 'function') rewordDeep(x, seen);
  }
  return v;
}

for (const mod of [wheels, gear, synergies, arenas, kits, talents, misc, story, progression, economy, text]) {
  for (const t of Object.values(mod)) if (t && typeof t === 'object') rewordDeep(t);
}
