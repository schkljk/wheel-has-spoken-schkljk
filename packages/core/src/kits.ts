import { ARCH_KIT, RACE_KIT } from './data/kits';
import { WEAPONS } from './data/wheels';
import type { Fighter, KitMove, MoveFamily, Move, RoundMod, Weapon } from './types';

const A_ = (n: string, e: string, fam: MoveFamily, c: Move, rm: RoundMod, d: string): KitMove => ({ n, e, fam, c, rm, d });

/** The move a weapon brings, chosen by weapon kind (first matching rule wins). */
export function weaponKit(w: Weapon | null | undefined): KitMove {
  const n = (w && w.n) || '';
  const t = (w && w.t) || [];
  if (w && w.fists) return A_('Uppercut', '👊', 'atk', 'strike', { dmgX: 1.25, apply: { s: 'stun', ch: 0.15 } }, '+25% damage, may stun');
  if (/crossbow|bow|rifle/i.test(n)) return A_('Aimed shot', '🎯', 'atk', 'strike', { critPlus: 0.35, slow: 1 }, '+35% crit, goes second');
  if (/dagger|rapier/i.test(n)) return A_('Twin stab', '🗡️', 'atk', 'strike', { hits: 2, dmgX: 0.6, first: 1 }, 'Two quick stabs, goes first');
  if (/katana/i.test(n)) return A_('Draw cut', '⚔️', 'atk', 'strike', { first: 1, dmgX: 1.2 }, 'Goes first, +20% damage');
  if (/chainsaw/i.test(n))
    return A_('Rev up', '🪚', 'atk', 'strike', { hits: 3, dmgX: 0.5, apply: { s: 'bleed', ch: 0.5 } }, 'Three grinding hits');
  if (/hammer|bat|brick|pan|staff$|bo staff/i.test(n))
    return A_('Stagger', '🔨', 'atk', 'strike', { dmgX: 1.1, apply: { s: 'stun', ch: 0.3 } }, 'May stun them');
  if (/axe|scythe|greatsword/i.test(n))
    return A_('Cleave', '🪓', 'atk', 'strike', { dmgX: 1.4, slow: 1, apply: { s: 'bleed', ch: 0.4 } }, '+40% damage, may cause bleeding');
  if (/spear|trident|harpoon/i.test(n)) return A_('Lunge', '🔱', 'atk', 'strike', { first: 1, dmgX: 1.15 }, 'Long reach: goes first');
  if (/whip|nunchuck|fishing/i.test(n)) return A_('Lash', '〰️', 'atk', 'strike', { hits: 2, dmgX: 0.55, steal: 10 }, 'Two lashes, steals energy');
  if (/shuriken|chakram|boomerang/i.test(n)) return A_('Ricochet', '🌀', 'atk', 'strike', { hits: 2, dmgX: 0.65 }, 'Hits twice');
  if (/guitar/i.test(n))
    return A_('Power chord', '🎸', 'atk', 'strike', { debuff: { k: 'weak', v: 0.15, r: 2 } }, 'Deafens them: they deal 15% less');
  if (/chicken|noodle|lollipop|uno/i.test(n))
    return A_('Bonk', '🤪', 'atk', 'strike', { dmgX: 0.6, apply: { s: 'stun', ch: 0.3 }, en: 10 }, 'Silly, but it may stun');
  if (/staff/i.test(n)) return A_('Channel', '🪄', 'pow', 'focus', { en: 30, buff: { k: 'critB', v: 0.1, r: 2 } }, '+30 energy, +10% crit');
  if (t.includes('blade')) return A_('Slash', '⚔️', 'atk', 'strike', { dmgX: 1.15, apply: { s: 'bleed', ch: 0.3 } }, 'May cause bleeding');
  return A_('Weapon strike', (w && w.e) || '⚔️', 'atk', 'strike', { dmgX: 1.1 }, '+10% damage');
}

export type FighterMove = KitMove & { src: 'class' | 'race' | 'weapon' };

/** A fighter's full kit: two class moves, a racial move and a weapon move. */
export function kitMoves(f: Fighter): FighterMove[] {
  const out: FighterMove[] = [];
  const hasPower = !!(f.power && f.power.k !== 'none' && !f.power.passive);
  const add = (m: KitMove | undefined, src: FighterMove['src']) => {
    if (!m) return;
    // power moves fall back to strikes for fighters without an active power
    const c = m.c === 'power' && !hasPower ? 'strike' : m.c;
    out.push({ ...m, c, src, rm: { label: m.n, e: m.e, ...m.rm } });
  };
  for (const m of ARCH_KIT[(f.arch && f.arch.k) || ''] || []) add(m, 'class');
  add(RACE_KIT[(f.race && f.race.n) || ''], 'race');
  add(weaponKit(f.weapon), 'weapon');
  return out;
}

/** Look a move up by name across every kit. */
export function findMove(n: string): FighterMove | null {
  for (const ms of Object.values(ARCH_KIT)) for (const m of ms) if (m.n === n) return { src: 'class', ...m };
  for (const m of Object.values(RACE_KIT)) if (m.n === n) return { src: 'race', ...m };
  for (const w of WEAPONS) {
    const m = weaponKit(w);
    if (m.n === n) return { src: 'weapon', ...m };
  }
  return null;
}
