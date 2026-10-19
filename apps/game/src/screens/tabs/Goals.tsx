import { useEffect } from 'preact/hooks';
import { ARCHS, BOUNTY_JOB_GEMS, BOUNTY_SWAP_GEMS, COL_STEP, ALL_GOALS as GOALS, MASTERY, MASTERY_RW, WHEEL, bountyBoard, bountiesDone, bountyJob, codexCount, dropJob, goalCur, goalsBySoonest, masteryLvl, rwText, seeGoals, swapBounty, takeJob } from '@whs/core';
import { G, act, activeFighter, ensure, save, toast } from '../../state/game';
import { confirm, openSheet } from '../../state/ui';
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

/** The slice a bounty's job fixes, in words: "your next fighter's race wheel lands on Pigeon". */
function jobText(b: ReturnType<typeof bountyBoard>[number]['b']) {
  const pin = b.pin!;
  const W = WHEEL[pin.w];
  const it = W && typeof W.items !== 'function' ? W.items.find((x) => (pin.n != null && x.n === pin.n) || (pin.k != null && (x as { k?: string }).k === pin.k)) : null;
  return `your next new fighter's ${W ? (typeof W.label === 'string' ? W.label : W.lc).toLowerCase() : pin.w} wheel lands on ${it?.n ?? pin.n ?? pin.k}`;
}

/**
 * A standing build challenge on the bounty board (F5): no timer, and swapping it for another costs a gem. It says
 * who on your roster fits it (H5), and its job can be taken (L1): its slice fixed on your next fighter's wheel.
 */
function BountyRow({ x }: { x: ReturnType<typeof bountyBoard>[number] }) {
  const gems = G.save.profile.gems || 0;
  const job = bountyJob(G);
  const mine = job?.k === x.b.k;
  const swap = async () => {
    if (!(await confirm({ title: 'Swap this bounty?', body: `"${x.b.n}" comes down and a new one goes up. Costs ${BOUNTY_SWAP_GEMS} 💎.`, yes: 'Swap it' }))) return;
    if (!act((g) => swapBounty(g, x.b.k))) toast('Not enough gems');
  };
  const take = async () => {
    const body = `For ${BOUNTY_JOB_GEMS} 💎, ${jobText(x.b)}. The rest of the wheels still spin as usual. Drop the job before then and the gems come back.`;
    if (!(await confirm({ title: 'Take the job?', body, yes: `Take it, ${BOUNTY_JOB_GEMS} 💎` }))) return;
    if (act((g) => takeJob(g, x.b.k))) toast('📌 The wheel takes requests. It charges in dignity');
    else toast('Not enough gems');
  };
  const drop = async () => {
    if (!(await confirm({ title: 'Drop the job?', body: `Your next fighter's wheels spin free again, and the ${BOUNTY_JOB_GEMS} 💎 come back.`, yes: 'Drop it' }))) return;
    act((g) => dropJob(g));
  };
  return (
    <div class="goal bounty">
      <span class="g-e" aria-hidden="true">
        {x.b.e}
      </span>
      <div class="g-t">
        <b>{x.b.n}</b>
        <small>
          💎 {x.b.gems}
          {x.need > 1 ? ` · ${x.cur}/${x.need}` : ''}
        </small>
        {x.fits.length > 0 && <small class="fits">Fits {x.fits.join(', ')}</small>}
        {mine && <small class="jobline">📌 Job taken: {jobText(x.b)}</small>}
        <small class="flav">{x.b.f}</small>
        {x.need > 1 && (
          <div class="xpbar">
            <i style={{ width: `${Math.round((x.cur / x.need) * 100)}%` }} />
          </div>
        )}
      </div>
      <span class="g-r b-acts">
        {mine ? (
          <button class="btn ghost sm" onClick={() => void drop()}>
            Drop job
          </button>
        ) : (
          x.b.pin &&
          !job && (
            <button class="btn ghost sm" disabled={gems < BOUNTY_JOB_GEMS} aria-label={`Take the job for "${x.b.n}", ${BOUNTY_JOB_GEMS} gems`} onClick={() => void take()}>
              Job
            </button>
          )
        )}
        <button class="btn ghost sm" disabled={gems < BOUNTY_SWAP_GEMS || mine} aria-label={`Swap "${x.b.n}" for another bounty, ${BOUNTY_SWAP_GEMS} gem`} onClick={() => void swap()}>
          Swap
        </button>
      </span>
    </div>
  );
}

function AllGoals() {
  const done = G.save.profile.goalsDone;
  return (
    <Sheet icon="target" title="All goals" sub={`${done.length} of ${GOALS.length} done`}>
      <div class="stack">
        {[...goalsBySoonest(G), ...GOALS.filter((g) => done.includes(g.k))].map((g) => (
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
  // the soonest done first, by fights still needed (not by percent)
  const open = goalsBySoonest(G).slice(0, 6);
  // the first look deals the board; after that it only changes when a bounty does
  const bounties = ensure((g) => bountyBoard(g), 'bounties');
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
        Bounty board <small>{bountiesDone(G)} done. No timers: a new one goes up when one comes down</small>
      </span>
      {bounties.map((x) => (
        <div key={x.b.k} {...rise(n++)}>
          <BountyRow x={x} />
        </div>
      ))}
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
