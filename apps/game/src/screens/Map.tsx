import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { BOSSES, CHAPTERS, NODE, hpTxt, maxGrit, storyOf, type NodeKind } from '@whs/core';
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
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(6);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setFit(Math.max(3, Math.floor((el.clientHeight - 40) / 62)));
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
  // as many steps as the screen holds: one done step, the current one, what is next, and the boss
  const before = S.row > 0 ? 1 : 0;
  const after = Math.max(1, fit - before - 2);
  const lo = Math.max(0, S.row - before);
  const hi = Math.min(last - 1, S.row + after);
  const hearts = Array.from({ length: maxGrit(G) }, (_, i) => (i < S.grit ? '❤️' : '🖤')).join('');
  return (
    <main class="screen map-screen" style={{ '--ch': C.col } as Record<string, string>}>
      <header class="maphead pad">
        <div class="row">
          <span class="mh-e" aria-hidden="true">
            {C.e}
          </span>
          <div class="grow">
            <small>
              Chapter {S.ch}
              {S.ng ? `, encore ${S.ng}` : ''}
            </small>
            <h2 class="ellipsis">{C.n}</h2>
          </div>
          <Inf k="rule|story" class="hint">
            How it works
          </Inf>
        </div>
        <div class="row mh-stats">
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
              {r === lo && lo > 0 && <div class="mgap">{lo} done ⋯</div>}
              {r === last && hi < last - 1 && <div class="mgap">⋯ {last - 1 - hi} more ⋯</div>}
              <div class={`mrow ${state}`}>
                <div class="mstep">{r === last ? 'Boss' : `Step ${r + 1}`}</div>
                <div class="mnodes">
                  {row.map((t, i) => {
                    const N = NODE[t as NodeKind]!;
                    const e = t === 'boss' ? boss.e : N.e;
                    if (state === 'now')
                      return (
                        <button key={i} class={`mnode now t-${t}`} onClick={() => void enterNode(i)}>
                          <span class="mn-e">{e}</span>
                          <span class="mn-t">
                            <b>{t === 'boss' ? boss.name : N.n}</b>
                            <small>{t === 'boss' ? boss.title : N.d}</small>
                          </span>
                        </button>
                      );
                    const cls = state === 'done' ? (S.picks[r] === i ? 'chosen' : 'skipped') : 'later';
                    return (
                      <div key={i} class={`mnode ${cls} t-${t}`} aria-label={t === 'boss' ? boss.name : N.n}>
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
