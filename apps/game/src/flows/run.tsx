import { BALANCE, RUN_FIGHTS, RUN_WIND_HP, boonOf, pl, relicOf, fightUnder, numStats, quitRun, runBest, runFighter, runOpponent, runSpecOf, runState, runWindLeft, startRun, takeBoon, type NumStats } from '@whs/core';
import { useEffect, useState } from 'preact/hooks';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { G, act, popStats, reducedMotion } from '../state/game';
import { FighterCard } from '../ui/FighterCard';
import { tick } from '../ui/sound';
import type { CareerFighter } from '@whs/core';
import { confirm } from '../state/ui';
import { fight } from './fight';
import { choose, goHub, runSteps, showCine } from './nav';
import { bossIntro } from './story';

/** Lower case in a sentence, except for a name in capitals (NPC). */
const lc = (s: string) => (s === s.toUpperCase() ? s : s.toLowerCase());

/** Every wheel, all at once (H2): the runner's picks tick in one after another, then their whole card is a tap away. */
function RunnerReveal({ f }: { f: CareerFighter }) {
  const picks = [f.race, f.arch, f.weapon, f.power, f.ench, f.weak, f.chaos, f.side, f.title].filter((x): x is NonNullable<typeof x> => !!x && x.n !== 'None' && x.n !== 'No title');
  const [n, setN] = useState(() => (reducedMotion() ? picks.length : 0));
  useEffect(() => {
    if (n >= picks.length) return;
    const t = setTimeout(() => {
      tick();
      setN((x) => x + 1);
    }, 110);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <>
      <div class="cine-kicker">Your runner</div>
      <div class="boss-art">
        <FighterSprite look={lookOf(f)} h={130} />
      </div>
      <div class="boss-plate">
        <b>{f.name}</b>
        <span>Level {f.lvl}</span>
      </div>
      <div class="run-picks" aria-label="Their wheels">
        {picks.slice(0, n).map((x) => (
          <span key={x.n} class="oc up run-pick">
            {x.e} {x.n}
          </span>
        ))}
      </div>
      <details class="run-card">
        <summary>The whole card</summary>
        <FighterCard f={f} />
      </details>
      <div class="cine-meta">They exist for one run. Make it count, or at least make it funny.</div>
    </>
  );
}

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
          A brand new fighter from the wheels, for one run: {RUN_FIGHTS - 1} fights and a boss. HP carries over, plus 10 after a win, and every win is a level and a pick of one boon out of three.
          {BALANCE.runFair ? ` One second wind: the first loss leaves you standing with ${RUN_WIND_HP}% HP for a rematch.` : ''} Their picks join your collection
          {BALANCE.runFair ? ' once they win a fight' : ''}, their wins count toward class mastery, and the run pays gems. {best ? `Your best: ${best.wins} ${best.wins === 1 ? 'win' : 'wins'}${best.won ? ', boss included' : ''}.` : ''}
        </p>
      ),
      options: [{ label: '🎡 Spin a runner', sub: 'Every wheel, all at once' }, { label: 'Not now' }],
    });
    if (c !== 0) return void goHub();
    const R = act((g) => startRun(g));
    await showCine(<RunnerReveal f={runFighter(R)} />, 'Start the run');
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
        sub: offer.some((k) => relicOf(k)) ? `Fight ${R.i} of ${RUN_FIGHTS} won. Relics on offer: power, with a catch` : `Fight ${R.i} of ${RUN_FIGHTS} won. One of these, for the rest of the run`,
        // relics (L5) wear their catch on a tag
        options: offer.map((k) => ({ label: `${boonOf(k).e} ${boonOf(k).n}`, sub: boonOf(k).d, ...(relicOf(k) ? { tag: 'Tradeoff', tone: 'even' as const } : {}) })),
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
      sub: `${f.name}, level ${f.lvl}, HP ${Math.max(1, Math.round((R.hp / 100) * ns.hp))}/${ns.hp}${BALANCE.runFair ? (runWindLeft(R) ? ' · second wind ready' : ' · second wind used') : ''}${R.relics?.length ? ` · ${R.relics.map((k) => relicOf(k)?.e).join('')}` : ''}${R.ends != null ? ` · ${pl(R.ends - R.i, 'fight')} of borrowed time` : ''}`,
      body: (
        <>
          Next: <b>{o.name}</b>, {boss && o.bossTitle ? `${o.bossTitle}, level ${o.lvl}` : `level ${o.lvl} ${lc(o.race.n)} ${lc(o.arch.n)}`}.
        </>
      ),
      options: [
        { label: boss ? '💀 Face the boss' : '⚔️ Fight', sub: boss ? 'Up to 30 rounds, then sudden death' : `${RUN_FIGHTS - R.i - 1} more after this, then the boss` },
        { label: `📇 ${f.name}'s card`, sub: 'Every wheel result, gear and boon so far', quiet: true },
        {
          label: 'Walk away',
          sub: BALANCE.runFair && R.i === 0 ? 'Ends the run with no wins: nothing to keep, not even the picks' : `Ends the run with ${R.i} ${R.i === 1 ? 'win' : 'wins'}, and keeps what it earned`,
        },
      ],
    });
    if (c === 1) {
      await showCine(<FighterCard f={f} />, 'Back to the run');
      continue;
    }
    if (c !== 0) {
      if (await confirm({ title: 'End the run?', body: `${f.name} retires after ${R.i} ${R.i === 1 ? 'win' : 'wins'}. The run pays out what it earned.`, yes: 'End the run', danger: true })) {
        const lines = act((g) => quitRun(g));
        // what the run paid, on a card of its own (H2)
        await showCine(
          <>
            <div class="cine-kicker">Spin & Run, over</div>
            <div class="boss-art">
              <FighterSprite look={lookOf(f)} h={110} />
            </div>
            <h2>{R.i ? `${f.name}: ${R.i} ${R.i === 1 ? 'win' : 'wins'}` : `${f.name} walks`}</h2>
            <ul class="gains">
              {lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div class="cine-meta">{R.i ? 'Retired with dignity. Mostly with dignity.' : 'Spun, looked at, put back. The wheel understands.'}</div>
          </>,
          'Home',
        );
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
