import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  CW_FOCUS,
  CW_REC,
  ULTS,
  ULT_WHEEL,
  READ_NAME,
  autoChoice,
  ctxOf,
  cwPowOk,
  cwSlices,
  fightLabel,
  fullName,
  numStats,
  peekSlice,
  phaseKitOf,
  phaseSlice,
  personalityOf,
  pickW,
  powerScale,
  finisherOf,
  procFeed,
  procOf,
  rankOf,
  rankTxt,
  readClue,
  startBattle,
  type Battle,
  type BattleEvent,
  type CareerFighter,
  type CwSlice,
  type FightOutcome,
  type FightResult,
  type FightSpec,
  type Focus,
  type Move,
  type RoundMod,
} from '@whs/core';
import { lookOf } from '../art/sprite';
import { FightScene, fightDims, type FightDims } from '../pixi/fight-scene';
import { usePixi } from '../pixi/usePixi';
import { toSlices } from './Spin';
import { G, act, buzz, reducedMotion, settings, commit, SPF } from '../state/game';
import { closeSheet, confirm, openInfo, openSheet } from '../state/ui';
import { Icon, type IconName } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { Sheet, Toggle } from '../ui/kit';
import { FighterCard } from '../ui/FighterCard';
import { ShareSheet } from '../ui/ShareSheet';
import { SettingsSheet } from '../sheets/Settings';
import { burst } from '../ui/fx';
import { ac, landSound, phaseMusic, tick } from '../ui/sound';
import { CHIP_ICON } from '../ui/status-icons';

const PILLN: Record<string, string> = { crit: 'crit', weak: 'weak spot', guard: 'guarded', broke: 'guard broken', interrupted: 'interrupted', caught: 'caught mid-cast' };
/** A narration line with the fighters' names in it. */
export const evText = (e: BattleEvent, names: [string, string]) => e.text.replace(/\{0\}/g, names[0]).replace(/\{1\}/g, names[1]);

/** How long the once-a-fight nudge is offered after the combat wheel lands. */
const NUDGE_MS = (fast: boolean) => (fast ? 1500 : 2200);
/** The opponent's recent moves, as pixel icons by their HP bar. */
const MOVE_ICON: Record<Move, [IconName, string]> = {
  strike: ['sword', 'Strike'],
  power: ['spark', 'Power'],
  guard: ['shield', 'Guard'],
  ult: ['star', 'Signature'],
  feint: ['mv_feint', 'Feint'],
  focus: ['mv_focus', 'Charge up'],
  dodge: ['wing', 'Sidestep'],
  fumble: ['swirl', 'Fumble'],
};
/** Pixel icons for the combat wheel's focus chips. */
const FOCUS_ICON: Record<string, string> = { atk: 'sword', def: 'shield', pow: 'spark', ult: 'star' };

function LogLine({ e, names }: { e: BattleEvent; names: [string, string] }) {
  const syn = e.a?.syn ? procOf(e) : null;
  return (
    <li class={e.cls}>
      <span>
        {evText(e, names)}
        {e.pills.map((p) =>
          p.startsWith('combo:') ? (
            <Inf key={p} k={`pill|combo|${p.slice(6)}`} class="pill combo">
              {p.slice(6)}
            </Inf>
          ) : (
            <Inf key={p} k={`pill|${p}`} class={`pill ${p}`}>
              {PILLN[p] || p}
            </Inf>
          ),
        )}
        {syn && (
          <Inf k={`it|syn|${syn.n}`} class={`pill syn${syn.anti ? ' anti' : ''}`}>
            {syn.n}
          </Inf>
        )}
      </span>
      {e.d != null && (
        <span class="dmg">
          {e.cls === 'heal' ? '+' : '−'}
          {e.d}
        </span>
      )}
    </li>
  );
}

/** A held combat wheel slice: roughly what it does to them, and what it beats. */
function SlicePeekView({ it, bt, foe }: { it: CwSlice; bt: Battle; foe: string }) {
  const p = peekSlice(bt, it);
  return (
    <div class="peek" aria-live="polite">
      <b class={`q${it.q}`}>
        {it.e} {it.n}
      </b>
      <small class="peek-dmg">
        {p.dmg ? (
          <>
            ≈ <b>{p.dmg[0] === p.dmg[1] ? p.dmg[0] : `${p.dmg[0]}–${p.dmg[1]}`}</b> damage to {foe}
            {p.weak && <em> · weak spot</em>}
          </>
        ) : p.counter ? (
          <>
            No hit · counters for ≈ <b>{`${p.counter[0]}–${p.counter[1]}`}</b> if they strike
          </>
        ) : (
          'No damage this round'
        )}
      </small>
      <small>{p.beats}</small>
      {it.flavor && (
        <small class="peek-fl">
          <i>{it.flavor}</i>
        </small>
      )}
    </div>
  );
}

