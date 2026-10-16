import { ARCHS, GOALS, MASTERY } from '@whs/core';
import { save } from '../../state/game';
import { Icon } from '../../ui/Icon';
import { rise } from '../../ui/kit';

export function GoalsTab() {
  const p = save.value.profile;
  const done = new Set(p.goalsDone);
  const mastered = Object.entries(p.mastery)
    .map(([k, wins]) => ({ a: ARCHS.find((x) => x.k === k), wins, lvl: MASTERY.filter((m) => wins >= m).length }))
    .filter((x) => x.a)
    .sort((x, y) => y.wins - x.wins);
  let n = 0;
  return (
    <div class="stack tab-stack">
      <div class="card" {...rise(n++)}>
        <b>
          {done.size} of {GOALS.length} goals done
        </b>
        <small style={{ display: 'block' }}>Progress counting returns with the fights in the next update</small>
      </div>
      {mastered.length > 0 && (
        <>
          <span class="sec-label">Class mastery</span>
          {mastered.map((m) => (
            <div class="card row" key={m.a!.k} {...rise(n++)}>
              <span aria-hidden="true">{m.a!.e}</span>
              <span class="grow">
                <b>{m.a!.n}</b>
                <small style={{ display: 'block' }}>
                  {m.wins} wins · mastery {m.lvl} of {MASTERY.length}
                </small>
              </span>
            </div>
          ))}
        </>
      )}
      <span class="sec-label">Goals</span>
      {GOALS.map((g) => (
        <div class={`card row goal${done.has(g.k) ? ' done' : ''}`} key={g.k} {...rise(n++)}>
          <span aria-hidden="true">{g.e}</span>
          <span class="grow">
            <b>{g.n}</b>
            <small style={{ display: 'block' }}>{g.d}</small>
          </span>
          <span class="row" style={{ gap: '0.25rem' }}>
            {done.has(g.k) ? (
              <Icon name="check" label="Done" />
            ) : (
              <>
                {g.rw.gems ? (
                  <span class="chip">
                    <Icon name="gem" /> {g.rw.gems}
                  </span>
                ) : null}
                {g.rw.coins ? (
                  <span class="chip">
                    <Icon name="coin" /> {g.rw.coins}
                  </span>
                ) : null}
                {g.rw.legacy ? (
                  <span class="chip">
                    <Icon name="legacy" /> {g.rw.legacy}
                  </span>
                ) : null}
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
