import type { TraitFx, StatMods } from '../types';
import { deserFighter, type CareerFighter } from './fighter';
import type { Profile, Slot } from './schema';

/** Rank of a legacy perk. */
export const lgLvl = (profile: Pick<Profile, 'legacy'>, k: string) => profile.legacy.perks[k] || 0;

/** The small permanent edge legacy perks give every career fighter. */
export function legacyFx(profile: Pick<Profile, 'legacy'>): { m: StatMods; fx: TraitFx } {
  return { m: { dur: lgLvl(profile, 'iron') }, fx: { readB: 0.05 * lgLvl(profile, 'scouts') } };
}

/** XP needed to go from level l to l+1. */
export const xpNeed = (l: number) => 20 + (l - 1) * 15;
export const LEVEL_CAP = 50;

/** The playable fighter in a roster slot (legacy loadCareer), or null if the save can't rebuild it. */
export function loadCareer(slot: Slot | null | undefined, profile: Pick<Profile, 'legacy'>): CareerFighter | null {
  if (!slot) return null;
  const f = deserFighter(slot.career);
  if (!f) return null;
  f.career = true;
  f.lfx = legacyFx(profile);
  return f;
}