function Hud({
  bt,
  snap,
  names,
  last,
  onMenu,
}: {
  bt: Battle | null;
  snap: BattleEvent | ReturnType<Battle['snap']> | null;
  names: [string, string];
  /** the opponent's last moves, oldest first, and how many rounds they have played */
  last: { m: Move[]; n: number };
  onMenu: () => void;
}) {
  // momentum changes replay their animation: a pop when it grows, a red flash when it's lost
  const momRef = useRef({ v: [0, 0], fx: ['', ''], n: [0, 0] });
  const side = (i: 0 | 1) => {
    const hp = snap ? snap.h[i]! : 100;
    const en = snap ? snap.en[i]! : 50;
    const mo = snap ? snap.mo[i]! : 0;
    const M = momRef.current;
    if (mo !== M.v[i]) {
      M.fx[i] = mo > M.v[i]! ? 'gain' : 'lost';
      M.v[i] = mo;
      M.n[i]!++;
    }
    return (
      <div class={`hs${i ? ' r' : ' me'}`}>
        <div class="hn ellipsis">{names[i]}</div>
        <Inf
          key={`mom${M.n[i]}`}
          k="rule|momentum"
          class={`mom${mo > 0 ? ' up' : ''}${mo >= 3 ? ' max' : ''} ${M.fx[i]}`}
          label={`Momentum ${mo} of 3${mo ? `: +${mo * 10}% damage` : ''}`}
        >
          <Icon name="momentum" />
          {[0, 1, 2].map((k) => (
            <i key={k} class={k < mo ? `on${k === mo - 1 ? ' new' : ''}` : ''} />
          ))}
          {mo > 0 && <small>+{mo * 10}%</small>}
        </Inf>
        <div class="mbar hp" role="progressbar" aria-label={`${names[i]} HP`} aria-valuenow={hp} aria-valuemin={0} aria-valuemax={100}>
          <b class="ghost" style={{ width: `${hp}%` }} />
          <i class={hp < 30 ? 'low' : ''} style={{ width: `${hp}%` }} />
        </div>
        <div class={`mbar en${en >= 100 ? ' full' : ''}`}>
          <i style={{ width: `${en}%` }} />
        </div>
        <div class="hv">
          <span>{snap ? `${snap.hr[i]}/${snap.mx[i]} HP` : ''}</span>
          <Inf k="rule|energy" class="env">
            ⚡ {en}
          </Inf>
        </div>
        {i === 1 && (
          <Inf k="rule|moves" class="mhist" label={last.m.length ? `Their last moves: ${last.m.map((m) => MOVE_ICON[m][1]).join(', ')}` : 'Their last moves'}>
            {last.m.length > 0 && <small>Lately</small>}
            {last.m.map((m, k) => (
              <i key={last.n - last.m.length + k} class={k === last.m.length - 1 ? 'new' : ''} title={MOVE_ICON[m][1]}>
                <Icon name={MOVE_ICON[m][0]} />
              </i>
            ))}
          </Inf>
        )}
      </div>
    );
  };
  const mr = bt ? bt.maxR : 12;
  return (
    <div class="fhud">
      {side(0)}
      <div class="rd">
        <span>{bt && bt.sd ? 'Sudden death' : `Round ${Math.max(1, snap?.r || 1)}/${mr}`}</span>
        <button class="iconbtn fmenu" aria-label="Fight menu" onClick={onMenu}>
          <Icon name="menu" />
        </button>
      </div>
      {side(1)}
    </div>
  );
}

type Phase = 'intro' | 'input' | 'spinning' | 'playing' | 'over';

