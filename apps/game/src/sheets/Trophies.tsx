import { trophyShelves } from '@whs/core';
import { G, ensure } from '../state/game';
import { openSheet } from '../state/ui';
import { Inf } from '../ui/Info';
import { Sheet, rise } from '../ui/kit';

const times = (n: number) => (n === 1 ? 'once' : `×${n}`);

/** The trophy room (upgrade 23): what every fighter has won, as shelves, with silhouettes for what's left. */
export function openTrophies() {
  const s = ensure((g) => trophyShelves(g));
  const bosses = s.bosses.filter((b) => b.won).length;
  const titles = s.titles.filter((t) => t.won).length;
  const classes = s.classes.filter((c) => c.lvl > 0);
  const mastered = classes.filter((c) => c.lvl >= c.max).length;
  let i = 0;
  const pop = () => rise(i++);
  openSheet(
    <Sheet icon="cup" title="Trophy room" sub="Everything your fighters have won. Dust not included">
      <div class="stack trophies">
        <span class="sec-label">Belts</span>
        <div class="shelf belts">
          {s.belts.map((b) => (
            <div key={b.k} class={`trophy${b.won ? '' : ' locked'}`} {...pop()}>
              <span class="tr-e">{b.won ? b.e : '❔'}</span>
              <b>{b.n}</b>
              <small>{b.won ? `${times(b.won.n)}, first by ${b.won.who}` : 'Not yet'}</small>
            </div>
          ))}
        </div>
        <span class="sec-label">
          Boss kills ({bosses} of {s.bosses.length})
        </span>
        <div class="shelf heads">
          {s.bosses.map((b) => (
            <div key={b.ch} class={`trophy head${b.won ? '' : ' locked'}`} title={b.won ? `${b.n}, ${b.title}` : `Chapter ${b.ch}`} {...pop()}>
              <span class="tr-e">{b.won ? b.e : '❔'}</span>
              <small>{b.won ? b.n : `Ch ${b.ch}`}</small>
              {b.won && b.won.n > 1 ? <em class="tr-n">×{b.won.n}</em> : null}
            </div>
          ))}
        </div>
        <span class="sec-label">
          Rare titles ({titles} of {s.titles.length})
        </span>
        <div class="shelf titles">
          {s.titles.map((t) =>
            t.won ? (
              <Inf key={t.k} k={`it|ach|${t.n}`} class="trophy" label={t.n}>
                <span class="tr-e">{t.e}</span>
                <small>{t.n}</small>
              </Inf>
            ) : (
              <div key={t.k} class="trophy locked" title={t.d} {...pop()}>
                <span class="tr-e">❔</span>
                <small>???</small>
              </div>
            ),
          )}
        </div>
        <span class="sec-label">
          Class mastery ({mastered} mastered, {classes.length} started)
        </span>
        {classes.length ? (
          <div class="shelf classes">
            {classes.map((c) => (
              <Inf key={c.k} k={`it|arch|${c.n}`} class={`trophy${c.lvl >= c.max ? ' gold' : ''}`} label={c.n}>
                <span class="tr-e">{c.e}</span>
                <small>{c.n}</small>
                <span class="tr-pips" aria-label={`Mastery ${c.lvl} of ${c.max}`}>
                  {Array.from({ length: c.max }, (_, k) => (
                    <i key={k} class={k < c.lvl ? 'on' : ''} />
                  ))}
                </span>
              </Inf>
            ))}
          </div>
        ) : (
          <p class="hint">Win 5 fights with a class to put it on this shelf. Win 100 to make it gold.</p>
        )}
        {G.save.roster.retired.length === 0 && bosses === 0 ? <p class="hint">An empty room echoes. Go win something.</p> : null}
      </div>
    </Sheet>,
  );
}
