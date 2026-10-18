// What the sprite parts need to know: how each race is built, how each class dresses, and the drawing context
// passed between the parts. One row per race or class, so a new one is a one-line addition.

import type { Ramp } from './px';

export const SW = 70;
export const SH = 84;
/** the row under the feet */
export const GROUND = 82;

/** Everything the art needs from a fighter. */
export interface Look {
  name?: string;
  race?: string;
  rsub?: string;
  arch?: string;
  size?: string;
  weapon?: string;
  power?: string;
  ench?: string;
  /** a story boss: their own silhouette on top of the build (upgrade 38) */
  boss?: string;
}

/** Own-property lookup (skips prototype names like "constructor"). */
export const own = <T>(o: Record<string, T>, k: string | undefined): T | undefined => (k !== undefined && Object.hasOwn(o, k) ? o[k] : undefined);

/** Skin colors for sub-races that look different from their race. */
export const SUBCOL: Record<string, string> = {
  'Golem/Clay': '#B97A56', 'Golem/Stone': '#9A9A96', 'Golem/Iron': '#7C8790', 'Golem/Flesh': '#C98F86', 'Golem/Diamond': '#8FE3F2',
  'Elemental/Fire': '#FF7A2F', 'Elemental/Ice': '#9FE3FF', 'Elemental/Storm': '#9C8BFF', 'Elemental/Water': '#3D8BFF', 'Elemental/Earth': '#8D6E46', 'Elemental/Void': '#3B2A55',
  'Dragonkin/Red': '#C0392B', 'Dragonkin/White': '#DDE6EC', 'Dragonkin/Blue': '#3D7BD9', 'Dragonkin/Black': '#3A3344', 'Dragonkin/Gold': '#E8B33A',
  'Slime/Acid slime': '#C6F04A', 'Slime/King slime': '#4FC1E9', 'Slime/Metal slime': '#A9B4C2',
  'Werewolf/Blood moon': '#7A3B35', 'Catfolk/Sphynx': '#F0C8B8', 'Catfolk/Void cat': '#2A2236', 'Catfolk/Lion-blooded': '#D9A441', 'Robot/Battle droid': '#6E7B5A',
  'Robot/Butler bot': '#C9CED6', 'Robot/Vacuum bot': '#4A4F5A', 'Sharkfolk/Megalodon': '#4E5E70', 'Treant/Venus flytrap': '#5DAA4B', 'Treant/Sapling': '#9C7A52',
  'Snowman/Slush': '#C9D6E2', 'Clown/Horror clown': '#E8E2DA', 'Ratfolk/Lab rat': '#F4F1EA', 'Ogre/Swamp ogre': '#7FA04A', 'Mummy/Pharaoh': '#E8D9A8',
  'Werewolf/Full moon': '#6E6A70', 'Demon/Ninth circle': '#7A1020', 'Angel/Fallen': '#B9A9C9',
  'Vampire/Nosferatu': '#C9C3B8', 'Ghost/Wraith': '#8C86A8', 'Ghost/Banshee': '#D7E6F5', 'Skeleton/Lich bones': '#D8E8C8', 'Cosmic warrior/Supernova': '#5B2A6B',
};

