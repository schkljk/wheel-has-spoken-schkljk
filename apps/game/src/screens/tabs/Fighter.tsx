import {
  ACHK,
  CONTRACTK,
  GEARK,
  GEAR_SLOTS,
  INJK,
  RANKS,
  RANK_EFFECT,
  SLOT_N,
  TIERS_T,
  contractOffers,
  dropContract,
  readSteps,
  fullName,
  legacyEarned,
  pl,
  rankOf,
  rankReward,
  retire,
  takeContract,
  xpNeed,
} from '@whs/core';
import { FighterSprite } from '../../art/FighterSprite';
import { lookOf } from '../../art/sprite';
import { G, act, activeFighter, ensure, go } from '../../state/game';
import { confirm, openSheet } from '../../state/ui';
import { FighterCard, NumBlock, KitStrip } from '../../ui/FighterCard';
import { Icon } from '../../ui/Icon';
import { Inf } from '../../ui/Info';
import { Sheet, rise } from '../../ui/kit';
import { openArmory } from '../../flows/armory';
import { openTalents } from '../../flows/talents';
import { GearIcon, SlotIcon } from '../../ui/GearIcon';

/** What the next rank pays, in words: "+18 🪙 and 1 talent point". */
function nextReward(r: number) {
  const w = rankReward(r);
  return `+${w.coins} 🪙 and ${pl(w.tp, 'talent point')}${w.gems ? `, ${w.gems} 💎` : ''}`;
}

