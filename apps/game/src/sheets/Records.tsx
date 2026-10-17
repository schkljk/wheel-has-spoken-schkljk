import { LEGACY, buyLegacy, codexCount, legacyCost, lgLvl, type Champ, type PatchNote, type Retired } from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { G, act, go, save } from '../state/game';
import { openSheet } from '../state/ui';
import { Sheet } from '../ui/kit';
import { Inf } from '../ui/Info';
import { landSound } from '../ui/sound';

/** Season patch notes: what the game buffed and nerfed. */
export function openPatchNotes() {
  const pn = G.save.profile.patchNotes as { season: number; notes: PatchNote[]; unseen?: boolean } | null;
  if (!pn) return;
  act((g) => ((g.save.profile.patchNotes as { unseen?: boolean }).unseen = false));
  openSheet(
    <Sheet icon="scroll" title={`Season ${pn.season} patch notes`} sub="Last season's tournaments plus 400 league fights played behind the scenes">
      <ul class="pn">
        {pn.notes.length ? (
          pn.notes.map((n) => (
            <li key={n.txt} class={n.up ? 'up' : 'down'}>
              <b>
                {n.up ? '▲' : '▼'} {n.txt}
              </b>
              <small>{n.why}</small>
            </li>
          ))
        ) : (
          <li>No changes this time. Not enough fights to judge yet.</li>
        )}
      </ul>
    </Sheet>,
  );
}

function StatsList() {
  const p = save.value.profile;
  const st = p.stats;
  const rows: [string, number | string][] = [
    ['Tournaments won', p.won],
    ['Tournaments entered', p.entered],
    ['Fights won', st.wins ?? 0],
    ['Elite wins', st.elites ?? 0],
    ['Bosses beaten', st.bosses ?? 0],
    ['Chapters cleared', st.chapters ?? 0],
    ['Cups won', st.cups ?? 0],
    ['World titles', st.worlds ?? 0],
    ['Best gauntlet streak', Math.max(st.gauntletBest ?? 0, p.gbest)],
    ['Daily challenges won', st.dailies ?? 0],
    ['Loot spins', st.loot ?? 0],
    ['Gear found', st.gearFound ?? 0],
    ['Fighters built', st.built ?? 0],
    ['Highest level', st.topLevel ?? 0],
    ['Wheel spins', p.spins],
  ];
  return (
    <div class="card build">
      {rows.map(([k, v]) => (
        <div class="build-row" key={k}>
          <small>{k}</small>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

/** Records, seasons, legacy perks, the collection and the hall of fame. */
export function RecordsSheet() {
  const s = save.value;
  const p = s.profile;
  const cc = codexCount(G);
  const champs = p.champs as unknown as Champ[];
  const retired = s.roster.retired as unknown as Retired[];
  return (
    <Sheet icon="cup" title="Records and legacy" sub="Seasons, legacy perks, collection and the hall of fame">
      <div class="stack">
        <StatsList />
        <div class="card">
          <div class="row">
            <b class="grow">Season {p.season.n}</b>
            <small>{p.season.tourneys} of 3 tournaments played</small>
          </div>
          <p class="hint">After every 3 tournaments, the game buffs whatever keeps losing and nerfs whatever keeps winning.</p>
          {p.patchNotes && (
            <button class="btn ghost sm" onClick={openPatchNotes}>
              Read the latest patch notes
            </button>
          )}
        </div>
        {p.lastLegacy ? <p class="note sub center">Your last fighter left {p.lastLegacy} ✦ of legacy</p> : null}
        <div class="card legacy">
          <div class="row">
            <Inf k="rule|legacy" class="grow">
              <b>Legacy</b>
            </Inf>
            <span>{p.legacy.pts} ✦ to spend</span>
          </div>
          <p class="hint">Retiring a fighter earns legacy points based on their level, belts, titles and rank. Perks help every fighter after them.</p>
          {LEGACY.map((x) => {
            const lv = lgLvl(p, x.k);
            const cost = legacyCost(G, x.k);
            return (
              <div class="shopitem" key={x.k}>
                <span class="se">{x.e}</span>
                <div class="st2">
                  <b>
                    {x.n} {lv ? `(${lv}/${x.max})` : ''}
                  </b>
                  <small>{x.d}</small>
                </div>
                {cost == null ? (
                  <span class="price">Maxed</span>
                ) : (
                  <button
                    class="buy"
                    disabled={p.legacy.pts < cost}
                    onClick={() => {
                      if (act((g) => buyLegacy(g, x.k))) {
                        landSound(3);
                        openSheet(<RecordsSheet />);
                      }
                    }}
                  >
                    {cost} ✦
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div class="card">
          <div class="row">
            <b class="grow">Collection</b>
            <span>
              {cc.f} of {cc.t} found
            </span>
          </div>
          <div class="xpbar">
            <i style={{ width: `${Math.round((cc.f / cc.t) * 100)}%` }} />
          </div>
          <button class="btn ghost sm" onClick={() => go({ screen: 'codex' })}>
            Open the collection
          </button>
        </div>
        <h3>Hall of fame</h3>
        <p class="hint">Only the top 10 champions stay. The best can return as legends to challenge future fighters.</p>
        {champs.length ? (
          <ol class="hall">
            {champs.slice(0, 15).map((c, i) => (
              <li key={i}>
                <span class="mini">{c.look ? <FighterSprite look={c.look} h={46} /> : c.e || '🏆'}</span>
                <span class="grow">
                  <b class="ellipsis">{c.n}</b>
                  <small>{c.s}</small>
                </span>
                <small>{c.d}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p class="hint">No champions yet. Win a tournament to get your fighter in here. Champions can come back later as reincarnations.</p>
        )}
        {retired.length > 0 && (
          <>
            <h3>Retired legends</h3>
            <ol class="hall">
              {retired.slice(0, 15).map((c, i) => (
                <li key={i}>
                  <span class="mini">{c.look ? <FighterSprite look={c.look} h={46} /> : null}</span>
                  <span class="grow">
                    <b class="ellipsis">{c.n}</b>
                    <small>{c.s}</small>
                  </span>
                  <small>{c.d}</small>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </Sheet>
  );
}
