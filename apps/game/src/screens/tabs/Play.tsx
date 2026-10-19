import { useEffect } from 'preact/hooks';
import { BALANCE, CHAPTERS, TIERS_T, exhibitionLegends, hardChapters, hardMutator, seasonNews, TOWER_FROM, towerBest, towerOpen, baseOpen, dailyReady, dailyText, duelText, TRIAL_COUNT, TRIAL_FROM, trialsCleared, trialsOpen, goalCur, goalsBySoonest, hpTxt, maxGrit, myNemesis, rushOpen, runSummary, tierUnlocked, type Story } from '@whs/core';
import { G, act, activeFighter, ensure, toast } from '../../state/game';
import { ChapterIcon } from '../../art/ChapterIcon';
import { Icon } from '../../ui/Icon';
import { Hearts } from '../../ui/Hearts';
import { Inf } from '../../ui/Info';
import { rise } from '../../ui/kit';
import { goHub, goMap } from '../../flows/nav';
import { openBag } from '../../flows/story';
import { abandon, challengeFlow, dailyFlow, dailyWheel, hardFlow, leaveHard, openClub, openDuel, openTrials, resumeRun, rushFlow, startTier, towerFlow } from '../../flows/modes';
import { openBaseShop } from '../../flows/shop';
import { openPatchNotes } from '../../sheets/Records';
import { sfx } from '../../ui/sound';

interface Mode {
  n: string;
  icon: string;
  st: string;
  fl: string;
  locked?: boolean;
  go: () => void;
}

