/** Core stat keys. `cha` (charisma) arrived later than the others; old fighters may lack it. */
export type StatKey = 'str' | 'spd' | 'dur' | 'iq' | 'wm' | 'pm' | 'cha';
export type StatMods = Partial<Record<StatKey, number>>;
export type Stats = Record<StatKey, number>;

/** Quality band of a wheel slice: 0 junk/joke, 1 common, 2 good, 3 rare. */
export type Quality = 0 | 1 | 2 | 3;

/** Keys of the build wheels, in spin order (see `WHEELS` in fighter.ts). */
export type WheelKey =
  | 'race' | 'rsub' | 'arch' | 'asub' | 'stance' | 'size' | 'back' | 'reinc'
  | 'str' | 'spd' | 'dur' | 'iq' | 'cha' | 'growth' | 'weapon' | 'wm' | 'power' | 'pm'
  | 'ench' | 'weak' | 'chaos' | 'quirk' | 'side' | 'title';

/** "Earlier spins steer later wheels": multiply named slices by x, or tilt a tier wheel by s. */
export interface OddsShift {
  w: WheelKey;
  n?: string[];
  x?: number;
  s?: number;
}

export interface Pet {
  e: string;
  n: string;
  x: number;
}

/** Trait effects ("fx") that items, synergies, gear and talents feed into the fight engine. */
export interface TraitFx {
  // additive
  rizz?: number; regen?: number; venom?: number; critB?: number; dodgeB?: number; dr?: number; drain?: number;
  extra?: number; wlvl?: number; guardEn?: number; readB?: number; counterB?: number; guardAdd?: number;
  bluntDR?: number; enRegen?: number; startEn?: number;
  // multiplicative
  dmgX?: number; strikeX?: number; ultX?: number; darkX?: number; behindX?: number; clutchX?: number;
  // max
  rage?: number; revive?: number; snack?: number;
  // flags
  unholy?: number; immune?: number; firstStrike?: number; taunt?: number;
  // special
  rageAt?: number; guardX?: number; pet?: Pet; breath?: string;
}

/** A slice on any wheel. Specific wheels extend this with their own fields. */
export interface WheelItem {
  n: string;
  e: string;
  w: number;
  q: Quality;
  k?: string;
  d?: string;
  /** a meme reaction line shown when this lands */
  r?: string;
  m?: StatMods;
  fx?: TraitFx;
  o?: OddsShift[];
}

export interface Race extends WheelItem {
  unholy?: number;
  immune?: number;
}
export interface Arch extends WheelItem {
  k: string;
}
export interface Stance extends WheelItem {
  k: string;
  /** AI move weight multipliers */
  ai?: Partial<Record<'strike' | 'guard' | 'power', number>>;
}
export interface Backstory extends WheelItem {
  k: string;
}
/** A stat tier slice (1..14). Tier slices have no emoji. */
export interface TierItem extends Omit<WheelItem, 'e'> {
  e?: string;
  v: number;
  lab?: string;
  skip?: boolean;
}
export interface Growth extends WheelItem {
  k: string;
  s: number;
  g: number;
}
export interface Weapon extends WheelItem {
  /** weapon level: raw offense it adds */
  l: number;
  t: string[];
  v?: string;
  fists?: number;
  ranged?: number;
  proj?: string;
  uno?: number;
}
export interface Power extends WheelItem {
  k: string;
  l: number;
  t: string[];
  v?: string;
  passive?: number;
  spin?: number;
}
export interface Enchant extends WheelItem {
  k: string;
  l?: number;
  t?: string[];
}
export interface Weakness extends WheelItem {
  k: string;
  trig?: string[];
  skip?: number;
  sfx?: string;
  st?: string;
  firstSkip?: number;
  selfhit?: number;
  magicWeak?: number;
  cocky?: number;
}
export interface KeyedItem extends WheelItem {
  k: string;
}

export interface SubWheel {
  label: string;
  items: WheelItem[];
}

export type GearSlot = 'armor' | 'trinket' | 'boots' | 'helm' | 'gloves' | 'cape';
export type RarityKey = 'junk' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'premium';

export interface Gear {
  k: string;
  slot: GearSlot;
  r: RarityKey;
  n: string;
  e: string;
  cost: number;
  q: Quality;
  d: string;
  m?: StatMods;
  fx?: TraitFx;
  /** old "requires rank" marker; such pieces never drop from randomGear */
  req?: number;
  set?: string;
}

