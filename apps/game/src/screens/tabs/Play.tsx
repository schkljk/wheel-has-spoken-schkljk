import { useEffect } from 'preact/hooks';
import { CHAPTERS, TIERS_T, baseOpen, coinsOf, dailyReady, dailyText, hpTxt, maxGrit, myNemesis, rushOpen, runSummary, tierUnlocked, type Story } from '@whs/core';
import { G, act, activeFighter, ensure } from '../../state/game';
import { Icon } from '../../ui/Icon';
import { Inf } from '../../ui/Info';
import { rise } from '../../ui/kit';
import { goMap } from '../../flows/nav';
import { openBag } from '../../flows/story';
import { abandon, challengeFlow, dailyFlow, dailyWheel, openClub, resumeRun, rushFlow, startTier } from '../../flows/modes';
import { openBaseShop } from '../../flows/shop';
import { openPatchNotes } from '../../sheets/Records';
import { go } from '../../state/game';

/** Every way to play, in one place: the story first, then the modes, cups and the gauntlet. */
export function PlayTab() {
  const F = activeFighter.value!;
  useEffect(() => {
    const pn = G.save.profile.patchNotes as { unseen?: boolean } | null;
    if (pn && pn.unseen) openPatchNotes();
  }, []);
  const S = F.story as Story | null;
  const ch = S ? S.ch : 1;
  const C = CHAPTERS[ch - 1]!;
  const run = runSummary(G);
  const NM = ensure((g) => myNemesis(g));
  const chal = F.challenge as { kind: string; name: string } | null;
  const open = rushOpen(G);
  const act2 = !!(S && (S.cleared || []).includes(11));
  let n = 0;
  return (
    <div class="stack tab-stack">
      <div class="card story-card" data-rise="" style={{ ...rise(n++).style, '--ch': C.col } as Record<string, string>}>
        <div class="row">
          <span class="story-e" aria-hidden="true">
            {C.e}
          </span>
          <span class="grow">
            <small>
              Story, chapter {ch} of {CHAPTERS.length}
              {S && S.ng ? `, encore ${S.ng}` : ''}
            </small>
            <h3>{C.n}</h3>
          </span>
        </div>
        {S && (
          <div class="sc-prog" aria-hidden="true">
            {S.rows.map((_, i) => (
              <i key={i} class={i < S.row ? 'd' : i === S.row ? 'c' : ''} />
            ))}
          </div>
        )}
        <small>
          HP {hpTxt(G, S ? S.hp : 100)}. {(F.lvl || 1) < C.lvl && <span class="reclvl">Recommended level {C.lvl}, you are {F.lvl || 1}. </span>}
          {'❤️'.repeat(Math.max(0, S ? S.grit : maxGrit(G)))}
          {'🖤'.repeat(Math.max(0, maxGrit(G) - (S ? S.grit : maxGrit(G))))}
        </small>
        <button class="btn block" onClick={() => goMap()}>
          {!S || (S.row === 0 && !S.seenIntro) ? 'Start the chapter' : 'Continue the story'}
        </button>
        <div class="row">
          <button class="btn ghost sm grow" onClick={() => openBag()}>
            <Icon name="bag" /> Bag
          </button>
          <button class="btn ghost sm grow" onClick={() => go({ screen: 'title' })}>
            <Icon name="people" /> Your fighters
          </button>
        </div>
      </div>
      {chal && (
        <div class="card challenge" {...rise(n++)}>
          <b>⚔️ {chal.kind === 'legend' ? 'A hall of fame legend wants to test you' : 'An old rival wants a rematch'}</b>
          <span>
            {chal.name}
            {chal.kind === 'legend' ? ' 👑' : ' 😈'}
          </span>
          <div class="row">
            <button class="btn sm grow" onClick={() => void challengeFlow()}>
              Accept the challenge
            </button>
            <button class="btn ghost sm" onClick={() => act((g) => (g.F!.challenge = null))}>
              Not now
            </button>
          </div>
        </div>
      )}
      {dailyReady(G) && (
        <button class="btn daily block" onClick={() => void dailyWheel()} {...rise(n++)}>
          🎁 Your daily wheel is ready
        </button>
      )}
      {NM && (
        <Inf k="rule|nemesis" class="nem card">
          😈 Nemesis: <b>{NM.f.name}</b> has beaten you {NM.beats === 1 ? 'once' : `${NM.beats} times`}. They'll show up in your next tournament, a level stronger each time they win.
        </Inf>
      )}
      <span class="sec-label">More ways to play</span>
      <button class="card tap mode" onClick={() => void dailyFlow()} {...rise(n++)}>
        <Icon name="calendar" class="lg" />
        <span class="grow">
          <b>Daily challenge</b>
          <small>{dailyText(G)}. One fight, one twist, zero refunds</small>
        </span>
      </button>
      <button class={`card tap mode${open ? '' : ' locked'}`} onClick={() => void rushFlow()} {...rise(n++)}>
        <Icon name="skull" class="lg" />
        <span class="grow">
          <b>Boss rush</b>
          <small>
            {open
              ? `${act2 ? 'Act II' : 'Act I'} bosses back to back. Best: ${G.save.profile.rushBest || 0}/10`
              : 'Beat chapter 2 or reach level 10. Bosses do not do walk-ins'}
          </small>
        </span>
      </button>
      <button class="card tap mode" onClick={() => openClub()} {...rise(n++)}>
        <Icon name="dice" class="lg" />
        <span class="grow">
          <b>Fight club</b>
          <small>Bet on strangers. Lose money with friends</small>
        </span>
      </button>
      <button class="card tap mode" onClick={() => openBaseShop()} {...rise(n++)}>
        <Icon name="cart" class="lg" />
        <span class="grow">
          <b>Base shop</b>
          <small>{baseOpen(G) ? 'Supplies, one daily deal, gear priced like rent' : 'Closed. Finish the chapter, then shop'}</small>
        </span>
      </button>
      <span class="sec-label">Cups and the gauntlet</span>
      {run && (
        <div class="card resume" {...rise(n++)}>
          <b>
            {run.e} {run.n} in progress
          </b>
          <small>{run.sub}</small>
          <div class="row">
            <button class="btn sm grow" onClick={() => resumeRun()}>
              Resume
            </button>
            <button class="btn ghost sm" onClick={() => void abandon()}>
              Abandon it
            </button>
          </div>
        </div>
      )}
      {TIERS_T.map((t) => {
        const ok = tierUnlocked(t, F) && !run;
        const def = F.belts && F.belts[t.k];
        const reward = t.size ? `Win it: ${t.coins} 🪙${def ? '. You hold this belt' : ''}` : `Your best: ${F.gbest || 0} in a row`;
        return (
          <button key={t.k} class={`card tap mode tier${ok ? '' : ' locked'}`} disabled={!ok} onClick={() => startTier(t.k)} {...rise(n++)}>
            <span class="te" aria-hidden="true">
              {t.e}
            </span>
            <span class="grow">
              <b>
                {t.n}
                {def ? ' (defending)' : ''}
              </b>
              <small>{ok ? t.d : run && tierUnlocked(t, F) ? 'Finish or abandon the current one first' : t.lock}</small>
              {ok && <small>{reward}</small>}
            </span>
          </button>
        );
      })}
      <small class="center hint">🪙 {coinsOf(G)} to spend</small>
    </div>
  );
}
