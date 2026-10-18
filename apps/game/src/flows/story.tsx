import {
  BOSSES,
  CHAPTERS,
  GEARK,
  ITEMK,
  ITEMS,
  RARITY,
  buyMerchantGear,
  buyMerchantItem,
  campfire,
  coinsOf,
  ctxOf,
  eventOption,
  eventOptionOk,
  gearPriceM,
  haggle,
  haggleChance,
  hardMutator,
  hpTxt,
  itemPriceM,
  LS,
  makeBoss,
  maxGrit,
  merchantOf,
  merchantStock,
  myNemesis,
  nemesisOpponent,
  nemesisTaunt,
  mysteryLand,
  mysteryList,
  pick,
  pl,
  powerScale,
  storyEvent,
  talkOf,
  storyOf,
  storyOpponent,
  trainLand,
  trainList,
  useItem,
  type NodeKind,
  type Story,
} from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { useEffect, useState } from 'preact/hooks';
import { G, act, buzz, reducedMotion, toast } from '../state/game';
import { closeSheet, confirm, openSheet } from '../state/ui';
import { Icon } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { beep } from '../ui/sound';
import { spinWheel } from '../screens/Spin';
import { fight } from './fight';
import { choose, goMap, lootFlow, runSteps, showCine } from './nav';
import { openArmory } from './armory';
import { GearIcon, ItemIcon } from '../ui/GearIcon';
import { GearCompareView } from '../ui/GearCompare';
import { tip } from '../state/tips';

/** The step is done: on to the next one. */
export function backToMap() {
  act((g) => {
    storyOf(g).row++;
  });
  goMap();
}

export function chapterIntro() {
  const S = storyOf(G);
  const C = CHAPTERS[S.ch - 1]!;
  const HM = S.hard ? hardMutator(G) : null;
  [262, 330, 392].forEach((f, i) => beep(f, 0.25, 'triangle', 0.05, i * 0.12));
  return showCine(
    <>
      <div class="cine-kicker">
        {HM ? '🔥 Hard mode, chapter ' : 'Chapter '}
        {S.ch}
        {S.ng ? `, encore ${S.ng}` : ''}
      </div>
      <div class="cine-emoji">{C.e}</div>
      <h2>{C.n}</h2>
      <p>{HM ? 'You have been here before. It remembers. It has been working out.' : C.intro}</p>
      {HM && (
        <p class="cine-twist">
          {HM.e} Twist for the whole chapter: <b>{HM.n}</b>. {HM.d}.
        </p>
      )}
      <div class="cine-meta">
        {pl(maxGrit(G), 'grit', 'grit')}. {S.rows.length} steps. One boss{HM ? ', and it is in a mood' : ''}.
      </div>
    </>,
    'Begin',
  );
}

/**
 * A boss or nemesis line that types itself out. It wraps like normal text: the part still to come takes its
 * place invisibly, so nothing moves while it types. Instant with reduced motion; screen readers get it whole.
 */
function TypeLine({ text }: { text: string }) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0));
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => Math.min(text.length, x + 1)), 26);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <p class="boss-line">
      <span class="sr">“{text}”</span>
      <span aria-hidden="true">
        “{text.slice(0, n)}
        <span class="typed-rest">{text.slice(n)}</span>”
      </span>
    </p>
  );
}

export async function bossIntro(b: ReturnType<typeof makeBoss>, line: string, kicker: string) {
  [98, 110, 82].forEach((f, i) => beep(f, 0.35, 'sawtooth', 0.05, i * 0.32));
  buzz([60, 80, 60]);
  await showCine(
    <>
      <div class="cine-kicker">{kicker}</div>
      <div class="boss-art">
        <FighterSprite look={lookOf(b)} h={170} />
      </div>
      <div class="boss-plate">
        <b>{b.name}</b>
        <span>{b.bossTitle}</span>
      </div>
      <TypeLine text={line} />
      <div class="cine-meta">
        Level {b.lvl}. {Math.round(b.maxHp! * LS(b))} HP, you have {hpTxt(G, storyOf(G).hp)}. Power scale: {powerScale(b, ctxOf(G)).n}. Has a second phase.
      </div>
    </>,
    'Fight',
  );
}

