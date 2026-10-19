import { COSMETICS, COSMETIC_KINDS, buyCosmetic, owns, wearCosmetic, worn, type Cosmetic } from '@whs/core';
import { G, act, save, toast } from '../state/game';
import { confirm } from '../state/ui';
import { burst } from '../ui/fx';
import { Sheet, rise } from '../ui/kit';

/**
 * The locker (review F11): earned cosmetics for gems. Wheel rims, pointer charms, victory confetti and
 * nameplates. Pure looks: nothing here changes a fight, and gems only come from playing.
 */
export function LockerSheet() {
  void save.value;
  const gems = G.save.profile.gems || 0;
  const buy = async (c: Cosmetic) => {
    if (!(await confirm({ title: `Buy ${c.n}?`, body: `${c.gems} 💎 of your ${gems}. It goes on right away, and you can swap it any time.`, yes: `Buy for ${c.gems} 💎` }))) return;
    if (!act((g) => buyCosmetic(g, c.k))) return toast('Not enough gems');
    if (c.kind === 'confetti') burst();
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
                        <button class="btn sm" disabled={gems < c.gems} onClick={() => void buy(c)}>
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
