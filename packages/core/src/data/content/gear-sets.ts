// More gear sets (Phase 4, upgrade 22): pirate, chef, cosmic and royal. Kept apart from the ported GEAR and SYN
// tables (parity); `gearPool()` deals them into loot, shops and boxes when `BALANCE.moreSets` is on.
import type { Gear, Synergy } from '../../types';

// prettier-ignore
export const GEAR_MORE: Gear[] = [
  // ---- pirate (rare): extra swings, reads and getting ahead when behind
  { k: 'tricorn', slot: 'helm', r: 'rare', n: 'Tricorn hat', e: '🏴‍☠️', cost: 14, q: 2, m: { str: 1 }, fx: { readB: 0.04 }, set: 'pirate', d: '+1 strength, reads half a step clearer. Pirate set' },
  { k: 'hookhand', slot: 'gloves', r: 'rare', n: 'Hook hand', e: '🪝', cost: 14, q: 2, m: { wm: 1 }, fx: { extra: 0.04 }, set: 'pirate', d: '+1 weapon mastery, +4% extra hit chance. Pirate set' },
  { k: 'piratecoat', slot: 'cape', r: 'rare', n: 'Captain’s coat', e: '🧥', cost: 14, q: 2, m: { cha: 1 }, fx: { dodgeB: 0.03 }, set: 'pirate', d: '+1 charisma, +3% dodge. Pirate set' },
  { k: 'piratevest', slot: 'armor', r: 'rare', n: 'Salt-stained vest', e: '🦺', cost: 15, q: 2, m: { dur: 2 }, set: 'pirate', d: '+2 durability. Smells like adventure and fish. Pirate set' },
  { k: 'seaboots', slot: 'boots', r: 'rare', n: 'Sea boots', e: '🥾', cost: 13, q: 2, m: { spd: 1, dur: 1 }, set: 'pirate', d: '+1 speed, +1 durability. Pirate set' },
  { k: 'parrot', slot: 'trinket', r: 'rare', n: 'Loud parrot', e: '🦜', cost: 12, q: 2, fx: { readB: 0.06 }, set: 'pirate', d: 'Reads half a step clearer. It squawks the move before they make it. Pirate set' },
  // ---- chef (common): the snack set
  { k: 'toque', slot: 'helm', r: 'common', n: 'Chef’s toque', e: '👨‍🍳', cost: 5, q: 1, m: { iq: 1 }, set: 'chef', d: '+1 IQ. Tall hat, tall ideas. Chef set' },
  { k: 'chefmitts', slot: 'gloves', r: 'common', n: 'Kitchen mitts', e: '🧤', cost: 5, q: 1, m: { str: 1 }, set: 'chef', d: '+1 strength. Rated for 260 degrees. Chef set' },
  { k: 'apron', slot: 'armor', r: 'common', n: 'Stained apron', e: '🥼', cost: 5, q: 1, m: { dur: 1 }, set: 'chef', d: '+1 durability. Every stain is a story. Chef set' },
  { k: 'clogs', slot: 'boots', r: 'common', n: 'Kitchen clogs', e: '🩴', cost: 5, q: 1, m: { spd: 1 }, set: 'chef', d: '+1 speed. Non-slip, mostly. Chef set' },
  // ---- cosmic (epic): energy and the signature
  { k: 'starhelm', slot: 'helm', r: 'epic', n: 'Star-glass helm', e: '🌌', cost: 26, q: 2, m: { pm: 1, iq: 1 }, set: 'cosmic', d: '+1 power mastery, +1 IQ. Cosmic set' },
  { k: 'nebulagloves', slot: 'gloves', r: 'epic', n: 'Nebula gloves', e: '🧤', cost: 26, q: 2, m: { pm: 1 }, fx: { ultX: 1.08 }, set: 'cosmic', d: '+1 power mastery, signature 8% harder. Cosmic set' },
  { k: 'voidcloak', slot: 'cape', r: 'epic', n: 'Void cloak', e: '🌑', cost: 26, q: 2, fx: { dodgeB: 0.05, enRegen: 2 }, set: 'cosmic', d: '+5% dodge, +2 energy every round. Cosmic set' },
  { k: 'orbitplate', slot: 'armor', r: 'epic', n: 'Orbit plate', e: '🪐', cost: 28, q: 2, m: { dur: 2 }, fx: { dr: 0.03 }, set: 'cosmic', d: '+2 durability, takes 3% less damage. Cosmic set' },
  { k: 'stardrifters', slot: 'boots', r: 'epic', n: 'Star drifters', e: '☄️', cost: 26, q: 2, m: { spd: 2 }, set: 'cosmic', d: '+2 speed. Leaves a trail. Cosmic set' },
  { k: 'starshard', slot: 'trinket', r: 'epic', n: 'Fallen star shard', e: '🌠', cost: 24, q: 2, m: { pm: 1 }, fx: { startEn: 10 }, set: 'cosmic', d: '+1 power mastery, start fights with +10 energy. Cosmic set' },
  // ---- royal (legendary): presence, counters and guards
  { k: 'heavycrown', slot: 'helm', r: 'legendary', n: 'Heavy crown', e: '👑', cost: 50, q: 3, m: { cha: 2, dur: 1 }, set: 'royal', d: '+2 charisma, +1 durability. Heavy lies the head. Royal set' },
  { k: 'royalgauntlets', slot: 'gloves', r: 'legendary', n: 'Gold-thread gloves', e: '🧤', cost: 48, q: 3, m: { str: 2 }, fx: { counterB: 0.1 }, set: 'royal', d: '+2 strength, counters 10% harder. Royal set' },
  { k: 'ermine', slot: 'cape', r: 'legendary', n: 'Ermine mantle', e: '🦢', cost: 48, q: 3, m: { cha: 1, dur: 1 }, fx: { guardAdd: -0.05 }, set: 'royal', d: '+1 charisma, +1 durability, guards block 5% more. Royal set' },
  { k: 'royalplate', slot: 'armor', r: 'legendary', n: 'Gold-leaf plate', e: '🛡️', cost: 55, q: 3, m: { dur: 3 }, fx: { dr: 0.03 }, set: 'royal', d: '+3 durability, takes 3% less damage. Royal set' },
  { k: 'velvetslippers', slot: 'boots', r: 'legendary', n: 'Velvet slippers', e: '🥿', cost: 46, q: 3, m: { spd: 2, cha: 1 }, set: 'royal', d: '+2 speed, +1 charisma. Royal set' },
  { k: 'signet', slot: 'trinket', r: 'legendary', n: 'Royal signet', e: '💍', cost: 46, q: 3, m: { cha: 2 }, fx: { rizz: 0.05 }, set: 'royal', d: '+2 charisma, opponents sometimes bow instead of acting. Royal set' },
];