export type BuildKey = 'normal' | 'slim' | 'big' | 'stocky' | 'small';
export type PlanKey = 'slime' | 'ghost' | 'pigeon' | 'toaster' | 'eldritch' | 'djinn' | 'snowman' | 'duck' | 'elemental';
/** How a race is drawn: a humanoid build plus feature flags, or a creature plan of its own. */
export interface RaceSpec {
  b?: BuildKey;
  plan?: PlanKey;
  skin?: string;
  hairCol?: string;
  eye?: string;
  cape?: string;
  head?: 'raccoon' | 'wolf' | 'dragon' | 'bull' | 'frog' | 'yeti' | 'shark' | 'rat';
  tail?: 'raccoon' | 'wolf' | 'demon' | 'dragon' | 'fox' | 'cat' | 'rat';
  ears?: 'goblin' | 'elf' | 'fox' | 'cat';
  wings?: 'bat' | 'feather' | 'fairy';
  horns?: 'demon' | 'goat';
  hair?: 1; nose?: 1; skull?: 1; boney?: 1; tusks?: 1; brow?: 1; fangs?: 1; fur?: 1; cyborg?: 1; golem?: 1; halo?: 1; scales?: 1;
  stars?: 1; laurel?: 1; beard?: 1; fins?: 1; tailLegs?: 1; antennae?: 1; bugeyes?: 1; chitin?: 1; cap?: 1; zombie?: 1; whiskers?: 1;
  noHorns?: 1; beak?: 1; talons?: 1; fin?: 1; robot?: 1; gnomehat?: 1; hooves?: 1; mummy?: 1; clown?: 1; bee?: 1; treant?: 1; ogre?: 1;
}
export const RACE_SP: Record<string, RaceSpec> = {
  Human: { b: 'normal', hair: 1 }, Goblin: { b: 'small', skin: '#8DBF4A', ears: 'goblin', nose: 1, hair: 1 }, Skeleton: { b: 'slim', skin: '#EDE6D6', skull: 1, boney: 1 },
  Orc: { b: 'big', skin: '#6E9E4A', tusks: 1, brow: 1, hair: 1 }, Elf: { b: 'slim', skin: '#F2D3B3', ears: 'elf', hair: 1 }, Pigeon: { plan: 'pigeon', skin: '#8C96A3' },
  Raccoon: { b: 'small', skin: '#8E8E96', head: 'raccoon', tail: 'raccoon' }, Slime: { plan: 'slime', skin: '#7BD657' },
  Vampire: { b: 'slim', skin: '#E8E0EE', fangs: 1, hair: 1, cape: '#2A0F1E', eye: '#E5484D', hairCol: '#1F1A24' },
  Werewolf: { b: 'big', skin: '#8D7A68', head: 'wolf', tail: 'wolf', fur: 1 }, Cyborg: { b: 'normal', skin: '#E8C4A0', cyborg: 1, hair: 1 }, Ghost: { plan: 'ghost', skin: '#CDE6FF' },
  Golem: { b: 'big', skin: '#9A9A96', golem: 1 }, Demon: { b: 'normal', skin: '#C0392B', horns: 'demon', tail: 'demon', wings: 'bat', hair: 1, hairCol: '#2A1A1E', eye: '#FFD54F' },
  Angel: { b: 'slim', skin: '#F7E3C9', wings: 'feather', halo: 1, hair: 1, hairCol: '#F0D27A' },
  Elemental: { plan: 'elemental', skin: '#FF7A2F' }, Dragonkin: { b: 'normal', skin: '#C0392B', head: 'dragon', tail: 'dragon', wings: 'bat', scales: 1, eye: '#FFD54F' },
  'Cosmic warrior': { b: 'normal', skin: '#2C2A6B', stars: 1, eye: '#7FE3FF' },
  Titan: { b: 'big', skin: '#C9A27A', laurel: 1, hair: 1 }, 'Eldritch horror': { plan: 'eldritch', skin: '#6A4C93' }, Dwarf: { b: 'stocky', skin: '#E9B996', beard: 1, hair: 1 },
  Merfolk: { b: 'normal', skin: '#5FB3A8', fins: 1, tailLegs: 1, hair: 1, hairCol: '#2E6E8E' }, Insectoid: { b: 'slim', skin: '#6B8E23', antennae: 1, bugeyes: 1, chitin: 1 },
  Fairy: { b: 'small', skin: '#FBD9E6', ears: 'elf', wings: 'fairy', hair: 1, hairCol: '#F28BC0' },
  Minotaur: { b: 'big', skin: '#7B5233', head: 'bull', fur: 1 }, 'Mushroom folk': { b: 'small', skin: '#F3E7D3', cap: 1 }, Zombie: { b: 'normal', skin: '#8FA67A', zombie: 1, hair: 1 },
  Kitsune: { b: 'slim', skin: '#F6D6B8', ears: 'fox', tail: 'fox', hair: 1, hairCol: '#E8862E' }, Frogfolk: { b: 'small', skin: '#5DAA4B', head: 'frog' },
  Yeti: { b: 'big', skin: '#EEF2F6', head: 'yeti', fur: 1 },
  'Sentient toaster': { plan: 'toaster', skin: '#B8C2CC' },
  Catfolk: { b: 'slim', skin: '#E9A86A', ears: 'cat', tail: 'cat', hair: 1, whiskers: 1 },
  Lizardfolk: { b: 'normal', skin: '#6FA84A', head: 'dragon', tail: 'dragon', scales: 1, noHorns: 1, eye: '#FFD54F' },
  Harpy: { b: 'slim', skin: '#F0D2B4', wings: 'feather', beak: 1, hair: 1, talons: 1 }, Sharkfolk: { b: 'big', skin: '#7F98AE', head: 'shark', tail: 'dragon', fin: 1 },
  Robot: { b: 'normal', skin: '#9AA6B2', robot: 1 }, Gnome: { b: 'small', skin: '#F1C9A5', beard: 1, gnomehat: 1, hairCol: '#E8E2DA' },
  Satyr: { b: 'normal', skin: '#E6B98E', horns: 'goat', hooves: 1, hair: 1 },
  Mummy: { b: 'slim', skin: '#E6DCC2', mummy: 1 }, Djinn: { plan: 'djinn', skin: '#4F8DF5' }, Clown: { b: 'normal', skin: '#F7F4EE', clown: 1, hair: 1, hairCol: '#FF4F8B' },
  Beefolk: { b: 'small', skin: '#F2C14E', bee: 1, antennae: 1, wings: 'fairy', bugeyes: 1 }, Snowman: { plan: 'snowman', skin: '#F4F8FC' },
  Treant: { b: 'big', skin: '#7A5A3A', treant: 1 },
  'Rubber duck': { plan: 'duck', skin: '#F7D23E' }, Ratfolk: { b: 'small', skin: '#9A8F8A', head: 'rat', tail: 'rat' },
  Ogre: { b: 'big', skin: '#8DA35A', tusks: 1, brow: 1, ogre: 1 },
};

