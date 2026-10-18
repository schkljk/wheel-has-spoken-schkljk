import { ARCHS, ENCHANTS, GEAR, ITEMS, POWER_ALL } from '@whs/core';
import { POWER_ICON } from '../art/icons';
import { RaceIcon } from '../art/RaceIcon';
import { facePortrait, weaponPortrait } from '../art/portraits';
import { GearIcon, ItemIcon } from './GearIcon';
import { Icon } from './Icon';

const Img = ({ url, e, kind }: { url: string | null; e?: string; kind: string }) =>
  url ? <img class={`pxi ${kind}`} src={url} alt="" aria-hidden="true" /> : <>{e}</>;

/**
 * The pixel icon for a piece of content: races and sub-races as faces, classes as a face in their headgear,
 * weapons and enchantments drawn from the sprite art, powers, gear and bag items from the icon set. Anything else keeps
 * its emoji.
 */
export function ContentIcon({ cat, name, e }: { cat: string; name: string; e?: string }) {
  if (cat === 'race') return <RaceIcon race={name} e={e} />;
  if (cat === 'rsub') {
    const [race, sub] = name.split('/');
    if (race && sub) return <RaceIcon race={race} rsub={sub} e={e} />;
  }
  if (cat === 'arch') {
    const a = ARCHS.find((x) => x.n === name || x.k === name);
    if (a) return <Img url={facePortrait({ race: 'Human', arch: a.k, name: 'Class ' + a.k })} e={e} kind="race" />;
  }
  if (cat === 'weapon') return name === 'Bare fists' ? <Icon name="fist" /> : <Img url={weaponPortrait(name)} e={e} kind="wpn" />;
  if (cat === 'ench') {
    const en = ENCHANTS.find((x) => x.n === name || x.k === name);
    if (en && en.k !== 'none') return <Img url={weaponPortrait('Sword', en.k)} e={e} kind="wpn" />;
  }
  if (cat === 'power') {
    const p = POWER_ALL.find((x) => x.n === name || x.k === name);
    if (p && POWER_ICON[p.k]) return <Icon name={POWER_ICON[p.k]!} />;
  }
  if (cat === 'gear') {
    const g = GEAR.find((x) => x.n === name || x.k === name);
    if (g) return <GearIcon g={g} />;
  }
  if (cat === 'item') {
    const i = ITEMS.find((x) => x.n === name || x.k === name);
    if (i) return <ItemIcon k={i.k} />;
  }
  return <>{e}</>;
}

/** The same for an info-card key such as "it|race|Pigeon". */
export function iconForInfoKey(key: string, e: string) {
  const [kind, cat, ...rest] = key.split('|');
  const name = rest.join('|');
  if (kind === 'it' && cat && name) return <ContentIcon cat={cat} name={name} e={e} />;
  return <>{e}</>;
}
