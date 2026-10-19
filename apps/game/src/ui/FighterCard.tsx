import {
  ACHK,
  ASUB,
  INJK,
  RSUB,
  STATLBL,
  ULTS,
  ctxOf,
  eff,
  fullName,
  gearOf,
  injText,
  itemKeyFor,
  kitMoves,
  markSeen,
  numStats,
  personalityOf,
  powerScale,
  shareWord,
  synFound,
  synOf,
  verdict,
  type CareerFighter,
  type NumStats,
  type WheelItem,
} from '@whs/core';
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite-look';
import { G, ensure } from '../state/game';
import { rateFor } from '../state/odds';
import { Inf } from './Info';
import { GearIcon } from './GearIcon';
import { Icon, type IconName } from './Icon';

/** The real numbers: key, pixel icon, label, unit. */
export const NS_META: [keyof NumStats, IconName, string, string?][] = [
  ['hp', 'heart', 'HP'],
  ['atk', 'sword', 'Attack'],
  ['pow', 'spark', 'Power'],
  ['def', 'shield', 'Defense'],
  ['spd', 'wing', 'Speed'],
  ['crit', 'target', 'Crit', '%'],
  ['dodge', 'swirl', 'Dodge', '%'],
  ['cha', 'chat', 'Charisma'],
];

/** The real numbers: level sets the base, rolled stats modify it. */
export function NumBlock({ f }: { f: CareerFighter }) {
  const n = numStats(f, ctxOf(G));
  return (
    <div class="numblock">
      {NS_META.filter(([k]) => n[k] != null).map(([k, e, l, u]) => (
        <Inf k="rule|numstats" key={k} class="nb-i">
          <Icon name={e} />
          <b>
            {n[k]}
            {u || ''}
          </b>
          <small>{l}</small>
        </Inf>
      ))}
    </div>
  );
}

/** What a rolled stat does to the real numbers (legacy modTxt). */
export function modTxt(k: string, v: number) {
  // against an average roll (6); an average roll just says so
  if (v === 6) return 'average';
  const p = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x))}%`;
  if (k === 'str') return p((Math.pow(1.17, 0.6 * (v - 6)) - 1) * 100) + ' Attack';
  if (k === 'wm') return p((Math.pow(1.17, 0.4 * (v - 6)) - 1) * 100) + ' Attack';
  if (k === 'dur') return p((Math.pow(1.17, v - 6) - 1) * 100) + ' Defense';
  if (k === 'pm') return p((Math.pow(1.17, 0.75 * (v - 6)) - 1) * 100) + ' Power';
  if (k === 'iq') return p((v - 6) * 0.8) + ' crit, reads';
  // Speed is 4 per point plus 2 per level: say the rolled part against an average roll, like the others
  if (k === 'spd') return `${v >= 6 ? '+' : '−'}${Math.abs(4 * (v - 6))} Speed`;
  if (k === 'cha') return p((v - 6) * 0.4) + ' crit, haggling';
  return '';
}
const TQ = (v: number) => (v <= 3 ? 0 : v <= 6 ? 1 : v <= 10 ? 2 : 3);

function StatRows({ f }: { f: CareerFighter }) {
  const s = eff(f, ctxOf(G));
  const rows: [string, 'str' | 'spd' | 'dur' | 'iq' | 'wm' | 'pm' | 'cha'][] = [
    ['Strength', 'str'],
    ['Speed', 'spd'],
    ['Durability', 'dur'],
    ['IQ', 'iq'],
    ['Weapon mastery', 'wm'],
  ];
  if (f.power.k !== 'none') rows.push(['Power mastery', 'pm']);
  if (f.cha) rows.push(['Charisma', 'cha']);
  return (
    <div class="statrows">
      {rows.map(([lb, k]) => {
        const base = f[k] as WheelItem & { v: number };
        const v = s[k];
        const diff = v - base.v;
        return (
          <div class="st" key={k}>
            <Inf k={`stat|${k}`} class="lb">
              {lb}
            </Inf>
            {/* the roll, then only its effect, colored by what it does (bonuses are already in it) */}
            <span class="vl" title={diff ? `${diff > 0 ? '+' : '−'}${Math.abs(diff)} from bonuses and penalties` : undefined}>
              {base.n}
              <small class={`modv ${v > 6 ? 'up' : v < 6 ? 'down' : ''}`}>{modTxt(k, v)}</small>
            </span>
            <span class="tr" aria-hidden="true">
              <i class={`f${TQ(Math.min(14, v))}`} style={{ width: `${Math.min(100, Math.round((v / 20) * 100))}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** The fighter's own moves (class, race, weapon). */
