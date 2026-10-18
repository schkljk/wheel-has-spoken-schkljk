import { ARCHS, ASUB, BACKS, CHAOS, CURED, ENCHANTS, POWER_ALL, QUIRKS, RACES, RSUB, SIDEKICKS, SIZES, STANCES, TITLES, ULTS, WEAKS, WEAPONS } from '../data/wheels';
import { ARENAS } from '../data/arenas';
import { SEASONAL_ARENAS } from '../data/content/seasonal';
import { BONUS, DAILY, EVENTS, INJURIES, LEVELUP, MUTATORS } from '../data/misc';
import { RARITY } from '../data/gear';
import { SYN_SETS } from '../data/content/gear-sets';
import { SYN } from '../data/synergies';
import { SYN_HIDDEN } from '../data/content/hidden-synergies';
import { ACHIEVEMENTS } from '../data/content/progression';
import { PERSONALITIES, type PersonalityKey } from '../data/content/personality';
import { ARCH_MECH, CATN, COMBO_INFO, FLAVOR, PILL_INFO, QN, RULES, RULES_MORE, RULES_NOW, STATUS_FLAVOR, STATUS_INFO, STATUS_MORE, STAT_INFO, TAGN, WHEELN } from '../data/content/text';
import { WHEELS } from '../fighter';
import { findMove } from '../kits';
import { GEAR_ALL, STATLBL } from '../stats';
import type { StatMods, TraitFx } from '../types';
import { TIERK } from './lookups';

/** A help card: what something does (mechanics) and the joke under it (flavor). */
export interface Info {
  e: string;
  title: string;
  sub?: string;
  p?: string;
  lines: string[];
  hint?: string;
  flavor?: string;
}

const tagList = (t?: readonly string[]) => (t || []).map((x) => TAGN[x] || x);
const pctS = (v: number) => Math.round(Math.abs(v) * 100) + '%';
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const lc1 = (s: string) => s.replace(/^./, (c) => c.toLowerCase());

export function modsText(m?: StatMods | null): string {
  return Object.entries(m || {})
    .filter(([k, v]) => v && STATLBL[k])
    .map(([k, v]) => `${v! > 0 ? '+' : '−'}${Math.abs(v!)} ${STATLBL[k]}`)
    .join(', ');
}

/** Plain-language lines for a trait block. */
export function fxLines(fx?: (TraitFx & Record<string, unknown>) | null): string[] {
  if (!fx) return [];
  const L: string[] = [];
  const n = (k: string) => fx[k] as number;
  if (n('rizz')) L.push(`Opponents lose about ${pctS(n('rizz'))} of their turns distracted`);
  if (n('regen')) L.push(`Heals ${n('regen')} HP every round`);
  if (n('venom')) L.push(`Strikes poison the target for ${n('venom')} a round`);
  if (n('critB')) L.push(`+${pctS(n('critB'))} crit chance`);
  if (n('dodgeB')) L.push(`+${pctS(n('dodgeB'))} dodge chance`);
  if (n('dr')) L.push(n('dr') > 0 ? `Takes ${pctS(n('dr'))} less damage` : `Takes ${pctS(n('dr'))} more damage`);
  if (n('drain')) L.push(`Steals ${n('drain')} energy per hit`);
  if (n('extra')) L.push(`+${pctS(n('extra'))} chance of an extra hit`);
  if (n('wlvl')) L.push(`Weapon hits harder (+${n('wlvl')} weapon level)`);
  if (n('dmgX')) L.push(`+${pctS(n('dmgX') - 1)} damage`);
  if (n('strikeX')) L.push(`Strikes do +${pctS(n('strikeX') - 1)} damage`);
  if (n('ultX')) L.push(`Signature move does +${pctS(n('ultX') - 1)} damage`);
  if (n('rage')) L.push(`Hits 35% harder below ${n('rage')} HP`);
  if (fx.rageAt != null) L.push(n('rageAt') > 100 ? 'Always raging: +35% damage' : `Berserker rage starts below ${n('rageAt')} HP`);
  if (n('guardX')) L.push(`Guard blocks ${Math.round((1 - n('guardX')) * 100)}% instead of 60%`);
  if (n('guardAdd')) L.push(`Guard blocks ${pctS(n('guardAdd'))} less`);
  if (n('guardEn')) L.push(`Guarding gives +${n('guardEn')} extra energy`);
  if (n('readB')) L.push(`Reads opponents ${pctS(n('readB'))} better`);
  if (n('counterB')) L.push(`+${pctS(n('counterB'))} counter chance when guarding`);
  if (n('revive')) L.push(`Gets back up once with ${n('revive')} HP`);
  const pet = fx.pet as { e: string; n: string } | undefined;
  if (pet) L.push(`${pet.e} A ${pet.n} attacks every round`);
  if (fx.unholy) L.push('Counts as unholy: paladins and cathedrals hurt more');
  if (fx.immune) L.push('Immune to poison');
  if (fx.breath) L.push(`Strikes also count as ${TAGN[fx.breath as string] || fx.breath}`);
  if (fx.firstStrike) L.push('Always acts first in round 1');
  return L;
}

