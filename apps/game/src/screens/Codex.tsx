import { CODEX, codexCount } from '@whs/core';
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
      </div>
    </main>
  );
}