/** A fight: the arena fills the screen, the combat wheel stands on the floor, everything else is in the ☰ menu. */
export function FightScreen({ spec, end, done }: { spec: FightSpec; end: (o: FightOutcome) => FightResult; done: (r: FightResult) => void }) {
  const F = G.F!;
  const O = spec.opp;
  const names: [string, string] = [F.name, O.name];
  // the label as the fight starts (a cup's round moves on once it is won)
  const where = useMemo(() => fightLabel(spec), []);
  const sceneRef = useRef<FightScene | null>(null);
  const btRef = useRef<Battle | null>(null);
  const S = useRef({ skip: false, ended: false, playing: false, log: [] as BattleEvent[], forfeit: false, nudged: false, dir: 1, landTimer: 0, procs: procFeed(), music: () => {} }).current;
  const [nudgeTo, setNudgeTo] = useState<number | null>(null);
  const nudgeRef = useRef<number | null>(null);
  nudgeRef.current = nudgeTo;
  const [phase, setPhase] = useState<Phase>('intro');
  const [snap, setSnap] = useState<ReturnType<Battle['snap']> | null>(null);
  const [plan, setPlan] = useState<{ shown: Move; acc: number } | null>(null);
  const [focus, setFocus] = useState<Focus>('atk');
  const [last, setLast] = useState<{ m: Move[]; n: number }>({ m: [], n: 0 });
  /** the slice being held for a preview */
  const [peek, setPeek] = useState<number | null>(null);
  /** the boss's phase-two slice has been landed (it's once a fight) */
  const [phaseUsed, setPhaseUsed] = useState(false);
  const [out, setOut] = useState<{ it: CwSlice } | null>(null);
  const [result, setResult] = useState<FightResult | null>(null);
  const [auto, setAuto] = useState(settings.value.autoBattle);
  const [dims, setDims] = useState<FightDims>(() => fightDims(innerWidth, innerHeight));
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const slot = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const me = () => btRef.current!.P[0];
  const list = useMemo(() => {
    const bt = btRef.current;
    if (!bt || phase === 'over') return [];
    const l = cwSlices(bt.P[0], focus);
    // a boss in phase two adds its one-use slice to the wheel it belongs on
    const ps = phaseSlice(bt, focus, phaseUsed);
    return ps ? [{ it: ps, w: ps.w, mult: 1 }, ...l] : l;
  }, [focus, phase, snap, phaseUsed]);
  /** the focus whose wheel has the boss's phase-two slice right now */
  const phaseFam = btRef.current && !phaseUsed && btRef.current.P[1].phased ? phaseKitOf(btRef.current.P[1].f)?.slice : undefined;
  const items = useMemo(() => toSlices(list), [list]);

  // the wheel follows the slot the DOM leaves for it
  const placeWheel = () => {
    const sc = sceneRef.current;
    const el = slot.current;
    const host = root.current;
    if (!sc || !el || !host) return;
    const r = el.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    sc.placeWheel(r.left - h.left + r.width / 2, r.top - h.top + r.height / 2, Math.min(r.width, r.height));
  };

  const { host } = usePixi((app) => {
    const d = fightDims(app.screen.width, app.screen.height);
    const sc = new FightScene(app, [lookOf(F), lookOf(O)], spec.arena, { mythic: !!F.career && rankOf(F) >= 6 });
    sc.sp = SPF();
    sc.reduced = reducedMotion();
    sc.wheel.rng = Math.random;
    sc.wheel.events = {
      tick: () => tick(),
      land: (i) => cwLandRef.current(i),
    };
    const kit = phaseKitOf(O);
    if (kit) sc.phaseKit = { light: kit.light, bpm: kit.tune.bpm };
    sc.layout(d.W, d.H);
    sceneRef.current = sc;
    // the end-to-end tests reach into the scene (combo banners on every screen size)
    if (navigator.webdriver) (window as unknown as { __whsFight?: FightScene }).__whsFight = sc;
    setDims(d);
    let lastW = d.W;
    let lastH = d.H;
    const onResize = () => {
      const W = app.screen.width;
      const H = app.screen.height;
      if (W === lastW && H === lastH) return;
      lastW = W;
      lastH = H;
      sc.layout(W, H);
      setDims(fightDims(W, H));
    };
    app.renderer.on('resize', onResize);
    void start(sc);
    return () => {
      app.renderer.off('resize', onResize);
      S.ended = true;
      S.music();
      sc.destroy();
    };
  });

  useEffect(() => {
    placeWheel();
  });
  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc) return;
    sc.wheel.visible = phase === 'input' || phase === 'spinning';
    if (items.length) sc.wheel.setItems(items, sc.wheel.size || dims.cw, null);
    sc.wheel.setHub(F.arch.e);
  }, [items, phase]);

  async function playEvents(evs: BattleEvent[]) {
    const sc = sceneRef.current!;
    const fin = finisherOf(evs);
    for (let i = 0; i < evs.length; i++) {
      if (S.skip || S.ended) {
        S.log.push(...evs.slice(i));
        const last = evs[evs.length - 1];
        if (last) {
          setSnap(last);
          sc.applySnap(last);
          const ko = evs.slice(i).find((e) => e.a && e.a.t === 'ko');
          if (ko) sc.F[ko.a!.on as 0 | 1].setDown(true);
        }
        return;
      }
      const e = evs[i]!;
      S.log.push(e);
      setSnap(e);
      // a boss's phase two brings its own music
      if (e.a?.t === 'phase' && e.a.on === 1) {
        const kit = phaseKitOf(O);
        if (kit) {
          S.music();
          S.music = phaseMusic(kit.tune);
        }
      }
      await sc.play(e, S.procs(e), i === fin);
    }
  }

  async function start(sc: FightScene) {
    ac();
    S.procs = procFeed();
    await sc.intro();
    const bt = act((g) => startBattle(g, spec));
    btRef.current = bt;
    if (navigator.webdriver) (window as unknown as { __whsBattle?: Battle }).__whsBattle = bt;
    S.playing = true;
    setSnap(bt.snap());
    sc.applySnap(bt.snap());
    setPhase('playing');
    try {
      await playEvents(bt.start());
    } catch (err) {
      console.error(err);
      forceEnd();
    }
    S.playing = false;
    nextTurn();
  }

  function forceEnd() {
    const bt = btRef.current;
    if (!bt) return;
    bt.over = true;
    if (bt.w == null) bt.w = bt.P[0].hp >= bt.P[1].hp ? 0 : 1;
  }

  function nextTurn() {
    const bt = btRef.current;
    if (S.ended || !bt) return;
    if (S.skip && !bt.over) return finishInstant();
    if (bt.over) return finish();
    const s = bt.snap();
    setSnap(s);
    const p = bt.plan();
    setPlan(p);
    // their moves show once the round has played out, never ahead of it
    setLast({ m: bt.hist[1].slice(-3), n: bt.hist[1].length });
    const ult = bt.P[0].en >= 100;
    setFocus((f) => (f === 'ult' && !ult ? 'atk' : ult ? 'ult' : f));
    setOut(null);
    if (autoRef.current) return void doRound(null);
    setPhase('input');
  }

  async function doRound(choice: Move | null, m?: RoundMod) {
    const bt = btRef.current;
    if (S.playing || S.ended || !bt || bt.over) return;
    S.playing = true;
    setPhase('playing');
    try {
      const evs = choice ? bt.step(choice, null, m || {}) : bt.step(autoChoice(G.rng, bt.P[0], bt.P[1], bt.hist[1]));
      await playEvents(evs);
    } catch (err) {
      console.error(err);
      forceEnd();
    }
    S.playing = false;
    nextTurn();
  }

  function finishInstant() {
    const bt = btRef.current!;
    const rest: BattleEvent[] = [];
    try {
      while (!bt.over) rest.push(...bt.step());
    } catch (err) {
      console.error(err);
      forceEnd();
    }
    S.log.push(...rest);
    const sc = sceneRef.current!;
    sc.settle();
    const last = rest[rest.length - 1];
    if (last) {
      setSnap(last);
      sc.applySnap(last);
    }
    if (bt.w != null) sc.F[(1 - bt.w) as 0 | 1].setDown(bt.P[1 - bt.w]!.hp <= 0);
    finish();
  }

  function finish() {
    if (S.ended) return;
    S.ended = true;
    S.music();
    const bt = btRef.current!;
    const sc = sceneRef.current!;
    sc.wheel.visible = false;
    try {
      sc.F[(1 - bt.w!) as 0 | 1].setDown(bt.P[1 - bt.w!]!.hp <= 0);
    } catch {
      // cosmetic
    }
    let r: FightResult;
    try {
      r = act(() => end({ w: bt.w!, me: bt.P[0], round: bt.round, sd: !!bt.sd }));
    } catch (err) {
      console.error(err);
      r = {
        won: bt.w === 0,
        big: bt.w === 0 ? 'You won' : 'You lost',
        desc: 'Something went wrong while tallying the results, but your fighter is saved.',
        lines: [],
        got: [],
        next: [{ t: 'hub' }],
        button: 'Back to your fighter',
        q: 0,
        confetti: false,
      };
    }
    setPhase('over');
    setResult(r);
    landSound(r.q);
    buzz(r.q === 3 ? [40, 60, 40, 60, 120] : r.won ? 40 : 80);
    if (r.confetti) setTimeout(() => burst(innerWidth / 2, dims.groundY + 40), 300);
  }

  // ---------------------------------------------------------------- the combat wheel
  function cwSpin(flickW?: number) {
    const sc = sceneRef.current;
    const bt = btRef.current;
    if (!sc || !bt || phase !== 'input' || S.playing || bt.over || !list.length) return;
    ac();
    const idx = pickW(G.rng, list);
    const dir = flickW && flickW < 0 ? -1 : 1;
    S.dir = dir;
    const turns = flickW ? Math.max(2, Math.min(6, Math.round(Math.abs(flickW) / 5))) : 3 + Math.floor(Math.random() * 2);
    setPhase('spinning');
    setOut(null);
    sc.wheel.spinTo(idx, { turns, dir, dur: reducedMotion() ? 150 : settings.value.fast ? 900 : 1600 });
  }
  function cwLand(idx: number) {
    const it = list[idx]?.it;
    const sc = sceneRef.current!;
    if (!it) return;
    sc.wheel.setHub(it.e);
    landSound(it.q);
    buzz(it.q >= 3 ? [30, 40, 50] : 20);
    if (it.q >= 3) burst(sc.wheel.x, sc.wheel.y);
    setOut({ it });
    // once per fight the player may push the wheel one more slice: offer it for a moment longer
    const offer = !S.nudged && !autoRef.current && list.length > 1;
    const nx = offer ? sc.wheel.nextSlice(idx, S.dir) : -1;
    setNudgeTo(offer ? nx : null);
    const fast = settings.value.fast;
    S.landTimer = window.setTimeout(
      () => {
        setNudgeTo(null);
        const bt = btRef.current!;
        if (it.src === 'phase') setPhaseUsed(true);
        if (it.c === 'ult') {
          if (it.ultIdx != null) bt.P[0].ultSpin = ULT_WHEEL[it.ultIdx]!;
          void doRound('ult', { ...(it.m || {}) });
          return;
        }
        void doRound(it.c as Move, { ...(it.m || {}) });
      },
      offer ? NUDGE_MS(fast) : fast ? 350 : 650,
    );
  }
  /** The once-per-fight nudge: the wheel clicks one slice on, and that slice is the move. */
  function nudge() {
    const sc = sceneRef.current;
    const to = nudgeRef.current;
    if (!sc || to == null || S.nudged) return;
    clearTimeout(S.landTimer);
    S.nudged = true;
    setNudgeTo(null);
    tick(true);
    buzz(15);
    sc.wheel.spinTo(to, { turns: 0, dir: S.dir, dur: reducedMotion() ? 120 : 320 });
  }

  // flicks and taps on the wheel
  useEffect(() => {
    const el = root.current!;
    let drag: { id: number; cx: number; cy: number; a: number; x: number; y: number; samples: { t: number; r: number }[]; moved: number } | null = null;
    const TAU = Math.PI * 2;
    // holding still on a slice previews it; sliding the finger then previews the others, and letting go doesn't spin
    let hold = 0;
    let peeking = false;
    const peekAt = (x: number, y: number) => {
      if (!drag) return;
      peekRef.current(sceneRef.current!.wheel.segAtAngle(Math.atan2(y - drag.cy, x - drag.cx)));
    };
    const endPeek = () => {
      clearTimeout(hold);
      if (!peeking) return false;
      peeking = false;
      peekRef.current(null);
      return true;
    };
    const down = (e: PointerEvent) => {
      const sc = sceneRef.current;
      if (!sc || !sc.wheel.visible || phaseRef.current !== 'input') return;
      const h = el.getBoundingClientRect();
      const cx = h.left + sc.wheel.x;
      const cy = h.top + sc.wheel.y;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) > sc.wheel.size / 2 + 8) return;
      e.preventDefault();
      drag = { id: e.pointerId, cx, cy, a: Math.atan2(e.clientY - cy, e.clientX - cx), x: e.clientX, y: e.clientY, samples: [{ t: performance.now(), r: sc.wheel.rot }], moved: 0 };
      clearTimeout(hold);
      hold = window.setTimeout(() => {
        if (!drag || drag.moved >= 0.08 || phaseRef.current !== 'input') return;
        peeking = true;
        buzz(12);
        peekAt(drag.x, drag.y);
      }, 420);
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (peeking) return peekAt(e.clientX, e.clientY);
      const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      let d = a - drag.a;
      d = ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
      drag.a = a;
      drag.moved += Math.abs(d);
      if (drag.moved >= 0.08) clearTimeout(hold);
      sceneRef.current!.wheel.nudge(d);
      const now = performance.now();
      drag.samples.push({ t: now, r: sceneRef.current!.wheel.rot });
      while (drag.samples.length > 2 && now - drag.samples[0]!.t > 100) drag.samples.shift();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (endPeek()) return void (drag = null);
      const s = drag.samples;
      const moved = drag.moved;
      drag = null;
      if (moved < 0.08) return cwSpinRef.current();
      const a = s[0]!;
      const b = s[s.length - 1]!;
      const dt = (b.t - a.t) / 1000;
      if (dt <= 0 || performance.now() - b.t > 120) return;
      const w = (b.r - a.r) / dt;
      if (Math.abs(w) > 3) cwSpinRef.current(w);
    };
    const cancel = () => {
      endPeek();
      drag = null;
    };
    el.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', cancel);
    return () => {
      clearTimeout(hold);
      el.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', cancel);
    };
  }, []);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const peekRef = useRef((idx: number | null) => {
    setPeek(idx);
    sceneRef.current?.wheel.highlight(idx);
  });
  const cwSpinRef = useRef(cwSpin);
  cwSpinRef.current = cwSpin;
  const cwLandRef = useRef(cwLand);
  cwLandRef.current = cwLand;

  // ---------------------------------------------------------------- the ☰ menu
  const skip = () => {
    const bt = btRef.current;
    if (!bt || S.ended) return;
    S.skip = true;
    sceneRef.current?.settle();
    if (!S.playing) finishInstant();
  };
  const toggleAuto = () => {
    const on = !autoRef.current;
    setAuto(on);
    autoRef.current = on;
    const bt = btRef.current;
    if (on && bt && !S.playing && !S.ended && !bt.over && phaseRef.current === 'input') void doRound(null);
  };
  const forfeit = async () => {
    if (!(await confirm({ title: 'Forfeit this fight?', body: 'It counts as a loss.', yes: 'Forfeit', danger: true }))) return openMenu();
    const bt = btRef.current;
    if (!bt || S.ended) return;
    bt.over = true;
    bt.w = 1;
    bt.P[0].hp = Math.min(bt.P[0].hp, 0);
    S.skip = true;
    sceneRef.current?.settle();
    if (!S.playing) finish();
  };
  const openMenu = () => {
    const bt = btRef.current;
    const pct = Math.round(spec.odds * 100);
    const ctx = ctxOf(G);
    // what is on each fighter right now (the icons over their heads, tappable here)
    const sx = bt?.snap().sx;
    const theirs = personalityOf(O, ctx);
    openSheet(
      <Sheet icon="menu" title={fightLabel(spec)} sub={`Round ${bt?.round || 1}`}>
        <div class="fm-scout">
          <Inf k="rule|simodds" class={`chip ${pct >= 60 ? 'good' : pct >= 40 ? 'even' : 'bad'}`}>
            {pct}% to win
          </Inf>
          <Inf k="rule|scale" class="chip">
            📈 {powerScale(F, ctx).n} vs {powerScale(O, ctx).n}
          </Inf>
          {rankTxt(O) && <span class="chip">🏅 {rankTxt(O)} of 1000</span>}
          <Inf k={`pers|${theirs.k}`} class="chip">
            {theirs.e} {theirs.n}
          </Inf>
          {spec.arena && (
            <Inf k={`it|arena|${spec.arena.n}`} class="chip">
              {spec.arena.e} {spec.arena.n}
            </Inf>
          )}
        </div>
        {sx && sx.some((l) => l.length > 0) && (
          <div class="fm-status">
            {([0, 1] as const).map((i) =>
              sx[i]!.length ? (
                <div key={i} class="fm-st">
                  <b class="ellipsis">{i ? O.name : F.name}</b>
                  {sx[i]!.map((c) => (
                    <Inf key={c.k} k={`status|${c.k}`} class={`stchip${c.k === 'guard' ? '' : c.bad ? ' bad' : ' good'}`}>
                      <Icon name={CHIP_ICON[c.k]} />
                      {c.t && <span>{c.t}</span>}
                    </Inf>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        )}
        <Toggle label="Auto-battle" sub="Your fighter picks their own moves" on={autoRef.current} onToggle={() => (toggleAuto(), openMenu())} />
        <Toggle label="Fast mode" sub="Quicker animations" on={settings.value.fast} onToggle={() => (commit((s) => (s.settings.fast = !s.settings.fast)), sceneRef.current && (sceneRef.current.sp = SPF()), openMenu())} />
        <div class="fm-grid">
          <button class="menu-i" onClick={() => (closeSheet(), skip())}>
            <Icon name="skip" />
            <b>Skip</b>
            <small>Jump to the result</small>
          </button>
          <button class="menu-i" onClick={openLog}>
            <Icon name="scroll" />
            <b>Fight log</b>
            <small>Everything so far</small>
          </button>
          <button class="menu-i" onClick={() => openSheet(<Sheet icon="card" title={O.name}><FighterCard f={O} /></Sheet>)}>
            <Icon name="card" />
            <b>Their card</b>
            <small class="ellipsis">{O.name}</small>
          </button>
          <button class="menu-i" onClick={() => openInfo('rule|moves')}>
            <Icon name="question" />
            <b>How it works</b>
            <small>Moves and focus</small>
          </button>
          <button class="menu-i" onClick={() => openSheet(<SettingsSheet />)}>
            <Icon name="gear" />
            <b>Settings</b>
            <small>Sound, vibration</small>
          </button>
          <button class="menu-i danger" onClick={() => void forfeit()}>
            <Icon name="flag" />
            <b>Forfeit</b>
            <small>Counts as a loss</small>
          </button>
        </div>
      </Sheet>,
    );
  };
  const openLog = () =>
    openSheet(
      <Sheet icon="scroll" title="Fight log" sub={`${S.log.length} events`}>
        <ol class="log full">
          {S.log.map((e, i) => (
            <LogLine key={i} e={e} names={names} />
          ))}
        </ol>
      </Sheet>,
    );

  // ---------------------------------------------------------------- render
  const bt = btRef.current;
  const ult = bt ? bt.P[0].en >= 100 : false;
  const pw = bt ? cwPowOk(bt.P[0]) : false;
  let rec: Focus | null = plan ? CW_REC[plan.shown] || null : null;
  if (rec === 'pow' && !pw) rec = 'atk';
  const style = {
    '--groundY': `${dims.groundY}px`,
    '--stageW': `${dims.stageW}px`,
    '--panelX': `${dims.panelX}px`,
    '--panelW': `${dims.panelW}px`,
    '--cw': `${dims.cw}px`,
  } as Record<string, string>;
  const busy = phase !== 'input';
  /** The share card: both fighters, the final blow, names and titles. */
  const shareWin = () => {
    if (!result) return;
    const w = result.won ? 0 : 1;
    // the last real blow (not a bleed or burn tick), falling back to any last damage
    const dealt = [...S.log].reverse().filter((e) => e.d != null && e.d > 0 && e.a && e.a.by === w);
    const last = dealt.find((e) => e.a!.t === 'hit' || e.a!.t === 'ult' || e.a!.t === 'pet') ?? dealt[0];
    const who = (f: CareerFighter) => ({
      name: f.isBoss && f.bossTitle ? `${f.name}, ${f.bossTitle}` : fullName(f),
      line: `Level ${f.lvl || 1} ${f.race.n.toLowerCase()} ${f.arch.n.toLowerCase()}`,
      look: lookOf(f),
    });
    const ar = spec.arena as { k: string; n: string; sky?: string; floor?: string } | null | undefined;
    openSheet(
      <ShareSheet
        d={{
          big: result.big,
          winner: who(result.won ? F : O),
          loser: who(result.won ? O : F),
          playerWon: result.won,
          arena: ar ? { k: ar.k, n: ar.n, sky: ar.sky, floor: ar.floor } : null,
          blow: last ? { text: evText(last, names), d: Math.round(last.d!) } : null,
          rounds: btRef.current?.round || 1,
          where,
        }}
      />,
    );
  };

  return (
    <main class={`fight${dims.side ? ' side' : ''}`} ref={root} style={style}>
      <div ref={host} class="fight-canvas" />
      <Hud bt={bt} snap={snap} names={names} last={last} onMenu={openMenu} />
      {phase !== 'over' && (
        <section class="fpanel" aria-label="Your move">
          <div class="readpill-row">
            {plan && (phase === 'input' || phase === 'spinning') && (
              <Inf k="rule|read" class={`readpill${plan.acc >= 0.8 ? ' good' : plan.acc < 0.6 ? ' weak' : ''}`}>
                🔮 <span class="rp-acc">{readClue(plan.acc)}:</span> <b>{READ_NAME[plan.shown] || '?'}</b>
              </Inf>
            )}
          </div>
          <div class="cw-chips" role="group" aria-label="Focus">
            {CW_FOCUS.map(([k, , n]) => (
              <button
                key={k}
                class={`fchip${focus === k ? ' on' : ''}${rec === k ? ' rec' : ''}${k === 'ult' && ult ? ' gold' : ''}${phaseFam?.fam === k ? ' new' : ''}`}
                aria-pressed={focus === k}
                disabled={busy || (k === 'ult' && !ult)}
                onClick={() => {
                  setFocus(k);
                  tick();
                }}
              >
                <Icon name={FOCUS_ICON[k]!} /> {n}
              </button>
            ))}
          </div>
          <div class="cw-row">
            <div class="cw-slot" ref={slot} style={{ width: `${dims.cw}px`, height: `${dims.cw}px` }} aria-hidden="true" />
            <div class="cw-out" aria-live="polite">
              {out ? (
                <>
                  <b class={`q${out.it.q}`}>
                    {out.it.e} {out.it.n}
                  </b>
                  {nudgeTo != null && list[nudgeTo] ? (
                    <button class="btn sm nudge" style={{ '--nudge-ms': `${NUDGE_MS(settings.value.fast)}ms` } as Record<string, string>} onClick={nudge} aria-label={`Nudge the wheel one slice, to ${list[nudgeTo]!.it.n}. Once a fight`}>
                      ↷ Nudge to {list[nudgeTo]!.it.e} {list[nudgeTo]!.it.n}
                      <small>once a fight</small>
                    </button>
                  ) : (
                    <small>{out.it.d}</small>
                  )}
                </>
              ) : peek != null && list[peek] && bt ? (
                <SlicePeekView it={list[peek].it} bt={bt} foe={O.name} />
              ) : phase === 'spinning' ? (
                <b>Spinning…</b>
              ) : focus === 'ult' ? (
                <>
                  <b class="q3">🌟 {ULTS[F.arch.k] || 'Signature move'}</b>
                  <small>Full energy. This wheel is the damage: spin it and hope for a jackpot. It can't be dodged.</small>
                </>
              ) : (
                <>
                  <b>{CW_FOCUS.find((x) => x[0] === focus)![2]} moves</b>
                  <small>
                    {auto
                      ? 'Auto-battle is on.'
                      : phaseFam
                        ? `Phase two: ${phaseFam.e} ${phaseFam.n} is on your ${CW_FOCUS.find((x) => x[0] === phaseFam.fam)![2]} wheel. Once.`
                        : 'Tap or flick the wheel to spin. Hold a slice to see what it does.'}
                  </small>
                </>
              )}
            </div>
          </div>
          <button class={`btn cw-spin${focus === 'ult' ? ' gold' : ''}`} disabled={busy} onClick={() => cwSpin()}>
            {focus === 'ult' ? 'Unleash your signature' : 'Spin your move'}
          </button>
        </section>
      )}
      {result && (
        <section class={`fresult ${result.won ? 'win' : 'lose'}`} aria-live="polite">
          <div class="big">{result.big}</div>
          <p>{result.desc}</p>
          <ul class="gains scroll">
            {result.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {result.got.length > 0 && (
            <div class="chips">
              {result.got.map((a) => (
                <Inf key={a.k} k={`it|ach|${a.n}`} class="oc up">
                  {a.e} New title: {a.n}
                </Inf>
              ))}
            </div>
          )}
          <button class="btn block" onClick={() => done(result)}>
            {result.button}
          </button>
          {result.won && (
            <button class="btn ghost block" onClick={shareWin}>
              <Icon name="download" /> Save this win as a picture
            </button>
          )}
          {result.bracket && (
            <button class="btn ghost block" onClick={() => done({ ...result, next: [{ t: 'bracket' }] })}>
              See how the bracket ended
            </button>
          )}
        </section>
      )}
    </main>
  );
}

/** HP the active fighter shows in fights (legacy hudHpTxt): real numbers. */
export const hpReal = (p: number) => {
  const mx = numStats(G.F!, ctxOf(G)).hp;
  return `${Math.max(1, Math.round((p / 100) * mx))}/${mx}`;
};
