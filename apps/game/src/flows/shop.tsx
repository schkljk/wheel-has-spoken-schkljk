import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import {
  BASICS,
  FLAVOR,
  GEARK,
  ITEMK,
  PREMIUM,
  RARITY,
  SERVICES,
  baseHagDone,
  baseHagMult,
  baseOpen,
  basePrice,
  basicPrice,
  buyBasic,
  buyDeal,
  buyPremium,
  buyService,
  coinsOf,
  dailyDeal,
  dealPrice,
  equippedGear,
  gemPrice,
  sellGear,
  sellValue,
  serviceOk,
  talentPoints,
  type Gear,
  type Service,
} from '@whs/core';
import { G, act, ensure, toast } from '../state/game';
import { closeSheet, confirm, openSheet } from '../state/ui';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { beep } from '../ui/sound';
import { gearChoice } from './nav';
import { GearCompareView } from '../ui/GearCompare';
import { haggleFlow } from './story';
import { GearIcon, ItemIcon } from '../ui/GearIcon';
import { Icon, type IconName } from '../ui/Icon';

type Tab = 'basics' | 'deal' | 'vault' | 'services';
const flav = (n: string) => (FLAVOR[n] ? <i class="flav"> {FLAVOR[n]}</i> : null);

function GearRow({ g, price, sold, star }: { g: Gear; price: ComponentChildren; sold?: boolean; star?: boolean }) {
  return (
    <div class={`shopitem r-${g.r}${star ? ' deal' : ''}`}>
      <span class="se"><GearIcon g={g} /></span>
      <div class="st2">
        <b>
          {star ? '⭐ ' : ''}
          <Inf k={`it|gear|${g.n}`}>{g.n}</Inf>
        </b>
        <small>
          <span class={`rar r-${g.r}`}>
            {RARITY[g.r]?.n} {g.slot}
          </span>{' '}
          {g.d}
          {flav(g.n)}
          {star ? '. Today only: deal price' : ''}
        </small>
      </div>
      {sold ? <span class="price">Sold</span> : price}
    </div>
  );
}

