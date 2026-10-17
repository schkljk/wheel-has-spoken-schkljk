import { useEffect, useState } from 'preact/hooks';
import { statPop, type StatChange } from '../state/game';
import { NS_META } from './FighterCard';
import { Icon } from './Icon';

/** Counts a number from a to b. */
function Roll({ a, b }: { a: number; b: number }) {
  const [v, setV] = useState(a);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      setV(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [a, b]);
  return <b>{v}</b>;
}

/** Every change to the fighter's real numbers pops up: old → new and the difference. */
export function StatPopHost() {
  const p = statPop.value;
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => {
      if (statPop.value === p) statPop.value = null;
    }, 3800);
    return () => clearTimeout(t);
  }, [p]);
  if (!p) return null;
  return (
    <button class="statpop" key={p.id} onClick={() => (statPop.value = null)} aria-live="polite">
      <b class="sp-h">📊 Stats changed</b>
      {p.rows.map((r: StatChange) => {
        const m = NS_META.find((x) => x[0] === r.k)!;
        const u = m[3] || '';
        const d = r.b - r.a;
        return (
          <span class={`sp-r ${d > 0 ? 'up' : 'down'}`} key={r.k}>
            <span>
              <Icon name={m[1]} /> {m[2]}
            </span>
            <span class="sp-v">
              <s>
                {r.a}
                {u}
              </s>{' '}
              → <Roll a={r.a} b={r.b} />
              {u}{' '}
              <em>
                {d > 0 ? '+' : '−'}
                {Math.abs(d)}
                {u}
              </em>
            </span>
          </span>
        );
      })}
    </button>
  );
}