export function KitStrip({ f }: { f: CareerFighter }) {
  const ks = kitMoves(f);
  if (!ks.length) return null;
  if (f === G.F) ensure((g) => ks.forEach((m) => markSeen(g, 'moves', 'mv/' + m.n)), 'seen|' + ks.map((m) => m.n).join('|'));
  return (
    <div class="card-kit">
      <span class="ck-l">Moves</span>
      <div class="kitlist">
        {ks.map((m) => (
          <Inf k={`mv|${m.n}`} key={m.n} class={`kitmv k-${m.src}`}>
            {m.e} {m.n}
          </Inf>
        ))}
      </div>
    </div>
  );
}

function Row(props: { dt: string; it?: (WheelItem & { skip?: unknown }) | null; extra?: string; k?: string; children?: ComponentChildren }) {
  const { it } = props;
  if (!it || it.skip) return null;
  const label = `${it.e || ''} ${it.n}`.trim();
  const small = [it.d, props.extra].filter(Boolean).join('. ');
  return (
    <>
      <dt>{props.dt}</dt>
      <dd>
        {props.k ? <Inf k={props.k}>{label}</Inf> : label}
        {small && <small>{small}</small>}
      </dd>
    </>
  );
}

/**
 * A fighter's rating (their share of wins against random level 1 fighters), or null while the worker works it
 * out: 160 fights, over a second on a mid-range phone, that used to freeze the card's reveal.
 */
export function useRating(f: CareerFighter): number | null {
  const cached = (f as { _win?: number | null })._win;
  const [w, setW] = useState<{ f: CareerFighter; p: number } | null>(null);
  useEffect(() => {
    if (cached != null) return;
    let live = true;
    void rateFor(f, ctxOf(G)).then((p) => live && setW({ f, p }));
    return () => {
      live = false;
    };
  }, [f, cached]);
  return cached ?? (w && w.f === f ? w.p : null);
}

