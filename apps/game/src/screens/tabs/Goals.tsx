import { useEffect } from 'preact/hooks';
import { ARCHS, COL_STEP, GOALS, MASTERY, MASTERY_RW, codexCount, goalCur, masteryLvl, rwText, seeGoals } from '@whs/core';
import { G, act, activeFighter, save } from '../../state/game';
import { openSheet } from '../../state/ui';
import { Sheet, rise } from '../../ui/kit';

type Goal = (typeof GOALS)[number];
function GoalRow({ g, done }: { g: Goal; done?: boolean }) {
  const c = Math.min(g.need, goalCur(G, g.k));
  const p = Math.round((c / g.need) * 100);
  return (
    <div class={`goal${done ? ' done' : ''}`}>
      <span class="g-e" aria-hidden="true">
        {done ? '✅' : g.e}
      </span>
      <div class="g-t">
        <b>{g.n}</b>
        <small>
          {g.d}. {rwText(g.rw)}
        </small>
        <div class="xpbar">
          <i style={{ width: `${p}%` }} />
        </div>
      </div>
      <span class="g-r">
        <small>
          {c}/{g.need}
        </small>
      </span>
    </div>
  );
}

function AllGoals() {
  const done = G.save.profile.goalsDone;
  return (
    <Sheet icon="target" title="All goals" sub={`${done.length} of ${GOALS.length} done`}>
      <div class="stack">
        {GOALS.map((g) => (
          <GoalRow key={g.k} g={g} done={done.includes(g.k)} />
        ))}
      </div>
    </Sheet>
  );
}
function AllMastery() {
  return (
    <Sheet icon="star" title="Class mastery" sub={`Win with a class to master it. Rewards at ${MASTERY.join(', ')} wins`}>
      <div class="mast-grid">
        {ARCHS.map((a) => {
          const l = masteryLvl(G, a.k);
          const w = G.save.profile.mastery[a.k] || 0;
          return (
            <div class={`mast${l >= 5 ? ' max' : ''}`} key={a.k}>
              <span aria-hidden="true">{a.e}</span>
              <b>{a.n}</b>
              <small>
                Level {l}, {w} wins
              </small>
              <span class="mast-pips">
                {MASTERY.map((_, i) => (
                  <i key={i} class={i < l ? 'on' : ''} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Permanent goals, class mastery and collection milestones: no timers, no resets. */
export function GoalsTab() {
  void save.value;
  // looking clears the tab's dot (upgrade 32)
  useEffect(() => {
    if (G.save.profile.extra.goalsSeen !== G.save.profile.goalsDone.length) act((g) => seeGoals(g));
  });
  const F = activeFighter.value!;
  const done = G.save.profile.goalsDone;
  const open = GOALS.filter((g) => !done.includes(g.k))
    .sort((a, b) => goalCur(G, b.k) / b.need - goalCur(G, a.k) / a.need)
    .slice(0, 6);
  const mk = F.arch.k;
  const ml = masteryLvl(G, mk);
  const mw = G.save.profile.mastery[mk] || 0;
  const next = MASTERY[ml];
  const { f, t } = codexCount(G);
  const nextCol = (Math.floor(f / COL_STEP) + 1) * COL_STEP;
  let n = 0;
  return (
    <div class="stack tab-stack">
      <span class="sec-label">
        Goals <small>{done.length} of {GOALS.length} done</small>
      </span>
      {open.length ? (
        open.map((g) => (
          <div key={g.k} {...rise(n++)}>
            <GoalRow g={g} />
          </div>
        ))
      ) : (
        <p class="hint">Every goal is done. Incredible.</p>
      )}
      <button class="btn ghost sm" onClick={() => openSheet(<AllGoals />)}>
        See all goals
      </button>
      <span class="sec-label">
        {F.arch.e} {F.arch.n} mastery
      </span>
      <div class="goal" {...rise(n++)}>
        <span class="g-e" aria-hidden="true">
          🎓
        </span>
        <div class="g-t">
          <b>Level {ml} of 5</b>
          <small>
            {next ? `${mw}/${next} wins with this class. Next: ${MASTERY_RW[ml]!.note || rwText(MASTERY_RW[ml]!)}` : 'Fully mastered'}
          </small>
          <div class="xpbar">
            <i style={{ width: `${next ? Math.round((mw / next) * 100) : 100}%` }} />
          </div>
        </div>
      </div>
      <button class="btn ghost sm" onClick={() => openSheet(<AllMastery />)}>
        All classes
      </button>
      <span class="sec-label">Collection</span>
      <div class="goal" {...rise(n++)}>
        <span class="g-e" aria-hidden="true">
          📚
        </span>
        <div class="g-t">
          <b>
            {f} of {t} found
          </b>
          <small>
            Every {COL_STEP} new entries: 💎3 🪙15. Next at {nextCol}
          </small>
          <div class="xpbar">
            <i style={{ width: `${Math.round(((f % COL_STEP) / COL_STEP) * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
