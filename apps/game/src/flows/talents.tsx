import { useState } from 'preact/hooks';
import { BALANCE, TIER_LVL, TIER_PTS, TNODE, TREE, branchPts, canRank, rankTalent, reviveSources, talRank, unrankTalent } from '@whs/core';
import { G, act, dropToast, toast } from '../state/game';
import { openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { burstFrom } from '../ui/fx';
import { landSound } from '../ui/sound';
import { tip } from '../state/tips';

const pl = (n: number, one: string) => `${n} ${n === 1 ? one : one + 's'}`;
// the open Undo toast: only the latest rank can be taken back
let lastUndo = 0;

/** The talent tree: five branches, six tiers each; deeper tiers need a higher level and points in the branch. */
function Talents({ br: br0 }: { br: string }) {
  const [br, setBr] = useState(br0);
  const [, setV] = useState(0);
  const F = G.F!;
  const B = TREE.find((b) => b.k === br)!;
  const lv = F.lvl || 1;
  const pts = branchPts(F, B.k);
  const tiers = [];
  for (let t = 1; t <= 6; t++) {
    const nodes = B.t.slice((t - 1) * 2, t * 2).map((x) => TNODE[B.k + '_' + x[0]]!);
    const lockLv = lv < TIER_LVL(t);
    const lockPts = pts < TIER_PTS(t);
    const locked = lockLv || lockPts;
    tiers.push(
      <div class={`tt-tier${locked ? ' locked' : ''}`} key={t}>
        <div class="tt-req">
          {t === 6 ? 'Capstone' : `Tier ${t}`}
          {locked && (
            <small>
              {lockLv ? `Level ${TIER_LVL(t)}` : ''}
              {lockLv && lockPts ? ', ' : ''}
              {lockPts ? `${TIER_PTS(t)} pts in ${B.n}` : ''}
            </small>
          )}
        </div>
        {nodes.map((n) => {
          const r = talRank(F, n.key);
          const ok = canRank(F, n);
          // only one revive counts a fight (review K6): say so before a point goes on a second one
          const others = BALANCE.reviveCap && !r && n.eff.fx?.revive ? reviveSources(F, n.key) : [];
          return (
            <button
              key={n.key}
              class={`tt-node${r ? ' has' : ''}${r >= n.max ? ' max' : ''}`}
              disabled={!ok}
              style={{ '--c': B.col } as Record<string, string>}
              onClick={(e) => {
                const el = e.currentTarget;
                if (act((g) => rankTalent(g, n.key))) {
                  landSound(talRank(F, n.key) >= n.max ? 3 : 2);
                  burstFrom(el);
                  setV((x) => x + 1);
                  // a point spent on one tap can be taken back for three seconds, like a gear swap
                  if (lastUndo) dropToast(lastUndo);
                  lastUndo = toast(`${n.e} ${n.n} ${talRank(F, n.key) > 1 ? `rank ${talRank(F, n.key)}` : 'learned'}`, 3000, {
                    label: 'Undo',
                    run: () => {
                      lastUndo = 0;
                      if (act((g) => unrankTalent(g, n.key))) {
                        toast('Point back');
                        setV((x) => x + 1);
                      }
                    },
                  });
                }
              }}
            >
              <span class="tt-e">{n.e}</span>
              <b>{n.n}</b>
              <small>{n.d}</small>
              {others.length > 0 && <small class="tt-warn">Won't stack: {others.join(', ')} already gets you back up</small>}
              <span class="tt-pips">
                {Array.from({ length: n.max }, (_, i) => (
                  <i key={i} class={i < r ? 'on' : ''} />
                ))}
              </span>
            </button>
          );
        })}
      </div>,
    );
  }
  return (
    <Sheet icon="star" title="Talents" sub={`${pl(F.tp || 0, 'point')} to spend`}>
      <div class="stack">
        <p class="hint">One point every level and rank-up. Deeper tiers need more points in that branch and a higher level. Many talents have several ranks.</p>
        <div class="tt-tabs" role="tablist">
          {TREE.map((b) => (
            <button key={b.k} role="tab" aria-selected={b.k === br} class={`tt-tab${b.k === br ? ' on' : ''}`} style={{ '--c': b.col } as Record<string, string>} onClick={() => setBr(b.k)}>
              <span aria-hidden="true">{b.e}</span>
              {b.n}
              <small>{branchPts(F, b.k)}</small>
            </button>
          ))}
        </div>
        <div class="tt-body">{tiers}</div>
      </div>
    </Sheet>
  );
}
export function openTalents(br = 'off') {
  openSheet(<Talents key={Math.random()} br={br} />);
  tip('talents');
}
