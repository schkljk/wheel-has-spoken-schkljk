import { RUN_FIGHTS, boonOf, fightUnder, numStats, quitRun, runBest, runFighter, runOpponent, runSpecOf, runState, startRun, takeBoon, type NumStats } from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { G, act, popStats } from '../state/game';
import { confirm } from '../state/ui';
import { fight } from './fight';
import { choose, goHub, runSteps, showCine } from './nav';
import { bossIntro } from './story';

/** Lower case in a sentence, except for a name in capitals (NPC). */
const lc = (s: string) => (s === s.toUpperCase() ? s : s.toLowerCase());

/**
 * Spin & Run (review F3): a throwaway fighter, eight fights and a boss. Between fights: pick a boon (after a
 * win), then fight on or walk away. The run is kept in the save, so it picks up where it was.
 */
export async function runFlow() {
  if (!runState(G)) {
    const best = runBest(G);
    const c = await choose({
      emoji: '🏃',
      title: 'Spin & Run',
      sub: 'Built in two minutes. Expected to last three.',
      body: (
        <p class="hint">
          A brand new fighter from the wheels, for one run: {RUN_FIGHTS - 1} fights and a boss. HP carries over, plus 10 after a win, and every win is a level and a pick of one boon out of three. Their picks
          join your collection, their wins count toward class mastery, and the run pays gems. {best ? `Your best: ${best.wins} ${best.wins === 1 ? 'win' : 'wins'}${best.won ? ', boss included' : ''}.` : ''}
        </p>
      ),
      options: [{ label: '🎡 Spin a runner', sub: 'Every wheel, all at once' }, { label: 'Not now' }],
    });
    if (c !== 0) return void goHub();
    const R = act((g) => startRun(g));
    const f = runFighter(R);
    await showCine(
      <>
        <div class="cine-kicker">Your runner</div>
        <div class="boss-art">
          <FighterSprite look={lookOf(f)} h={150} />
        </div>
        <div class="boss-plate">
          <b>{f.name}</b>
          <span>
            Level {f.lvl} {lc(f.race.n)} {lc(f.arch.n)}, {lc(f.weapon.n)}, {lc(f.power.n)}
          </span>
        </div>
        <div class="cine-meta">They exist for one run. Make it count, or at least make it funny.</div>
      </>,
      'Start the run',
    );
  }
  // the runner's numbers after a boon or a win's level, old → new like any fighter's (G15)
  let last: NumStats | null = null;
  for (;;) {
    const R = runState(G);
    if (!R) return void goHub();
    const ns = numStats(runFighter(R));
    if (last) popStats(last, ns);
    last = ns;
    if (R.offer) {
      const offer = R.offer;
      const c = await choose({
        emoji: '🎁',
        title: 'Pick a boon',
        sub: `Fight ${R.i} of ${RUN_FIGHTS} won. One of these, for the rest of the run`,
        options: offer.map((k) => ({ label: `${boonOf(k).e} ${boonOf(k).n}`, sub: boonOf(k).d })),
      });
      act((g) => takeBoon(g, offer[c]!));
      continue;
    }
    const f = runFighter(R);
    const boss = R.i === RUN_FIGHTS - 1;
    // the same opponent the fight will bring (the run's own dice)
    const o = act((g) => runOpponent(g, R));
    // a fight the app closed on goes straight back in (G2)
    const under = !!fightUnder(G, 'run', o.name);
    const c = under ? 0 : await choose({
      emoji: boss ? '💀' : '🏃',
      title: boss ? 'Spin & Run: the boss' : `Spin & Run: fight ${R.i + 1} of ${RUN_FIGHTS}`,
      sub: `${f.name}, level ${f.lvl}, HP ${Math.max(1, Math.round((R.hp / 100) * ns.hp))}/${ns.hp}`,
      body: (
        <>
          Next: <b>{o.name}</b>, {boss && o.bossTitle ? `${o.bossTitle}, level ${o.lvl}` : `level ${o.lvl} ${lc(o.race.n)} ${lc(o.arch.n)}`}.
        </>
      ),
      options: [
        { label: boss ? '💀 Face the boss' : '⚔️ Fight', sub: boss ? 'Up to 30 rounds, then sudden death' : `${RUN_FIGHTS - R.i - 1} more after this, then the boss` },
        { label: 'Walk away', sub: `Ends the run with ${R.i} ${R.i === 1 ? 'win' : 'wins'}, and keeps what it earned` },
      ],
    });
    if (c !== 0) {
      if (await confirm({ title: 'End the run?', body: `${f.name} retires after ${R.i} ${R.i === 1 ? 'win' : 'wins'}. The run pays out what it earned.`, yes: 'End the run', danger: true })) {
        act((g) => quitRun(g));
        return void goHub();
      }
      continue;
    }
    const spec = act((g) => runSpecOf(g, R));
    if (boss && !under) await bossIntro(spec.opp, 'You are not even on the poster.', 'Spin & Run');
    const r = await fight(spec);
    // a win comes back here (a 'run' step); the end goes home
    return void runSteps(r.next);
  }
}
