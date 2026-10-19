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
];

/**
 * HP in descriptions is in engine units, where 100 is a full bar: "below 45 HP" means below 45% of max HP, and
 * "heals 25" heals a quarter of a normal bar. A level 12 fighter has about 220 HP, so the old wording read as a
 * tiny amount. Write them as percentages.
 */
// both patterns below need one of these: most strings have neither, and skip the regexes (rewording every table
// at load took 66 to 77 ms on a mid-range phone, nearly all of it in them)
const MAYBE = /HP|eal/;
export function reword(s: string): string {
  for (const [a, b] of EXACT) if (s.includes(a)) s = s.split(a).join(b);
  if (!MAYBE.test(s)) return s;
  return s
    .replace(/(?<![\d%.])(\d+) ?HP\b/g, '$1% HP')
    .replace(/\b([Hh]eal(?:s|ing)?) (\d+)(?![\d%.])(?! ?HP)/g, '$1 $2% HP');
}

/** Rewords every string in a value, in place. Returns the value. */
export function rewordDeep<T>(v: T, seen = new Set<unknown>()): T {
  if (!v || typeof v !== 'object' || seen.has(v)) return v;
  seen.add(v);
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
