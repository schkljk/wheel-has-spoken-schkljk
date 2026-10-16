import { TUT } from '@whs/core';
import { commit } from '../state/game';
import { cine, closeSheet } from '../state/ui';

// The legacy tour still said "Five chapters" after the story grew to twenty; that line is corrected here.
const PAGES = TUT.map(([e, t, d]) => [e, t, d.replace('Five chapters, each', 'Twenty chapters in two acts, each')] as const);

function Page({ i }: { i: number }) {
  const [e, t, d] = PAGES[i]!;
  const last = i === PAGES.length - 1;
  const done = () => {
    cine.value = null;
    commit((s) => (s.settings.tutorialSeen = true));
  };
  return (
    <div class="cine-card" key={i}>
      <div class="cine-kicker">
        How to play, {i + 1} of {PAGES.length}
      </div>
      <div class="cine-emoji" aria-hidden="true">
        {e}
      </div>
      <h2>{t}</h2>
      <p>{d}</p>
      <div class="dots" aria-hidden="true">
        {PAGES.map((_, k) => (
          <i key={k} class={k === i ? 'on' : ''} />
        ))}
      </div>
      <button class="btn block" onClick={() => (last ? done() : (cine.value = <Page i={i + 1} />))}>
        {last ? "Let's go" : 'Next'}
      </button>
      {!last && (
        <button class="btn ghost sm" onClick={done}>
          Skip the tour
        </button>
      )}
    </div>
  );
}

export function startTutorial() {
  closeSheet();
  cine.value = <Page i={0} />;
}
