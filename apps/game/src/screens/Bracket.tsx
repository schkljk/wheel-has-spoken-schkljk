import { RNAMES, coinsOf, fullName, myMatch, type CareerFighter, type Run } from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { G, activeFighter } from '../state/game';
import { openSheet } from '../state/ui';
import { FighterCard } from '../ui/FighterCard';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/kit';
import { goHub } from '../flows/nav';
import { runFight } from '../flows/modes';
import { openBaseShop } from '../flows/shop';

const card = (f: CareerFighter) => openSheet(<Sheet icon="card" title={f.name}><FighterCard f={f} /></Sheet>);

function Chip({ f, you, state, right }: { f: CareerFighter; you?: boolean; state?: 'won' | 'lost' | ''; right?: boolean }) {
  return (
    <button class={`bchip ${state || ''}${you ? ' you' : ''}${right ? ' r' : ''}`} onClick={() => card(f)}>
      <span class="mini">
        <FighterSprite look={lookOf(f)} h={40} mirror={right} />
      </span>
      <span class="ntx">
        <span class="n ellipsis">
          {f.name}
          {you ? ' (you)' : ''}
        </span>
        <span class="lv">
          Lv {f.lvl || 1}
          {f.isNem ? ' 😈 nemesis' : ''}
        </span>
      </span>
    </button>
  );
}

/** A cup bracket, or the gauntlet's streak and next opponent. */
export function BracketScreen({ run: T }: { run: Run }) {
  void activeFighter.value;
  const F = G.F!;
  const shop = (
    <button class="btn ghost sm" onClick={() => openBaseShop()}>
      <Icon name="cart" /> Shop (🪙 {coinsOf(G)})
    </button>
  );
  if (T.kind === 'gauntlet') {
    return (
      <main class="screen bracket-screen">
        <header class="bar pad row">
          <button class="iconbtn" aria-label="Back to your fighter" onClick={() => void goHub()}>
            <Icon name="back" />
          </button>
          <h2 class="grow">🔥 The gauntlet</h2>
        </header>
        <div class="scroll pad stack bracket-body">
          <div class="gaunt center">
            <div class="streak">{T.streak} in a row</div>
            <p class="hint">
              Your best: {F.gbest || 0}. All-time best: {G.save.profile.gbest}. Opponents get tougher every two wins, and every third win spins the event wheel.
            </p>
            <div class="match mine">
              <Chip f={F} you />
              <span class="vs">vs</span>
              <Chip f={T.opp} right />
            </div>
          </div>
        </div>
        <footer class="dock pad">
          <button class="btn block" onClick={() => void runFight(T)}>
            Fight {T.opp.name}
          </button>
          {shop}
        </footer>
      </main>
    );
  }
  const total = Math.log2(T.size);
  const rounds = [];
  for (let r = 0; r < total; r++) {
    const ms = T.rounds[r];
    const label = RNAMES[T.size >> r];
    if (!ms) {
      const n = T.size >> (r + 1);
      rounds.push(
        <div class="round" key={r}>
          <h3>{label}</h3>
          <p class="tbd">
            {n} {n === 1 ? 'match' : 'matches'} to come
          </p>
        </div>,
      );
      continue;
    }
    const body = ms.map((m, i) => {
      const wi = T.res[r]![i];
      const st = (idx: number) => (wi == null ? '' : wi === idx ? 'won' : 'lost');
      return (
        <div class={`match${m.includes(T.me) ? ' mine' : ''}`} key={i}>
          <Chip f={T.fs[m[0]]!} you={m[0] === T.me} state={st(m[0])} />
          <span class="vs">vs</span>
          <Chip f={T.fs[m[1]]!} you={m[1] === T.me} state={st(m[1])} right />
        </div>
      );
    });
    const open = r === T.r || T.size <= 8 || (T.done && r === T.rounds.length - 1);
    rounds.push(
      open ? (
        <div class="round" key={r}>
          <h3>{label}</h3>
          {body}
        </div>
      ) : (
        <details class="round" key={r}>
          <summary>
            {label} ({ms.length} {ms.length === 1 ? 'match' : 'matches'})
          </summary>
          {body}
        </details>
      ),
    );
  }
  const live = !T.done && !T.out;
  const opp = live ? T.fs[T.rounds[T.r]![myMatch(T)]!.find((x) => x !== T.me)!]! : null;
  return (
    <main class="screen bracket-screen">
      <header class="bar pad row">
        <button class="iconbtn" aria-label="Back to your fighter" onClick={() => void goHub()}>
          <Icon name="back" />
        </button>
        <h2 class="grow ellipsis">
          {T.tier.e} {T.tier.n}
        </h2>
      </header>
      <div class="scroll pad stack bracket-body">
        {T.done && T.champ != null && (
          <p class="champ-line">
            🏆 Champion: {fullName(T.fs[T.champ]!)}
            {T.champ === T.me ? ' (you)' : ''}
          </p>
        )}
        {!T.done && T.defending && <p class="champ-line">🛡️ You're the defending champion. Lose and the belt goes.</p>}
        {rounds}
      </div>
      <footer class="dock pad">
        {live && opp ? (
          <>
            <button class="btn block" onClick={() => void runFight(T)}>
              Fight {opp.name}
              {opp.isNem ? ' 😈' : ''}
            </button>
            {shop}
          </>
        ) : (
          <button class="btn block" onClick={() => void goHub()}>
            Continue
          </button>
        )}
      </footer>
    </main>
  );
}