// prettier-ignore
const SYN_SET_ROWS: (Synergy & { set: string; need: number })[] = [
  { k: 'set_pirate2', set: 'pirate', need: 2, n: 'Pirate set (2)', e: '🏴‍☠️', q: 1, d: '2 pirate pieces: +5% extra hit chance', fx: { extra: 0.05 } },
  { k: 'set_pirate4', set: 'pirate', need: 4, n: 'Pirate set (4)', e: '🏴‍☠️', q: 2, d: '4 pirate pieces: +1 strength, +15% damage while behind on HP', m: { str: 1 }, fx: { behindX: 1.15 } },
  { k: 'set_pirate6', set: 'pirate', need: 6, n: 'Pirate set (6)', e: '🏴‍☠️', q: 3, d: 'Full pirate set: acts first, +10% extra hit chance', fx: { firstStrike: 1, extra: 0.1 } },
  { k: 'set_chef2', set: 'chef', need: 2, n: 'Chef set (2)', e: '👨‍🍳', q: 1, d: '2 chef pieces: eats a snack below 30% HP for 25 HP, once', fx: { snack: 25 } },
  { k: 'set_chef4', set: 'chef', need: 4, n: 'Chef set (4)', e: '👨‍🍳', q: 2, d: 'Full chef set: +2% HP every round, +1 charisma. Yes, chef', m: { cha: 1 }, fx: { regen: 2 } },
  { k: 'set_cosmic2', set: 'cosmic', need: 2, n: 'Cosmic set (2)', e: '🌌', q: 1, d: '2 cosmic pieces: start fights with +10 energy', fx: { startEn: 10 } },
  { k: 'set_cosmic4', set: 'cosmic', need: 4, n: 'Cosmic set (4)', e: '🌌', q: 2, d: '4 cosmic pieces: +1 power mastery, +3 energy every round', m: { pm: 1 }, fx: { enRegen: 3 } },
  { k: 'set_cosmic6', set: 'cosmic', need: 6, n: 'Cosmic set (6)', e: '🌌', q: 3, d: 'Full cosmic set: signature 25% harder, +8% dodge', fx: { ultX: 1.25, dodgeB: 0.08 } },
  { k: 'set_royal2', set: 'royal', need: 2, n: 'Royal set (2)', e: '👑', q: 1, d: '2 royal pieces: +2 charisma', m: { cha: 2 } },
  { k: 'set_royal4', set: 'royal', need: 4, n: 'Royal set (4)', e: '👑', q: 2, d: '4 royal pieces: counters 20% harder, guards block 8% more', fx: { counterB: 0.2, guardAdd: -0.08 } },
  { k: 'set_royal6', set: 'royal', need: 6, n: 'Royal set (6)', e: '👑', q: 3, d: 'Full royal set: takes 8% less damage, +10% damage', fx: { dr: 0.08, dmgX: 1.1 } },
];

/** The joke under each set, for its info card. */
export const SET_FLAVOR: Record<string, string> = {
  pirate: 'Arr. The parrot does most of the talking.',
  chef: 'Yes, chef. The secret ingredient is violence.',
  cosmic: 'You are made of star stuff. So is your fist.',
  royal: 'Uneasy lies the head. Easy lies everyone else, on the floor.',
};
/** The set bonuses, each with its set's joke for the info card. */
export const SYN_SETS = SYN_SET_ROWS.map((s) => ({ ...s, flavor: SET_FLAVOR[s.set]! }));