/** The full fighter card (legacy cardHTML): art, verdict, real numbers, stats, moves and every wheel result. */
export function FighterCard({ f, nemesis }: { f: CareerFighter; nemesis?: boolean }) {
  const ctx = ctxOf(G);
  const w = useRating(f);
  const v = w == null ? null : verdict(w);
  const syns = synOf(f);
  const gear = gearOf(f);
  const P = (G.save.profile.patch || {}) as { race?: Record<string, Record<string, number>>; arch?: Record<string, Record<string, number>> };
  const patch = [f.race && P.race?.[f.race.n], f.arch && P.arch?.[f.arch.k]]
    .filter(Boolean)
    .flatMap((m) => Object.entries(m!).filter(([, x]) => x))
    .map(([k, x]) => `${x > 0 ? '+' : '−'}${Math.abs(x)} ${STATLBL[k]}`);
  const ik = (cat: string, it: { n: string } | null | undefined) => (it ? itemKeyFor(cat, it, f) : undefined);
  const pers = personalityOf(f, ctx);
  return (
    <div class="fcard">
      <div class="fc-top">
        <FighterSprite look={lookOf(f)} h={118} />
        <div class="grow">
          {/* the player's own fighter wears their nameplate (F11) */}
          <div class={`fc-name${f === G.F ? ' mine' : ''}`}>{fullName(f)}</div>
          <div class="fc-sub">
            Level {f.lvl || 1} {f.size?.n.toLowerCase()} {f.race.n.toLowerCase()} {f.arch.n.toLowerCase()}
            {f.isNem || nemesis ? '. Your nemesis 😈' : ''}
          </div>
          <div class="fc-sub">
            Power scale: <Inf k="rule|scale">{powerScale(f, ctx).n}</Inf>
          </div>
        </div>
        {v ? (
          <Inf k="rule|verdict" class={`stamp q${v.q} stamp-in`}>
            {v.t}
          </Inf>
        ) : (
          <span class="stamp q0 rating" aria-label="Rating them">
            …
          </span>
        )}
      </div>
      <p class="fc-win">
        {w == null ? (
          'Sizing them up against random level 1 fighters…'
        ) : (
          <>
            Beats <b>{shareWord(w)}</b> random level 1 fighters.
          </>
        )}
      </p>
      <NumBlock f={f} />
      <StatRows f={f} />
      <KitStrip f={f} />
      <dl class="loadout">
        {f.rsub && <Row dt={RSUB[f.race.n]?.label || 'Sub-race'} it={f.rsub} k={ik('rsub', f.rsub)} />}
        <Row dt="Archetype" it={f.arch} extra={'Signature move: ' + ULTS[f.arch.k]} k={ik('arch', f.arch)} />
        {f.asub && <Row dt={ASUB[f.arch.k]?.label || 'Specialty'} it={f.asub} k={ik('asub', f.asub)} />}
        <Row dt="Stance" it={f.stance} k={ik('stance', f.stance)} />
        <Row dt="Plays like" it={pers as never} k={`pers|${pers.k}`} />
        <Row dt="Backstory" it={f.back} k={ik('back', f.back)} />
        {f.reinc && <Row dt="Reincarnation of" it={f.reinc} />}
        <Row dt="Weapon" it={f.weapon} extra={f.wm.n + ' with it'} k={ik('weapon', f.weapon)} />
        {f.power.k === 'none' ? (
          <Row dt="Power" it={f.power} k={ik('power', f.power)} />
        ) : (
          <>
            <dt>Power</dt>
            <dd>
              <Inf k={ik('power', f.power)!}>
                {f.power.e} {f.power.n}
              </Inf>
              <small>
                {f.pm.n}. {f.power.d}
              </small>
            </dd>
          </>
        )}
        <Row dt="Enchant" it={f.ench} k={ik('ench', f.ench)} />
        <Row dt="Weakness" it={f.weak} k={ik('weak', f.weak)} />
        <Row dt="Chaos" it={f.chaos} k={ik('chaos', f.chaos)} />
        {f.quirk && <Row dt="Quirk" it={f.quirk} k={ik('quirk', f.quirk)} />}
        {f.side && <Row dt="Sidekick" it={f.side} k={ik('side', f.side)} />}
        {gear.length > 0 && (
          <>
            <dt>Gear</dt>
            <dd>
              {gear.map((g) => (
                <span key={g.k} class="dd-item">
                  <Inf k={`it|gear|${g.n}`}>
                    <GearIcon g={g} /> {g.n}
                    {f.gup?.[g.k] ? <span class="up-lv"> +{f.gup[g.k]}</span> : null}
                  </Inf>
                  <small>{g.d}</small>
                </span>
              ))}
            </dd>
          </>
        )}
        {f.title && f.title.k !== 'none' && <Row dt="Title" it={f.title} k={ik('title', f.title)} />}
        {syns.length > 0 && (
          <>
            <dt>Synergies</dt>
            <dd>
              {syns.map((s) =>
                synFound(G, s) ? (
                  <span key={s.k} class={`syn${s.anti ? ' anti' : ''}${s.hidden ? ' secret' : ''}`}>
                    <Inf k={`it|syn|${s.n}`}>
                      {s.e} {s.n}
                    </Inf>
                    <small>{s.d}</small>
                  </span>
                ) : (
                  // a hidden synergy nobody has found yet
                  <span key={s.k} class="syn secret">
                    <span>❓ ???</span>
                    <small>Something about this build is off. In a good way. A fight will tell.</small>
                  </span>
                ),
              )}
            </dd>
          </>
        )}
        {(f.inj || []).length > 0 && (
          <>
            <dt>Injuries</dt>
            <dd>
              {(f.inj as { k: string; left: number }[]).map((j) => {
                const d = INJK[j.k];
                return d ? (
                  <span key={j.k} class="dd-item">
                    <Inf k={`it|inj|${d.k}`}>
                      {d.e} {d.n}
                    </Inf>
                    <small>
                      {injText(d)}, {j.left} more tournament{j.left > 1 ? 's' : ''}
                    </small>
                  </span>
                ) : null;
              })}
            </dd>
          </>
        )}
        {(f.earned || []).length > 0 && (
          <>
            <dt>Earned titles</dt>
            <dd>
              {f
                .earned!.map((k) => ACHK[k])
                .filter(Boolean)
                .map((a) => (
                  <Inf key={a!.k} k={`it|ach|${a!.n}`} class="chipish">
                    {a!.e} {a!.n}
                  </Inf>
                ))}
            </dd>
          </>
        )}
        {patch.length > 0 && (
          <>
            <dt>Season patch</dt>
            <dd>{patch.join(', ')}</dd>
          </>
        )}
        {f.boons.length > 0 && (
          <>
            <dt>Upgrades</dt>
            <dd>
              {f.boons
                .slice(-12)
                .map((b) => `${b.e} ${b.n}`)
                .join(', ')}
              {f.boons.length > 12 ? ` and ${f.boons.length - 12} more` : ''}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
