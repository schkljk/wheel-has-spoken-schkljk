import { Hearts } from '../ui/Hearts';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BOSSES, CHAPTERS, hardMutator, hashStr, hpTxt, maxGrit, myNemesis, nodePreview, nodeOf, recLevel, storyOf, type NodeKind } from '@whs/core';
import { ChapterIcon } from '../art/ChapterIcon';
import { FighterFace } from '../art/FighterFace';
import { FighterSprite } from '../art/FighterSprite';
import { bossLook, mapLayout, renderMap } from '../art/map-art';
import { mapTheme } from '../art/map-themes';
import { lookOf } from '../art/sprite';
import { G, activeFighter, act, reducedMotion } from '../state/game';
import { openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { goHub } from '../flows/nav';
import { chapterIntro, enterNode, openBag } from '../flows/story';
import { tip } from '../state/tips';
import { sfx } from '../ui/sound';

// the stop each kind of step shows on the map
const KIND_ICON: Partial<Record<NodeKind, string>> = { fight: 'fist', elite: 'attack', event: 'question', rest: 'camp', shop: 'cart', treasure: 'chest' };
// where your fighter stood when you last left the map, so they can walk to the next stop when you come back
let lastSpot: { ch: number; row: number; x: number; y: number } | null = null;

/** The chapter map: a landscape in the chapter's theme, a road forking at every step, you on it, the boss at the end. */
export function MapScreen() {
  const F = activeFighter.value!;
  const S = storyOf(G);
  const C = CHAPTERS[S.ch - 1]!;
  const boss = BOSSES[S.ch - 1]!;
  const NM = myNemesis(G);
  const HM = S.hard ? hardMutator(G) : null;
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [cw, setCw] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setCw(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!S.seenIntro) {
      act((g) => (storyOf(g).seenIntro = true));
      void chapterIntro().then(() => tip('map'));
    } else tip('map');
  }, []);
  const last = S.rows.length - 1;
  const seed = hashStr(`${S.ch}|${S.ng || 0}|${S.hard ? 1 : 0}|${S.rows.map((r) => r.join(',')).join('/')}`);
  const L = useMemo(() => (cw ? mapLayout(S.rows, cw, seed) : null), [cw, seed]);
  const f = L ? cw / L.W : 1;
  const picks = S.picks.join(',');
  // the picture under the stops, painted right after the screen shows (the ground color stands in until then)
  useEffect(() => {
    const c = cv.current;
    if (!L || !c) return;
    const img = renderMap(L, S.ch, { row: S.row, picks: S.picks }, seed);
    c.width = img.w;
    c.height = img.h;
    c.getContext('2d')!.putImageData(new ImageData(img.d as Uint8ClampedArray<ArrayBuffer>, img.w, img.h), 0, 0);
  }, [L, S.row, picks]);
  // where you stand: the stop you took last, or the start
  const here = L ? (S.row > 0 ? L.stops[S.row - 1]![S.picks[S.row - 1] ?? 0] : null) ?? L.joins[0]! : null;
  const [walk, setWalk] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!L || !here) return;
    // scroll so the choices ahead sit a little above the middle, with you below them
    const el = box.current!;
    const ahead = (L.stops[Math.min(S.row, last)]![0]!.y + here.y) / 2;
    el.scrollTop = ahead * f - el.clientHeight * 0.55;
    // came back from a step on this chapter: walk there from where you stood
    if (lastSpot && lastSpot.ch === S.ch && lastSpot.row === S.row - 1 && !reducedMotion()) {
      setWalk({ x: lastSpot.x, y: lastSpot.y });
      requestAnimationFrame(() => requestAnimationFrame(() => setWalk(null)));
      // footsteps along the way
      for (let i = 0; i < 4; i++) sfx('s.step', { delay: 0.1 + i * 0.2, pitch: i % 2 ? 1.08 : 0.95 });
    }
    lastSpot = { ch: S.ch, row: S.row, x: here.x, y: here.y };
  }, [L, S.row]);
  const at = (x: number, y: number) => ({ left: `${x * f}px`, top: `${y * f}px` });
  const you = walk ?? here;
  return (
    <main class={`screen map-screen${HM ? ' hard' : ''}`} style={{ '--ch': C.col } as Record<string, string>}>
      <header class="maphead pad">
        <div class="row">
          <span class="mh-e" aria-hidden="true">
            <ChapterIcon ch={S.ch} />
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
            <Hearts n={S.grit} max={maxGrit(G)} />
          </Inf>
        </div>
      </header>
      <div class="mapview" ref={box}>
        {L && (
          <div class="mapworld" style={{ height: `${L.H * f}px`, background: mapTheme(S.ch).g[1] }}>
            <canvas ref={cv} class="mapart" aria-hidden="true" />
            {S.rows.map((row, r) =>
              row.map((t, i) => {
                const n = L.stops[r]![i]!;
                const state = r < S.row ? (S.picks[r] === i ? 'chosen' : 'skipped') : r === S.row ? 'now' : 'later';
                const N = nodeOf(t as NodeKind);
                const nem = t === 'nemesis' && NM;
                const name = t === 'boss' ? boss.name : nem ? NM.f.name : N.n;
                const go = () => (state === 'now' ? void enterNode(i) : previewNode(t as NodeKind, r));
                if (t === 'boss')
                  return (
                    <button
                      key={`${r}-${i}`}
                      class={`mnode mboss ${state} t-boss`}
                      style={at(n.x, n.y)}
                      aria-label={state === 'now' ? undefined : `${boss.name}: what's here`}
                      onClick={go}
                    >
                      <span class="mb-art">
                        <FighterSprite look={bossLook(S.ch)} h={96} mirror />
                      </span>
                      <span class="mb-plate">
                        <b>{boss.name}</b>
                        <small>{boss.title}</small>
                      </span>
                      {state === 'later' && <span class={`mn-lv${(F.lvl || 1) < recLevel(G) ? ' low' : ''}`}>Lv {recLevel(G)}</span>}
                    </button>
                  );
                return (
                  <button
                    key={`${r}-${i}`}
                    class={`mnode ${state} t-${t}`}
                    style={at(n.x, n.y)}
                    aria-label={state === 'now' ? undefined : `${nem ? `Nemesis: ${NM.f.name}` : N.n}: what's here`}
                    onClick={go}
                  >
                    <span class="mn-b">{nem ? <FighterFace f={NM.f} e={N.e} /> : KIND_ICON[t as NodeKind] ? <Icon name={KIND_ICON[t as NodeKind]!} /> : <span>{N.e}</span>}</span>
                    {state === 'chosen' && (
                      <span class="mn-ok" aria-hidden="true">
                        <Icon name="check" />
                      </span>
                    )}
                    {state === 'now' && (
                      <span class="mn-t">
                        <b>{name}</b>
                        <small>{nem ? `Your nemesis. ${N.d}` : N.d}</small>
                      </span>
                    )}
                  </button>
                );
              }),
            )}
            {you && (
              <div class={`map-you${walk ? ' start' : ''}`} style={at(you.x, you.y)} aria-hidden="true">
                <FighterSprite look={lookOf(F)} h={70} />
              </div>
            )}
          </div>
        )}
      </div>
      <footer class="dock pad map-dock">
        <button class="btn ghost" onClick={() => openBag()}>
          <Icon name="bag" /> Bag
        </button>
        <button class="btn ghost" onClick={() => void goHub()}>
          <Icon name="house" /> Home
        </button>
      </footer>
    </main>
  );
}

/** What a step holds, before you get there. */
function previewNode(k: NodeKind, row: number) {
  const p = nodePreview(G, k, row);
  openSheet(
    <Sheet emoji={p.e} title={p.n} sub={p.sub}>
      <ul class="np-lines">
        {p.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </Sheet>,
  );
}
