import { ARMORY_CAP, GEARK, GEAR_SLOTS, RARITY, SLOT_N, salvageStored, syncArmory, synOf, takeOff, wear, type Gear } from '@whs/core';
import { G, act, toast } from '../state/game';
import { confirm, openSheet } from '../state/ui';
import { Inf } from '../ui/Info';
import { Sheet } from '../ui/kit';
import { beep } from '../ui/sound';
import { GearIcon, SlotIcon } from '../ui/GearIcon';

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
          <p class="hint">Wear matching knight, shadow, arcane or clown pieces for set bonuses.</p>
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
            return (
              <div class={`shopitem r-${g.r}`} key={g.k}>
                <span class="se"><GearIcon g={g} /></span>
                <div class="st2">
                  <b>
                    <Inf k={`it|gear|${g.n}`}>{g.n}</Inf>
                    {on ? ' ✓' : ''}
                  </b>
                  <small>
                    <span class={`rar r-${g.r}`}>{RARITY[g.r]?.n ?? ''}</span>
                    {g.set ? <span class="rar">{g.set} set</span> : null} {g.d}
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
                    <>
                      <button
                        class="buy"
                        onClick={() => {
                          act((x) => wear(x, g.k));
                          beep(880, 0.1, 'triangle', 0.05);
                          toast(`${g.e} ${g.n} equipped`);
                          openArmory(g.slot);
                        }}
                      >
                        Wear
                      </button>
                      <button
                        class="buy ghostbuy"
                        onClick={async () => {
                          if (await confirm({ title: `Salvage ${g.n}?`, body: 'You get a few coins. It is gone for good.', yes: 'Salvage it' })) {
                            const before = G.save.roster.slots[G.save.roster.active!]!.coins;
                            act((x) => salvageStored(x, g.k));
                            toast(`+${G.save.roster.slots[G.save.roster.active!]!.coins - before} 🪙`);
                          }
                          openArmory(g.slot);
                        }}
                      >
                        Salvage
                      </button>
                    </>
                  )}
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
