import { GEARK, gearCompare } from '@whs/core';
import { G } from '../state/game';
import { NS_META } from './stat-meta';
import { GearIcon, SlotIcon } from './GearIcon';
import { Icon } from './Icon';

/** Before a piece goes on (upgrade 28): now vs with it, every real number that moves, green up and red down. */
export function GearCompareView({ k }: { k: string }) {
  const x = GEARK[k]!;
  const c = gearCompare(G, k);
  const moved = c.rows.filter((r) => r.a !== r.b);
  return (
    <div class="gcmp">
      <div class="gc-head">
        <span class="gc-side">
          <span class="gc-i">{c.old ? <GearIcon g={c.old} /> : <SlotIcon slot={x.slot} />}</span>
          <small>Now</small>
          <b class="ellipsis">{c.old ? c.old.n : 'Nothing'}</b>
        </span>
        <span class="gc-arrow" aria-hidden="true">
          →
        </span>
        <span class="gc-side">
          <span class="gc-i">
            <GearIcon g={x} />
          </span>
          <small>New</small>
          <b class="ellipsis">{x.n}</b>
        </span>
      </div>
      {moved.length ? (
        <ul class="gc-rows">
          {moved.map((r) => {
            const m = NS_META.find((n) => n[0] === r.k)!;
            const u = m[3] || '';
            const d = r.b - r.a;
            return (
              <li key={r.k} class={d > 0 ? 'up' : 'down'}>
                <span class="gc-l">
                  <Icon name={m[1]} /> {m[2]}
                </span>
                <span class="gc-v">
                  {r.a}
                  {u} → <b>{r.b}{u}</b>{' '}
                  <em>
                    {d > 0 ? '+' : '−'}
                    {Math.abs(d)}
                    {u}
                  </em>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p class="gc-same">Your numbers stay the same. The difference is in what it does.</p>
      )}
      {c.gain.map((s) => (
        <div key={s.k} class="gc-syn up">
          ✨ Starts {s.e} <b>{s.n}</b>: {s.d}
        </div>
      ))}
      {c.lose.map((s) => (
        <div key={s.k} class="gc-syn down">
          ✖ Ends {s.e} <b>{s.n}</b>
        </div>
      ))}
      <div class="gc-fx">
        <small>
          <b>Now:</b> {c.old ? c.old.d : 'nothing in this slot'}
        </small>
        <small>
          <b>New:</b> {x.d}
        </small>
      </div>
    </div>
  );
}