/** The nemesis steps out, with a speech about your last fight. */
async function nemesisIntro(o: ReturnType<typeof makeBoss>, t: ReturnType<typeof nemesisTaunt>) {
  [131, 123, 98].forEach((f, i) => beep(f, 0.3, 'square', 0.05, i * 0.26));
  buzz([40, 60, 40]);
  await showCine(
    <>
      <div class="cine-kicker">Your nemesis · meeting {t.meeting}</div>
      <div class="boss-art nem-art">
        <FighterSprite look={lookOf(o)} h={170} />
      </div>
      <div class="boss-plate">
        <b>{o.name}</b>
        <span>{t.record}</span>
      </div>
      <TypeLine text={t.line} />
      <div class="cine-meta">
        Level {o.lvl}. You have {hpTxt(G, storyOf(G).hp)} HP. Beat them for elite loot and a bonus.
      </div>
    </>,
    'Settle it',
  );
}

/** A story fight from the map (or an encounter): fight, results, then rewards and back to the map. */
async function storyFight(kind: 'fight' | 'elite' | 'boss' | 'nemesis', opp?: ReturnType<typeof makeBoss>) {
  const o = opp ?? act((g) => storyOpponent(g, kind as 'fight' | 'elite'));
  const label = { boss: 'Boss fight', elite: 'Elite fight', nemesis: 'Nemesis fight', fight: 'Story fight' }[kind];
  const r = await fight({
    kind: 'story',
    node: kind,
    tier: { k: 'story', n: label, e: '📖', xpW: 0, coins: 0 },
    opp: o,
  });
  await runSteps(r.next);
}

/** Taps on the map's current step. */
export async function enterNode(i: number) {
  const S = storyOf(G);
  const t = S.rows[S.row]![i]! as NodeKind;
  if (t === 'boss') {
    const B = BOSSES[S.ch - 1]!;
    const ok = await confirm({
      title: `Face ${B.name}?`,
      body: `You go in with ${hpTxt(G, S.hp)} HP. Boss fights last up to 30 rounds and end in sudden death.${S.hp < 70 ? ' You might want to heal first.' : ''}`,
      yes: 'Fight the boss',
      no: 'Not yet',
    });
    if (!ok) return;
  }
  act((g) => {
    const st = storyOf(g);
    st.picks[st.row] = i;
  });
  if (t === 'fight' || t === 'elite') return storyFight(t);
  if (t === 'nemesis') {
    // they may have been beaten (or replaced) somewhere else since: then it is an elite fight
    if (!myNemesis(G)) return storyFight('elite');
    const o = act((g) => nemesisOpponent(g));
    await nemesisIntro(o, act((g) => nemesisTaunt(g)));
    return storyFight('nemesis', o);
  }
  if (t === 'boss') {
    const b = act((g) => makeBoss(g, storyOf(g).ch));
    await bossIntro(b, pick(G.rng, BOSSES[storyOf(G).ch - 1]!.lines), `Chapter ${storyOf(G).ch} boss`);
    return storyFight('boss', b);
  }
  if (t === 'event') return encounter();
  if (t === 'rest') return campfireFlow();
  if (t === 'shop') return merchantSheet();
  if (t === 'treasure') {
    await lootFlow('treasure');
    return backToMap();
  }
}

