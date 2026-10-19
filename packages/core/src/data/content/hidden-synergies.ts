// Hidden synergies (Phase 4, upgrade 16): joke picks are secretly viable. They don't show on the card, the build
// screen or the collection until they turn up in a fight. One row each; `test` says who has it.
import type { Fighter, StatMods, Synergy } from '../../types';
import { GEAR } from '../gear';

const all = (n: number): StatMods => ({ str: n, spd: n, dur: n, iq: n, wm: n, pm: n });
const JUNK = new Set(GEAR.filter((g) => g.r === 'junk').map((g) => g.k));
/** How many junk gear pieces a fighter wears. */
export const junkCount = (f: Fighter) => Object.values(f.gear || {}).filter((k) => k && JUNK.has(k)).length;
const jokeWeapon = (f: Fighter) => f.weapon?.q === 0;

export interface HiddenSynergy extends Synergy {
  hidden: 1;
  test: (f: Fighter) => boolean;
  flavor: string;
}

// prettier-ignore
export const SYN_HIDDEN: HiddenSynergy[] = [
  {
    k: 'h_bgchar', n: 'Unnamed extra', e: '🫥', q: 3, hidden: 1,
    d: 'NPC: +2 to everything, +12% dodge, +25% damage while behind on HP', m: all(2), fx: { dodgeB: 0.12, behindX: 1.25 },
    test: (f) => f.arch?.k === 'npc',
    flavor: 'Nobody remembers their name. That is the whole plan.',
  },
  {
    k: 'h_underdog', n: 'The underdog story', e: '🎬', q: 3, hidden: 1,
    d: 'NPC with a joke weapon: gets back up once with 30% HP', fx: { revive: 30 },
    test: (f) => f.arch?.k === 'npc' && jokeWeapon(f),
    flavor: 'Every sports movie ever. Cue the montage.',
  },
  {
    k: 'h_irony', n: 'Weaponized irony', e: '🎭', q: 2, hidden: 1,
    d: 'Joke weapon: +25% strike damage, and opponents sometimes laugh too hard to act', fx: { strikeX: 1.25, rizz: 0.06 },
    test: jokeWeapon,
    flavor: 'Getting hit with a pool noodle is funny until it is not.',
  },
  {
    k: 'h_comic', n: 'Comic relief', e: '🎪', q: 2, hidden: 1,
    d: 'Joke race: the crowd is on their side. +30% damage below a quarter HP, and opponents sometimes stop to wave', fx: { clutchX: 1.3, rizz: 0.04 },
    test: (f) => f.race?.q === 0 && f.race.n !== 'Zombie',
    flavor: 'Everyone roots for the goblin. Nobody knows why.',
  },
  {
    k: 'h_dumpster', n: 'Dumpster chic', e: '🗑️', q: 2, hidden: 1,
    d: 'Three or more junk gear pieces: +6% dodge (nobody aims at the bin)', fx: { dodgeB: 0.06 },
    test: (f) => junkCount(f) >= 3,
    flavor: "One person's trash is another person's armor set.",
  },
  {
    k: 'h_trashking', n: 'Trash king', e: '👑', q: 3, hidden: 1,
    d: 'Five or more junk gear pieces: +1 to everything', m: all(1),
    test: (f) => junkCount(f) >= 5,
    flavor: 'Long live the king. The king smells like a bin.',
  },
];
