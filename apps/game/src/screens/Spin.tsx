import type { ComponentChildren } from 'preact';
import { emojiCanvas } from '../art/emoji-px';
import { contentCanvas } from '../art/portraits';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  WHEELS,
  applicable,
  buildLand,
  finishBuild,
  fullName,
  itemKeyFor,
  labelOf,
  newBuild,
  nextWheel,
  pickW,
  playerOdds,
  reaction,
  reroll,
  synFound,
  synOf,
  wheelsDone,
  wheelsMaybe,
  saveBuild,
  wheelsTotal,
  type BuildFighter,
  type Fighter,
  type OddsEntry,
  type OddsReason,
  type Slice,
} from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { PixiWheel, type WheelHandle } from '../pixi/PixiWheel';
import type { WheelSlice } from '../pixi/wheel';
import { G, act, buzz, go, reducedMotion, settings } from '../state/game';
import { confirm, openSheet } from '../state/ui';
import { Icon } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { burst } from '../ui/fx';
import { ac, drumRoll, landSound, sfx } from '../ui/sound';

/** A wheel entry as the rules list it. */
export interface Entry<T = Slice> {
  it: T;
  w: number;
  mult: number;
}
/** Wheel slices; races, classes, weapons and enchantments get their pixel icon (`race` is the parent of sub-races). */
export const toSlices = (list: Entry<{ n: string; e?: string; q?: number; k?: string }>[], cat?: string, race?: string): WheelSlice[] =>
  list.map((e) => ({ n: e.it.n, e: e.it.e, q: e.it.q, w: e.w, mark: e.mult >= 1.5 ? 'up' : e.mult <= 0.67 ? 'down' : '', img: contentCanvas(cat, e.it, race) ?? (e.it.e ? emojiCanvas(e.it.e, true) : null) }));

export function OddsChips({ reasons, unlock }: { reasons: OddsReason[] | { cls: string; txt: string }[]; unlock?: string }) {
  const shown = reasons.slice(0, 5);
  if (!shown.length && !unlock) return <div class="oddschips" />;
  return (
    <div class="oddschips">
      {unlock && <span class="unlock">{unlock}</span>}
      {shown.map((r) => (
        <Inf key={r.txt} k={r.txt.startsWith('😇') || r.txt.startsWith('🤨') ? 'rule|karma' : 'rule|odds'} class={`oc ${r.cls}`}>
          {r.cls === 'up' ? '▲' : r.cls === 'down' ? '▼' : '✕'} {r.txt}
        </Inf>
      ))}
      {reasons.length > 5 && <span class="oc">+{reasons.length - 5} more</span>}
    </div>
  );
}

