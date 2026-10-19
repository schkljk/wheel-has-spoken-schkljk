// Review round 2's retune of the ported tables (K1, K6, K7, K10). The tables stay a faithful port of the legacy
// game: each change here is laid over a row while its switch in `BALANCE` is on, and taken off again when the
// tuning switches back (the parity tests play by `LEGACY_BALANCE`, so they see the legacy rows). The rows are
// changed in place, so everything that reads them (the fight engine, the UI's descriptions) follows the switch.
import './wording'; // the wording fixes go on first, so a row's "before" is the worded legacy row
import { BALANCE, onBalance, type BalanceFlag } from './balance';
import { TNODE } from '../stats';
import { GEAR } from './gear';
import { SYN } from './synergies';
import { TREE } from './talents';
import { SIDEKICKS, TITLES } from './wheels';

const MISSING = Symbol('missing');
interface Patch {
  flag: BalanceFlag;
  row: Record<string | number, unknown>;
  live: Record<string | number, unknown>;
  old: Record<string | number, unknown>;
}
const PATCHES: Patch[] = [];

/** Lays `live` over `row` while `flag` is on. Only the keys in `live` change (a key set to undefined is removed). */
export function retune<T extends object>(flag: BalanceFlag, row: T | undefined, live: Partial<Record<keyof T, unknown>>) {
  if (!row) throw new Error(`retune: no row for ${flag}`);
  const r = row as Record<string | number, unknown>;
  const old: Record<string | number, unknown> = {};
  for (const k of Object.keys(live)) old[k] = k in r ? r[k] : MISSING;
  PATCHES.push({ flag, row: r, live: live as Record<string, unknown>, old });
}

/** A talent's new effect and description, in the tree and in its node. */
export function retuneTalent(flag: BalanceFlag, key: string, eff: unknown, d: string) {
  const [br, k] = key.split('_') as [string, string];
  const row = TREE.find((b) => b.k === br)?.t.find((x) => x[0] === k);
  retune(flag, row as unknown as Record<number, unknown>, { 4: eff, 5: d });
  retune(flag, TNODE[key], { eff, d });
}

/** Puts every row in the state its switch says. */
export function applyRetune() {
  for (const p of PATCHES) {
    const on = !!BALANCE[p.flag];
    for (const k of Object.keys(p.live)) {
      const v = on ? p.live[k] : p.old[k];
      if (v === MISSING || v === undefined) delete p.row[k];
      else p.row[k] = v;
    }
  }
}
onBalance(applyRetune);

// ---------------------------------------------------------------- the rows

const gear = (k: string) => GEAR.find((g) => g.k === k);
const syn = (k: string) => SYN.find((s) => s.k === k);

// K1: premium gear. The Coat's revive was most of its 20 points; the Crown and the halo boots did nothing.
retune('premiumGate', gear('starcoat'), { fx: { regen: 4 }, d: '+1 to everything, heals 4% HP every round' });
retune('premiumGate', gear('rizzcrown'), {
  fx: { critB: 0.1, taunt: 1, rizz: 0.12 },
  d: '+4 charisma, +10% crit, taunts, and opponents lose 12% of their turns staring',
});
// the wheel lean itself is in the fight engine (battle.ts ultWeights, R2_TUNE.halo)
retune('premiumGate', gear('haloboots'), {
  m: { cha: 2, spd: 1 },
  d: '+2 charisma, +1 speed, +12% crit, +8% dodge. Your signature wheel lands Jackpot 4× as often, Whiff a quarter as often',
});

// K6: one revive in the tree. Second wind and Lucky break did the same job as Stubborn, and only one counts a fight.
retuneTalent('reviveCap', 'def_wind', { fx: { regen: 2, enRegen: 4 } }, 'Heal 2% HP and gain 4 energy every round');
retuneTalent('reviveCap', 'for_break', { fx: { critB: 0.08, dodgeB: 0.08 } }, '+8% crit, +8% dodge');
retuneTalent('reviveCap', 'def_stubborn', { fx: { revive: 35 } }, 'Get back up once with 35% HP. One revive counts a fight, whatever it comes from');

// K7: the Knight set beat the epic Cosmic set; Shadow did nothing; Clown cost you.
retune('critDodge', syn('set_knight4'), { m: { dur: 1 }, d: '4 knight pieces: +1 durability, guards block 10% more' });
retune('critDodge', syn('set_knight6'), { fx: { dr: 0.05, counterB: 0.2 }, d: 'Full knight set: takes 5% less damage, counters 20% harder' });
retune('critDodge', syn('set_shadow4'), {
  d: "4 shadow pieces: +1 speed, +8% crit, and your first strike of a fight can't be dodged or guarded",
  flavor: 'Nobody sees the first one coming. That is the whole business model.',
});
retune('critDodge', syn('set_clown2'), { m: { dur: 2 }, fx: undefined, d: '2 clown pieces: +2 durability', flavor: 'Taking a pie to the face is a job skill.' });
retune('critDodge', syn('set_clown4'), {
  m: { cha: 2 },
  fx: { dodgeB: 0.1, rizz: 0.1 },
  d: 'Full clown set: +10% dodge, +2 charisma, and opponents lose 10% of their turns laughing',
  flavor: 'The crowd loves it. The opponent hates that they love it.',
});

// K10: dead fight talents, the outliers, and lifesteal that finally heals (a drain under 1 is a share of the damage)
retuneTalent('pickTune', 'spi_drain', { fx: { drain: 0.06 } }, 'Hits heal 6% of the damage per rank');
retuneTalent('pickTune', 'def_counter', { fx: { counterB: 0.3 } }, 'Counters 30% harder per rank');
retuneTalent('pickTune', 'def_iguard', { fx: { guardAdd: -0.05, dr: 0.02 } }, 'Guards block 5% more, and take 2% less damage, per rank');
retuneTalent('pickTune', 'def_wall', { fx: { guardAdd: -0.06, counterB: 0.2, guardEn: 8 } }, 'Guards block 6% more, counter 20% harder and give 8 more energy, per rank');
retuneTalent('pickTune', 'tac_evade', { fx: { dodgeB: 0.05 } }, '+5% dodge per rank');
retune('pickTune', TITLES.find((t) => t.k === 'fraud'), { m: { str: -1, spd: -1, dur: -1 }, d: '−1 strength, speed and durability. The comments were right' });
retune('pickTune', TITLES.find((t) => t.k === 'goat'), { m: { str: 2, spd: 1, dur: 2, iq: 1, wm: 1, pm: 1 }, d: '+2 strength and durability, +1 to everything else' });
retune('pickTune', SIDEKICKS.find((s) => s.k === 'dragon'), { fx: { pet: { e: '🐉', n: 'tiny dragon', x: 1.4 } } });
// the lifesteal now works, so its numbers have to be true
retune('pickTune', gear('fang'), { d: 'Hits heal 12% of the damage' });
retune('pickTune', syn('shark_water'), { d: 'Sharkfolk with water power or in a sea weapon: +2 strength, bites heal 15% of the damage' });

applyRetune();
