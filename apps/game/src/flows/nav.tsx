import type { ComponentChildren } from 'preact';
import {
  GEARK,
  RARITY,
  SLOT_N,
  WHEEL,
  act2Migrate,
  addCoins,
  hpTxt,
  applyEvent,
  eventList,
  gearArrives,
  gearChoose,
  healS,
  labelOf,
  levelUpLand,
  levelUpList,
  lootLand,
  lootList,
  lootStart,
  prizeMoney,
  salvageValue,
  storyEnsure,
  placeNemesis,
  myNemesis,
  storyOf,
  upgradeChoose,
  upgradeLists,
  upgradeNone,
  type Gear,
  type LootTable,
  type Step,
} from '@whs/core';
import { G, act, go, sync, toast } from '../state/game';
import { cine, closeSheet, confirm, openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { burst } from '../ui/fx';
import { beep } from '../ui/sound';
import { spinWheel } from '../screens/Spin';
import { GearIcon } from '../ui/GearIcon';
import { GearCompareView } from '../ui/GearCompare';

// ---------------------------------------------------------------- primitives
export interface ChoiceOpt {
  label: string;
  sub?: string;
  disabled?: boolean;
  /** a small chip by the label (charisma options say what they need) */
  tag?: string;
  /** styled as a charisma option */
  talk?: boolean;
}
/** Asks the player to pick one option (legacy askChoice). Resolves with its index. */
export function choose(o: { emoji?: string; title: string; sub?: string; body?: ComponentChildren; options: ChoiceOpt[] }): Promise<number> {
  return new Promise((resolve) => {
    openSheet(
      <Sheet emoji={o.emoji} title={o.title} sub={o.sub} locked>
        {o.body && <div class="ch-body">{o.body}</div>}
        <div class="ch-opts">
          {o.options.map((x, i) => (
            <button
              key={x.label}
              class={`ch-opt${x.talk ? ' talk' : ''}`}
              disabled={x.disabled}
              onClick={() => {
                closeSheet();
                resolve(i);
              }}
            >
              <b>
                {x.label}
                {x.tag && <span class="ch-tag">{x.tag}</span>}
              </b>
              {x.sub && <small>{x.sub}</small>}
            </button>
          ))}
        </div>
      </Sheet>,
      true,
    );
  });
}

/** A full-screen card with one button (intros, celebrations). */
export function showCine(content: ComponentChildren, button: string): Promise<void> {
  return new Promise((resolve) => {
    cine.value = (
      <div class="cine-card">
        {content}
        <button
          class="btn block cine-btn"
          ref={(b) => b?.focus()}
          onClick={() => {
            cine.value = null;
            resolve();
          }}
        >
          {button}
        </button>
      </div>
    );
  });
}

export async function celebrate(icon: string, title: string, sub: string) {
  [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.2, 'triangle', 0.06, i * 0.09));
  setTimeout(() => burst(innerWidth / 2, innerHeight * 0.35), 150);
  await showCine(
    <>
      <div class="cele-badge" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{sub}</p>
    </>,
    'Continue',
  );
}

const note = (t: string, cls = 'sub') => (t ? <div class={`note ${cls}`}>{t}</div> : null);

// ---------------------------------------------------------------- level-ups
/** Spins the level-up wheel for every level waiting. Awakening and Arsenal lead to an upgrade spin. */
export async function levelUps() {
  while (G.F && (G.F.pendingLv || 0) > 0) {
    let up: 'power' | 'weapon' | null = null;
    const F = G.F;
    await spinWheel({
      cat: 'lvl',
      title: 'Level up',
      who: `${F.name} reached level ${F.lvl}`,
      list: levelUpList(),
      spinLabel: 'Spin the level-up wheel',
      preview: true,
      nextLabel: 'Continue',
      onLand: (it) => {
        up = levelUpLand(G, it);
        if (up === 'power') return <div class="ds">Next: a power spin with only equal or better slices. You can keep your current power if you like it more</div>;
        if (up === 'weapon') return <div class="ds">Next: a weapon spin with only equal or better slices. You can keep your current weapon</div>;
        return null;
      },
    });
    if (up) await upgradeSpin(up);
  }
}