/** The base shop on the fighter page: basics, one daily deal, premium gear for gems, services. Only between chapters. */
function BaseShop({ tab: tab0 }: { tab: Tab }) {
  const [tab, setTab] = useState<Tab>(tab0);
  const [, setV] = useState(0);
  const re = () => setV((x) => x + 1);
  const F = G.F!;
  const open = baseOpen(G);
  const coins = coinsOf(G);
  const gems = G.save.profile.gems || 0;
  const hm = baseHagMult(G);
  const dis = (ok: boolean) => !(open && ok);
  let body;
  if (tab === 'basics')
    body = BASICS.map((k) => {
      const i = ITEMK[k]!;
      const p = basicPrice(G, k);
      return (
        <div class="shopitem" key={k}>
          <span class="se"><ItemIcon k={k} /></span>
          <div class="st2">
            <b>
              {i.n}
              {F.bag![k] ? ` (have ${F.bag![k]})` : ''}
            </b>
            <small>
              {i.d}
              {flav(i.n)}
            </small>
          </div>
          <button
            class="buy"
            disabled={dis(coins >= p)}
            onClick={() => {
              if (act((g) => buyBasic(g, k))) {
                beep(880, 0.1, 'triangle', 0.05);
                toast(`${i.e} ${i.n} added to your bag`);
                re();
              }
            }}
          >
            {p} 🪙
          </button>
        </div>
      );
    });
  else if (tab === 'deal') {
    const d = ensure((g) => dailyDeal(g));
    const row = (k: string | null, star: boolean) => {
      const g = k ? GEARK[k] : null;
      if (!g) return null;
      const p = dealPrice(G, g.k, star);
      return (
        <GearRow
          key={g.k}
          g={g}
          star={star}
          sold={d.sold.includes(g.k)}
          price={
            <button
              class="buy"
              disabled={dis(coins >= p)}
              onClick={async () => {
                if (!(await confirm({ title: `Buy ${g.n}?`, body: `It costs ${p} 🪙. You have ${coinsOf(G)} 🪙. You wear it right away.`, extra: <GearCompareView k={g.k} />, yes: 'Buy it' }))) return openBaseShop(tab);
                if (act((x) => buyDeal(x, g.k))) toast(`${g.e} ${g.n} equipped`);
                openBaseShop(tab);
              }}
            >
              {p} 🪙
            </button>
          }
        />
      );
    };
    body = (
      <>
        <p class="hint">One deal a day, plus two regular pieces. Legendary and mythic gear only come from loot.</p>
        {row(d.star, true)}
        {d.more.map((k) => row(k, false))}
      </>
    );
  } else if (tab === 'vault')
    body = (
      <>
        <p class="hint">Premium gear. Earn 💎 gems from elites, bosses, finals and other hard fights.</p>
        {PREMIUM().map((g) => {
          const own = F.gear![g.slot] === g.k;
          const gp = gemPrice(g.k);
          const buy = async (cur: 'gem' | 'coin') => {
            if (!(await confirm({ title: `Buy ${g.n}?`, body: `It costs ${cur === 'gem' ? gp + ' 💎' : g.cost + ' 🪙'}. You have ${cur === 'gem' ? gems + ' 💎' : coins + ' 🪙'}. You wear it right away.`, extra: <GearCompareView k={g.k} />, yes: 'Buy it' })))
              return openBaseShop(tab);
            if (act((x) => buyPremium(x, g.k, cur))) toast(`${g.e} ${g.n} equipped`);
            openBaseShop(tab);
          };
          return (
            <GearRow
              key={g.k}
              g={g}
              price={
                own ? (
                  <span class="price">Equipped</span>
                ) : (
                  <div class="buy2">
                    <button class="buy gem" disabled={dis(gems >= gp)} onClick={() => void buy('gem')}>
                      {gp} 💎
                    </button>
                    <button class="buy" disabled={dis(coins >= g.cost)} onClick={() => void buy('coin')}>
                      {g.cost} 🪙
                    </button>
                  </div>
                )
              }
            />
          );
        })}
      </>
    );
  else {
    const nT = talentPoints(F);
    const desc: Record<Service, string> = { physio: 'Cure all your injuries', respec: `Refund all ${nT} talent points`, box: 'A random piece of gear, any rarity. Usually common' };
    body = (
      <>
        {SERVICES.map((s) => {
          const p = basePrice(G, s.cost);
          return (
            <div class="shopitem" key={s.k}>
              <span class="se">{s.e}</span>
              <div class="st2">
                <b>{s.n}</b>
                <small>{desc[s.k]}</small>
              </div>
              <button
                class="buy"
                disabled={dis(serviceOk(G, s.k) && coins >= p)}
                onClick={async () => {
                  if (s.k === 'respec' && !(await confirm({ title: 'Reset all your talents?', body: 'Every talent point comes back so you can spend it again.', yes: 'Reset them' })))
                    return openBaseShop(tab);
                  const r = act((g) => buyService(g, s.k));
                  if (!r) return;
                  if (s.k === 'physio') toast('All patched up');
                  if (s.k === 'respec') toast(`${r.refunded} talent points refunded`);
                  if (r.gear) {
                    toast(`${RARITY[r.gear.r]?.n}: ${r.gear.e} ${r.gear.n}${r.copy ? '. You had it: a copy for upgrades' : ''}`);
                    if (r.choose) {
                      closeSheet();
                      await gearChoice(r.gear);
                    }
                  }
                  openBaseShop(tab);
                }}
              >
                {p} 🪙
              </button>
            </div>
          );
        })}
        {equippedGear(G).length > 0 && <h3 class="sec-label">Sell gear</h3>}
        {equippedGear(G).map((g) => (
          <div class="shopitem" key={g.k}>
            <span class="se"><GearIcon g={g} /></span>
            <div class="st2">
              <b>{g.n}</b>
              <small>
                {RARITY[g.r]?.n ?? ''} {g.slot}. {g.r === 'premium' ? 'Premium gear sells for very little' : 'Sells for a third of its value'}
              </small>
            </div>
            <button
              class="buy"
              disabled={!open}
              onClick={async () => {
                if (!(await confirm({ title: `Sell ${g.n}?`, body: `You get ${sellValue(g)} 🪙. It's gone for good, including from your armory.`, yes: 'Sell it' }))) return openBaseShop(tab);
                if (act((x) => sellGear(x, g.k))) toast(`Sold ${g.n}`);
                openBaseShop(tab);
              }}
            >
              +{sellValue(g)} 🪙
            </button>
          </div>
        ))}
      </>
    );
  }
  const tabs: [Tab, IconName, string][] = [
    ['basics', 'bag', 'Basics'],
    ['deal', 'star', 'Deal'],
    ['vault', 'gem', 'Premium'],
    ['services', 'gear', 'Services'],
  ];
  return (
    <Sheet
      icon="cart"
      title="Base shop"
      sub={`🪙 ${coins}  💎 ${gems}${hm !== 1 ? (hm < 1 ? `. 🤝 Haggled: ${Math.round((1 - hm) * 100)}% off today` : `. 😤 Prices up ${Math.round((hm - 1) * 100)}% today`) : ''}`}
    >
      <div class="stack">
        {!open && (
          <div class="lockbar">🔒 You're in the middle of chapter {F.story!.ch}. The base shop opens again once you finish it. Merchants on the map sell supplies on the road.</div>
        )}
        <div class="shop-tabs" role="tablist">
          {tabs.map(([k, ic, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} class={`fchip light${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
              <Icon name={ic} /> {n}
            </button>
          ))}
        </div>
        {body}
        {open && !baseHagDone(G) && (
          <button
            class="btn ghost sm"
            onClick={async () => {
              closeSheet();
              await haggleFlow('base');
              openBaseShop(tab);
            }}
          >
            🤝 Haggle (once a day)
          </button>
        )}
        <Inf k="rule|base" class="hint">
          How the base shop works
        </Inf>
      </div>
    </Sheet>
  );
}
export function openBaseShop(tab: Tab = 'basics') {
  openSheet(<BaseShop key={Math.random()} tab={tab} />);
}
