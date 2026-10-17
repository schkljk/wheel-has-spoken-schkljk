// Boss phase two (Phase 4, upgrade 10): when a boss drops below half HP the arena changes light and music,
// and the player's combat wheel gets one slice made for that boss, usable once. One row per boss, chapters 1 to 20.
import type { KitMove } from '../../types';

export interface BossPhaseKit {
  /** the arena's light in phase two */
  light: number;
  /** the phase-two music: root note (MIDI) and tempo */
  tune: { root: number; bpm: number };
  /** the one slice that only shows up in phase two, with the joke under its mechanics */
  slice: KitMove & { flavor: string };
}

// prettier-ignore
export const BOSS_PHASE: BossPhaseKit[] = [
  { light: 0xff6a3d, tune: { root: 40, bpm: 132 }, slice: { n: 'Duck the haymaker', e: '🦆', fam: 'def', c: 'dodge', rm: { dodge: 0.7, en: 20 }, d: 'Big dodge chance, +20 energy', flavor: 'He telegraphs everything. Like a fridge falling down the stairs.' } },
  { light: 0xff8c2a, tune: { root: 43, bpm: 126 }, slice: { n: 'Steal a meatball', e: '🍝', fam: 'def', c: 'focus', rm: { heal: 25, en: 15 }, d: 'Heals 25, +15 energy', flavor: "Grandma's secret recipe now belongs to you. Don't tell her." } },
  { light: 0x7dff6a, tune: { root: 45, bpm: 138 }, slice: { n: 'Antidote jab', e: '💉', fam: 'atk', c: 'strike', rm: { cleanse: 1, dmgX: 1.15 }, d: 'Cures burn and poison, then hits 15% harder', flavor: 'Fight poison with a pointy needle. Doctors hate this one trick.' } },
  { light: 0x3db8ff, tune: { root: 38, bpm: 120 }, slice: { n: 'Cut the rigging', e: '⛵', fam: 'atk', c: 'strike', rm: { dmgX: 1.2, debuff: { k: 'weak', v: 0.2, r: 2 } }, d: '+20% damage, weakens him for 2 rounds', flavor: 'No sails, no swagger. Just a man on a sad boat.' } },
  { light: 0xb388ff, tune: { root: 42, bpm: 116 }, slice: { n: 'Pop quiz', e: '📝', fam: 'atk', c: 'strike', rm: { dmgX: 1.1, debuff: { k: 'vuln', v: 0.2, r: 2 } }, d: '+10% damage, exposes him for 2 rounds', flavor: "He didn't study for this one. Nobody ever does." } },
  { light: 0xd04bff, tune: { root: 37, bpm: 110 }, slice: { n: 'Open the curtains', e: '🌅', fam: 'atk', c: 'strike', rm: { dmgX: 1.1, unholyX: 1.4 }, d: '+10% damage, +40% more against the undead', flavor: 'Sunlight: the original critical hit.' } },
  { light: 0xc9a06a, tune: { root: 33, bpm: 100 }, slice: { n: 'Topple the mountain', e: '⛰️', fam: 'atk', c: 'strike', rm: { lowTargetBonus: 0.4 }, d: '+40% damage against a fighter below half HP', flavor: 'The bigger they are, the longer the fall. Bring a snack.' } },
  { light: 0xff3df2, tune: { root: 47, bpm: 150 }, slice: { n: 'Pull the plug', e: '🔌', fam: 'def', c: 'guard', rm: { counterX: 2.2, en: 15 }, d: 'A guard that counters 120% harder, +15 energy', flavor: 'Have you tried turning him off and on again?' } },
  { light: 0xffd23d, tune: { root: 44, bpm: 144 }, slice: { n: 'Smoke the hive', e: '💨', fam: 'def', c: 'focus', rm: { buff: { k: 'dr', v: 0.25, r: 2 }, en: 20 }, d: 'Takes 25% less damage for 2 rounds, +20 energy', flavor: 'Beekeepers do it. Beekeepers are terrifying.' } },
  { light: 0xff4f8b, tune: { root: 41, bpm: 136 }, slice: { n: 'Rig the wheel', e: '🎡', fam: 'atk', c: 'strike', rm: { critPlus: 0.5 }, d: '+50% crit chance', flavor: 'Two can play this game. Yours is weighted.' } },
  { light: 0x9fe8ff, tune: { root: 46, bpm: 140 }, slice: { n: 'Ground the captain', e: '⚓', fam: 'atk', c: 'strike', rm: { first: 1, nododge: 1, dmgX: 1.1 }, d: "Goes first, can't be dodged, +10% damage", flavor: 'Gravity always wins. It has never lost a fight.' } },
  { light: 0xff4a1c, tune: { root: 36, bpm: 124 }, slice: { n: 'Bucket brigade', e: '🪣', fam: 'def', c: 'focus', rm: { cleanse: 1, heal: 20 }, d: 'Puts out burns and poison, heals 20', flavor: 'Water: the hottest new counterplay.' } },
  { light: 0xe6c36a, tune: { root: 48, bpm: 160 }, slice: { n: 'Throw a wrench', e: '🔧', fam: 'atk', c: 'strike', rm: { debuff: { k: 'weak', v: 0.25, r: 2 } }, d: 'Weakens him by 25% for 2 rounds', flavor: 'Precision engineering meets imprecise throwing.' } },
  { light: 0x2ad4c8, tune: { root: 31, bpm: 104 }, slice: { n: 'Harpoon', e: '🔱', fam: 'atk', c: 'strike', rm: { pierce: 1, nododge: 1, dmgX: 1.15 }, d: "Goes through guards, can't be dodged, +15% damage", flavor: 'Big fish, bigger hook.' } },
  { light: 0xff2d55, tune: { root: 39, bpm: 128 }, slice: { n: 'Turn on the lights', e: '🔦', fam: 'atk', c: 'strike', rm: { nododge: 1, critPlus: 0.3 }, d: "Can't be dodged, +30% crit chance", flavor: 'Clowns hate this. Most things in the dark do.' } },
  { light: 0x8fe7ff, tune: { root: 45, bpm: 112 }, slice: { n: 'Hot cocoa', e: '☕', fam: 'def', c: 'focus', rm: { heal: 20, buff: { k: 'dr', v: 0.15, r: 2 } }, d: 'Heals 20, takes 15% less damage for 2 rounds', flavor: 'Marshmallows are a valid survival strategy.' } },
  { light: 0x8c7dff, tune: { root: 35, bpm: 96 }, slice: { n: 'Smelling salts', e: '🧂', fam: 'atk', c: 'strike', rm: { nododge: 1, dmgX: 1.2 }, d: "Can't be dodged, +20% damage", flavor: 'Wake up. Wake UP.' } },
  { light: 0x5b4b8a, tune: { root: 30, bpm: 90 }, slice: { n: 'Stare back', e: '👁️', fam: 'atk', c: 'strike', rm: { dmgX: 0.8, debuff: { k: 'vuln', v: 0.3, r: 3 } }, d: '−20% damage, exposes it for 3 rounds (+30% damage taken)', flavor: 'It blinked first. Probably. It has no eyes.' } },
  { light: 0xfff0a0, tune: { root: 50, bpm: 132 }, slice: { n: 'Sunglasses', e: '🕶️', fam: 'def', c: 'dodge', rm: { dodge: 0.75 }, d: 'Huge dodge chance', flavor: 'Style and safety. Mostly style.' } },
  { light: 0xf2b544, tune: { root: 34, bpm: 120 }, slice: { n: 'Spin it back', e: '🔄', fam: 'atk', c: 'strike', rm: { dmgX: 1.3, critPlus: 0.2 }, d: '+30% damage, +20% crit chance', flavor: 'Every wheel stops eventually. Today, this one.' } },
];