// ---------------------------------------------------------------- encounters
async function encounter() {
  const ev = act((g) => storyEvent(g));
  // the charisma option comes last; below what it needs it shows locked, as a tease
  const t = talkOf(G, ev.k);
  const i = await choose({
    emoji: ev.e,
    title: ev.t,
    body: ev.d,
    options: [
      ...ev.o.map((o) => ({ label: o.l, sub: o.s, disabled: !eventOptionOk(G, o) })),
      ...(t
        ? [
            {
              label: `🗣️ ${t.o.l}`,
              sub: t.have >= t.o.need ? t.o.s : `Needs ${t.o.need} charisma, you have ${t.have}. ${t.o.s}`,
              disabled: !t.ok,
              tag: `Charisma ${t.o.need}`,
              talk: true,
            },
          ]
        : []),
    ],
  });
  const r = act((g) => eventOption(g, ev.k, i));
  if ('fight' in r) return storyFight(r.fight);
  if ('wheel' in r) {
    await spinWheel({
      cat: 'mystery',
      title: 'Mystery wheel',
      who: 'It creaks as it turns',
      list: mysteryList(),
      spinLabel: 'Spin it',
      nextLabel: 'Back to the map',
      onLand: (it) => <div class="note sub">{mysteryLand(G, it)}</div>,
    });
    return backToMap();
  }
  if ('loot' in r) {
    if (r.bit) toast(`It bites! −${r.bit} HP`);
    await lootFlow(r.loot as 'treasure');
    return backToMap();
  }
  // chapter events keep the mechanics apart from the joke: what happened, then the italic flavor line
  const body = 'fx' in r && r.fx ? (
    <>
      <b class="ev-fx">{r.fx}</b>
      {r.txt && <i class="ev-flav">{r.txt}</i>}
    </>
  ) : (
    r.txt
  );
  await choose({ emoji: ev.e, title: ev.t, body, options: [{ label: 'Continue' }] });
  backToMap();
}

// ---------------------------------------------------------------- campfire
async function campfireFlow() {
  const F = G.F!;
  const c = await choose({
    emoji: '🔥',
    title: 'Campfire',
    sub: `HP ${hpTxt(G, storyOf(G).hp)}`,
    body: 'A quiet spot to catch your breath. You only have time for one thing.',
    options: [
      { label: 'Sleep it off', sub: 'Heal 45% HP' },
      { label: 'Train', sub: '10 HP: spin the training wheel for a permanent stat point' },
      { label: 'See the medic', sub: `Cure injuries and heal 20% HP${(F.inj || []).length ? '' : '. You have no injuries right now'}` },
    ],
  });
  if (c === 0) {
    act((g) => campfire(g, 'sleep'));
    toast('+45% HP');
    return backToMap();
  }
  if (c === 2) {
    act((g) => campfire(g, 'medic'));
    toast('Patched up. +20% HP');
    return backToMap();
  }
  act((g) => campfire(g, 'train'));
  await spinWheel({
    cat: 'train',
    title: 'Training',
    who: `${F.name} hits the training dummy`,
    list: trainList(),
    spinLabel: 'Spin the training wheel',
    preview: true,
    nextLabel: 'Back to the map',
    onLand: (it) => {
      const t = trainLand(G, it);
      return t ? <div class="note sub">{t}</div> : null;
    },
  });
  backToMap();
}

// ---------------------------------------------------------------- merchants and haggling
export async function haggleFlow(where: 'merchant' | 'base') {
  const F = G.F!;
  tip('haggle');
  const opts = ([10, 25, 40, 60] as const).map((p) => {
    const c = Math.round(haggleChance(G, p) * 100);
    return { p, label: `Ask for ${p}% off`, sub: `${c}% chance it works. If not, prices go up ${Math.round(p / 2)}%` };
  });
  const i = await choose({
    emoji: '🤝',
    title: 'Haggle',
    sub: `Your charisma: ${F.cha ? F.cha.n : 'Likeable'}`,
    body: 'Pick how hard to push. You only get one try.',
    options: [...opts, { label: 'Never mind', sub: 'Keep the current prices' }],
  });
  if (i >= opts.length) return;
  const p = opts[i]!.p;
  const r = act((g) => haggle(g, where, p));
  beep(r.ok ? 880 : 220, 0.15, 'triangle', 0.05);
  toast(r.ok ? `🤝 Deal! ${p}% off everything` : `😤 Not happening. Prices up ${Math.round(p / 2)}%`);
}