/**
 * A body plan. Chunky and big-headed so a fighter reads at a glance on a phone: the head is about a third of the
 * height. tw torso width, sy shoulder row, hy hip row, hr head radius, hc head center row, lw leg width, aw arm
 * width.
 */
export interface Build {
  tw: number;
  sy: number;
  hy: number;
  hr: number;
  hc: number;
  lw: number;
  aw: number;
}
export const BUILDS: Record<BuildKey, Build> = {
  normal: { tw: 20, sy: 34, hy: 59, hr: 12, hc: 22, lw: 7, aw: 6 },
  slim: { tw: 17, sy: 34, hy: 59, hr: 11.5, hc: 22.5, lw: 6, aw: 5.2 },
  big: { tw: 27, sy: 34, hy: 60, hr: 12.5, hc: 21.5, lw: 9, aw: 7.6 },
  stocky: { tw: 25, sy: 41, hy: 64, hr: 12.5, hc: 28.5, lw: 8.5, aw: 7 },
  small: { tw: 17, sy: 44, hy: 65, hr: 12.5, hc: 31.5, lw: 6, aw: 5.4 },
};

export type Top = 'tank' | 'robe' | 'leather' | 'plate' | 'bare' | 'motley' | 'vest' | 'gi' | 'coat' | 'tunic';
export type Hat =
  | 'band' | 'wizard' | 'hood' | 'circlet' | 'horned' | 'helm' | 'jester' | 'ranger' | 'none' | 'wide' | 'kabuto' | 'tricorn' | 'antlers'
  | 'toque' | 'visor' | 'cap';
