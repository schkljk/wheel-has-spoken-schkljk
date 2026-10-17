import { ITEMS, RARITY, type Gear, type GearSlot } from '@whs/core';
import { Icon, ICONS, type Tint } from './Icon';

/** A rarity color and a lighter highlight for it. */
const tints = new Map<string, Tint>();
export function rarityTint(r: string): Tint {
  let t = tints.get(r);
  if (!t) {
    const c = (RARITY as Record<string, { c: string }>)[r]?.c ?? '#B9B2CC';
    const n = parseInt(c.slice(1), 16);
    const mix = (v: number) => Math.round(v + (255 - v) * 0.55);
    const hi = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
    tints.set(r, (t = { x: c, X: `#${hi.map((v) => v.toString(16).padStart(2, '0')).join('')}` }));
  }
  return t;
}

/** A gear piece as a pixel icon: its slot's shape in its rarity's color. */
export function GearIcon({ g, class: cls }: { g: Pick<Gear, 'slot' | 'r' | 'n'>; class?: string }) {
  return <Icon name={`slot_${g.slot}`} tint={rarityTint(g.r)} class={cls} label={g.n} />;
}

/** An empty gear slot, drawn faded. */
export function SlotIcon({ slot, class: cls }: { slot: GearSlot; class?: string }) {
  return <Icon name={`slot_${slot}`} tint={rarityTint('junk')} class={`faded${cls ? ' ' + cls : ''}`} />;
}

/** A bag item as a pixel icon (its emoji if it has none yet). */
export function ItemIcon({ k, class: cls }: { k: string; class?: string }) {
  if (ICONS[`it_${k}`]) return <Icon name={`it_${k}`} class={cls} label={ITEMS.find((i) => i.k === k)?.n} />;
  return <span class={cls}>{ITEMS.find((i) => i.k === k)?.e}</span>;
}
