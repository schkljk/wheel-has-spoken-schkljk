import { useState } from 'preact/hooks';
import { TIER_LVL, TIER_PTS, TNODE, TREE, branchPts, canRank, rankTalent, talRank } from '@whs/core';
import { G, act } from '../state/game';
import { openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { burstFrom } from '../ui/fx';
import { landSound } from '../ui/sound';

const pl = (n: number, one: string) => `${n} ${n === 1 ? one : one + 's'}`;

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
                }
              }}
            >
              <span class="tt-e">{n.e}</span>
              <b>{n.n}</b>
              <small>{n.d}</small>
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
}