/** Every way to play, in one place: the story first, then the modes as tiles, cups and the gauntlet. */
export function PlayTab() {
  const F = activeFighter.value!;
  useEffect(() => {
    const pn = G.save.profile.patchNotes as { unseen?: boolean } | null;
    if (pn && pn.unseen) openPatchNotes();
    // a seasonal arena on the wheel (upgrade 27): said once a season
    const news = act((g) => seasonNews(g));
    if (news) toast(news);
  }, []);
  const S = F.story as Story | null;
  const ch = S ? S.ch : 1;
  const C = CHAPTERS[ch - 1]!;
  const run = runSummary(G);
  const NM = ensure((g) => myNemesis(g));
  const NG = goalsBySoonest(G)[0];
  const chal = F.challenge as { kind: string; name: string } | null;
  const open = rushOpen(G);
  const act2 = !!(S && (S.cleared || []).includes(11));
  // a hard run of a cleared chapter (upgrade 26) takes the story card's place until it ends
  const HM = S && S.hard ? hardMutator(G) : null;
  const HC = hardChapters(G);
  let n = 0;
  const rushBest = G.save.profile.rushBest || 0;
  const tb = towerBest(G).floor;
  const hardDone = HC.filter((c) => c.done).length;
  const cta = S && S.hard ? (S.row === 0 && !S.seenIntro ? 'Start on hard' : 'Continue on hard') : !S || (S.row === 0 && !S.seenIntro) ? 'Start the chapter' : 'Continue the story';
  const modes: Mode[] = [
    { n: 'Daily challenge', icon: 'calendar', st: dailyText(G), fl: 'One twist, zero refunds', go: () => void dailyFlow() },
    { n: 'Daily duel', icon: 'sword', st: duelText(G), fl: 'Same fighters. Same dice. Different excuses', go: () => openDuel() },
    {
      n: 'Wheelborn trials',
      icon: 'swirl',
      locked: !trialsOpen(G),
      st: trialsOpen(G) ? `${trialsCleared(G)} of ${TRIAL_COUNT} remixes beaten` : `Level ${TRIAL_FROM} or the whole story`,
      fl: trialsOpen(G) ? 'Old bosses, new tricks, worse attitudes' : 'The wheel is saving the weird stuff for later',
      go: () => openTrials(),
    },
    {
      n: 'Boss rush',
      icon: 'skull',
      locked: !open,
      st: open ? `${act2 ? 'Act II' : 'Act I'} bosses. Best ${rushBest}/10` : 'Chapter 2 or level 10',
      fl: open ? 'Back to back, no snacks' : 'Bosses do not do walk-ins',
      go: () => void rushFlow(),
    },
    {
      n: 'Endless tower',
      icon: 'tower',
      locked: !towerOpen(G),
      st: towerOpen(G) ? `Best: floor ${F.towerBest || 0}${tb ? `. Record ${tb}` : ''}` : `Level ${TOWER_FROM} or chapter 1`,
      fl: towerOpen(G) ? 'A new twist every five floors' : 'The stairs are judging you',
      go: () => void towerFlow(),
    },
    {
      n: 'Hard mode',
      icon: 'flame',
      locked: !HC.length,
      st: S && S.hard ? `On it: chapter ${ch}` : HC.length ? `${hardDone} of ${HC.length} beaten on hard` : 'Clear a chapter first',
      fl: 'Same chapter, worse day, better loot',
      go: () => hardFlow(),
    },
    { n: 'Fight club', icon: 'dice', st: 'Bet on strangers', fl: 'Lose money with friends', go: () => openClub() },
    {
      n: 'Exhibition',
      icon: 'star',
      locked: exhibitionLegends(G).length < 2,
      st: exhibitionLegends(G).length < 2 ? 'Needs two hall of fame legends' : 'Legends fight for pride', fl: 'With commentary. Nobody gets paid', go: () => void import('../../flows/exhibition').then((m) => m.openExhibition()) },
    {
      n: 'Base shop',
      icon: 'cart',
      locked: !baseOpen(G),
      st: baseOpen(G) ? 'Supplies and a daily deal' : 'Opens after this chapter',
      fl: 'Gear priced like rent',
      go: () => openBaseShop(),
    },
  ];
  return (
    <div class="stack tab-stack">
      <div class={`card story-card${S && S.hard ? ' hard' : ''}`} data-rise="" style={{ ...rise(n++).style, '--ch': C.col } as Record<string, string>}>
        <div class="sc-head">
          <span class="story-e" aria-hidden="true">
            <ChapterIcon ch={ch} />
          </span>
          <span class="grow">
            <small class="sc-kick">
              {S && S.hard ? `Hard mode, chapter ${ch}` : `Story, chapter ${ch} of ${CHAPTERS.length}`}
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
        <div class="sc-stats">
          <span class="sc-hp">
            <Icon name="heart" /> HP {hpTxt(G, S ? S.hp : 100)}
          </span>
          <Hearts n={S ? S.grit : maxGrit(G)} max={maxGrit(G)} />
        </div>
        {(F.lvl || 1) < C.lvl && (
          <small class="reclvl">
            Recommended level {C.lvl}, you are {F.lvl || 1}.
          </small>
        )}
        {HM && (
          <Inf k={`it|mut|${HM.n}`} class="hard-mut">
            {HM.e} <b>{HM.n}</b>: {HM.d}
          </Inf>
        )}
        <button class="btn block big" onClick={() => goMap()}>
          {cta}
        </button>
        <div class="row">
          <button class="btn ghost sm grow" onClick={() => openBag()}>
            <Icon name="bag" /> Bag
          </button>
          {S && S.hard && (
            <button class="btn ghost sm grow" onClick={() => void leaveHard()}>
              <Icon name="back" /> Walk away
            </button>
          )}
        </div>
      </div>
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
          <Icon name="gift" /> Your daily wheel is ready
        </button>
      )}
      {NG && (
        // the goal closest to done, pinned where you play (the Goals tab has the rest)
        <button class="nextgoal" onClick={() => void goHub('goals')} {...rise(n++)}>
          <span class="ng-e" aria-hidden="true">
            {NG.e}
          </span>
          <span class="ng-t">
            <small>Next goal</small>
            <b class="ellipsis">{NG.n}</b>
            <span class="ng-bar" aria-hidden="true">
              <i style={{ width: `${Math.round((Math.min(NG.need, goalCur(G, NG.k)) / NG.need) * 100)}%` }} />
            </span>
          </span>
          <small class="ng-n">
            {Math.min(NG.need, goalCur(G, NG.k))}/{NG.need}
          </small>
        </button>
      )}
      {NM && (
        <Inf k={BALANCE.storyNemesis ? 'rule|nemstory' : 'rule|nemesis'} class="nem card">
          😈 Nemesis: <b>{NM.f.name}</b> has beaten you {NM.beats === 1 ? 'once' : `${NM.beats} times`}
          {NM.lost ? `, you've beaten them ${NM.lost === 1 ? 'once' : 'twice'}` : ''}. They'll show up in your next tournament
          {BALANCE.storyNemesis ? ' and on your story map' : ''}, a level stronger each time they win.
        </Inf>
      )}
      <span class="sec-label">More ways to play</span>
      <div class="mtiles">
        {modes.map((m) => (
          <button
            key={m.n}
            class={`mtile${m.locked ? ' locked' : ''}`}
            onClick={() => {
              if (m.locked) sfx('ui.error', { vary: 0 });
              m.go();
            }}
            {...rise(n++)}
          >
            <span class="mtile-ic">
              <Icon name={m.icon} />
              {m.locked && <Icon name="lock" class="mtile-lock" />}
            </span>
            <b>{m.n}</b>
            <small>{m.st}</small>
            <i>{m.fl}</i>
          </button>
        ))}
      </div>
      <span class="sec-label">Cups and the gauntlet</span>
      <div class="mtiles">
        {TIERS_T.map((t) => {
          const ok = tierUnlocked(t, F) && !run;
          const def = F.belts && F.belts[t.k];
          return (
            <button
              key={t.k}
              class={`mtile tier${ok ? '' : ' locked'}`}
              aria-disabled={!ok}
              onClick={() => {
                if (ok) return startTier(t.k);
                sfx('ui.error', { vary: 0 });
                toast(run && tierUnlocked(t, F) ? 'Finish or abandon the current one first' : t.lock);
              }}
              {...rise(n++)}
            >
              <span class="mtile-ic">
                <span class="te" aria-hidden="true">
                  {t.e}
                </span>
                {!ok && <Icon name="lock" class="mtile-lock" />}
              </span>
              <b>
                {t.n}
                {def ? ' (defending)' : ''}
              </b>
              <small>
                {ok
                  ? t.size
                    ? `Win it: ${t.coins} 🪙${def ? '. Your belt' : ''}`
                    : `Your best: ${F.gbest || 0} in a row`
                  : run && tierUnlocked(t, F)
                    ? 'Finish or abandon the current one first'
                    : t.lock}
              </small>
              <i>{t.d}</i>
            </button>
          );
        })}
      </div>
    </div>
  );
}
