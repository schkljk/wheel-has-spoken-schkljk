import { GEARK, setCount, traitsBase } from './stats';
import type { Fighter } from './types';

// When each synergy is active. Keys match SYN in data/synergies.ts.
// A missing value never satisfies a threshold (as in the legacy game).

const gte = (v: number | undefined, n: number) => v !== undefined && v >= n;
const lte = (v: number | undefined, n: number) => v !== undefined && v <= n;
const isIn = (list: readonly string[], v: string | undefined) => v !== undefined && list.includes(v);
/** Does the fighter's pick on a wheel have this key or name? */
const HAS = (f: Fighter, k: 'arch' | 'race', v: string) => !!f[k] && (f[k].k === v || f[k].n === v);
const ELEMS = ['fire', 'ice', 'lightning', 'water'];
const gearKeys = (f: Fighter) => Object.values(f.gear || {}) as string[];
const rarityCount = (f: Fighter, r: string) => gearKeys(f).filter((k) => GEARK[k] && GEARK[k].r === r).length;

export const SYN_TESTS: Record<string, (f: Fighter) => boolean> = {
  inferno: (f) => f.power?.k === 'fire' && f.ench?.k === 'flame',
  zero: (f) => f.power?.k === 'ice' && f.ench?.k === 'frost',
  storm: (f) => f.power?.k === 'lightning' && (f.ench?.k === 'thunder' || f.weapon?.n === 'Laser rifle'),
  crusader: (f) => f.arch?.k === 'paladin' && (isIn(['light', 'smite'], f.power?.k) || f.ench?.k === 'holy'),
  blood: (f) => f.race?.n === 'Vampire' && f.ench?.k === 'vamp',
  backstab: (f) => f.arch?.k === 'assassin' && !!f.weapon?.t.includes('blade'),
  bonelord: (f) => f.arch?.k === 'necro' && f.race?.n === 'Skeleton',
  immovable: (f) => (f.arch?.k === 'tank' || f.race?.n === 'Golem') && isIn(['Huge', 'Colossal'], f.size?.n),
  pure: (f) => f.race?.n === 'Elemental' && isIn(ELEMS, f.power?.k),
  speed: (f) => (f.arch?.k === 'assassin' || f.arch?.k === 'monk') && gte(f.spd?.v, 7),
  brain: (f) => (f.arch?.k === 'mage' || f.power?.k === 'mind') && gte(f.iq?.v, 7),
  glass: (f) => gte(f.str?.v, 7) && lte(f.dur?.v, 2),
  feral: (f) => f.race?.n === 'Werewolf' && f.arch?.k === 'berserker',
  pack: (f) => f.race?.n === 'Werewolf' && f.asub?.n === 'Wolf',
  dragonheart: (f) => f.race?.n === 'Dragonkin' && !!f.rsub?.fx?.breath && !!f.power?.t?.includes(f.rsub.fx.breath),
  lich: (f) => f.rsub?.n === 'Lich bones' && f.arch?.k === 'necro',
  mega: (f) => f.race?.n === 'Pigeon' && f.size?.n === 'Colossal',
  comedy: (f) => (isIn(['Wet noodle', 'Rubber chicken'], f.weapon?.n) || f.race?.n === 'Pigeon') && f.chaos?.k === 'unhinged',
  destiny: (f) => f.arch?.k === 'chosen' && isIn(['main', 'plot'], f.chaos?.k),
  horror: (f) => f.race?.n === 'Eldritch horror' && f.power?.k === 'reality',
  fists: (f) => f.arch?.k === 'brawler' && !!f.weapon?.fists,
  selfown: (f) => {
    const w = f.weak?.trig;
    if (!w) return false;
    const tags = [...(f.weapon?.t || []), ...(f.ench?.t || []), ...(f.power && f.power.k !== 'none' && !f.power.passive ? f.power.t : [])];
    return tags.some((t) => w.includes(t));
  },
  merking: (f) => f.race?.n === 'Merfolk' && f.weapon?.n === 'Trident',
  rocker: (f) => f.weapon?.n === 'Electric guitar' && f.power?.k === 'sonic',
  forge: (f) => f.race?.n === 'Dwarf' && isIn(['War hammer', 'Planet-cracker axe', 'Greatsword'], f.weapon?.n),
  foxfire: (f) => f.race?.n === 'Kitsune' && isIn(['fire', 'illusion'], f.power?.k),
  toast: (f) => f.race?.n === 'Sentient toaster' && (f.power?.k === 'fire' || f.ench?.k === 'flame'),
  wizard: (f) => f.arch?.k === 'mage' && f.weapon?.n === 'Magic staff',
  tank2: (f) => f.arch?.k === 'tank' && f.stance?.k === 'defensive',
  storm2: (f) => f.power?.k === 'wind' && f.ench?.k === 'swift',
  gymbro: (f) => f.quirk?.k === 'gymrat' && (!!f.weapon?.fists || f.gear?.trinket === 'knuckles'),
  owlnight: (f) => f.quirk?.k === 'owl' && (isIn(['Vampire', 'Ghost'], f.race?.n) || f.power?.k === 'shadow'),
  hypetrain: (f) => f.quirk?.k === 'hype' && f.stance?.k === 'showboat',
  twinpower: (f) => f.quirk?.k === 'twin' && f.power?.k === 'mind',
  samurai_katana: (f) => HAS(f, 'arch', 'samurai') && f.weapon?.n === 'Katana',
  ninja_stars: (f) => HAS(f, 'arch', 'ninja') && isIn(['Shuriken', 'Chakram'], f.weapon?.n),
  chef_pan: (f) => HAS(f, 'arch', 'chef') && /frying pan/i.test(f.weapon?.n || ''),
  bard_guitar: (f) => HAS(f, 'arch', 'bard') && f.weapon?.n === 'Electric guitar',
  pirate_parrot: (f) =>
    HAS(f, 'arch', 'pirate') && (isIn(['Trident', 'Harpoon spear', 'Fishing rod', 'Cursed blade'], f.weapon?.n) || f.power?.k === 'water'),
  druid_vines: (f) => (HAS(f, 'arch', 'druid') || f.race?.n === 'Treant') && isIn(['vines', 'earth'], f.power?.k),
  gunslinger_draw: (f) => HAS(f, 'arch', 'gunslinger') && (f.weapon?.t || []).includes('ranged'),
  alch_poison: (f) => HAS(f, 'arch', 'alchemist') && f.power?.k === 'poison',
  wrestler_fists: (f) => HAS(f, 'arch', 'wrestler') && !!f.weapon?.fists,
  gambler_luck: (f) => HAS(f, 'arch', 'gambler') && f.power?.k === 'luck',
  streamer_crowd: (f) => HAS(f, 'arch', 'streamer') && isIn(['main', 'crowd'], f.chaos?.k),
  cat_nine: (f) => f.race?.n === 'Catfolk' && traitsBase(f).revive > 0,
  shark_water: (f) => f.race?.n === 'Sharkfolk' && (f.power?.k === 'water' || (f.weapon?.t || []).includes('water')),
  robot_laser: (f) => isIn(['Robot', 'Cyborg'], f.race?.n) && f.weapon?.n === 'Laser rifle',
  snow_ice: (f) => isIn(['Snowman', 'Yeti'], f.race?.n) && f.power?.k === 'ice',
  mummy_tomb: (f) => f.race?.n === 'Mummy' && isIn(['shadow', 'poison'], f.power?.k),
  djinn_wish: (f) => f.race?.n === 'Djinn' && isIn(['reality', 'tele'], f.power?.k),
  clown_chicken: (f) => f.race?.n === 'Clown' && isIn(['Rubber chicken', 'Pool noodle', 'Giant lollipop'], f.weapon?.n),
  bee_swarm: (f) => f.race?.n === 'Beefolk' && isIn(['summon', 'poison'], f.power?.k),
  duck_debug: (f) => f.race?.n === 'Rubber duck' && (f.iq?.v || 0) >= 9,
  ogre_club: (f) => f.race?.n === 'Ogre' && (f.weapon?.t || []).includes('blunt'),
  tamer_dragon: (f) => (HAS(f, 'arch', 'tamer') || f.race?.n === 'Dragonkin') && f.side?.k === 'dragon',
  squire_knight: (f) => (HAS(f, 'arch', 'paladin') || HAS(f, 'arch', 'tank')) && f.side?.k === 'squire',
  coach_gym: (f) => f.side?.k === 'coach' && (f.quirk?.k === 'gymrat' || f.back?.k === 'gymteacher'),
  goose_rematch: (f) => f.back?.k === 'goose' && f.quirk?.k === 'sore',
  timeloop_reader: (f) => f.back?.k === 'timeloop' && (f.iq?.v || 0) >= 8,
  glasscannon_title: (f) => f.title?.k === 'glass' && isIn(['aggressive', 'reckless'], f.stance?.k),
  nightowl_shadow: (f) => f.quirk?.k === 'owl' && isIn(['Harpy', 'Catfolk', 'Vampire'], f.race?.n),
  phoenix_fire: (f) => f.power?.k === 'fire' && ['phoenix', 'phoenixrobe'].some((k) => gearKeys(f).includes(k)),
  fullset_mythic: (f) => rarityCount(f, 'mythic') >= 2,
  junk_pile: (f) => rarityCount(f, 'junk') >= 2,
  speedster_boots: (f) => (f.spd?.v || 0) >= 8 && isIn(['rocket', 'sevenleague'], (f.gear || {}).boots),
  set_knight2: (f) => setCount(f, 'knight') >= 2,
  set_knight4: (f) => setCount(f, 'knight') >= 4,
  set_knight6: (f) => setCount(f, 'knight') >= 6,
  set_shadow2: (f) => setCount(f, 'shadow') >= 2,
  set_shadow4: (f) => setCount(f, 'shadow') >= 4,
  set_shadow6: (f) => setCount(f, 'shadow') >= 6,
  set_arcane2: (f) => setCount(f, 'arcane') >= 2,
  set_arcane4: (f) => setCount(f, 'arcane') >= 4,
  set_arcane6: (f) => setCount(f, 'arcane') >= 6,
  set_clown2: (f) => setCount(f, 'clown') >= 2,
  set_clown4: (f) => setCount(f, 'clown') >= 4,
};
