import {
  CLUB_BETS,
  DAILY_TIER,
  abandonRun,
  challengeSpec,
  clubFight,
  clubMatchup,
  clubMult,
  clubSettle,
  coinsOf,
  ctxOf,
  cupOpponent,
  dailyArena,
  dailyList,
  dailyLand,
  dailyState,
  dailyWinCoins,
  deserFighter,
  hpTxt,
  loadRun,
  makeBoss,
  mutatorList,
  mutatorOf,
  nextGauntletOpp,
  pick,
  pl,
  powerScale,
  rushBoss,
  rushBosses,
  rushOpen,
  rushTier,
  setDailyMutator,
  startCup,
  startGauntlet,
  LS,
  type Battle,
  type Club,
  type Cup,
  type Gauntlet,
  type Run,
  type RushState,
} from '@whs/core';
import { useEffect, useRef, useState } from 'preact/hooks';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { G, act, go, settings, toast } from '../state/game';
import { closeSheet, confirm, openSheet } from '../state/ui';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { burst } from '../ui/fx';
import { landSound, tick } from '../ui/sound';
import { spinWheel } from '../screens/Spin';
import { evText } from '../screens/Fight';
import { fight } from './fight';
import { choose, goHub, runSteps, showCine } from './nav';

// ---------------------------------------------------------------- cups and the gauntlet
export function showRun(T: Run) {
  go({ screen: 'bracket', run: T, key: Math.random() });
}
export function startTier(k: string) {
  const T = act((g) => (k === 'gauntlet' ? startGauntlet(g) : startCup(g, k)));
  showRun(T);
}
export function resumeRun() {
  const T = act((g) => loadRun(g));
  if (T) showRun(T);
  else void goHub();
}
export async function abandon() {
  if (!(await confirm({ title: 'Abandon this tournament?', body: 'Your progress in it is lost.', yes: 'Abandon it', danger: true }))) return;
  act((g) => abandonRun(g));
  void goHub();
}
/** The next fight of a cup or the gauntlet, then whatever follows it. */
export async function runFight(T: Run) {
  const opp = T.kind === 'cup' ? T.fs[cupOpponent(T)]! : T.opp;
  const r = await fight({ kind: T.kind, tier: T.tier, opp, run: T });
  await runSteps(r.next, { bracket: () => showRun(T), gauntlet: () => showRun(T) });
}

// ---------------------------------------------------------------- rival and legend challenges
export async function challengeFlow() {
  const c = act((g) => challengeSpec(g));
  if (!c) return goHub();
  const r = await fight({ kind: 'challenge', tier: c.tier, opp: c.opp });
  await runSteps(r.next);
}

// ---------------------------------------------------------------- the daily wheel
export async function dailyWheel() {
  await spinWheel({
    cat: 'daily',
    title: 'Daily wheel',
    who: 'One free spin every day',
    list: dailyList(),
    spinLabel: 'Spin the daily wheel',
    nextLabel: 'Back to your fighter',
    onLand: (it) => {
      const out = dailyLand(G, it);
      if (it.q >= 3) setTimeout(() => burst(), 200);
      return <div class="note sub">{out}</div>;
    },
  });
  void goHub();
}

// ---------------------------------------------------------------- the daily challenge
export async function dailyFlow() {
  const dc = act((g) => dailyState(g));
  if (dc.done) return toast(dc.won ? 'Already won today. Come back tomorrow' : 'One attempt a day. Come back tomorrow');
  if (!dc.mut)
    await spinWheel({
      cat: 'mut',
      title: 'Mutator',
      who: "Today's twist",
      list: mutatorList(),
      spinLabel: 'Spin the mutator',
      nextLabel: 'See the challenge',
      noDesc: true,
      onLand: (it) => {
        setDailyMutator(G, it.k);
        return <div class="ds">{it.d}</div>;
      },
    });
  const o = deserFighter(dc.opp);
  const mut = mutatorOf(dc.mut);
  if (!o || !mut) {
    act((g) => (g.save.profile.dc = null as never));
    return goHub();
  }
  const c = await choose({
    emoji: '📆',
    title: 'Daily challenge',
    sub: dc.streak ? `${dc.streak}-day streak` : 'Win to start a streak',
    body: (
      <>
        <b>{o.name}</b>, level {o.lvl} {o.race.n.toLowerCase()} {o.arch.n.toLowerCase()}.
        <br />
        {mut.e} <b>{mut.n}</b>: {mut.d}.
        <br />
        <span class="hint">Win: {dailyWinCoins(G)} 🪙, 20 XP, fame and an elite loot spin. One attempt today.</span>
      </>
    ),
    options: [
      { label: '⚔️ Fight', sub: 'Your HP starts full' },
      { label: 'Not now', sub: 'It will still be here today' },
    ],
  });
  if (c !== 0) return goHub();
  const r = await fight({ kind: 'daily', tier: DAILY_TIER, opp: o, mut: { mods: mut.mods, arena: mut.arena } }, mut.arena ? { arena: dailyArena(mut.arena) } : {});
  await runSteps(r.next);
}

