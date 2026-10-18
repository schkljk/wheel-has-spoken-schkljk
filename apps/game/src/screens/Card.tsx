import { buildSummary, ctxOf, enterCareer, type CareerFighter, type SumLine } from '@whs/core';
import { G, act, go } from '../state/game';
import { confirm } from '../state/ui';
import { rise } from '../ui/kit';
import { FighterCard } from '../ui/FighterCard';
import { Icon } from '../ui/Icon';
import { goHub } from '../flows/nav';

/** The finished fighter: keep them (start a career) or scrap them. */
export function CardScreen({ f }: { f: CareerFighter }) {
  return (
    <main class="screen card-screen">
      <header class="bar pad row">
        <span class="grow">
          <small>The wheel has spoken</small>
          <h2 class="ellipsis">Meet your fighter</h2>
        </span>
      </header>
      <div class="scroll pad card-body">
        <ScoutingReport f={f} />
        <FighterCard f={f} />
      </div>
      <footer class="dock pad">
        <button
          class="btn block"
          onClick={() => {
            act((g) => enterCareer(g, f));
            void goHub();
          }}
        >
          <Icon name="check" /> Start their career
        </button>
        <button
          class="btn ghost block"
          onClick={async () => {
            if (await confirm({ title: `Scrap ${f.name}?`, body: 'They go back into the wheel. Every spin is lost.', yes: 'Scrap them', danger: true })) go({ screen: 'title' });
          }}
        >
          Scrap them
        </button>
      </footer>
    </main>
  );
}

/** The build in plain words (upgrade 29): three strengths, the biggest weakness and the best synergy, with jokes. */
function ScoutingReport({ f }: { f: CareerFighter }) {
  const r = buildSummary(f, ctxOf(G));
  let n = 0;
  const line = (cls: string, l: SumLine, label?: string) => (
    <li class={`sr-l ${cls}`} key={cls + l.k} {...rise(n++)}>
      <span class="sr-e" aria-hidden="true">
        {l.e}
      </span>
      <span class="sr-t">
        <b>
          {label}
          {l.n}.
        </b>{' '}
        {l.what}
        <i class="flav">{l.joke}</i>
      </span>
    </li>
  );
  return (
    <section class="card scout" aria-label="Scouting report">
      <h3>📋 Scouting report</h3>
      <ul class="sr-list">
        {r.strengths.map((l) => line('good', l))}
        {line('bad', r.weakness, 'Biggest weakness: ')}
        {r.synergy ? (
          line('syn', r.synergy, 'Best synergy: ')
        ) : (
          <li class="sr-l syn" {...rise(n++)}>
            <span class="sr-e" aria-hidden="true">
              🧩
            </span>
            <span class="sr-t">
              <b>Best synergy:</b> {r.noSyn}
            </span>
          </li>
        )}
      </ul>
      <p class="sr-close">{r.closer}</p>
    </section>
  );
}