function MerchantBody() {
  const S = storyOf(G) as Story;
  const F = G.F!;
  const M = merchantOf(G);
  const coins = coinsOf(G);
  const hm = S.hagMult || 1;
  return (
    <Sheet emoji={M[0]} title={M[1]} sub={`${M[2]}. 🪙 ${coins}`} locked>
      <div class="stack">
        {/* haggling changes every price below it, so it comes first */}
        {!S.hagDone ? (
          <button
            class="btn ghost sm"
            onClick={async () => {
              closeSheet();
              await haggleFlow('merchant');
              merchantSheet(false);
            }}
          >
            🤝 Haggle first
          </button>
        ) : (
          <p class="hint center">{hm < 1 ? `🤝 Deal: ${Math.round((1 - hm) * 100)}% off everything` : `😤 Prices up ${Math.round((hm - 1) * 100)}%`}</p>
        )}
        {(S.stock || []).map((k) => {
          const i = ITEMK[k]!;
          const p = itemPriceM(G, i);
          return (
            <div class="shopitem" key={k}>
              <span class="se"><ItemIcon k={k} /></span>
              <div class="st2">
                <b>
                  {i.n}
                  {F.bag![k] ? ` (have ${F.bag![k]})` : ''}
                </b>
                <small>{i.d}</small>
              </div>
              <button
                class="buy"
                disabled={coins < p}
                onClick={() => {
                  if (act((g) => buyMerchantItem(g, k))) {
                    toast(`${i.e} ${i.n} is in your bag. Use it any time`);
                    merchantSheet(false);
                  }
                }}
              >
                {p} 🪙
              </button>
            </div>
          );
        })}
        {(S.gearOffers || []).map((k) => {
          const g = GEARK[k]!;
          const p = gearPriceM(G, g);
          const cur = F.gear![g.slot];
          return (
            <div class={`shopitem r-${g.r}`} key={k}>
              <span class="se"><GearIcon g={g} /></span>
              <div class="st2">
                <b>{g.n}</b>
                <small>
                  <span class={`rar r-${g.r}`}>
                    {RARITY[g.r]?.n} {g.slot}
                  </span>{' '}
                  {g.d}
                  {cur ? `. Replaces your ${GEARK[cur]!.n.toLowerCase()}` : ''}
                </small>
              </div>
              <button
                class="buy"
                disabled={coins < p}
                onClick={async () => {
                  if (!(await confirm({ title: `Buy ${g.n}?`, body: `It costs ${p} 🪙. You have ${coinsOf(G)} 🪙. You wear it right away.`, extra: <GearCompareView k={k} />, yes: 'Buy it' }))) return;
                  if (act((x) => buyMerchantGear(x, k))) {
                    toast(`${g.e} ${g.n} equipped`);
                    beep(880, 0.15, 'triangle', 0.05);
                  }
                  merchantSheet(false);
                }}
              >
                {p} 🪙
              </button>
            </div>
          );
        })}
        <div class="row">
          <button class="btn ghost sm grow" onClick={() => openBag(() => merchantSheet(false))}>
            <Icon name="bag" /> Open bag
          </button>
          <button
            class="btn ghost sm grow"
            onClick={() => {
              closeSheet();
              backToMap();
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </Sheet>
  );
}
export function merchantSheet(fresh = true) {
  if (fresh) act((g) => merchantStock(g));
  openSheet(<MerchantBody key={Math.random()} />, true);
  tip('merchant');
}

// ---------------------------------------------------------------- the bag
export function openBag(back?: () => void) {
  const F = G.F!;
  const bag = F.bag || {};
  const keys = ITEMS.filter((i) => bag[i.k]! > 0);
  openSheet(
    <Sheet icon="bag" title="Bag" sub={F.story ? `HP ${hpTxt(G, storyOf(G).hp)}` : undefined} locked={!!back}>
      <div class="stack">
        {keys.length ? (
          keys.map((i) => (
            <div class="shopitem" key={i.k}>
              <span class="se"><ItemIcon k={i.k} /></span>
              <div class="st2">
                <b>
                  {i.n} ×{bag[i.k]}
                </b>
                <small>{i.d}</small>
              </div>
              <button
                class="buy"
                onClick={() => {
                  const m = act((g) => useItem(g, i.k));
                  if (m) toast(m);
                  openBag(back);
                }}
              >
                Use
              </button>
            </div>
          ))
        ) : (
          <p class="hint">Your bag is empty. Merchants, loot spins and the base shop fill it up.</p>
        )}
        <Inf k="rule|bag" class="hint">
          How the bag works
        </Inf>
        <div class="row">
          <button class="btn ghost sm grow" onClick={() => openArmory(undefined, () => openBag(back))}>
            <Icon name="shield" /> Armory
          </button>
          {back && (
            <button class="btn ghost sm grow" onClick={back}>
              Back
            </button>
          )}
        </div>
      </div>
    </Sheet>,
    !!back,
  );
}

