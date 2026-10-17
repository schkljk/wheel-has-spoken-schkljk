import { enterCareer, type CareerFighter } from '@whs/core';
import { act, go } from '../state/game';
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
        <button class="btn ghost block" onClick={() => go({ screen: 'title' })}>
          Scrap them
        </button>
      </footer>
    </main>
  );
}