async function upgradeSpin(kind: 'power' | 'weapon') {
  const L = upgradeLists(G, kind);
  if (!L.list.length) {
    toast(act((g) => upgradeNone(g, kind)));
    return;
  }
  const it = await spinWheel({
    cat: kind,
    title: kind === 'power' ? 'Awakening' : 'New weapon',
    who: 'Only equal or better slices on this wheel',
    list: L.list,
    reasons: [{ cls: 'up', txt: `Only slices at least as good as your ${L.old.n.toLowerCase()}` }],
    onLand: () => null,
    nextLabel: 'Now the mastery',
  });
  const MW = WHEEL[L.MK];
  const m = await spinWheel({
    cat: L.MK,
    title: labelOf(MW, G.F!),
    who: 'Mastery can only go up',
    list: L.mlist,
    reasons: [{ cls: 'up', txt: `Never below ${L.oldM.n.toLowerCase()}` }],
    onLand: () => null,
    nextLabel: 'Compare',
  });
  const c = await choose({
    emoji: '⚖️',
    title: 'Swap or keep?',
    sub: 'Pick the one you want to fight with',
    options: [
      { label: `New: ${it.e} ${it.n}`, sub: `${m.n} mastery${it.d ? '. ' + it.d : ''}` },
      { label: `Keep: ${L.old.e} ${L.old.n}`, sub: `${L.oldM.n} mastery, plus +1 mastery for staying loyal` },
    ],
  });
  act((g) => upgradeChoose(g, kind, c === 0 ? { it, m } : null));
  toast(c === 0 ? `${it.e} ${it.n} it is` : '+1 mastery');
}

// ---------------------------------------------------------------- loot and new gear
/** The loot wheel; new gear for a taken slot asks what to do with it. */
export async function lootFlow(table: LootTable) {
  storyEnsure(G);
  const list = lootList(G, table);
  const reasons = act((g) => lootStart(g, table));
  let pending: Gear | null = null;
  await spinWheel({
    cat: 'loot',
    title: 'Loot',
    who: `${G.F!.name} searches the spoils`,
    list,
    reasons,
    spinLabel: 'Spin for loot',
    nextLabel: 'Continue',
    onLand: (it) => {
      const r = lootLand(G, it);
      if (!r) return null;
      if (r.kind === 'coins') return note(`+${r.n} coins`);
      if (r.kind === 'item') return note(`${r.item.e} ${r.item.n} added to your bag`);
      const g = r.gear;
      if (g.r === 'legendary' || g.r === 'mythic') setTimeout(() => burst(), 200);
      if (r.then === 'choose') pending = g;
      return (
        <>
          <GearReveal g={g} />
          {r.then === 'equipped' && note('Equipped')}
          {r.then === 'salvaged' && note('You already have one: salvaged for coins')}
          {r.then === 'copy' && note('You already have one: +1 copy for upgrading it (Armory → Forge)')}
          {r.bonus && note(`Bonus: a copy of your ${r.bonus.e} ${r.bonus.n}, for upgrading it`)}
        </>
      );
    },
  });
  if (pending) await gearChoice(pending);
}

export function GearReveal({ g }: { g: Gear }) {
  return (
    <div class={`lootreveal r-${g.r}`}>
      <span class="lr-e" aria-hidden="true">
        <GearIcon g={g} />
      </span>
      <span>
        <b>{g.n}</b>
        <small>
          {RARITY[g.r]?.n} {g.slot}. {g.d}
        </small>
      </span>
    </div>
  );
}