/** How a face looks: brows and mouth. */
export type Mood = 'angry' | 'stern' | 'sly' | 'grin' | 'calm' | 'happy' | 'blank' | 'worried';
/** A class outfit: top, two colors, headgear, the face it makes, and extras. */
export interface Outfit {
  top: Top;
  c: string;
  c2: string;
  hat: Hat;
  hatC?: string;
  mood: Mood;
  tabard?: string;
  cape?: string;
  wraps?: 1; stars?: 1; mask?: 1; cross?: 1; pelt?: 1; paint?: 1; shield?: 1; skullBelt?: 1; furTrim?: 1; bald?: 1; beads?: 1;
  belts?: 1; bandage?: 1; glow?: 1; feather?: 1; patch?: 1; goggles?: 1; apron?: 1; lucha?: 1; headset?: 1;
}
export const OUT: Record<string, Outfit> = {
  brawler: { top: 'tank', c: '#E5484D', c2: '#2B2B33', hat: 'band', hatC: '#E5484D', wraps: 1, mood: 'angry' },
  mage: { top: 'robe', c: '#4B5BD6', c2: '#F2B544', hat: 'wizard', hatC: '#3B47B8', stars: 1, mood: 'calm' },
  assassin: { top: 'leather', c: '#2E2A3A', c2: '#B3262B', hat: 'hood', hatC: '#24202E', mask: 1, mood: 'stern' },
  paladin: { top: 'plate', c: '#C9D1DA', c2: '#F2E6B8', hat: 'circlet', hatC: '#E8B33A', tabard: '#F4F1EA', cross: 1, cape: '#2F5BB7', mood: 'calm' },
  berserker: { top: 'bare', c: '#7A4E2D', c2: '#8D6E63', hat: 'horned', hatC: '#8A97A6', pelt: 1, paint: 1, mood: 'angry' },
  tank: { top: 'plate', c: '#8A97A6', c2: '#5A6572', hat: 'helm', hatC: '#7C8896', shield: 1, mood: 'stern' },
  trickster: { top: 'motley', c: '#8E44AD', c2: '#2ECC71', hat: 'jester', hatC: '#8E44AD', mood: 'grin' },
  necro: { top: 'robe', c: '#2B2238', c2: '#8E5BD6', hat: 'hood', hatC: '#211A2C', skullBelt: 1, mood: 'sly' },
  tamer: { top: 'vest', c: '#6B7A3A', c2: '#8D6E46', hat: 'ranger', hatC: '#7A5A36', furTrim: 1, mood: 'happy' },
  monk: { top: 'gi', c: '#E8952E', c2: '#7A3E14', hat: 'none', bald: 1, beads: 1, mood: 'calm' },
  slayer: { top: 'coat', c: '#6E1F2B', c2: '#3A2A22', hat: 'wide', hatC: '#2E2620', belts: 1, mood: 'angry' },
  resilient: { top: 'tunic', c: '#7D8597', c2: '#B6A58A', hat: 'none', bandage: 1, mood: 'worried' },
  npc: { top: 'tunic', c: '#C9B38A', c2: '#6D5A44', hat: 'none', mood: 'blank' },
  chosen: { top: 'tunic', c: '#F4F1EA', c2: '#E8B33A', hat: 'none', cape: '#C62F35', glow: 1, mood: 'calm' },
  bard: { top: 'motley', c: '#C0392B', c2: '#F2B544', hat: 'ranger', hatC: '#7A2E8E', feather: 1, mood: 'grin' },
  ninja: { top: 'leather', c: '#1E1E28', c2: '#3A3A4A', hat: 'hood', hatC: '#16161E', mask: 1, mood: 'stern' },
  samurai: { top: 'plate', c: '#A3242E', c2: '#2B2B33', hat: 'kabuto', hatC: '#2B2B33', mood: 'angry' },
  pirate: { top: 'coat', c: '#2C3E70', c2: '#C9A25B', hat: 'tricorn', hatC: '#1F1F26', patch: 1, belts: 1, mood: 'grin' },
  alchemist: { top: 'tunic', c: '#6B5B3E', c2: '#C9B38A', hat: 'none', goggles: 1, apron: 1, mood: 'calm' },
  druid: { top: 'robe', c: '#3E7A3A', c2: '#8D6E46', hat: 'antlers', hatC: '#8D6E46', mood: 'calm' },
  gunslinger: { top: 'coat', c: '#8A5A36', c2: '#3A2A22', hat: 'wide', hatC: '#6B4A2E', belts: 1, mood: 'sly' },
  chef: { top: 'tunic', c: '#F4F1EA', c2: '#C9CED6', hat: 'toque', hatC: '#FFFFFF', mood: 'happy' },
  wrestler: { top: 'bare', c: '#2E86DE', c2: '#F2B544', hat: 'none', lucha: 1, wraps: 1, mood: 'angry' },
  gambler: { top: 'vest', c: '#2E5E3E', c2: '#E8E2DA', hat: 'visor', hatC: '#2E8B57', mood: 'sly' },
  streamer: { top: 'tunic', c: '#7B3FE4', c2: '#2B2B33', hat: 'cap', hatC: '#2B2B33', headset: 1, mood: 'grin' },
};
export const HAIRS = ['#2B1B12', '#5A3825', '#C9A25B', '#A33A1D', '#1F1F1F', '#D8D2C8', '#7B4A2D', '#E8C872'];
export const HSKIN = ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3A21'];
export const HIDES_HAIR: readonly Hat[] = ['helm', 'hood', 'wizard', 'jester', 'wide', 'ranger', 'horned', 'kabuto', 'tricorn', 'toque', 'cap'];

/** Everything a part needs while drawing one fighter. */
export interface Ctx {
  L: Look;
  race: RaceSpec;
  out: Outfit;
  /** the name's hash: picks skin tone (humans), hair color and style */
  hs: number;
  skinHex: string;
  S: Ramp;
  O1: Ramp;
  O2: Ramp;
  HAIR: Ramp;
}
