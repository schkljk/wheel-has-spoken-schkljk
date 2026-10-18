import type { StatusChip } from '@whs/core';

/** The pixel icon for each status or buff on a fighter (over their head, and in the fight menu). */
export const CHIP_ICON: Record<StatusChip['k'], string> = {
  guard: 'shield',
  opened: 'mv_feint',
  focused: 'mv_focus',
  dmgX: 'fist',
  dr: 'slot_armor',
  critB: 'target',
  frozen: 'st_frozen',
  burning: 'st_burn',
  poison: 'st_poison',
  soaked: 'st_soaked',
  vuln: 'st_vuln',
  weak: 'st_weak',
  bent: 'st_bent',
};
