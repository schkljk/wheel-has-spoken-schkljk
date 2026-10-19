import { signal } from '@preact/signals';
import { BALANCE, CODEX, QN, SEASONAL_ARENAS, codexCount, codexFilterOn, filterCodex, matchText, seasonalNow, type CodexFilter } from '@whs/core';
import { G, save } from '../state/game';
import { openInfo } from '../state/ui';
import { ContentIcon } from '../ui/ContentIcon';
import { Chips, SearchBox } from '../ui/Filters';
import { Icon } from '../ui/Icon';

/** A synergy's key (the collection lists entries by name). */
const synKey = (it: object) => (it as { k?: string }).k;
// filters stay put while you look around (upgrade 30)
const cxf = signal<CodexFilter>({ show: 'all', q: null });
const cxCat = signal<string | null>(null);
const cxOpen = signal(false);

/** The collection: every race, class, weapon, power, gear, arena, title... found by your fighters. */
export function CodexScreen({ back }: { back: () => void }) {
  void save.value;
  const cc = codexCount(G);
  const seen = G.save.profile.seen;
  const f = cxf.value;
  const on = codexFilterOn(f) || cxCat.value != null;
  const nOn = [f.show && f.show !== 'all', f.q != null, cxCat.value != null].filter(Boolean).length;
  let shown = 0;
  return (
    <main class="screen codex-screen with-filters">
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
      <div class="pad cx-filters">
        <div class="row">
          <SearchBox label="Search the collection" placeholder="Search what you've found" value={f.text || ''} onInput={(text) => (cxf.value = { ...f, text })} />
          <button class={`btn ghost sm fbtn${nOn ? ' on' : ''}`} aria-expanded={cxOpen.value} onClick={() => (cxOpen.value = !cxOpen.value)}>
            Filters{nOn ? ` (${nOn})` : ''}
          </button>
        </div>
        {cxOpen.value && (
          <>
            <Chips
              label="Show"
              value={f.show === 'all' ? null : (f.show ?? null)}
              options={[
                ['found', 'Found'],
                ['missing', 'Still missing'],
              ]}
              onChange={(v) => (cxf.value = { ...f, show: v ?? 'all' })}
            />
            <Chips label="Tier" value={f.q ?? null} options={QN.map((n, i) => [i, n] as [number, string])} onChange={(q) => (cxf.value = { ...f, q })} />
            <Chips label="Category" value={cxCat.value} options={CODEX.map(([k, label]) => [k, label] as [string, string])} onChange={(k) => (cxCat.value = k)} />
          </>
        )}
      </div>
      <div class="scroll pad codex-body">
        {CODEX.map(([k, label, get]) => {
          if (cxCat.value && cxCat.value !== k) return null;
          const all = get();
          const s = seen[k] || [];
          const found = all.filter((x) => s.includes(x.key)).length;
          const list = on ? filterCodex(all, s, f) : all;
          if (on && !list.length) return null;
          shown += list.length;
          return (
            // about three tiles a row on a phone: the height a category starts from until it is first drawn
            <section class="cx-cat" key={k} style={{ containIntrinsicSize: `auto ${48 + Math.ceil(list.length / 3) * 44}px` }}>
              <h3>
                {label}
                <span>
                  {found} of {all.length}
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
                  ) : k === 'syn' && synKey(x.it) ? (
                    // an undiscovered synergy is a riddle (F6)
                    <button key={x.key} class={`tile unk riddle q${x.it.q == null ? 1 : x.it.q}`} onClick={() => openInfo(`riddle|${synKey(x.it)}`)}>
                      <span class="e">?</span>
                      <span class="t">
                        ???<small>Tap for a riddle</small>
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
        {on && !shown && <p class="hint cx-none">Nothing matches. Fewer words, or fewer filters. The collection is big, not psychic.</p>}
        {BALANCE.seasonal && (!cxCat.value || cxCat.value === 'arena') && f.show !== 'missing' && <SeasonalSection fought={seen.arena || []} text={f.text || ''} />}
      </div>
    </main>
  );
}

/** Calendar-themed arenas (upgrade 27): all shown, with when they come back, and not counted toward the total. */
function SeasonalSection({ fought, text }: { fought: string[]; text: string }) {
  const now = new Set(seasonalNow(G).map((a) => a.k));
  const list = SEASONAL_ARENAS.filter((a) => matchText([a.n, a.d, a.when], text));
  if (!list.length) return null;
  return (
    <section class="cx-cat cx-season">
      <h3>
        Seasonal arenas
        <span>Not counted. They come back every year</span>
      </h3>
      <div class="cx-grid">
        {list.map((a) => (
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
