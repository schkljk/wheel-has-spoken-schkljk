import { useEffect, useRef, useState } from 'preact/hooks';
import { CALL_PAY, COMMENTATORS, deserFighter, exhibitionLegends, runExhibition, settleCall, type Call, type Exhibition, type Legend } from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { G, act, reducedMotion, settings } from '../state/game';
import { openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { sfx, tick } from '../ui/sound';

/** Hall of fame exhibitions (upgrade 24): pick two legends, then watch them fight with commentary. */
export function openExhibition(pair?: [number, number]) {
  const legends = exhibitionLegends(G);
  openSheet(<ExhibitionPick key={Math.random()} legends={legends} pair={pair ?? [0, 1]} />);
}

function ExhibitionPick({ legends, pair }: { legends: Legend[]; pair: [number, number] }) {
  const [[a, b], setPair] = useState(pair);
  if (legends.length < 2)
    return (
      <Sheet emoji="🏛️" title="Exhibition" sub="Legends only">
        <p class="hint">
          The hall of fame needs two legends: win a tournament or the story, or retire a champion. {legends.length === 1 ? `${legends[0]!.n} is warming up alone. It is a little sad.` : 'The arena is empty. The janitor is doing push-ups.'}
        </p>
      </Sheet>
    );
  const shuffle = () => {
    const x = Math.floor(Math.random() * legends.length);
    let y = Math.floor(Math.random() * (legends.length - 1));
    if (y >= x) y++;
    setPair([x, y]);
  };
  const ring = (call: 0 | 1 | null) =>
    openSheet(<ExhibitionLive key={Math.random()} ex={runExhibition(legends[a]!, legends[b]!, (Date.now() & 0xffffff) + a * 31 + b)} pair={[a, b]} call={call} />, true);
  const set = (corner: 0 | 1, i: number) => setPair(corner === 0 ? (i === b ? [i, a] : [i, b]) : i === a ? [b, i] : [a, i]);
  return (
    <Sheet emoji="🏛️" title="Exhibition" sub="Two legends, nothing on the line but pride">
      <div class="stack">
        <div class="fc-vs ex-vs">
          {[a, b].map((i, k) => [
            k === 1 ? (
              <div class="fc-v" key="vs">
                VS
              </div>
            ) : null,
            <div class="fc-side" key={k}>
              <FighterSprite look={lookOf(deserFighter(legends[i]!.f)!)} h={84} mirror={k === 1} />
              <b class="ellipsis">{legends[i]!.n}</b>
              <small class="ex-s ellipsis">{legends[i]!.s}</small>
            </div>,
          ])}
        </div>
        <div class="row">
          <button class="btn ghost grow" onClick={shuffle}>
            🎲 Shuffle
          </button>
          <button class="btn grow" onClick={() => ring(null)}>
            🔔 Ring the bell
          </button>
        </div>
        {/* call it before the bell (F8): a right call pays a little */}
        <div class="row ex-call-row" role="group" aria-label={`Call it, +${CALL_PAY} coins if you are right`}>
          <button class="btn ghost sm grow" onClick={() => ring(0)}>
            🔴 Call it for {legends[a]!.n}
          </button>
          <button class="btn ghost sm grow" onClick={() => ring(1)}>
            🔵 Call it for {legends[b]!.n}
          </button>
        </div>
        <span class="sec-label">The hall of fame ({legends.length})</span>
        <ul class="ex-list">
          {legends.map((l, i) => (
            <li key={l.key} class={i === a ? 'red' : i === b ? 'blue' : ''}>
              <span class="ex-e">{l.e}</span>
              <span class="grow ex-t">
                <b class="ellipsis">{l.n}</b>
                <small class="ellipsis">{l.s}</small>
              </span>
              <button class={`ex-c red${i === a ? ' on' : ''}`} aria-label={`${l.n} in the red corner`} onClick={() => set(0, i)}>
                🔴
              </button>
              <button class={`ex-c blue${i === b ? ' on' : ''}`} aria-label={`${l.n} in the blue corner`} onClick={() => set(1, i)}>
                🔵
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

type Line = { k: number; t: 'call'; c: Call } | { k: number; t: 'line'; s: string } | { k: number; t: 'round'; r: number };

function ExhibitionLive({ ex, pair, call = null }: { ex: Exhibition; pair: [number, number]; call?: 0 | 1 | null }) {
  const [called, setCalled] = useState<{ right: boolean; pay: number } | null>(null);
  const [shown, setShown] = useState<Line[]>([]);
  const [hp, setHp] = useState<[number, number]>([100, 100]);
  const [done, setDone] = useState(false);
  const feed = useRef<HTMLOListElement>(null);
  const skip = useRef(false);
  useEffect(() => {
    // the whole broadcast as one list of beats: intro calls, each round's lines and call, then the finish
    let k = 0;
    const beats: { lines: Line[]; hp?: [number, number] }[] = [{ lines: ex.intro.map((c) => ({ k: k++, t: 'call', c })) }];
    for (const r of ex.rounds)
      beats.push({
        lines: [{ k: k++, t: 'round', r: r.r }, ...r.lines.map((s) => ({ k: k++, t: 'line' as const, s })), ...(r.call ? [{ k: k++, t: 'call' as const, c: r.call }] : [])],
        hp: r.hp,
      });
    beats.push({ lines: ex.outro.map((c) => ({ k: k++, t: 'call', c })) });
    let i = 0;
    let timer = 0;
    const next = () => {
      const all = skip.current || reducedMotion();
      do {
        const b = beats[i++]!;
        setShown((s) => [...s, ...b.lines]);
        if (b.hp) setHp(b.hp);
      } while (all && i < beats.length);
      tick();
      if (i < beats.length) timer = window.setTimeout(next, settings.value.fast ? 450 : 1100);
      else {
        setDone(true);
        sfx('ui.goal', { vary: 0 });
        if (call != null) setCalled(act((g) => settleCall(g, ex, call)));
      }
    };
    timer = window.setTimeout(next, 300);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const el = feed.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);
  const L = [ex.a, ex.b];
  return (
    <Sheet emoji="🏛️" title={`${deserFighter(ex.a.f)!.name} vs ${deserFighter(ex.b.f)!.name}`} sub="Exhibition. Nothing on the line but pride" locked={!done}>
      <div class="ex-ring">
        {L.map((l, i) => (
          <div key={i} class={`ex-corner${done && ex.w !== i ? ' lost' : ''}`}>
            <FighterSprite look={lookOf(deserFighter(l.f)!)} h={72} mirror={i === 1} />
            <span class="ellipsis">{deserFighter(l.f)!.name}</span>
            <div class="hpbar2">
              <i style={{ width: `${Math.max(0, hp[i]!)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <ol class="ex-feed scroll" ref={feed} aria-live="polite">
        {shown.map((l) =>
          l.t === 'round' ? (
            <li key={l.k} class="ex-round">
              Round {l.r}
            </li>
          ) : l.t === 'line' ? (
            <li key={l.k} class="ex-line">
              {l.s}
            </li>
          ) : (
            <li key={l.k} class={`ex-call c${l.c.who}`}>
              <span class="ex-who">
                {COMMENTATORS[l.c.who].e} {COMMENTATORS[l.c.who].n}
              </span>
              {l.c.txt}
            </li>
          ),
        )}
      </ol>
      {called && (
        <p class={`ex-called ${called.right ? 'good' : 'bad'}`}>
          {called.right ? `🎯 You called it. +${called.pay} 🪙` : '🙈 You called it wrong. The booth saw. The booth will remember.'}
        </p>
      )}
      {done ? (
        <div class="row">
          <button class="btn grow" onClick={() => openSheet(<ExhibitionLive key={Math.random()} ex={runExhibition(ex.a, ex.b, (Date.now() & 0xffffff) + 7)} pair={pair} />, true)}>
            🔁 Rematch
          </button>
          <button class="btn ghost grow" onClick={() => openExhibition(pair)}>
            New matchup
          </button>
        </div>
      ) : (
        <button class="btn ghost block" onClick={() => (skip.current = true)}>
          Skip to the end
        </button>
      )}
    </Sheet>
  );
}
