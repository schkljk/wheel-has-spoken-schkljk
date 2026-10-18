import {
  ARMORY_CAP,
  GEARK,
  GEAR_SLOTS,
  RARITY,
  SLOT_N,
  UPGRADE_MAX,
  coinsOf,
  copiesOf,
  copyValue,
  salvageCopy,
  salvageStored,
  syncArmory,
  synOf,
  takeOff,
  upgradeGear,
  upgradeLevel,
  upgradeNext,
  wear,
  type Gear,
} from '@whs/core';
import { G, act, toast } from '../state/game';
import { confirm, openSheet } from '../state/ui';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { beep } from '../ui/sound';
import { burst } from '../ui/fx';
import { GearIcon, SlotIcon } from '../ui/GearIcon';
import { GearCompareView } from '../ui/GearCompare';

const ORDER = ['premium', 'mythic', 'legendary', 'epic', 'rare', 'common', 'junk'];
const pl = (n: number, one: string) => `${n} ${n === 1 ? one : one + 's'}`;

/** The armory: every piece the fighter has found, by slot. Swap any time; nothing is lost by swapping. */
export function openArmory(slot?: string) {
  act((g) => syncArmory(g, g.F));
  const F = G.F!;
  const own = (F.armory || []).map((k) => GEARK[k]).filter(Boolean) as Gear[];
  let body;
  if (!slot) {
    const sets = synOf(F).filter((x) => x.k.startsWith('set_'));
    body = (
      <>
        <div class="arm-grid">
          {GEAR_SLOTS.map((s) => {
            const g = GEARK[F.gear![s]!];
            const n = own.filter((x) => x.slot === s).length;
            return (
              <button key={s} class={`arm-slot${g ? ' r-' + g.r : ''}`} onClick={() => openArmory(s)}>
                <span class="as-e">{g ? <GearIcon g={g} /> : <SlotIcon slot={s} />}</span>
                <span class="as-t">
                  <small>{SLOT_N[s]}</small>
                  <b class="ellipsis">{g ? g.n : 'Empty'}</b>
                  <small>{pl(n, 'piece')} owned</small>
                </span>
              </button>
            );
          })}
        </div>
        {sets.length ? (
          <>
            <span class="sec-label">Set bonuses</span>
            {sets.map((x) => (
              <div class="arm-set" key={x.k}>
                {x.e} <b>{x.n}</b> <small>{x.d}</small>
              </div>
            ))}
          </>
        ) : (
          <p class="hint">Wear matching knight, shadow, arcane, clown, pirate, chef, cosmic or royal pieces for set bonuses.</p>
        )}
      </>
    );
  } else {
    const list = own.filter((x) => x.slot === slot).sort((a, b) => ORDER.indexOf(a.r) - ORDER.indexOf(b.r));
    body = (
      <>
        <button class="btn ghost sm" onClick={() => openArmory()}>
          ← All slots
        </button>
        <span class="sec-label">
          {SLOT_N[slot as keyof typeof SLOT_N]} ({list.length})
        </span>
        {list.length ? (
          list.map((g) => {
            const on = F.gear![g.slot] === g.k;
            const L = upgradeLevel(F, g.k);
            const cp = copiesOf(F, g.k);
            return (
              <div class={`shopitem r-${g.r}`} key={g.k}>
                <span class="se"><GearIcon g={g} /></span>
                <div class="st2">
                  <b>
                    <Inf k={`it|gear|${g.n}`}>{g.n}</Inf>
                    {L ? <span class="up-lv"> +{L}</span> : null}
                    {on ? ' ✓' : ''}
                  </b>
                  <small>
                    <span class={`rar r-${g.r}`}>{RARITY[g.r]?.n ?? ''}</span>
                    {g.set ? <span class="rar">{g.set} set</span> : null} {g.d}
                    {L ? <span class="up-fx"> {upgradeNext(G, g.k).now}</span> : null}
                    {cp ? <span class="up-cp"> · {cp === 1 ? '1 copy' : `${cp} copies`}</span> : null}
                  </small>
                </div>
                <div class="buy2">
                  {on ? (
                    <button
                      class="buy ghostbuy"
                      onClick={() => {
                        act((x) => takeOff(x, g.k));
                        openArmory(g.slot);
                      }}
                    >
                      Take off
                    </button>
                  ) : (
                    <button
                      class="buy"
                      onClick={async () => {
                        // what it changes first (upgrade 28)
                        const ok = await confirm({ title: `Wear ${g.n}?`, body: 'Swap back any time. Nothing is lost.', extra: <GearCompareView k={g.k} />, yes: 'Wear it', no: 'Back' });
                        if (!ok) return;
                        act((x) => wear(x, g.k));
                        beep(880, 0.1, 'triangle', 0.05);
                        toast(`${g.e} ${g.n} equipped`);
                        openArmory(g.slot);
                      }}
                    >
                      Wear
                    </button>
                  )}
                  <button class="buy ghostbuy" onClick={() => openForge(g.k)}>
                    {L >= UPGRADE_MAX ? 'Forge ★' : 'Forge'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p class="hint">Nothing for this slot yet. Loot spins, merchants and the base shop all drop gear.</p>
        )}
      </>
    );
  }
  openSheet(
    <Sheet icon="shield" title="Armory" sub={`${own.length} of ${ARMORY_CAP} spaces used. Swap any time`}>
      <div class="stack">{body}</div>
    </Sheet>,
  );
}

/** The forge: one piece's upgrade levels, the next step and its price, its copies, and salvaging. */
export function openForge(k: string) {
  const F = G.F!;
  const g = GEARK[k]!;
  const L = upgradeLevel(F, k);
  const u = upgradeNext(G, k);
  const cp = copiesOf(F, k);
  const on = F.gear![g.slot] === k;
  const back = () => openArmory(g.slot);
  openSheet(
    <Sheet icon="hammer" title={`${g.n}${L ? ` +${L}` : ''}`} sub={`${RARITY[g.r]?.n ?? ''} ${SLOT_N[g.slot].toLowerCase()}. ${g.d}`}>
      <div class="stack">
        <div class="forge-pips" aria-label={`Upgrade level ${L} of ${UPGRADE_MAX}`}>
          {Array.from({ length: UPGRADE_MAX }, (_, i) => (
            <span key={i} class={`pip${i < L ? ' on' : ''}${i >= 3 ? ' copy' : ''}`}>
              +{i + 1}
            </span>
          ))}
        </div>
        {L < UPGRADE_MAX ? (
          <div class="card forge-next">
            <b>
              Next: +{u.L}, {u.step}
            </b>
            <small>
              {L ? `${u.total} in all after it. ` : ''}
              {u.copies ? `Costs ${u.cost} 🪙 and a copy of it (you have ${cp}).` : `Costs ${u.cost} 🪙 (you have ${coinsOf(G)}).`}
            </small>
            <i class="ev-flav">{FORGE_LINES[Math.min(L, FORGE_LINES.length - 1)]}</i>
            <button
              class="btn primary block"
              disabled={!u.ok}
              onClick={async () => {
                const ok = await confirm({
                  title: `Upgrade ${g.n} to +${u.L}?`,
                  body: `It costs ${u.cost} 🪙${u.copies ? ' and a copy' : ''}. ${u.step}${on ? '' : ', once you wear it'}.`,
                  yes: 'Upgrade it',
                });
                if (ok && act((x) => upgradeGear(x, k))) {
                  beep(660, 0.08, 'square', 0.05);
                  beep(990, 0.12, 'triangle', 0.05, 0.08);
                  if (u.L === UPGRADE_MAX) setTimeout(() => burst(), 150);
                  toast(`${g.e} ${g.n} is now +${u.L}`);
                }
                openForge(k);
              }}
            >
              {u.ok ? `Upgrade for ${u.cost} 🪙${u.copies ? ' + a copy' : ''}` : u.why}
            </button>
          </div>
        ) : (
          <p class="hint">Fully upgraded: {u.now}. It will not get any better. Neither will you, emotionally.</p>
        )}
        <span class="sec-label">Copies ({cp})</span>
        <p class="hint">
          A copy comes from loot that lands a piece you already have, and sometimes as a bonus with any gear drop. +4 and +5 take one each.
        </p>
        {cp > 0 && (
          <button
            class="btn ghost block"
            onClick={async () => {
              if (await confirm({ title: 'Salvage a copy?', body: `You get ${copyValue(g)} 🪙. The copy is gone for good.`, yes: 'Salvage it' })) {
                const c = act((x) => salvageCopy(x, k));
                toast(`+${c} 🪙`);
              }
              openForge(k);
            }}
          >
            Salvage a copy (+{copyValue(g)} 🪙)
          </button>
        )}
        {!on && (
          <button
            class="btn ghost block"
            onClick={async () => {
              const extra = cp ? ` Its ${cp === 1 ? 'copy goes' : `${cp} copies go`} too, for coins.` : '';
              const lost = L ? ` Its +${L} is lost.` : '';
              if (await confirm({ title: `Salvage ${g.n}?`, body: `You get a few coins. It is gone for good.${lost}${extra}`, yes: 'Salvage it' })) {
                const before = coinsOf(G);
                act((x) => salvageStored(x, k));
                toast(`+${coinsOf(G) - before} 🪙`);
                return back();
              }
              openForge(k);
            }}
          >
            Salvage {g.n}
          </button>
        )}
        <button class="btn ghost sm" onClick={back}>
          ← {SLOT_N[g.slot]}
        </button>
      </div>
    </Sheet>,
  );
}

/** The smith's running commentary, by level. */
const FORGE_LINES = [
  'The smith squints at it. "I have seen worse. I have made worse."',
  'A little sharper, a little shinier. Still smells the same.',
  'It hums now. That is either good or a warranty issue.',
  'The smith asks if they can keep it. The answer is no.',
  'One more and it becomes the kind of thing people write songs about. Bad songs.',
];
