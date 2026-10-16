import { WHEELS, kitMoves, labelOf, numStats, synOf, xpNeed, type PartialFighter, type WheelItem } from '@whs/core';
import { activeFighter, save } from '../../state/game';
import { rise } from '../../ui/kit';

const STAT_ROWS: [keyof ReturnType<typeof numStats>, string, string][] = [
  ['hp', 'HP', '❤️'],
  ['atk', 'Attack', '⚔️'],
  ['pow', 'Power', '✨'],
  ['def', 'Defense', '🛡️'],
  ['spd', 'Speed', '👟'],
  ['crit', 'Crit', '🎯'],
  ['dodge', 'Dodge', '💨'],
  ['cha', 'Charisma', '😎'],
];

export function FighterTab() {
  const f = activeFighter.value!;
  const ctx = { patch: save.value.profile.patch };
  const ns = numStats(f, ctx);
  const lvl = f.lvl || 1;
  const need = xpNeed(lvl);
  const syn = synOf(f);
  const moves = kitMoves(f);
  let n = 0;
  return (
    <div class="stack tab-stack">
      <div class="card fighter-head" {...rise(n++)}>
        <span class="avatar big" aria-hidden="true">
          {f.race.e}
        </span>
        <span class="grow">
          <h3 class="ellipsis">{f.name}</h3>
          <small style={{ display: 'block' }}>
            {f.title && f.title.k !== 'none' ? `${f.title.n} · ` : ''}
            {f.race.n} {f.arch.n.toLowerCase()}
          </small>
          <small style={{ display: 'block' }}>
            Level {lvl} · {f.rec?.w ?? 0} wins, {f.rec?.l ?? 0} losses
          </small>
          <div class="xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={f.xp || 0} aria-label="Experience">
            <i style={{ width: `${Math.min(100, ((f.xp || 0) / need) * 100)}%` }} />
          </div>
        </span>
      </div>
      <div class="statgrid" {...rise(n++)}>
        {STAT_ROWS.map(([k, label, e]) => (
          <div class="stat" key={k}>
            <span aria-hidden="true">{e}</span>
            <small>{label}</small>
            <b>
              {ns[k] == null ? '—' : ns[k]}
              {k === 'crit' || k === 'dodge' ? '%' : ''}
            </b>
          </div>
        ))}
      </div>
      <span class="sec-label">Moves</span>
      <div class="card kit" {...rise(n++)}>
        {moves.map((m) => (
          <span key={m.n} class={`kitmv k-${m.src}`} title={m.d}>
            {m.e} {m.n}
          </span>
        ))}
      </div>
      {syn.length > 0 && (
        <>
          <span class="sec-label">Synergies</span>
          {syn.map((s) => (
            <div class="card" key={s.k} {...rise(n++)}>
              <b>
                {s.e} {s.n}
              </b>
              <small style={{ display: 'block' }}>{s.d}</small>
            </div>
          ))}
        </>
      )}
      <span class="sec-label">Build</span>
      <div class="card build" {...rise(n++)}>
        {WHEELS.map((W) => {
          const it = (f as unknown as Record<string, WheelItem & { skip?: boolean }>)[W.k];
          if (!it || it.skip) return null;
          return (
            <div class="build-row" key={W.k}>
              <small>{labelOf(W, f as PartialFighter)}</small>
              <span>
                {it.e ? `${it.e} ` : ''}
                {it.n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