/** The fighter page: level, rank, talents, contract, gear and the full card. */
export function FighterTab() {
  const F = activeFighter.value!;
  const lvl = F.lvl || 1;
  const need = xpNeed(lvl);
  const rk = rankOf(F);
  const RK = RANKS[rk]!;
  const NX = RANKS[rk + 1];
  const fm = F.fame || 0;
  const nx = (F.next || {}) as Record<string, number>;
  const nextB = [nx.dmgX ? '+15% damage' : '', nx.hp ? 'starts at 80% HP' : '', nx.en ? 'full energy' : '', nx.readB ? `reads ${readSteps(nx.readB as number)} clearer` : ''].filter(Boolean);
  const offers = F.contract ? [] : ensure((g) => contractOffers(g));
  const c = F.contract ? CONTRACTK[F.contract as string] : null;
  let n = 0;
  return (
    <div class="stack tab-stack">
      <div class="card hubcard" {...rise(n++)}>
        <FighterSprite look={lookOf(F)} h={120} />
        <div class="grow">
          <h3 class="ellipsis">{fullName(F)}</h3>
          <small>
            {F.race.n} {F.arch.n.toLowerCase()}
          </small>
          <Inf k="rule|xp" class="lvl">
            Level {lvl}
          </Inf>
          <div class="xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={F.xp || 0} aria-label="Experience">
            <i style={{ width: `${Math.min(100, ((F.xp || 0) / need) * 100)}%` }} />
          </div>
          <small>
            {F.xp || 0} of {need} XP to level {lvl + 1}
          </small>
          <small>
            {F.rec?.w ?? 0} wins, {F.rec?.l ?? 0} losses
          </small>
          <div class="belts">
            {TIERS_T.filter((t) => t.size).map((t) => (
              <Inf key={t.k} k={`tier|${t.k}`} class={`belt${F.belts && F.belts[t.k] ? ' on' : ''}`} label={`${t.n} belt: ${F.belts && F.belts[t.k] ? 'won' : 'not won yet'}`}>
                {t.e}
              </Inf>
            ))}
          </div>
        </div>
      </div>
      {((F.inj || []).length > 0 || (F.earned || []).length > 0) && (
        <div class="chips left" {...rise(n++)}>
          {(F.inj as { k: string; left: number }[]).map((j) => {
            const d = INJK[j.k];
            return d ? (
              <Inf key={j.k} k={`it|inj|${d.k}`} class="oc down">
                {d.e} {d.n}, {j.left} more
              </Inf>
            ) : null;
          })}
          {(F.earned || []).map((k) => {
            const a = ACHK[k];
            return a ? (
              <Inf key={k} k={`it|ach|${a.n}`} class="oc up">
                {a.e} {a.n}
              </Inf>
            ) : null;
          })}
        </div>
      )}
      {nextB.length > 0 && <p class="hint">Next fight: {nextB.join(', ')}</p>}
      <NumBlock f={F} />
      <KitStrip f={F} />
      <div class="card rankcard" {...rise(n++)}>
        <div class="row">
          <span class="rk-e" aria-hidden="true">
            {RK.e}
          </span>
          <div class="grow">
            <b>{RK.n}</b>
            <small>
              {fm} fame{NX ? `, ${NX.fame - fm} more for ${NX.n}` : ', top rank'}
            </small>
          </div>
          <Inf k="rule|ranks" class="hint">
            Ranks
          </Inf>
        </div>
        <div class="xpbar">
          <i style={{ width: `${NX ? Math.round(((fm - RK.fame) / (NX.fame - RK.fame)) * 100) : 100}%` }} />
        </div>
        {NX && (
          <small>
            At {NX.n}: {nextReward(rk + 1)}
            {RANK_EFFECT.has(rk + 1) ? `. ${NX.perk}` : ''}
          </small>
        )}
      </div>
      <button class="btn ghost block" onClick={() => openTalents()} {...rise(n++)}>
        <Icon name="star" /> Talents{F.tp ? `: ${F.tp} ${F.tp === 1 ? 'point' : 'points'} to spend` : ''}
      </button>
      <div class="card contract" {...rise(n++)}>
        <Inf k="rule|contracts" class="sec-label">
          📜 {c ? 'Sponsor contract' : 'Pick a sponsor contract'}
        </Inf>
        {c ? (
          <>
            <b>
              {c.e} {c.n}
            </b>
            <small>{c.d}</small>
            <small class="ct-r">
              Pays {c.coins} 🪙 and {c.xp} XP
            </small>
            <button class="linkish" onClick={() => act((g) => dropContract(g))}>
              Drop it
            </button>
          </>
        ) : (
          <div class="offers">
            {offers.map((k) => {
              const o = CONTRACTK[k];
              return o ? (
                <button key={k} class="offer" onClick={() => act((g) => takeContract(g, k))}>
                  <span class="oe">{o.e}</span>
                  <span class="grow">
                    <b>{o.n}</b>
                    <small>{o.d}</small>
                    <small class="ct-r">
                      {o.coins} 🪙, {o.xp} XP
                    </small>
                  </span>
                </button>
              ) : null;
            })}
          </div>
        )}
      </div>
      <div class="card gearline" {...rise(n++)}>
        <div class="row">
          <Inf k="rule|gear" class="grow">
            <Icon name="slot_armor" /> Gear
          </Inf>
          <button class="btn ghost sm" onClick={() => openArmory()}>
            <Icon name="shield" /> Armory ({(F.armory || []).length})
          </button>
        </div>
        <div class="gl-icons">
          {GEAR_SLOTS.map((sl) => {
            const g = GEARK[(F.gear || {})[sl]!];
            return (
              <span key={sl} class={`gl-i${g ? ' r-' + g.r : ''}`} title={SLOT_N[sl]}>
                {g ? <GearIcon g={g} /> : <SlotIcon slot={sl} />}
                {g && F.gup?.[g.k] ? <b class="gl-up">+{F.gup[g.k]}</b> : null}
              </span>
            );
          })}
        </div>
      </div>
      <button class="btn ghost block" onClick={() => openSheet(<Sheet icon="card" title={F.name} sub="Every wheel result and trait"><FighterCard f={F} /></Sheet>)} {...rise(n++)}>
        <Icon name="card" /> Every wheel result and trait
      </button>
      <button
        class="btn ghost sm block retire"
        onClick={async () => {
          const ok = await confirm({
            title: `Retire ${F.name}?`,
            body: `They leave your roster for good and you get ${legacyEarned(F)} ✦ legacy points.`,
            yes: 'Retire them',
            danger: true,
          });
          if (!ok) return;
          act((g) => retire(g));
          go({ screen: 'title' });
        }}
        {...rise(n++)}
      >
        Retire this fighter
      </button>
    </div>
  );
}
