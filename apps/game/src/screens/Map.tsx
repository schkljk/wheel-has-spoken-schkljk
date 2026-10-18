import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { BOSSES, CHAPTERS, hardMutator, hpTxt, maxGrit, myNemesis, nodeOf, storyOf, type NodeKind } from '@whs/core';
import { G, activeFighter, act } from '../state/game';
import { Icon } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { goHub } from '../flows/nav';
import { chapterIntro, enterNode, openBag } from '../flows/story';

/** The chapter map: your step, what you picked, what is ahead, and the boss at the end. */
export function MapScreen() {
  void activeFighter.value;
  const S = storyOf(G);
  const C = CHAPTERS[S.ch - 1]!;
  const boss = BOSSES[S.ch - 1]!;
  const NM = myNemesis(G);
  const HM = S.hard ? hardMutator(G) : null;
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ h: 420, w: 400 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setRoom({ h: el.clientHeight, w: el.clientWidth });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!S.seenIntro) {
      act((g) => (storyOf(g).seenIntro = true));
      void chapterIntro();
    }
  }, []);
  const last = S.rows.length - 1;
  // as many steps as the screen holds: one done step, the current one, what is next, and the boss. A step is
  // about 53 px with its gap, the current one 62 (two lines of choices when three don't fit side by side), a
  // "⋯ more ⋯" line 23, and the panel's padding 16.
  const nowH = (S.rows[S.row] || []).length > 2 && room.w < 430 ? 126 : 62;
  const need = (b: number, a: number) => {
    const h = Math.min(last - 1, S.row + a);
    return 16 + b * 53 + nowH + Math.max(0, h - S.row) * 53 + (h < last - 1 ? 23 : 0) + (S.row < last ? 53 : 0);
  };
  let before = S.row > 0 ? 1 : 0;
  let after = 1;
  while (S.row + after < last - 1 && need(before, after + 1) + 23 <= room.h) after++;
  if (before && need(before, after) + 23 > room.h) before = 0;
  const lo = Math.max(0, S.row - before);
  const hi = Math.min(last - 1, S.row + after);
  // the "⋯ done" line only when there is room for it
  const doneLine = lo > 0 && need(before, after) + 23 <= room.h;
  const hearts = Array.from({ length: maxGrit(G) }, (_, i) => (i < S.grit ? '❤️' : '🖤')).join('');
  return (
    <main class={`screen map-screen${HM ? ' hard' : ''}`} style={{ '--ch': C.col } as Record<string, string>}>
      <header class="maphead pad">
        <div class="row">
          <span class="mh-e" aria-hidden="true">
            {C.e}
          </span>
          <div class="grow">
            <small class="ellipsis">
              {HM ? '🔥 Hard, chapter ' : 'Chapter '}
              {S.ch}
              {S.ng ? `, encore ${S.ng}` : ''}
            </small>
            <h2 class="ellipsis">{C.n}</h2>
          </div>
          <Inf k="rule|story" class="hint">
            How it works
          </Inf>
        </div>
        <div class="row mh-stats">
          {HM && (
            <Inf k={`it|mut|${HM.n}`} class="mh-mut" label={`Twist: ${HM.n}. ${HM.d}`}>
              {HM.e}
            </Inf>
          )}
          <div class="grow">
            <small>HP {hpTxt(G, S.hp)}</small>
            <div class="hpbar2">
              <i style={{ width: `${S.hp}%` }} />
            </div>
          </div>
          <Inf k="rule|grit" class="mh-grit">
            {hearts}
          </Inf>
        </div>
      </header>
      <div class="maprows" ref={box}>
        {S.rows.map((row, r) => {
          if (!(r >= lo && r <= hi) && r !== last) return null;
          const state = r < S.row ? 'done' : r === S.row ? 'now' : 'later';
          return (
            <Fragment key={r}>
              {r === lo && doneLine && <div class="mgap">{lo} done ⋯</div>}
              {r === last && hi < last - 1 && <div class="mgap">⋯ {last - 1 - hi} more ⋯</div>}
              <div class={`mrow ${state}`}>
                <div class="mstep">{r === last ? 'Boss' : `Step ${r + 1}`}</div>
                <div class="mnodes">
                  {row.map((t, i) => {
                    const N = nodeOf(t as NodeKind);
                    const e = t === 'boss' ? boss.e : N.e;
                    const nem = t === 'nemesis' && NM;
                    if (state === 'now')
                      return (
                        <button key={i} class={`mnode now t-${t}`} onClick={() => void enterNode(i)}>
                          <span class="mn-e">{e}</span>
                          <span class="mn-t">
                            <b>{t === 'boss' ? boss.name : nem ? NM.f.name : N.n}</b>
                            <small>{t === 'boss' ? boss.title : nem ? `Your nemesis. ${N.d}` : N.d}</small>
                          </span>
                        </button>
                      );
                    const cls = state === 'done' ? (S.picks[r] === i ? 'chosen' : 'skipped') : 'later';
                    return (
                      <div key={i} class={`mnode ${cls} t-${t}`} aria-label={t === 'boss' ? boss.name : nem ? `Nemesis: ${NM.f.name}` : N.n}>
                        <span class="mn-e">{e}</span>
                        {state === 'done' && S.picks[r] === i && <span class="mn-ok">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
      <footer class="dock pad map-dock">
        <button class="btn ghost" onClick={() => openBag()}>
          <Icon name="bag" /> Bag
        </button>
        <button class="btn ghost" onClick={() => void goHub()}>
          <Icon name="house" /> Fighter page
        </button>
      </footer>
    </main>
  );
}
