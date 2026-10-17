import { CHAPTERS } from '@whs/core';
import { activeFighter } from '../../state/game';
import { goMap } from '../../flows/nav';
import { Icon, type IconName } from '../../ui/Icon';
import { rise } from '../../ui/kit';

const OLD_VERSION = `${import.meta.env.BASE_URL}legacy/`;

// Every way to play, in one place. They light up as the screens are ported (next update).
const MODES: [IconName, string, string][] = [
  ['calendar', 'Daily challenge', 'One fight, one twist, zero refunds'],
  ['skull', 'Boss rush', 'Every boss you have met, back to back'],
  ['dice', 'Fight club', 'Bet on fights you are not in. Morally flexible'],
  ['cart', 'Base shop', 'Supplies, one daily deal, gear priced like rent'],
  ['cup', 'Cups', 'Local, Regional and the World championship'],
  ['bolt', 'The gauntlet', 'Fight until you lose. It gets worse'],
];

export function PlayTab() {
  const f = activeFighter.value!;
  const st = f.story;
  const ch = st ? CHAPTERS[st.ch - 1] : CHAPTERS[0];
  let n = 0;
  return (
    <div class="stack tab-stack">
      <div class="card story-card" {...rise(n++)}>
        <div class="row">
          <span class="story-e" aria-hidden="true">
            {ch?.e}
          </span>
          <span class="grow">
            <small>Story, chapter {st?.ch ?? 1} of {CHAPTERS.length}</small>
            <h3>{ch?.n}</h3>
          </span>
        </div>
        {st ? (
          <small>
            HP {Math.round(st.hp)}% · {st.grit} grit · stage {st.row + 1} of {st.rows.length}
          </small>
        ) : (
          <small>Not started. The alley is waiting</small>
        )}
        <button class="btn block" onClick={() => goMap()}>
          {st && (st.row > 0 || st.seenIntro) ? 'Continue the story' : 'Start the chapter'}
        </button>
      </div>
      <span class="sec-label">More ways to play</span>
      {MODES.map(([icon, name, sub]) => (
        <div class="card soon row" key={name} {...rise(n++)}>
          <Icon name={icon} class="lg" />
          <span class="grow">
            <b>{name}</b>
            <small style={{ display: 'block' }}>{sub}</small>
          </span>
          <span class="tag">Soon</span>
        </div>
      ))}
      <a class="btn ghost block" href={OLD_VERSION} {...rise(n++)}>
        Play all of it in the current version
      </a>
    </div>
  );
}
