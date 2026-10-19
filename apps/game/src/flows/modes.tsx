import {
  BALANCE,
  TRIAL_COUNT,
  fightUnder,
  keepRun,
  keptRush,
  keptTower,
  TRIAL_FROM,
  trialBoss,
  trialInfo,
  trialLevel,
  trialTier,
  trialsCleared,
  trialsOpen,
  DUEL_TIER,
  DUEL_WIN_COINS,
  duelBest,
  duelBestFor,
  duelScoreText,
  duelDays,
  duelOf,
  duelShare,
  type CareerFighter,
  type Duel,
  CLUB_BETS,
  DAILY_TIER,
  abandonRun,
  challengeSpec,
  clubFight,
  clubMatchup,
  clubMult,
  clubSettle,
  buyClubTip,
  clubLine,
  clubTip,
  clubTipFree,
  coinsOf,
  ctxOf,
  cupOpponent,
  dailyArena,
  dailyList,
  dailyLand,
  dailyState,
  dailyWinCoins,
  deserFighter,
  endHard,
  hardChapters,
  hardMutator,
  hardOf,
  startHard,
  hpTxt,
  loadRun,
  makeBoss,
  mutatorList,
  mutatorOf,
  nextGauntletOpp,
  oddsWord,
  setPlace,
  pick,
  pl,
  powerScale,
  rushBoss,
  rushBosses,
  rushOpen,
  TOWER_FROM,
  TOWER_LIVES,
  towerBest,
  towerMutator,
  towerOpen,
  towerOpponent,
  towerTier,
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
  type TowerState,
} from '@whs/core';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
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
import { bossIntro } from './story';
import { choose, goHub, goMap, runSteps, showCine } from './nav';
import { tip } from '../state/tips';
import { copyText } from '../ui/copy';