// ---------------------------------------------------------------- boss rush
export async function rushFlow() {
  if (!rushOpen(G)) return toast('Beat chapter 2 or reach level 10 to unlock');
  await rushNext({ i: 0, hp: 100 });
}
async function rushNext(R: RushState) {
  const n = rushBosses(G).length;
  const { boss, def } = act((g) => rushBoss(g, R));
  await rushIntro(boss, pick(G.rng, def.lines), `Boss rush, ${R.i + 1} of ${n}`, R);
  const r = await fight({ kind: 'rush', tier: rushTier(G, R), opp: boss, node: 'boss', rushHp: R.hp }, { rush: R });
  await runSteps(r.next, { rush: () => void rushNext(R) });
}
function rushIntro(b: ReturnType<typeof makeBoss>, line: string, kicker: string, R: RushState) {
  return showCine(
    <>
      <div class="cine-kicker">{kicker}</div>
      <div class="boss-art">
        <FighterSprite look={lookOf(b)} h={170} />
      </div>
      <div class="boss-plate">
        <b>{b.name}</b>
        <span>{b.bossTitle}</span>
      </div>
      <p class="boss-line">“{line}”</p>
      <div class="cine-meta">
        You have {hpTxt(G, R.hp)} HP. They have {Math.round(b.maxHp! * LS(b))}. Power scale: {powerScale(b, ctxOf(G)).n}.
      </div>
    </>,
    'Fight',
  );
}

// ---------------------------------------------------------------- fight club
function ClubFight({ c, side, bt }: { c: Club; side: 'A' | 'B'; bt: Battle }) {
  const [snap, setSnap] = useState(bt.snap());
  const [log, setLog] = useState<string[]>([]);
  const [end, setEnd] = useState<{ won: boolean; pay: number } | null>(null);
  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    let alive = true;
    let evs = bt.start();
    const step = () => {
      if (!alive) return;
      if (!bt.over) {
        bt.plan();
        evs = bt.step();
      }
      setSnap(bt.snap());
      setLog((l) => [...l, ...evs.slice(-3).map((e) => evText(e, [c.A.name, c.B.name]))]);
      tick();
      if (!bt.over) {
        setTimeout(step, settings.value.fast ? 280 : 620);
        return;
      }
      const r = act((g) => clubSettle(g, c, side, bt.w!));
      landSound(r.won ? 3 : 0);
      setEnd(r);
    };
    setTimeout(step, 500);
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);
  const pick = side === 'A' ? c.A : c.B;
  return (
    <Sheet emoji="🎰" title={`${c.A.name} vs ${c.B.name}`} sub={`You bet ${c.bet} 🪙 on ${pick.name}`} locked={!end}>
      <div class="fc-live">
        {[c.A, c.B].map((f, i) => (
          <div key={i}>
            <span class="ellipsis">{f.name}</span>
            <div class="hpbar2">
              <i style={{ width: `${snap.h[i]}%` }} />
            </div>
          </div>
        ))}
      </div>
      <ol class="log full fc-log scroll" ref={logRef}>
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
      {end && (
        <div class="stack">
          <p class="center">
            <b>{end.won ? `🎉 ${pick.name} wins. You collect ${end.pay} 🪙` : `💸 ${(side === 'A' ? c.B : c.A).name} wins. Your ${c.bet} 🪙 are gone`}</b>
          </p>
          <div class="row">
            <button class="btn grow" onClick={() => openClub()}>
              Another fight
            </button>
            <button class="btn ghost grow" onClick={closeSheet}>
              Leave
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
function ClubSheet({ c }: { c: Club }) {
  const [bet, setBet] = useState(c.bet);
  c.bet = bet;
  const coins = coinsOf(G);
  const ctx = ctxOf(G);
  const side = (f: typeof c.A, p: number, k: 'A' | 'B') => (
    <div class="fc-side">
      <FighterSprite look={lookOf(f)} h={92} mirror={k === 'B'} />
      <b class="ellipsis">{f.name}</b>
      <small>
        Level {f.lvl} {f.race.n.toLowerCase()} {f.arch.n.toLowerCase()}
      </small>
      <small>📈 {powerScale(f, ctx).n}</small>
      <span class="fc-odds">{Math.round(p * 100)}% to win</span>
      <button
        class="btn sm"
        disabled={!(coins >= bet && bet > 0)}
        onClick={() => {
          const bt = act((g) => clubFight(g, c));
          if (bt) openSheet(<ClubFight c={c} side={k} bt={bt} />, true);
        }}
      >
        Bet {bet} 🪙 · pays ×{clubMult(p)}
      </button>
    </div>
  );
  return (
    <Sheet emoji="🎰" title="Fight club" sub={`You have ${coins} 🪙`}>
      <div class="stack">
        <Inf k="rule|club" class="hint">
          How it works
        </Inf>
        <div class="fc-bets" role="group" aria-label="Your bet">
          {CLUB_BETS.map((v) => (
            <button key={v} class={`fchip light${bet === v ? ' on' : ''}`} disabled={coins < v} onClick={() => setBet(v)}>
              {v} 🪙
            </button>
          ))}
        </div>
        <div class="fc-vs">
          {side(c.A, c.pA, 'A')}
          <div class="fc-v">VS</div>
          {side(c.B, 1 - c.pA, 'B')}
        </div>
        <div class="row">
          <button class="btn ghost grow" onClick={() => openClub()}>
            New matchup
          </button>
          <button class="btn ghost grow" onClick={closeSheet}>
            Leave
          </button>
        </div>
      </div>
    </Sheet>
  );
}
export function openClub() {
  const c = act((g) => clubMatchup(g));
  openSheet(<ClubSheet key={Math.random()} c={c} />);
}

export type { Cup, Gauntlet };
export { nextGauntletOpp, pl };
