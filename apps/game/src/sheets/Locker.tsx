import { useEffect, useRef } from 'preact/hooks';
import { COSMETICS, COSMETIC_KINDS, buyCosmetic, fullName, owns, wearCosmetic, worn, type Cosmetic } from '@whs/core';
import { G, act, save, toast } from '../state/game';
import { confirm } from '../state/ui';
import { burst, burstFrom } from '../ui/fx';
import { Sheet, rise } from '../ui/kit';
import { WheelStage } from '../WheelStage';

/** How it looks before you buy it (review H7): a wheel wearing it, its confetti thrown, your name on the plate. */
function Preview({ c }: { c: Cosmetic }) {
  const at = useRef<HTMLDivElement>(null);
  const throwIt = () => {
    const r = at.current?.getBoundingClientRect();
    if (r) burst(r.left + r.width / 2, r.top + r.height / 2, 26, c.col);
  };
  useEffect(() => {
    if (c.kind === 'confetti') setTimeout(throwIt, 250);
  }, []);
  if (c.kind === 'rim' || c.kind === 'charm')
    return (
      <div class="lk-prev">
        <WheelStage small rim={c.kind === 'rim' ? (c.col ?? null) : undefined} charm={c.kind === 'charm' ? c.e : undefined} />
      </div>
    );
  if (c.kind === 'plate')
    return (
      <div class="lk-prev">
        <div class="fc-name mine lk-plate" style={{ '--plate-bg': c.col?.[0], '--plate-ink': c.col?.[1] } as Record<string, string>} data-plate={c.k}>
          {G.F ? fullName(G.F) : 'Your name here'}
        </div>
      </div>
    );
  return (
    <div class="lk-prev" ref={at}>
      <button class="btn ghost sm" onClick={throwIt}>
        {c.e} Throw it again
      </button>
    </div>
  );
}

/**
 * The locker (review F11): earned cosmetics for gems. Wheel rims, pointer charms, victory confetti and
 * nameplates. Pure looks: nothing here changes a fight, and gems only come from playing.
 */
export function LockerSheet() {
  void save.value;
  const gems = G.save.profile.gems || 0;
  const buy = async (c: Cosmetic) => {
    // the question shows it on: a wheel wearing it, its confetti, your name on the plate (H7)
    const can = gems >= c.gems;
    const ok = await confirm({
      title: can ? `Buy ${c.n}?` : c.n,
      body: can ? `${c.gems} 💎 of your ${gems}. It goes on right away, and you can swap it any time.` : `${c.gems} 💎. You have ${gems}: ${c.gems - gems} more to go.`,
      extra: <Preview c={c} />,
      yes: can ? `Buy for ${c.gems} 💎` : 'Nice',
      no: can ? 'Not now' : undefined,
    });
    if (!ok || !can) return;
    if (!act((g) => buyCosmetic(g, c.k))) return toast('Not enough gems');
    if (c.kind === 'confetti') burstFrom(document.querySelector('.locker-item.on'));
    toast(`${c.e} ${c.n} is yours`);
  };
  let n = 0;
  return (
    <Sheet emoji="🧳" title="Locker" sub={`You have ${gems} 💎. Looks only: nothing here changes a fight`}>
      <div class="stack">
        {COSMETIC_KINDS.map(([kind, label, sub]) => {
          const on = worn(G, kind);
          return (
            <section key={kind} class="stack">
              <span class="sec-label">
                {label} <small>{sub}</small>
              </span>
              <div class="locker-grid">
                {COSMETICS.filter((c) => c.kind === kind).map((c) => {
                  const mine = owns(G, c.k);
                  const wearing = on?.k === c.k;
                  return (
                    <div key={c.k} class={`locker-item${wearing ? ' on' : ''}`} {...rise(n++)}>
                      <span class="lk-e" aria-hidden="true">
                        {c.e}
                      </span>
                      <b class="ellipsis">{c.n}</b>
                      {c.col && (
                        <span class="lk-sw" aria-hidden="true">
                          {c.col.map((x) => (
                            <i key={x} style={{ background: x }} />
                          ))}
                        </span>
                      )}
                      <small class="flav">{c.f}</small>
                      {wearing ? (
                        <button class="btn ghost sm" onClick={() => act((g) => wearCosmetic(g, kind, null))}>
                          Take it off
                        </button>
                      ) : mine ? (
                        <button class="btn sm" onClick={() => act((g) => wearCosmetic(g, kind, c.k))}>
                          Wear it
                        </button>
                      ) : (
                        // tapping the price shows it on first, affordable or not (H7)
                        <button class={`btn sm${gems < c.gems ? ' ghost' : ''}`} aria-label={`${c.n}: look, ${c.gems} gems`} onClick={() => void buy(c)}>
                          {c.gems} 💎
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}