type Odds = { w: string; n?: string[]; x?: number; s?: number }[];
function oddsLines(o?: Odds): string[] {
  return (o || []).map((x) => {
    const wl = WHEELN[x.w] || x.w;
    if (x.n) {
      const names = x.n.join(', ');
      return x.x === 0 ? `Removes ${names} from the ${wl} wheel` : `${names}: ${x.x}× ${x.x! > 1 ? 'more' : 'less'} likely on the ${wl} wheel`;
    }
    return `Pushes ${wl} ${x.s! > 0 ? 'higher' : 'lower'}`;
  });
}

type AnyItem = Record<string, unknown> & { n: string; e?: string; d?: string; q?: number; m?: StatMods; fx?: TraitFx; o?: Odds };
function findItem(cat: string, name: string): AnyItem | null {
  let list: readonly unknown[] = [];
  switch (cat) {
    case 'race':
      list = RACES;
      break;
    case 'rsub': {
      const [r, n] = name.split('/');
      const s = RSUB[r!];
      return (s ? s.items.find((x) => x.n === n) : null) as AnyItem | null;
    }
    case 'arch':
      return (ARCHS.find((a) => a.n === name || a.k === name) || null) as AnyItem | null;
    case 'asub': {
      const [k, n] = name.split('/');
      const s = ASUB[k!];
      return (s ? s.items.find((x) => x.n === n) : null) as AnyItem | null;
    }
    case 'stance':
      list = STANCES;
      break;
    case 'size':
      list = SIZES;
      break;
    case 'back':
      list = BACKS;
      break;
    case 'weapon':
      list = WEAPONS;
      break;
    case 'power':
      list = POWER_ALL;
      break;
    case 'ench':
      list = ENCHANTS;
      break;
    case 'weak':
      list = [...WEAKS, CURED];
      break;
    case 'chaos':
      list = CHAOS;
      break;
    case 'title':
      list = TITLES;
      break;
    case 'syn':
      list = [...SYN, ...SYN_HIDDEN, ...SYN_SETS];
      break;
    case 'arena':
      list = [...ARENAS, ...SEASONAL_ARENAS];
      break;
    case 'ach':
      list = ACHIEVEMENTS;
      break;
    case 'inj':
      return (INJURIES.find((j) => j.k === name || j.n === name) || null) as AnyItem | null;
    case 'event':
      list = EVENTS;
      break;
    case 'quirk':
      list = QUIRKS;
      break;
    case 'side':
      list = SIDEKICKS;
      break;
    case 'mut':
      list = MUTATORS;
      break;
    case 'gear':
      list = GEAR_ALL;
      break;
    case 'daily':
      list = DAILY;
      break;
    case 'lvl':
      list = LEVELUP;
      break;
    case 'bonus':
      list = BONUS;
      break;
    default: {
      const W = WHEELS.find((w) => w.k === cat);
      if (W && W.tier) list = W.items as readonly unknown[];
    }
  }
  return ((list as AnyItem[]).find((x) => x.n === name) || null) as AnyItem | null;
}

