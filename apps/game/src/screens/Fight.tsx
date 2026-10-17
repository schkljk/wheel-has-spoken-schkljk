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
  numStats,
  pickW,
  powerScale,
  rankOf,
  rankTxt,
  readClue,
  startBattle,
  type Battle,
  type BattleEvent,
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
import { Icon } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { Sheet, Toggle } from '../ui/kit';
import { FighterCard } from '../ui/FighterCard';
import { SettingsSheet } from '../sheets/Settings';
import { burst } from '../ui/fx';
import { ac, landSound, tick } from '../ui/sound';

const PILLN: Record<string, string> = { crit: 'crit', weak: 'weak spot', guard: 'guarded', broke: 'guard broken', interrupted: 'interrupted', caught: 'caught mid-cast' };
/** A narration line with the fighters' names in it. */
export const evText = (e: BattleEvent, names: [string, string]) => e.text.replace(/\{0\}/g, names[0]).replace(/\{1\}/g, names[1]);

/** Pixel icons for the combat wheel's focus chips. */
const FOCUS_ICON: Record<string, string> = { atk: 'sword', def: 'shield', pow: 'spark', ult: 'star' };

function LogLine({ e, names }: { e: BattleEvent; names: [string, string] }) {
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

function Hud({ bt, snap, names, onMenu }: { bt: Battle | null; snap: BattleEvent | ReturnType<Battle['snap']> | null; names: [string, string]; onMenu: () => void }) {
  const side = (i: 0 | 1) => {
    const hp = snap ? snap.h[i]! : 100;
    const en = snap ? snap.en[i]! : 50;
    const mo = snap ? snap.mo[i]! : 0;
    return (
      <div class={`hs${i ? ' r' : ' me'}`}>
        <div class="hn ellipsis">{names[i]}</div>
        <div class="mom" aria-label={`Momentum ${mo}`}>
          {[0, 1, 2].map((k) => (
            <i key={k} class={k < mo ? 'on' : ''} />
          ))}
        </div>
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
  const sceneRef = useRef<FightScene | null>(null);
  const btRef = useRef<Battle | null>(null);
  const S = useRef({ skip: false, ended: false, playing: false, log: [] as BattleEvent[], forfeit: false }).current;
  const [phase, setPhase] = useState<Phase>('intro');
  const [snap, setSnap] = useState<ReturnType<Battle['snap']> | null>(null);
  const [plan, setPlan] = useState<{ shown: Move; acc: number } | null>(null);
  const [focus, setFocus] = useState<Focus>('atk');
  const [out, setOut] = useState<{ it: CwSlice } | null>(null);
  const [result, setResult] = useState<FightResult | null>(null);
  const [auto, setAuto] = useState(settings.value.autoBattle);
  const [dims, setDims] = useState<FightDims>(() => fightDims(innerWidth, innerHeight));
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const slot = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const me = () => btRef.current!.P[0];
  const list = useMemo(() => (btRef.current && phase !== 'over' ? cwSlices(me(), focus) : []), [focus, phase, snap]);
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
    sc.layout(d.W, d.H);
    sceneRef.current = sc;
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
      await sc.play(e);
    }
  }

  async function start(sc: FightScene) {
    ac();
    await sc.intro();
    const bt = act((g) => startBattle(g, spec));
    btRef.current = bt;
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
    setTimeout(
      () => {
        const bt = btRef.current!;
        if (it.c === 'ult') {
          if (it.ultIdx != null) bt.P[0].ultSpin = ULT_WHEEL[it.ultIdx]!;
          void doRound('ult', { ...(it.m || {}) });
          return;
        }
        void doRound(it.c as Move, { ...(it.m || {}) });
      },
      settings.value.fast ? 350 : 650,
    );
  }

  // flicks and taps on the wheel
  useEffect(() => {
    const el = root.current!;
    let drag: { id: number; cx: number; cy: number; a: number; samples: { t: number; r: number }[]; moved: number } | null = null;
    const TAU = Math.PI * 2;
    const down = (e: PointerEvent) => {
      const sc = sceneRef.current;
      if (!sc || !sc.wheel.visible || phaseRef.current !== 'input') return;
      const h = el.getBoundingClientRect();
      const cx = h.left + sc.wheel.x;
      const cy = h.top + sc.wheel.y;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) > sc.wheel.size / 2 + 8) return;
      e.preventDefault();
      drag = { id: e.pointerId, cx, cy, a: Math.atan2(e.clientY - cy, e.clientX - cx), samples: [{ t: performance.now(), r: sc.wheel.rot }], moved: 0 };
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      let d = a - drag.a;
      d = ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
      drag.a = a;
      drag.moved += Math.abs(d);
      sceneRef.current!.wheel.nudge(d);
      const now = performance.now();
      drag.samples.push({ t: now, r: sceneRef.current!.wheel.rot });
      while (drag.samples.length > 2 && now - drag.samples[0]!.t > 100) drag.samples.shift();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
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
    el.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    };
  }, []);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
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
          {spec.arena && (
            <Inf k={`it|arena|${spec.arena.n}`} class="chip">
              {spec.arena.e} {spec.arena.n}
            </Inf>
          )}
        </div>
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
  return (
    <main class={`fight${dims.side ? ' side' : ''}`} ref={root} style={style}>
      <div ref={host} class="fight-canvas" />
      <Hud bt={bt} snap={snap} names={names} onMenu={openMenu} />
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
                class={`fchip${focus === k ? ' on' : ''}${rec === k ? ' rec' : ''}${k === 'ult' && ult ? ' gold' : ''}`}
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
                  <small>{out.it.d}</small>
                </>
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
                  <small>{auto ? 'Auto-battle is on.' : 'Tap or flick the wheel to spin.'}</small>
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