/** The result under the wheel: what landed, the crowd's reaction, what it does, extra notes. */
export interface Landed {
  name: string;
  /** which wheel it came from, said above it, since the next wheel is already up by then */
  wheel?: string;
  infoKey?: string;
  rx: string;
  desc?: string;
  notes?: ComponentChildren;
  q: number;
}
function LandedPanel({ landed, msg }: { landed: Landed | null; msg: ComponentChildren }) {
  return (
    <div class="landed" aria-live="polite">
      {landed ? (
        <div class="landed-in" key={landed.name + landed.rx}>
          {landed.wheel && <small class="lwheel">{landed.wheel}</small>}
          <div class={`ln q${landed.q}`}>{landed.infoKey ? <Inf k={landed.infoKey}>{landed.name}</Inf> : landed.name}</div>
          <div class="rx">{landed.rx}</div>
          {landed.desc && <div class="ds">{landed.desc}</div>}
          {landed.notes}
        </div>
      ) : (
        <div class="landed-in muted">{msg}</div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div class="legend" aria-hidden="true">
      <span>
        <i class="q0" />
        Cooked
      </span>
      <span>
        <i class="q1" />
        Mid
      </span>
      <span>
        <i class="q2" />
        Good
      </span>
      <span>
        <i class="q3" />
        Goated
      </span>
      <span>▲▼ odds shifted</span>
    </div>
  );
}

/** A small preview of the fighter on the wheel screens. */
function Preview({ f }: { f: Partial<Fighter> & { name: string } }) {
  const bits = [f.race?.n, f.rsub?.n, f.arch?.n, f.asub?.n, f.stance?.n].filter(Boolean);
  return (
    <div class="preview">
      <FighterSprite look={lookOf(f)} h={64} />
      <div class="grow">
        <b class="ellipsis">{f.race ? fullName(f as Fighter) : f.name}</b>
        <small class="ellipsis">{bits.length ? bits.join(', ') : 'The wheel is about to decide everything'}</small>
      </div>
    </div>
  );
}

/** Everything landed so far, as a sheet. */
function SoFarSheet({ f }: { f: BuildFighter }) {
  // hidden synergies stay secret until a fight shows them
  const syns = f.race ? synOf(f as Fighter).filter((s) => synFound(G, s)) : [];
  return (
    <Sheet icon="scroll" title={f.name} sub="Everything landed so far">
      <Preview f={f} />
      <dl class="loadout">
        {WHEELS.filter((W) => applicable(W, f)).map((W) => {
          const v = (f as Record<string, unknown>)[W.k] as (Slice & { skip?: unknown }) | undefined;
          return (
            <div key={W.k} class="lo-row">
              <dt>{labelOf(W, f)}</dt>
              <dd class={v ? '' : 'pending'}>
                {v ? (v.skip ? '—' : W.k === 'reinc' ? `${v.e ? v.e + ' ' : ''}${v.n}` : <Inf k={itemKeyFor(W.k, v, f)}>{`${v.e ? v.e + ' ' : ''}${v.n}`}</Inf>) : '?'}
              </dd>
            </div>
          );
        })}
        <div class="lo-row">
          <dt>Synergies</dt>
          <dd class={syns.length ? '' : 'pending'}>{syns.length ? syns.map((s) => `${s.e} ${s.n}`).join(', ') : 'None yet'}</dd>
        </div>
      </dl>
    </Sheet>
  );
}

// ---------------------------------------------------------------- building a fighter
/** Spins every wheel of a new fighter: flick or tap, one free reroll, or let the game spin the rest. */
export function BuildScreen({ name, resume }: { name: string; resume?: { f: unknown; idx: number; done: boolean } | null }) {
  // a build in progress is kept in the save after every wheel, so closing the app loses none of it (A4)
  const S = useRef({ f: (resume?.f as BuildFighter) ?? newBuild(name), idx: resume?.idx ?? 0, auto: false, spinning: false, done: false, lastSpun: -1, list: [] as OddsEntry[], reasons: [] as OddsReason[] }).current;
  const [, setV] = useState(0);
  const rerender = () => setV((x) => x + 1);
  const [landed, setLanded] = useState<Landed | null>(null);
  const [msg, setMsg] = useState<ComponentChildren>('Flick the wheel with your finger, or tap the button');
  const [hub, setHub] = useState('?');
  const [hi, setHi] = useState<number | null>(null);
  const wheel = useRef<WheelHandle | null>(null);
  const stopDrum = useRef<() => void>(() => {});
  const fast = settings.value.fast;
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = () => {
    S.idx = nextWheel(S.f, S.idx);
    if (S.idx >= WHEELS.length) {
      if (S.auto) return finish();
      S.done = true;
      S.list = [];
      S.reasons = [];
      rerender();
      return;
    }
    const od = playerOdds(G, WHEELS[S.idx]!, S.f);
    S.list = od.list;
    S.reasons = od.reasons;
    setHi(null);
    setHub('?');
    rerender();
  };
  useMemo(load, []);

  const W = WHEELS[S.idx];
  const items = useMemo(() => toSlices(S.list, W?.k, S.f.race?.n), [S.list]);
  // timers outlive the render that set them, so spins read the current slices from here
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const prep = () => {
    ac();
    // the next wheel may not be drawn yet (effects wait for a paint): draw it before spinning
    const v = wheel.current?.view;
    if (v && v.items !== itemsRef.current) v.setItems(itemsRef.current, v.size, null);
    S.spinning = true;
    S.lastSpun = -1;
    setLanded(null);
    setMsg('Round and round it goes…');
    setHub('?');
    rerender();
  };
  // a tap before Pixi has drawn the wheel waits for it instead of getting lost
  const pending = useRef(false);
  const doSpin = () => {
    const v = wheel.current?.view;
    if (S.done) return;
    if (!v) return void (pending.current = true);
    prep();
    if (reducedMotion()) {
      v.spinTo(pickW(G.rng, itemsRef.current), { dur: 500, turns: 1 });
      return;
    }
    v.spinPhysics(S.auto ? 'auto' : 'button', fast);
  };
  const onFlick = (w: number) => {
    if (S.spinning || S.done || !wheel.current) return;
    prep();
    wheel.current.view.spinPhysics('flick', fast, w);
  };
  const landedAt = (i: number, info: { turns: number; flick: boolean }) => {
    stopDrum.current();
    const e = S.list[i]!;
    const it = e.it;
    const Wk = WHEELS[S.idx]!;
    const r = act((g) => buildLand(g, S.f, Wk, it, S.idx));
    setHub(it.e || String(it.v ?? '✓'));
    if (r.respin) {
      setLanded({ name: it.n, rx: '🩹 Resilient: below Peak human, so the wheel spins again', q: 1 });
      landSound(1);
      later(() => {
        S.spinning = false;
        doSpin();
      }, fast ? 600 : 1100);
      return;
    }
    const notes: ComponentChildren[] = [];
    if (r.newInCollection) notes.push(<div class="note new">New in your collection</div>);
    for (const { s, isNew } of r.syns)
      notes.push(
        <Inf k={`it|syn|${s.n}`} class={`note ${s.anti ? 'anti' : 'syn'}`}>
          {s.anti ? 'Uh oh' : 'Synergy'}: {s.e} {s.n}
          {isNew ? ' (new)' : ''}
        </Inf>,
      );
    if (info.flick) notes.push(<div class="turns">Your flick: {info.turns.toFixed(1)} turns</div>);
    if (r.subWheel) notes.push(<div class="note sub">Sub-wheel unlocked: {r.subWheel}</div>);
    setLanded({ name: `${it.e ? it.e + ' ' : ''}${it.n}`, wheel: labelOf(Wk, S.f), infoKey: itemKeyFor(Wk.k, it, S.f), rx: reaction(G, it), desc: it.d, notes, q: r.best });
    landSound(r.best);
    buzz(r.best >= 3 ? [30, 50, 60] : 25);
    if (r.best >= 3) burst();
    S.lastSpun = S.idx;
    S.idx++;
    act((g) => saveBuild(g, S.f, S.idx, false));
    rerender();
    later(
      () => {
        S.spinning = false;
        load();
        if (S.auto && S.idx < WHEELS.length) later(doSpin, 250);
      },
      S.auto ? 650 : fast ? 750 : 1300,
    );
  };
  const events = {
    land: (i: number, info: { turns: number; flick: boolean }) => {
      setHi(i);
      setHub('!');
      later(() => landedAt(i, info), reducedMotion() ? 0 : fast || S.auto ? 220 : 480);
    },
    suspense: () => {
      setHub('…');
      setMsg('Slowing down…');
      if (!reducedMotion()) stopDrum.current = drumRoll();
    },
    tooGentle: (turns: number) => {
      S.spinning = false;
      setLanded({ name: 'Too gentle 😴', rx: `That only went around ${turns.toFixed(1)} times. A spin needs at least 1½ to count, so flick harder.`, q: 1 });
      rerender();
    },
  };
  const finish = () => {
    act((g) => {
      finishBuild(g, S.f as Fighter);
      // the finished fighter waits on the card, and is kept until they start a career or get scrapped
      saveBuild(g, S.f, S.idx, true);
    });
    go({ screen: 'card', f: S.f });
  };

  const total = wheelsTotal(S.f);
  // sub-wheels that may still join say so ("of 21+") instead of the total creeping up one spin at a time
  const more = S.done ? 0 : wheelsMaybe(S.f);
  const done = S.done ? total : wheelsDone(S.f, S.idx);
  const canReroll = !S.auto && S.lastSpun >= 0 && !S.spinning && (S.f.free || 0) > 0;
  const label = W && !S.done ? labelOf(W, S.f) : 'Done';
  const src = W && !S.done && W.from ? W.from(S.f) : null;
  const unlock = src ? (W!.k === 'power' ? `${src.e} ${src.n}s spin the ${label.toLowerCase()} wheel` : `Sub-wheel unlocked by ${src.e} ${src.n}`) : undefined;
  return (
    <main class="screen spin-screen">
      <header class="spin-head pad">
        <div class="row">
          <button
            class="iconbtn"
            aria-label="Scrap this fighter"
            onClick={async () => {
              // nothing spun yet: just leave; otherwise those spins are a big thing to throw away
              if (done > 0 && !(await confirm({ title: `Scrap ${name}?`, body: 'Every spin so far is lost. The wheel will not remember them fondly.', yes: 'Scrap them', danger: true }))) return;
              go({ screen: 'title' });
            }}
          >
            <Icon name="back" />
          </button>
          <span class="grow">
            <small class="ellipsis">Spinning {name}</small>
            <span class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <i style={{ width: `${(done / total) * 100}%` }} />
            </span>
          </span>
          <small class="prog-n">{S.done ? `${total} of ${total} spun` : `Spin ${done + 1} of ${total}${more ? '+' : ''}`}</small>
          <button class="btn ghost sm" onClick={() => openSheet(<SoFarSheet f={S.f} />)}>
            <Icon name="scroll" /> So far
          </button>
        </div>
        <h2 class="cat">{S.done ? 'All spun' : label}</h2>
        <OddsChips reasons={S.reasons} unlock={unlock} />
      </header>
      <div class="wheel-area">
        <PixiWheel items={items} hi={hi} hub={hub} live={!S.spinning && !S.done} onFlick={onFlick} onTap={doSpin} events={events} handle={wheel} onReady={() => pending.current && ((pending.current = false), doSpin())} label={`${label} wheel`} />
      </div>
      <LandedPanel landed={landed} msg={S.done ? 'Every wheel has spoken.' : msg} />
      <footer class="spin-foot pad">
        {!S.done && <Legend />}
        <button class="btn block" disabled={S.spinning && !S.done} onClick={() => (S.done ? finish() : doSpin())}>
          {S.done ? 'See the finished fighter' : `Spin for ${W && (W.k === 'rsub' || W.k === 'asub') ? label.toLowerCase() : W?.lc}`}
        </button>
        {/* the free reroll still works on the last wheel */}
        {(!S.done || canReroll) && !S.auto && (
          <div class="row">
            <button
              class="btn ghost sm grow"
              disabled={!canReroll}
              onClick={() => {
                if (!canReroll) return;
                sfx('wh.reroll', { vary: 0 });
                reroll(S.f, S.lastSpun);
                S.idx = S.lastSpun;
                S.lastSpun = -1;
                S.done = false;
                // the reroll is spent the moment it's used, even if the app closes mid-spin
                act((g) => saveBuild(g, S.f, S.idx, false));
                load();
                doSpin();
              }}
            >
              <Icon name="dice" /> {(S.f.free || 0) > 0 ? (S.lastSpun >= 0 ? `Reroll ${WHEELS[S.lastSpun]!.lc}` : 'Reroll (1 free)') : 'Reroll used'}
            </button>
            {!S.done && (
              <button
                class="btn ghost sm grow"
                disabled={S.spinning}
                onClick={() => {
                  S.auto = true;
                  rerender();
                  doSpin();
                }}
              >
                Spin the rest
              </button>
            )}
          </div>
        )}
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------- one-off wheels
export interface SpinSpec<T extends { n: string; e?: string; q?: number; d?: string } = { n: string; e?: string; q?: number; d?: string }> {
  /** collection / info category of the slices */
  cat?: string;
  title: string;
  who: string;
  list: Entry<T>[];
  reasons?: { cls: string; txt: string }[];
  unlock?: string;
  spinLabel?: string;
  nextLabel?: string;
  /** show the fighter while spinning (level-ups, training) */
  preview?: boolean;
  noDesc?: boolean;
  /** applies the result; returns extra lines to show under it */
  onLand: (it: T) => ComponentChildren | void;
  /** continue on its own after this many ms (the arena wheel) */
  autoNext?: number;
  /** spin on its own as soon as the wheel is up (spoils after a fight: no tap needed) */
  autoSpin?: boolean;
}

/** A single wheel (loot, level-ups, events, arenas...). Resolves with what landed once Continue is tapped. */
export function spinWheel<T extends { n: string; e?: string; q?: number; d?: string }>(spec: SpinSpec<T>): Promise<T> {
  return new Promise((resolve) => go({ screen: 'spin', spec, done: resolve, key: Math.random() }));
}

export function SpinScreen({ spec, done }: { spec: SpinSpec; done: (it: unknown) => void }) {
  const [landed, setLanded] = useState<Landed | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [spinning, setSpinning] = useState(false);
  const [hub, setHub] = useState('?');
  const [hi, setHi] = useState<number | null>(null);
  const [msg, setMsg] = useState<ComponentChildren>(`Flick the wheel with your finger, or tap ${spec.spinLabel || 'the button'}`);
  const wheel = useRef<WheelHandle | null>(null);
  const stopDrum = useRef<() => void>(() => {});
  const fast = settings.value.fast;
  const items = useMemo(() => toSlices(spec.list, spec.cat), [spec]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const finished = result != null;

  const prep = () => {
    ac();
    setSpinning(true);
    setLanded(null);
    setMsg('Round and round it goes…');
    setHub('?');
  };
  // a tap before Pixi has drawn the wheel waits for it instead of getting lost
  const pending = useRef(false);
  const doSpin = () => {
    const v = wheel.current?.view;
    if (spinning || finished) return;
    if (!v) return void (pending.current = true);
    prep();
    if (reducedMotion()) v.spinTo(pickW(G.rng, items), { dur: 500, turns: 1 });
    else v.spinPhysics('button', fast);
  };
  // spoils spin themselves; doSpin waits for the wheel if it isn't drawn yet
  useEffect(() => {
    if (spec.autoSpin) doSpin();
  }, []);
  const landedAt = (i: number, info: { turns: number; flick: boolean }) => {
    stopDrum.current();
    const it = spec.list[i]!.it;
    const q = it.q == null ? 1 : it.q;
    act((g) => (g.save.profile.spins++, 0));
    const notes = act(() => spec.onLand(it));
    setHub(it.e || '✓');
    setLanded({
      name: `${it.e ? it.e + ' ' : ''}${it.n}`,
      infoKey: spec.cat ? `it|${spec.cat}|${it.n}` : undefined,
      rx: reaction(G, it as never, G.F || undefined, true),
      desc: it.d && !spec.noDesc ? it.d : undefined,
      notes: (
        <>
          {notes}
          {info.flick && <div class="turns">Your flick: {info.turns.toFixed(1)} turns</div>}
        </>
      ),
      q,
    });
    landSound(q);
    buzz(q >= 3 ? [30, 50, 60] : 25);
    if (q >= 3) burst();
    setSpinning(false);
    setResult(it);
    if (spec.autoNext != null) timers.current.push(window.setTimeout(() => done(it), reducedMotion() ? 200 : fast ? spec.autoNext / 2 : spec.autoNext));
  };
  const events = {
    land: (i: number, info: { turns: number; flick: boolean }) => {
      setHi(i);
      setHub('!');
      timers.current.push(window.setTimeout(() => landedAt(i, info), reducedMotion() ? 0 : fast ? 220 : 480));
    },
    suspense: () => {
      setHub('…');
      setMsg('Slowing down…');
      if (!reducedMotion()) stopDrum.current = drumRoll();
    },
    tooGentle: (turns: number) => {
      setSpinning(false);
      setLanded({ name: 'Too gentle 😴', rx: `That only went around ${turns.toFixed(1)} times. A spin needs at least 1½ to count, so flick harder.`, q: 1 });
    },
  };
  const onFlick = (w: number) => {
    if (spinning || finished || !wheel.current) return;
    prep();
    wheel.current.view.spinPhysics('flick', fast, w);
  };
  return (
    <main class="screen spin-screen single">
      <header class="spin-head pad">
        <div class="row">
          <span class="grow">
            <small class="ellipsis">{spec.who}</small>
          </span>
        </div>
        {spec.preview && G.F && <Preview f={G.F} />}
        <h2 class="cat">{spec.title}</h2>
        <OddsChips reasons={spec.reasons || []} unlock={spec.unlock} />
      </header>
      <div class="wheel-area">
        <PixiWheel items={items} hi={hi} hub={hub} live={!spinning && !finished} onFlick={onFlick} onTap={doSpin} events={events} handle={wheel} onReady={() => pending.current && ((pending.current = false), doSpin())} label={`${spec.title} wheel`} />
      </div>
      <LandedPanel landed={landed} msg={msg} />
      <footer class="spin-foot pad">
        <button class="btn block" disabled={spinning} onClick={() => (finished ? done(result) : doSpin())}>
          {finished ? spec.nextLabel || 'Continue' : spec.spinLabel || `Spin the ${spec.title.toLowerCase()} wheel`}
        </button>
      </footer>
    </main>
  );
}