/** Help for an info key: `it|race|Elf`, `rule|moves`, `stat|str`, `status|frozen`, `pill|crit`, `pill|combo|Shatter`, `mv|Backstab`, `tier|local`. */
export function infoFor(key: string): Info | null {
  const [kind, a = '', b = ''] = key.split('|');
  if (kind === 'mv') {
    const m = findMove(a);
    if (!m) return null;
    const fam = ({ atk: 'Attack', def: 'Defend', pow: 'Power' } as Record<string, string>)[m.fam] || '';
    const base = ({ strike: 'a strike', guard: 'a guard', power: 'a power move', focus: 'a focus', dodge: 'a sidestep' } as Record<string, string>)[m.c] || 'a move';
    return {
      e: m.e,
      title: m.n,
      p: m.d,
      lines: [],
      hint: `${m.src === 'class' ? 'Class move' : m.src === 'race' ? 'Racial move' : 'Weapon move'}, on the ${fam} wheel. Built on ${base}, so it wins and loses the same way.`,
      flavor: FLAVOR[m.n],
    };
  }
  if (kind === 'rule') {
    const r = RULES_NOW[a] ?? RULES[a] ?? RULES_MORE[a];
    return r ? { e: r[0], title: r[1], lines: r[2] } : null;
  }
  if (kind === 'stat') {
    const s = STAT_INFO[a];
    return s ? { e: s[0], title: s[1], p: s[2], lines: [] } : null;
  }
  if (kind === 'status') {
    const s = STATUS_INFO[a] ?? STATUS_MORE[a];
    if (!s) return null;
    const elemental = ['frozen', 'soaked', 'burning'].includes(a);
    const counter: Record<string, string> = { poison: 'The number on its icon is the damage a round.', bent: 'The number on its icon is how many times it bent.' };
    return {
      e: s[0],
      title: s[1],
      p: s[2],
      lines: ['guard', 'opened', 'focused'].includes(a) ? [] : [counter[a] ?? 'The number on its icon is the rounds left.'],
      hint: elemental ? 'Tap "Element combos" in the fight menu\'s help for more.' : undefined,
      flavor: STATUS_FLAVOR[a],
    };
  }
  if (kind === 'pill') {
    if (a === 'combo') return { e: '⚗️', title: b, sub: 'Element combo', p: COMBO_INFO[b] || '', lines: RULES.combos![2].slice(1) };
    const p = PILL_INFO[a];
    return p ? { e: p[0], title: p[1], p: p[2], lines: [] } : null;
  }
  if (kind === 'pers') {
    const p = PERSONALITIES[a as PersonalityKey];
    if (!p) return null;
    return {
      e: p.e,
      title: p.n,
      sub: 'AI personality',
      p: p.d,
      lines: ['Read off their build: the stance first, then the stats that stand out.', 'It only changes how the AI picks moves: theirs, and yours on auto-battle.'],
      flavor: p.flavor,
    };
  }
  if (kind === 'move') return infoFor('rule|moves');
  if (kind === 'tier') {
    const t = TIERK[a];
    if (!t) return null;
    return {
      e: t.e,
      title: t.n,
      sub: 'Tournament',
      p: t.d,
      lines: [t.size ? `Winning pays ${t.coins} coins and the belt` : 'Wins pay 1 coin and 8 XP each', t.lock ? `Unlock: ${t.lock}` : 'Always open', `Wins give ${t.xpW} XP`],
    };
  }
  if (kind !== 'it') return null;
  const it = findItem(a, b);
  if (!it) return null;
  const lines: string[] = [];
  const mt = modsText(it.m);
  if (mt) lines.push(mt);
  lines.push(...fxLines(it.fx as never));
  if (a === 'race') {
    if (it.unholy) lines.push('Unholy: paladins and cathedrals hurt more');
    if (it.immune) lines.push('Immune to poison');
    if (RSUB[it.n]) lines.push(`Spins the ${RSUB[it.n]!.label} sub-wheel next`);
  }
  if (a === 'arch') {
    const k = it.k as string;
    if (ARCH_MECH[k]) lines.push(ARCH_MECH[k]!);
    lines.push(`Signature move: ${ULTS[k]}`);
    if (ASUB[k]) lines.push(`Spins the ${ASUB[k]!.label} wheel next`);
  }
  if (a === 'weapon') {
    const l = it.l as number;
    lines.push(`Weapon level ${l > 0 ? '+' : ''}${l}`);
    if ((it.t as string[] | undefined)?.length) lines.push(`Counts as ${tagList(it.t as string[]).join(' and ')}`);
    if (it.ranged) lines.push('Ranged: 10% harder to dodge');
    if (it.uno) lines.push('Once per fight, reflects a big hit back at the attacker');
  }
  if (a === 'power')
    lines.push(
      it.k === 'none'
        ? 'No power at all'
        : it.passive
          ? 'Passive: always on, nothing to spend'
          : `Costs 25 energy to use${(it.t as string[] | undefined)?.length ? '. Counts as ' + tagList(it.t as string[]).join(' and ') : ''}`,
    );
  if (a === 'ench' && (it.t as string[] | undefined)?.length) lines.push(`Weapon hits also count as ${tagList(it.t as string[]).join(' and ')}`);
  if (a === 'weak') {
    if (it.trig) lines.push(cap(`${tagList(it.trig as string[]).join(' and ')} do 80% extra damage to them`));
    if (it.skip) lines.push(`Loses about ${pctS(it.skip as number)} of turns`);
  }
  if (a === 'arena') {
    const tag = it.tag as Record<string, number> | undefined;
    if (tag) lines.push(...Object.entries(tag).map(([t, x]) => `${cap(TAGN[t] || t)} ${x > 1 ? '+' : '−'}${Math.round(Math.abs(x - 1) * 100)}%`));
    if (it.stat) lines.push(`Both fighters: ${modsText(it.stat as StatMods)}`);
    const hz = it.hazard as { one?: boolean; chance: number; dmg: number } | undefined;
    if (hz) lines.push(hz.one ? `${Math.round(hz.chance * 100)}% chance each round to hit someone for ${hz.dmg}` : `Both fighters take ${hz.dmg} damage every round`);
    if (it.when) lines.push(`Seasonal: on the arena wheel ${lc1(it.when as string)}. Comes back every year`);
  }
  if (a === 'inj') {
    const dur = it.dur as number;
    return { e: it.e || '', title: it.n, sub: 'Injury', lines: [modsText(it.m), `Lasts ${dur} tournament${dur > 1 ? 's' : ''}, or heal it in the shop`] };
  }
  if (a === 'ach') lines.push('Earning it pays 3 coins');
  if (it.v) lines.unshift(`Tier ${it.v} of 14`);
  if (a === 'gear') {
    const r = RARITY[it.r as keyof typeof RARITY];
    lines.unshift(`${r ? r.n : 'Common'} ${it.slot}`);
  }
  lines.push(...oddsLines(it.o));
  const sub = [CATN[a] || '', it.q != null && a !== 'ach' ? QN[it.q] : ''].filter(Boolean).join('. ');
  const flavorKey = it.n;
  return {
    e: it.e || '',
    title: it.n,
    sub,
    p: it.d,
    lines: lines.filter((l, i, arr) => l && arr.indexOf(l) === i && l !== it.d),
    flavor: FLAVOR[flavorKey] ?? (it as { flavor?: string }).flavor,
  };
}

/** Info key for a landed wheel pick (sub-wheels are filed under their parent). */
export function itemKeyFor(k: string, it: { n: string }, f: { race?: { n: string }; arch?: { k: string } }) {
  if (k === 'rsub') return `it|rsub|${f.race ? f.race.n : ''}/${it.n}`;
  if (k === 'asub') return `it|asub|${f.arch ? f.arch.k : ''}/${it.n}`;
  return `it|${k}|${it.n}`;
}
