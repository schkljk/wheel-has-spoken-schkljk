import { GEAR, ITEMS } from '@whs/core';
import { RaceIcon } from '../art/RaceIcon';
import { GearIcon, ItemIcon } from './GearIcon';

/** The pixel icon for a piece of content (race, gear, bag item), or its emoji where there is none yet. */
export function ContentIcon({ cat, name, e }: { cat: string; name: string; e?: string }) {
  if (cat === 'race') return <RaceIcon race={name} e={e} />;
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
  const [kind, cat, name] = key.split('|');
  if (kind === 'it' && cat && name) return <ContentIcon cat={cat} name={name} e={e} />;
  return <>{e}</>;
}
