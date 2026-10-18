import { BALANCE, CODEX, SEASONAL_ARENAS, codexCount, seasonalNow } from '@whs/core';
import { G, save } from '../state/game';
import { openInfo } from '../state/ui';
import { ContentIcon } from '../ui/ContentIcon';
import { Icon } from '../ui/Icon';

/** The collection: every race, class, weapon, power, gear, arena, title... found by your fighters. */
export function CodexScreen({ back }: { back: () => void }) {
  void save.value;
  const cc = codexCount(G);
  const seen = G.save.profile.seen;
  return (
    <main class="screen codex-screen">
      <header class="bar pad row">
        <button class="iconbtn" aria-label="Back" onClick={back}>
          <Icon name="back" />
        </button>
        <span class="grow">
          <h2>Collection</h2>
          <small>
            {cc.f} of {cc.t} found. Undiscovered slices get a small odds boost
          </small>
        </span>
      </header>
      <div class="scroll pad codex-body">
        {CODEX.map(([k, label, get]) => {
          const list = get();
          const s = seen[k] || [];
          const found = list.filter((x) => s.includes(x.key)).length;
          return (
            <section class="cx-cat" key={k}>
              <h3>
                {label}
                <span>
                  {found} of {list.length}
                </span>
              </h3>
              <div class="cx-grid">
                {list.map((x) =>
                  s.includes(x.key) ? (
                    <button key={x.key} class={`tile q${x.it.q == null ? 1 : x.it.q}`} onClick={() => openInfo(k === 'moves' ? `mv|${x.it.n}` : `it|${k}|${x.key}`)}>
                      <span class="e">
                        <ContentIcon cat={k} name={x.key} e={x.it.e} />
                      </span>
                      <span class="t">
                        {x.it.n}
                        {x.par && <small>{x.par}</small>}
                      </span>
                    </button>
                  ) : (
                    <div key={x.key} class={`tile unk q${x.it.q == null ? 1 : x.it.q}`}>
                      <span class="e">?</span>
                      <span class="t">
                        ???{x.par && <small>{x.par}</small>}
                        {k === 'ach' && <small>{x.it.d}</small>}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          );
        })}
        {BALANCE.seasonal && <SeasonalSection fought={seen.arena || []} />}
      </div>
    </main>
  );
}

/** Calendar-themed arenas (upgrade 27): all shown, with when they come back, and not counted toward the total. */
function SeasonalSection({ fought }: { fought: string[] }) {
  const now = new Set(seasonalNow(G).map((a) => a.k));
  return (
    <section class="cx-cat cx-season">
      <h3>
        Seasonal arenas
        <span>Not counted. They come back every year</span>
      </h3>
      <div class="cx-grid">
        {SEASONAL_ARENAS.map((a) => (
          <button key={a.k} class={`tile q${a.q}${now.has(a.k) ? ' now' : ''}${fought.includes(a.n) ? '' : ' unfought'}`} onClick={() => openInfo(`it|arena|${a.n}`)}>
            <span class="e">{a.e}</span>
            <span class="t">
              {a.n}
              <small>{now.has(a.k) ? 'In season now' : a.when}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