/** New gear for a slot that is taken: wear it, store it in the armory, or salvage it. */
export async function gearChoice(g: Gear) {
  act((x) => gearArrives(x, g));
  const F = G.F!;
  const old = GEARK[F.gear![g.slot]!];
  const salv = salvageValue(g);
  for (;;) {
    const c = await choose({
      emoji: g.e,
      title: `New ${SLOT_N[g.slot].toLowerCase()}: ${g.n}`,
      sub: `${RARITY[g.r] ? RARITY[g.r].n : ''}. ${g.d}`,
      body: (
        <>
          <GearCompareView k={g.k} />
          <small class="hint">Whatever you don't wear stays in your armory.</small>
        </>
      ),
      options: [
        { label: `Wear ${g.n}`, sub: old ? `${old.n} goes to your armory` : 'Equip it now' },
        { label: old ? `Keep wearing ${old.n}` : 'Store it for later', sub: `${g.n} goes to your armory` },
        { label: `Salvage ${g.n}`, sub: `Get ${salv} 🪙 instead. It's gone for good` },
      ],
    });
    if (c === 2 && !(await confirm({ title: `Salvage ${g.n}?`, body: `You get ${salv} coins. It is gone for good.`, yes: 'Salvage it' }))) continue;
    act((x) => gearChoose(x, g, (['wear', 'store', 'salvage'] as const)[c]!));
    toast(c === 0 ? `${g.e} ${g.n} equipped` : c === 1 ? `${g.e} ${g.n} added to your armory` : `+${salv} 🪙`);
    return;
  }
}

// ---------------------------------------------------------------- story rewards and cup events
/** After a story win: a loot spin, 25% HP back, or prize money. */
export async function rewardFlow() {
  const c = prizeMoney(G);
  const pick = await choose({
    emoji: '🏆',
    title: 'Pick your reward',
    sub: `HP ${hpTxt(G, storyOf(G).hp)}`,
    options: [
      { label: '🎁 Loot spin', sub: 'Gear, items or coins' },
      { label: '💚 Catch your breath', sub: 'Heal 25% HP' },
      { label: '💰 Prize money', sub: `+${c} coins` },
    ],
  });
  if (pick === 0) await lootFlow('normal');
  else if (pick === 1) {
    act((g) => healS(g, 25));
    toast('+25% HP');
  } else {
    act((g) => addCoins(g, c));
    toast(`+${c} 🪙`);
  }
}

export async function eventFlow() {
  const F = G.F!;
  await spinWheel({
    cat: 'event',
    title: 'Between rounds',
    who: `Something happens to ${F.name}`,
    list: eventList(),
    spinLabel: 'Spin the event wheel',
    nextLabel: 'Continue',
    onLand: (it) => note(applyEvent(G, it)),
  });
}

// ---------------------------------------------------------------- places
/** The fighter page. Waiting level-ups are spun first, as in the legacy game. */
export async function goHub(tab: 'play' | 'fighter' | 'goals' | 'more' = 'play') {
  if (!G.F) return go({ screen: 'title' });
  if ((G.F.pendingLv || 0) > 0) await levelUps();
  go({ screen: 'hub', tab });
}

/** The story map (repairs old stories and opens Act II for those who finished Act I). */
export function goMap() {
  if (!G.F) return go({ screen: 'title' });
  act((g) => {
    storyEnsure(g);
    const m = act2Migrate(g);
    if (m) toast(m);
    if (placeNemesis(g)) toast(`😈 ${myNemesis(g)!.f.name} is somewhere on this map. Waiting.`);
  });
  go({ screen: 'map', key: Math.random() });
}

/** What follows a fight result, in order. Steps that lead somewhere end the chain. */
export async function runSteps(steps: Step[], places: { bracket?: () => void; gauntlet?: () => void; rush?: () => void; tower?: () => void } = {}) {
  for (const s of steps) {
    switch (s.t) {
      case 'loot':
        await lootFlow(s.table);
        break;
      case 'reward':
        await rewardFlow();
        break;
      case 'event':
        await eventFlow();
        break;
      case 'levelups':
        await levelUps();
        break;
      case 'celebrate':
        await celebrate(s.icon, s.title, s.sub);
        break;
      case 'map':
        return goMap();
      case 'hub':
        return goHub();
      case 'bracket':
        return places.bracket?.();
      case 'gauntlet':
        return places.gauntlet?.();
      case 'rush':
        return places.rush?.();
      case 'tower':
        return places.tower?.();
    }
  }
  sync();
}