// ---------------------------------------------------------------- cups and the gauntlet
export function showRun(T: Run) {
  act((g) => setPlace(g, 'bracket'));
  go({ screen: 'bracket', run: T, key: Math.random() });
  tip(T.kind === 'gauntlet' ? 'gauntlet' : 'bracket');
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
/**
 * Back into a fight the app closed on (G2), through its own mode so what follows it is the same, skipping
 * the questions before it. False if the mode has nothing to go back to.
 */
export async function resumeFight(kind: string): Promise<boolean> {
  if (kind === 'cup' || kind === 'gauntlet') {
    const T = act((g) => loadRun(g));
    if (!T) return false;
    await runFight(T);
    return true;
  }
  const go = kind === 'daily' ? dailyFlow : kind === 'rush' && keptRush(G) ? rushFlow : kind === 'tower' && keptTower(G) ? towerFlow : kind === 'run' ? (await import('./run')).runFlow : null;
  if (!go) return false;
  await go();
  return true;
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
    nextLabel: 'Home',
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
  // a fight the app closed on goes straight back in (G2)
  const c = fightUnder(G, 'daily', o.name) ? 0 : await choose({
    emoji: '📆',
    title: 'Daily challenge',
    sub: dc.streak ? `Streak: ${dc.streak} ${dc.streak === 1 ? 'win' : 'wins'} in a row` : 'Win to start a streak. Skipping a day never breaks it',
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

// ---------------------------------------------------------------- the daily duel (F2)
function DuelSheet({ days }: { days: string[] }) {
  const [day, setDay] = useState(days[0]!);
  const d = useMemo(() => duelOf(day), [day]);
  // the score as it ranks: a win by rounds and HP, a loss by the HP they had left (G13)
  const best = duelBestFor(G, d);
  const side = (f: CareerFighter, i: 0 | 1) => (
    <div class="fc-side">
      <FighterSprite look={lookOf(f)} h={84} mirror={i === 1} />
      <b class="ellipsis">{f.name}</b>
      <small>
        Level {f.lvl} {f.race.n.toLowerCase()} {f.arch.n.toLowerCase()}
      </small>
      <small class="ellipsis">{i === 0 ? 'You play this one' : `${f.power.e} ${f.power.n}`}</small>
    </div>
  );
  return (
    <Sheet icon="sword" title={`Daily duel #${d.no}`} sub="Same fighters. Same dice. Different excuses.">
      <div class="stack">
        <div class="fc-bets" role="group" aria-label="Which day" data-hscroll>
          {days.map((x, i) => (
            <button key={x} class={`fchip light${x === day ? ' on' : ''}`} onClick={() => setDay(x)}>
              {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : x.slice(5).replace('-', '/')}
              {duelBest(G, x)?.won ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <div class="fc-vs">
          {side(d.me, 0)}
          <div class="fc-v">VS</div>
          {side(d.opp, 1)}
        </div>
        <p class="hint center">
          {d.arena.e} {d.arena.n}. Everyone gets this exact fight: the dice only change with your moves.
        </p>
        {best && (
          <div class="duel-best">
            <b>Your best: {duelScoreText(d, best)}</b>
            <span>{best.sq}</span>
            <button class="btn ghost sm" onClick={() => void copyText(duelShare(d, best))}>
              Copy the score
            </button>
          </div>
        )}
        <button class="btn block" onClick={() => (closeSheet(), void duelFight(d))}>
          ⚔️ {best ? 'Fight it again' : 'Fight'}
        </button>
        <span class="hint center">First win of each duel: +{DUEL_WIN_COINS} 🪙. No streaks: play any of the last week whenever you like.</span>
      </div>
    </Sheet>
  );
}
export function openDuel() {
  openSheet(<DuelSheet days={duelDays(new Date(G.clock.today))} />);
}
async function duelFight(d: Duel) {
  const r = await fight({ kind: 'duel', tier: DUEL_TIER, opp: d.opp, me: d.me, seed: d.seed, wheelSeed: d.wheelSeed }, { arena: d.arena, duel: d });
  await runSteps(r.next);
}

// ---------------------------------------------------------------- the Wheelborn trials (F12)
function TrialsSheet() {
  const done = trialsCleared(G);
  return (
    <Sheet emoji="🌀" title="Wheelborn trials" sub={`Ten remixed bosses for levels ${trialLevel(0)} to ${trialLevel(TRIAL_COUNT - 1)}. Losing costs nothing`}>
      <div class="stack">
        {Array.from({ length: TRIAL_COUNT }, (_, i) => {
          const t = trialInfo(i);
          const open = i <= done;
          return (
            <div key={i} class={`goal trial${i < done ? ' done' : ''}`}>
              <span class="g-e" aria-hidden="true">
                {i < done ? '✅' : open ? t.body.e || '🌀' : '🔒'}
              </span>
              <div class="g-t">
                <b>
                  {i + 1}. {t.body.name}, remixed
                </b>
                <small>
                  Level {t.lvl}. Fights with the tricks of {t.kits[0]!.name} and {t.kits[1]!.name}
                </small>
              </div>
              <span class="g-r">
                <button class="btn sm" disabled={!open} onClick={() => (closeSheet(), void trialFight(i))}>
                  {i < done ? 'Rematch' : 'Fight'}
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
export function openTrials() {
  if (!trialsOpen(G)) return toast(`Reach level ${TRIAL_FROM}, or clear the whole story, to face the trials`);
  openSheet(<TrialsSheet />);
}
async function trialFight(i: number) {
  const t = trialInfo(i);
  const ok = await confirm({
    title: `Face ${t.body.name}, remixed?`,
    body: `Level ${t.lvl}, with the phase-two tricks of ${t.kits[0]!.name} and ${t.kits[1]!.name}. 30 rounds, then sudden death. Your HP starts full.`,
    yes: 'Fight the remix',
    no: 'Not yet',
  });
  if (!ok) return;
  const b = act((g) => trialBoss(g, i));
  await bossIntro(b, pick(G.rng, t.body.lines), `Wheelborn trial ${i + 1} of ${TRIAL_COUNT}`);
  const r = await fight({ kind: 'trial', tier: trialTier(i), opp: b }, { trial: i });
  await runSteps(r.next);
}

// ---------------------------------------------------------------- the endless tower (upgrade 25)
export async function towerFlow() {
  if (!towerOpen(G)) return toast(`Reach level ${TOWER_FROM} or clear chapter 1 to unlock the tower`);
  // a climb the app closed on goes on where it was (G6)
  const kept = keptTower(G);
  if (kept) return towerNext(kept);
  tip('tower');
  await towerNext({ floor: 1, hp: 100, seed: Date.now() & 0xffffff });
}
async function towerNext(T: TowerState) {
  const o = act((g) => towerOpponent(g, T));
  const m = towerMutator(T);
  const best = towerBest(G);
  const fresh = T.floor === 1 && (T.lives ?? TOWER_LIVES) === TOWER_LIVES;
  // a fight the app closed on goes straight back in (G2)
  const c = fightUnder(G, 'tower', o.name) ? 0 : await choose({
    emoji: '🗼',
    title: `Tower, floor ${T.floor}`,
    sub: `HP ${hpTxt(G, T.hp)} ${'❤️'.repeat(T.lives ?? TOWER_LIVES)}${'🖤'.repeat(TOWER_LIVES - (T.lives ?? TOWER_LIVES))}. Record: ${best.floor ? `floor ${best.floor} (${best.who})` : 'nobody yet'}`,
    body: (
      <>
        <b>{o.name}</b>, level {o.lvl} {o.race.n.toLowerCase()} {o.arch.n.toLowerCase()}.
        {m ? (
          <>
            <br />
            {m.e} <b>{m.n}</b>: {m.d}. Until floor {Math.floor(T.floor / 5) * 5 + 4}.
          </>
        ) : (
          <>
            <br />
            <span class="hint">No twist yet. From floor 5 on, every five floors bring a new one.</span>
          </>
        )}
      </>
    ),
    options: [
      { label: '⚔️ Climb', sub: T.floor % 10 === 0 ? 'A chest waits on this landing' : `Win: about ${2 + T.floor} 🪙 and ${6 + 2 * T.floor} XP` },
      fresh
        ? { label: 'Not now', sub: 'The stairs will wait' }
        : { label: 'Walk back down', sub: T.floor > 1 ? `Keep floor ${T.floor - 1} as your result` : 'Pride is overrated anyway' },
    ],
  });
  if (c !== 0) {
    act((g) => keepRun(g, 'tower', null));
    if (T.floor > 1) toast(`🗼 You cleared ${T.floor - 1} floors`);
    return goHub();
  }
  // the climb is on once you climb (a win keeps it between floors: G6)
  act((g) => keepRun(g, 'tower', T));
  const r = await fight(
    { kind: 'tower', tier: towerTier(T), opp: o, rushHp: T.hp, mut: m ? { mods: m.mods, arena: m.arena } : undefined },
    { tower: T, ...(m && m.arena ? { arena: dailyArena(m.arena) } : {}) },
  );
  await runSteps(r.next, { tower: () => void towerNext(T) });
}

// ---------------------------------------------------------------- hard mode (upgrade 26)
export function hardFlow() {
  if (hardOf(G)) return goMap();
  const list = hardChapters(G);
  if (!list.length) return toast('Clear a chapter first. Hard mode needs something to be hard about');
  tip('hard');
  openSheet(<HardPick key={Math.random()} />);
}
function HardPick() {
  const list = hardChapters(G);
  const pickCh = async (ch: number, n: string) => {
    const ok = await confirm({
      title: `Chapter ${ch} on hard?`,
      body: `${n}, again, but meaner: tougher fights, a nastier boss and one twist for the whole chapter. Better loot. Your story waits right where it is.`,
      yes: '🔥 Bring it',
    });
    if (!ok) return;
    if (!act((g) => startHard(g, ch))) return toast('That one is not open');
    closeSheet();
    goMap();
  };
  return (
    <Sheet emoji="🔥" title="Hard mode" sub={`Beaten on hard: ${list.filter((c) => c.done).length} of ${list.length}`}>
      <div class="stack">
        <Inf k="rule|hard" class="hint">
          Fights from higher up the ranks, three levels stronger. One twist for the whole chapter. Half again the coins, and an extra treasure spin on the boss.
        </Inf>
        <ul class="ex-list hard-list">
          {list.map((c) => (
            <li key={c.ch}>
              <button class="hard-row" onClick={() => void pickCh(c.ch, c.n)}>
                <span class="ex-e" aria-hidden="true">
                  {c.e}
                </span>
                <span class="grow ex-t">
                  <small>Chapter {c.ch}</small>
                  <b class="ellipsis">{c.n}</b>
                </span>
                <span class={`hard-done${c.done ? ' on' : ''}`}>{c.done ? '🔥 Beaten' : 'Not yet'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
/** Walks away from a hard run: nothing lost but the run itself. */
export async function leaveHard() {
  const m = hardMutator(G);
  const ok = await confirm({
    title: 'Leave hard mode?',
    body: `This hard run ends here${m ? ` (${m.n} and all)` : ''}. Coins and loot you got stay yours. Your story picks up where you left it.`,
    yes: 'Leave it',
    danger: true,
  });
  if (!ok) return;
  act((g) => endHard(g, false));
  toast('🔥 Hard run over. The chapter will be there, smug as ever');
}

// ---------------------------------------------------------------- boss rush
export async function rushFlow() {
  if (!rushOpen(G)) return toast('Beat chapter 2 or reach level 10 to unlock');
  // a rush the app closed on goes on where it was (G6)
  const kept = keptRush(G);
  if (kept) return rushNext(kept);
  // boss fights ask first: the rush is a run, not a single fight
  const n = rushBosses(G).length;
  const best = G.save.profile.rushBest || 0;
  const c = await choose({
    emoji: '💀',
    title: 'Boss rush',
    sub: `${pl(n, 'boss', 'bosses')} back to back. Your best: ${best}/${n}`,
    body: (
      <p class="hint">
        Your HP carries over, plus 25 after every win. Each boss pays coins, XP and a gem; all {n} pay 90 coins and 10 gems on top. You can walk away between bosses with what you won. Lose and the run ends, you keep what you won.
      </p>
    ),
    options: [{ label: 'Start the rush', sub: `First up: boss 1 of ${n}` }, { label: 'Not now' }],
  });
  if (c !== 0) return;
  await rushNext({ i: 0, hp: 100 });
}
async function rushNext(R: RushState) {
  act((g) => keepRun(g, 'rush', R));
  const n = rushBosses(G).length;
  const { boss, def } = act((g) => rushBoss(g, R));
  // a fight the app closed on goes straight back in (G2)
  const under = !!fightUnder(G, 'rush', boss.name);
  // between bosses: keep going, or walk away with the best so far on record
  if (R.i > 0 && !under) {
    const c = await choose({
      emoji: '💀',
      title: `Boss rush: ${R.i} of ${n} down`,
      sub: `You have ${hpTxt(G, R.hp)} HP`,
      options: [
        { label: `Next boss: ${boss.name}`, sub: `Boss ${R.i + 1} of ${n}` },
        { label: 'Walk away', sub: `Keep what you won. Best: ${Math.max(G.save.profile.rushBest || 0, R.i)}/${n}` },
      ],
    });
    if (c !== 0) {
      act((g) => {
        g.save.profile.rushBest = Math.max(g.save.profile.rushBest || 0, R.i);
        keepRun(g, 'rush', null);
      });
      return void goHub();
    }
  }
  if (!under) await rushIntro(boss, pick(G.rng, def.lines), `Boss rush, ${R.i + 1} of ${n}`, R);
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
  const [inside, setInside] = useState<string[] | null>(c.tipped ? clubTip(c).lines : null);
  c.bet = bet;
  const coins = coinsOf(G);
  const ctx = ctxOf(G);
  // payouts follow the bookie's line (F8); the insider knows the real odds
  const line = clubLine(c);
  const free = clubTipFree(G);
  const gems = G.save.profile.gems || 0;
  const askInsider = () => {
    if (!act((g) => buyClubTip(g, c))) return toast('No gems. The insider does not take IOUs');
    setInside(clubTip(c).lines);
  };
  const side = (f: typeof c.A, p: number, k: 'A' | 'B') => (
    <div class="fc-side">
      <FighterSprite look={lookOf(f)} h={92} mirror={k === 'B'} />
      <b class="ellipsis">{f.name}</b>
      <small>
        Level {f.lvl} {f.race.n.toLowerCase()} {f.arch.n.toLowerCase()}
      </small>
      <small>📈 {powerScale(f, ctx).n}</small>
      <span class={`fc-odds ${oddsWord(p).tone}`}>{oddsWord(p).t}</span>
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
          {side(c.A, line, 'A')}
          <div class="fc-v">VS</div>
          {side(c.B, 1 - line, 'B')}
        </div>
        {c.line != null &&
          (inside ? (
            <div class="fc-tip" aria-live="polite">
              <b>🕵️ The insider says</b>
              {inside.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          ) : (
            <button class="btn ghost block" disabled={!free && gems < 1} onClick={askInsider}>
              🕵️ {free ? 'Charm the insider (your charisma: free)' : 'Ask the insider · 1 💎'}
            </button>
          ))}
        {BALANCE.clubTight && <p class="hint center">This card stays up until you bet on it. The bookie does not reshuffle for browsers.</p>}
        <div class="row">
          {!BALANCE.clubTight && (
            <button class="btn ghost grow" onClick={() => openClub()}>
              New matchup
            </button>
          )}
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
  tip('club');
}

export type { Cup, Gauntlet };
export { nextGauntletOpp, pl };
