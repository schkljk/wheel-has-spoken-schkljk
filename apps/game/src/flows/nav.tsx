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
  gearVerdict,
  healS,
  labelOf,
  addLevelSpin,
  levelSpins,
  levelSpinsPerLevel,
  levelUpItem,
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
  pendingSteps,
  pendingNode,
  lastPlace,
  pushStep,
  setPendingSteps,
  setPlace,
  stepDone,
  type Game,
  type Gear,
  type LootTable,
  type Step,
} from '@whs/core';
import { G, act, enterSlot, go, sync, toast } from '../state/game';
import { cine, closeSheet, confirm, openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { burst } from '../ui/fx';
import { duck, sfx } from '../ui/sound';
import { spinWheel } from '../screens/Spin';
import { GearIcon } from '../ui/GearIcon';
import { GearCompareView } from '../ui/GearCompare';
import { swapped } from './armory';

// ---------------------------------------------------------------- primitives
export interface ChoiceOpt {
  label: string;
  sub?: string;
  disabled?: boolean;
  /** a small chip by the label (charisma options say what they need) */
  tag?: string;
  /** the chip's color: good news, bad news or neither (default: the charisma purple) */
  tone?: 'up' | 'down' | 'even';
  /** styled as a charisma option */
  talk?: boolean;
  /** a way out rather than a choice ("Not now", "Walk back down"): styled quieter (guessed from the label) */
  quiet?: boolean;
}
const QUIET = /^(not now|leave|walk |no thanks|maybe later|back\b)/i;
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
              class={`ch-opt${x.talk ? ' talk' : ''}${(x.quiet ?? QUIET.test(x.label)) ? ' quiet' : ''}`}
              disabled={x.disabled}
              onClick={() => {
                closeSheet();
                resolve(i);
              }}
            >
              <b>
                {x.label}
                {x.tag && <span class={`ch-tag${x.tone ? ' ' + x.tone : ''}`}>{x.tag}</span>}
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
  sfx('ui.lvl', { vary: 0 });
  duck(0.45, 1, 0.8);
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
/** What keeping a level-up slice does, for the pick between two spins. */
const LV_SUB: Record<string, string> = {
  awaken: 'A power spin with only equal or better slices. You can keep your current power',
  arsenal: 'A weapon spin with only equal or better slices. You can keep your current weapon',
  cure: 'Your weakness is gone for good',
  all1: '+1 strength, speed, durability, IQ and both masteries',
};

export async function levelUps() {
  while (G.F && (G.F.pendingLv || 0) > 0) {
    const F = G.F;
    // a second opinion (F4): two spins a level, keep one. Spins landed before the app closed still count (A4)
    const per = levelSpinsPerLevel();
    const got = levelSpins(G)
      .map(levelUpItem)
      .filter((x): x is NonNullable<typeof x> => !!x);
    while (got.length < per) {
      const second = got.length > 0;
      const more = got.length + 1 < per;
      const it = await spinWheel({
        cat: 'lvl',
        title: second ? 'Second opinion' : 'Level up',
        who: second ? `Then keep the one you like. ${F.name}, level ${F.lvl}` : `${F.name} reached level ${F.lvl}`,
        list: levelUpList(),
        spinLabel: second ? 'Spin for a second opinion' : 'Spin the level-up wheel',
        preview: true,
        nextLabel: more ? 'Spin again' : 'Continue',
        // you spin it; it moves on by itself (B3)
        autoNext: 2000,
        onLand: (x) => {
          act((g) => addLevelSpin(g, x.k));
          if (more) return <div class="ds">One more spin, then you keep the one you like</div>;
          return LV_SUB[x.k] ? <div class="ds">{LV_SUB[x.k]}</div> : null;
        },
      });
      got.push(it);
    }
    let it = got[0]!;
    if (got.length > 1 && got[1]!.k !== it.k) {
      const c = await choose({
        emoji: '⚖️',
        title: 'Keep one',
        sub: `Level ${F.lvl}: two spins, one pick. The other goes back in the wheel`,
        options: got.map((x) => ({ label: `${x.e} ${x.n}`, sub: LV_SUB[x.k] })),
      });
      it = got[c]!;
    } else if (got.length > 1) toast(`Both spins agree: ${it.e} ${it.n}`);
    const up = act((g) => levelUpLand(g, it));
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
/**
 * The loot wheel; new gear for a taken slot asks what to do with it. As a step after a fight (`step`), landing
 * marks the step done in the same change that pays it, and a gear choice waits as its own step, so closing the
 * app never pays twice or loses the piece (A4). `landed` runs in that same change too (a map step moving on).
 */
export async function lootFlow(table: LootTable, o: { step?: boolean; landed?: (g: Game) => void } = {}) {
  storyEnsure(G);
  const list = lootList(G, table);
  const reasons = act((g) => lootStart(g, table));
  let pending: Gear | null = null;
  // a piece of gear is worth reading: its reveal waits for a tap (G10)
  let gear = false;
  await spinWheel({
    cat: 'loot',
    title: 'Loot',
    who: `${G.F!.name} searches the spoils`,
    list,
    reasons,
    spinLabel: 'Spin for loot',
    nextLabel: 'Continue',
    // spoils spin and move on by themselves (B3); a gear choice still waits for you
    autoSpin: true,
    autoNext: 1700,
    hold: () => gear,
    onLand: (it) => {
      const r = lootLand(G, it);
      gear = !!r && r.kind === 'gear';
      if (o.step) stepDone(G);
      if (r && r.kind === 'gear' && r.then === 'choose') pushStep(G, { t: 'gear', k: r.gear.k });
      o.landed?.(G);
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
  if (pending) await gearChoice(pending, true);
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

/** New gear for a slot that is taken: wear it, store it in the armory, or salvage it. `step`: it is a waiting step. */
export async function gearChoice(g: Gear, step = false) {
  act((x) => gearArrives(x, g));
  const F = G.F!;
  const old = GEARK[F.gear![g.slot]!];
  const salv = salvageValue(g);
  // the better choice goes first, tagged (a common piece should never be pushed over an epic one)
  const v = old ? gearVerdict(G, g.k) : 'up';
  const TAG = { up: 'Upgrade', down: 'Downgrade', even: 'About even' } as const;
  const wearOpt: ChoiceOpt = { label: `Wear ${g.n}`, sub: old ? `${old.n} goes to your armory` : 'Equip it now', tag: TAG[v], tone: v };
  const keepOpt: ChoiceOpt = { label: old ? `Keep wearing ${old.n}` : 'Store it for later', sub: `${g.n} goes to your armory`, tag: v === 'down' ? 'Better' : undefined, tone: 'up' };
  const keepFirst = v === 'down';
  for (;;) {
    const pick = await choose({
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
        ...(keepFirst ? [keepOpt, wearOpt] : [wearOpt, keepOpt]),
        { label: `Salvage ${g.n}`, sub: `Get ${salv} 🪙 instead. It's gone for good` },
      ],
    });
    // 0 wear, 1 keep, 2 salvage, whatever order they were shown in
    const c = pick === 2 ? 2 : keepFirst ? 1 - pick : pick;
    if (c === 2 && !(await confirm({ title: `Salvage ${g.n}?`, body: `You get ${salv} coins. It is gone for good.`, yes: 'Salvage it' }))) continue;
    const prev = F.gear![g.slot];
    act((x) => {
      gearChoose(x, g, (['wear', 'store', 'salvage'] as const)[c]!);
      if (step) stepDone(x);
    });
    if (c === 0) swapped(`${g.e} ${g.n} equipped`, g.slot, prev);
    else toast(c === 1 ? `${g.e} ${g.n} added to your armory` : `+${salv} 🪙`);
    return;
  }
}

// ---------------------------------------------------------------- story rewards and cup events
/** After a story win: a loot spin, 25% HP back, or prize money. As a step, the choice and its payout are one change. */
export async function rewardFlow(step = false) {
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
  if (pick === 0) return lootFlow('normal', { step });
  takeReward(pick === 1 ? 'heal' : 'money', step);
}
/** The story reward's heal or prize money (the loot spin is lootFlow). */
export function takeReward(k: 'heal' | 'money', step: boolean) {
  const c = prizeMoney(G);
  act((g) => {
    if (k === 'heal') healS(g, 25);
    else addCoins(g, c);
    if (step) stepDone(g);
  });
  toast(k === 'heal' ? '+25% HP' : `+${c} 🪙`);
}

export async function eventFlow(step = false) {
  const F = G.F!;
  await spinWheel({
    cat: 'event',
    title: 'Between rounds',
    who: `Something happens to ${F.name}`,
    list: eventList(),
    spinLabel: 'Spin the event wheel',
    nextLabel: 'Continue',
    onLand: (it) => {
      const t = applyEvent(G, it);
      if (step) stepDone(G);
      return note(t);
    },
  });
}

// ---------------------------------------------------------------- places
/** The fighter page. Steps still waiting after a fight come first (A4), then waiting level-ups. */
export async function goHub(tab: 'play' | 'fighter' | 'goals' | 'more' = 'play') {
  if (!G.F) return go({ screen: 'title' });
  if (pendingSteps(G).length) return resumeSteps();
  if ((G.F.pendingLv || 0) > 0) await levelUps();
  act((g) => setPlace(g, 'hub'));
  go({ screen: 'hub', tab });
}

/** The story map (repairs old stories and opens Act II for those who finished Act I). A step that was entered and not finished picks up where it was. */
export function goMap() {
  if (!G.F) return go({ screen: 'title' });
  if (pendingSteps(G).length) return void resumeSteps();
  act((g) => {
    storyEnsure(g);
    const m = act2Migrate(g);
    if (m) toast(m);
    if (placeNemesis(g)) toast(`😈 ${myNemesis(g)!.f.name} is somewhere on this map. Waiting.`);
    setPlace(g, 'map');
  });
  go({ screen: 'map', key: Math.random() });
  const i = pendingNode(G);
  if (i != null) void import('./story').then((m) => m.resumeNode(i));
}

type Places = { bracket?: () => void; gauntlet?: () => void; rush?: () => void; tower?: () => void };

/**
 * What follows a fight result, in order. The steps are kept in the save as they go (A4): each is done in the
 * same change that pays it, so closing the app picks up at the next one. Steps that lead somewhere end the chain.
 */
export async function runSteps(steps: Step[], places: Places = {}) {
  act((g) => setPendingSteps(g, steps));
  const leave = () => act((g) => setPendingSteps(g, null));
  for (const s of steps) {
    switch (s.t) {
      // these mark themselves done when they pay out
      case 'loot':
        await lootFlow(s.table, { step: true });
        continue;
      case 'reward':
        await rewardFlow(true);
        continue;
      case 'event':
        await eventFlow(true);
        continue;
      case 'gear':
        if (GEARK[s.k]) await gearChoice(GEARK[s.k]!, true);
        else act((g) => stepDone(g));
        continue;
      case 'levelups':
        await levelUps();
        break;
      case 'celebrate':
        await celebrate(s.icon, s.title, s.sub);
        break;
      case 'map':
        leave();
        return goMap();
      case 'hub':
        leave();
        return goHub();
      case 'bracket':
        leave();
        return places.bracket?.();
      case 'gauntlet':
        leave();
        return places.gauntlet?.();
      case 'rush':
        leave();
        return places.rush?.();
      case 'tower':
        leave();
        return places.tower?.();
      case 'run':
        leave();
        return void import('./run').then((m) => m.runFlow());
    }
    act((g) => stepDone(g));
  }
  leave();
  sync();
}

/**
 * Continue (B5): back into the fighter's game where it was left. Steps still waiting after a fight first, then
 * the story map, a bracket, or the fighter page.
 */
export async function continueGame(i: number) {
  if (!enterSlot(i)) return;
  if (pendingSteps(G).length) return resumeSteps();
  const p = lastPlace(G);
  if (p === 'map' && G.F!.story) return goMap();
  if (p === 'bracket') return (await import('./modes')).resumeRun();
  return goHub();
}
/** Where Continue goes, in words (for its button). */
export function continueText(): string {
  if (pendingSteps(G).length) return 'Your spoils are waiting';
  const p = lastPlace(G);
  return p === 'map' ? 'Back to the story map' : p === 'bracket' ? 'Back to the bracket' : 'Back to the fighter page';
}

/** Picks up the steps a closed app left waiting, then goes where they lead. */
export async function resumeSteps() {
  const m = await import('./modes');
  await runSteps(pendingSteps(G), { bracket: m.resumeRun, gauntlet: m.resumeRun, rush: () => void m.rushFlow(), tower: () => void m.towerFlow() });
}