export interface Synergy {
  k: string;
  n: string;
  e: string;
  q: Quality;
  d: string;
  m?: StatMods;
  fx?: TraitFx;
  /** a joke synergy that works against you */
  anti?: number;
}

export interface Arena extends WheelItem {
  k: string;
  sky: string;
  floor: string;
  ultX?: number;
  tag?: Record<string, number>;
  hazard?: { dmg: number; txt: string; fx: string; tint: string; one?: number; chance?: number };
  soak?: number;
  stat?: StatMods;
  freezeB?: number;
  unholyMod?: StatMods;
  dark?: number;
  dodgeB?: number;
  weaponX?: Record<string, number>;
  raceX?: Record<string, number>;
  critB?: number;
  powX?: Record<string, number>;
  sunBurn?: number;
  allX?: number;
}

/** Status a move can inflict. */
export type StatusKey = 'burn' | 'poison' | 'bleed' | 'freeze' | 'stun' | 'soak' | 'random';
export type BuffKey = 'dmgX' | 'dr' | 'critB' | 'vuln' | 'weak';

/** Round modifier: what makes a move (kit move or flavored basic) special. */
export interface RoundMod {
  label?: string;
  e?: string;
  dmgX?: number;
  first?: number;
  slow?: number;
  counterX?: number;
  dodge?: number;
  enCost?: number;
  hits?: number;
  miss?: number;
  gamble?: number;
  pierce?: number;
  nododge?: number;
  critPlus?: number;
  drainX?: number;
  unholyX?: number;
  behindBonus?: number;
  lowBonus?: number;
  lowTargetBonus?: number;
  petNow?: number;
  heal?: number;
  healMissing?: number;
  en?: number;
  steal?: number;
  cleanse?: number;
  buff?: { k: BuffKey; v: number; r: number };
  debuff?: { k: BuffKey; v: number; r: number };
  apply?: { s: StatusKey; ch: number };
  summon?: Pet;
  selfDmg?: number;
  wish?: number;
}

export type MoveFamily = 'atk' | 'def' | 'pow';
/** Engine moves. `ult` is the signature move; `fumble` and `dodge` (sidestep) come from flavors. */
export type Move = 'strike' | 'power' | 'guard' | 'feint' | 'focus' | 'dodge' | 'ult' | 'fumble';

export interface KitMove {
  n: string;
  e: string;
  fam: MoveFamily;
  c: Move;
  rm: RoundMod;
  d: string;
}

export interface Injury {
  k: string;
  n: string;
  e: string;
  m: StatMods;
  dur: number;
}

export interface Boon {
  k: string;
  n: string;
  e: string;
  w?: number;
  q?: Quality;
}

export interface BossPhase {
  txt: string;
  m?: StatMods;
  fx?: Record<string, number>;
}

export type TalentMap = Record<string, number>;

/**
 * A fighter: one item per build wheel plus career and boss extras.
 * Fields that arrived in later versions (cha, growth, quirk, side, stance) are optional for old saves.
 */
export interface Fighter {
  name: string;
  bonus: StatMods;
  boons: Boon[];
  race: Race;
  rsub?: WheelItem;
  arch: Arch;
  asub?: WheelItem;
  stance?: Stance;
  size?: WheelItem;
  back?: Backstory;
  reinc?: WheelItem;
  str: TierItem;
  spd: TierItem;
  dur: TierItem;
  iq: TierItem;
  cha?: TierItem;
  growth?: Growth;
  weapon: Weapon;
  wm: TierItem;
  power: Power;
  pm: TierItem;
  ench: Enchant;
  weak: Weakness;
  chaos: KeyedItem;
  quirk?: KeyedItem;
  side?: KeyedItem;
  title?: KeyedItem;

  // career
  lvl?: number;
  gear?: Partial<Record<GearSlot, string>>;
  /** talent ranks by node key; very old saves stored an array of old talent keys */
  talents?: TalentMap | string[];
  inj?: { k: string }[];
  /** legacy perks: a small permanent edge for career fighters */
  lfx?: { m?: StatMods; fx?: TraitFx };

  // bosses and special opponents
  maxHp?: number;
  isBoss?: boolean;
  phase?: BossPhase;
  wheelBoss?: number;
  bossFx?: TraitFx;
  aiSkill?: number;
}
