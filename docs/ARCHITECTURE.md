# Legacy architecture (reference for the rebuild)

## Build pipeline

1. `legacy/src/build_core.py` takes the core section of `v3.html` (between `// ===== CORE START =====` and `// ===== CORE END =====`), swaps in `core_tiers.js` and `core_names.js`, splices in `core_add.js` … `core_add10.js` (in that order), replaces `applyBonus`/`levelUp`, and replaces the battle engine with `engine.js`. Output: `core_new.js` (pure game logic plus data, ~2,150 lines, no DOM). **Use `core_new.js` for the parity harness.**
2. `legacy/src/assemble.py` concatenates: the `<head>` and base CSS from `v3.html`, all CSS files, `body.html`, then one `<script>` with `core_new.js` + `art_build.js` + `art_sprite.js` + the UI files in the order listed below. Output: `legacy/dist/wheel-has-spoken.html`.

Everything runs in one global scope. **Later files redefine or wrap functions from earlier files.** Function declarations are hoisted, so the *last* declaration of a name wins everywhere. Some wrappers capture the previous version first (`const _x = x; x = function(){…_x()…}`).

## Core files (pure logic, in splice order)

| File | What it adds |
|---|---|
| `v3.html` core | Base data (races, archetypes, stances, sizes, backstories, weapons, powers, enchantments, weaknesses, chaos, titles, arenas, Wheelmaster effects), `randomFighter`, `eff`, odds helpers, `verdict`, `fullName`, `headToHead`, `winRate`, `simulate` |
| `core_tiers.js` | 14-tier stat scale (`TIERNAMES`, `tiers()`), flatter odds |
| `core_names.js` | Meme name generator (`randName`), ~5M combinations |
| `core_add.js` | Sub-race and specialty wheels, quirks, synergies (`SYN`, `synOf`), traits system (`traitsOf`, `T_ADD` / `T_MUL` / `T_MAX` / `T_BOOL` key lists), injuries, achievements, `ALL()` helper, `MOD_SRC` |
| `core_add2.js` | Gear (`GEAR`, `GEARK`, `gearOf`, `randomGear`), contracts, talents (old list), seasons, `flattenOdds` (square-root flattening of all wheel weights) |
| `core_add3.js` | +16 races (with sub-wheels), +11 archetypes (with specialty wheels and `ULTS` signature names), +17 backstories, +17 titles, race→class pulls. Wraps `traitsOf` to add race/class `fx`. Defines `fw()` (flatten weight helper). |
| `core_add4.js` | `RARITY` (junk → mythic), boots slot (`GEAR_SLOTS`), 43 new gear pieces, **redefines `gearOf` and `randomGear`**, Sidekick wheel (`SIDEKICKS`), 8 weapons, `MUTATORS` (daily challenge), new achievements. Wraps `traitsOf` for sidekicks. |
| `core_add5.js` | +32 synergies with `fx`, trait amplifier (all trait `fx` values ×1.5, pets ×1.3), wraps `traitsOf` to include synergy `fx`. `traitsBase()` = traits without synergies. |
| `core_add6.js` | Talent tree (`TREE`, `TNODE`, 5 branches × 12 talents, 118 ranks), `TIER_LVL`, `TIER_PTS`, `talMap` (migrates old array format), `talRank`, `talEcon` (Fortune economy effects), `branchPts`. **Redefines `talentsOf`**. Adds `lfx` (legacy perk traits). |
| `core_add7.js` | Charisma wheel (`cha`, inserted after IQ), charisma mods on races/classes/backs/titles, premium gear (`RARITY.premium`, `GEM_PRICE`) |
| `core_add8.js` | Helmet, gloves and cape slots, 49 gear pieces, gear sets (knight/shadow/arcane/clown) as synergies, `SLOT_N`, `SLOT_E`, `setCount` |
| `core_add9.js` | **Move kits:** `ARCH_KIT` (2 per class), `RACE_KIT` (1 per race), `weaponKit(w)`, `kitMoves(f)` |
| `core_add10.js` | Growth wheel (`GROWTH`, after charisma), `LS(f)` level scale, `numStats(f)` displayed numbers |
| `engine.js` | The battle engine (replaces the original): `newBattle`, round limits and sudden death, buffs/debuffs, move-kit effects, AI kit usage, level-scale damage ratio |

## Battle engine API

```js
const bt = newBattle(A, B, quiet, opts)
// opts: { arena, mods:[m0,m1], maxRounds (default 12), suddenDeath }
// mods per fighter: { hp, maxHp, en, readB, revive, dmgX, halfHp }   hp/maxHp are in "engine units" (100 = normal)
bt.start() -> events[]        // intro events
bt.plan()  -> plan for P[0]   // the opponent's telegraphed move + accuracy (for the read clue)
bt.step(c0, m0) -> events[]   // c0 = 'strike'|'guard'|'power'|'feint'|'focus'|'dodge'|'ult', m0 = round modifier object (rm)
bt.over, bt.w (winner index), bt.round, bt.P[0..1], bt.maxR, bt.sd (sudden death active), bt.snap()
```

- **Engine HP units:** every fighter has 100 engine HP (bosses more via `mods.maxHp`). Real displayed HP = engine HP × `LS(f)`. Damage between fighters is multiplied by `LS(att)/LS(def)`, so level matters while flat heals and DoTs stay "% of max HP". The engine converts amounts in log events and `snap().hr` / `snap().mx` to real numbers. **Keep this model in the rebuild**: it is what makes the numbers work.
- **Round modifier (`rm`)** fields used by moves and flavors: `dmgX, first, slow, counterX, dodge, enCost, label, e, hits, miss, gamble, pierce, nododge, critPlus, drainX, unholyX, behindBonus, lowBonus, lowTargetBonus, petNow, heal, healMissing, en, steal, cleanse, buff:{k,v,r}, debuff:{k,v,r}, apply:{s,ch}, summon:{e,n,x}, selfDmg, wish`. Buff keys: `dmgX, dr, critB, vuln, weak`. Status `s`: `burn, poison, bleed, freeze, stun, soak, random`.
- **Events:** `{html, cls, d (real amount), pills[], a (animation: {t, by, to, on, fx, …}), …snap()}`; snap = `{h (hp %), hr (real hp), mx (real max), en, mo (momentum), r (round), …}`.
- RPS: Strike beats Power, Power beats Guard, Guard beats Strike. Feint baits guards; Focus charges energy; Sidestep dodges; Signature (`ult`) at full energy, damage multiplier from `ULT_WHEEL` (`ultWeights(x)`); the player's landed slice is forced via `P[0].ultSpin`.
- Max rounds 12 by default. 20 for elites, cup finals and legend challenges. 30 plus sudden death for story bosses and boss rush, 30 for the World championship final (see `fightRules()` in `ui_prog2.js`). Sudden death: damage ×(1.8 + 0.4 per extra round).

## UI files (load order) and the important overrides

| File | Role |
|---|---|
| `art_build.js` | Vector character fallback (`charSVGVec`) |
| `art_sprite.js` | Pixel sprite generator (70×84 per fighter from race/class/weapon rules), `charSVG(look,{h})`, sprite cache |
| `ui_a.js` | DB load/save (`STORE='wheel-has-spoken-v1'`), `serFighter`/`deserFighter`, roster slots, career, XP (`xpNeed`, level cap 50), `markSeen`, `codexCount`, `saveCareer` (calls `syncArmory` and `statWatch`) |
| `cp_odds.js` | `playerOdds()`: wheel odds shifts (collection-based; luck streaks were removed) |
| `cp_soundwheel.js` | Sound, haptics, wheel canvas drawing |
| `ui_b.js` | Screens (`show`), build flow, card (`cardHTML`, `statRows`), hub (`showHub`, `organizeHub`, `setHubTab`), tournaments, gauntlet |
| `ui_scene.js` | Arena SVG scenery |
| `ui_prog.js` | Fame ranks (`RANKS`, 10 ranks), `gainFame`, `priceOf`, old talents, legacy (`LEGACY`, `lgLvl`), rivals/legends |
| `ui_c.js` | Arena render, HUD, ambient particles (`renderArena`, `applySnap`) |
| `cp_arenahelp.js`, `cp_anims.js` | Fight animations and effects |
| `ui_d.js` | Fight flow (`goFight`, `openFight`, `startFight`, `doRound`, `endFight`, `finishTournament`), `evHTML` |
| `ui_fightfx.js` | Broadcast layout, old signature wheel (`ultSpin`, no longer used for the player) |
| `cp_narr.js` | Fight narration |
| `ui_info.js` | Tap-for-info (`infoHTML`, `findItem`, `RULES`, `STAT_INFO`, `ik()` keys `it|cat|name`, `rule|x`, `mv|name`) |
| `ui_story.js` | Story mode: `CHAPTERS`, `BOSSES`, `LASTCH`, `newChapter`, `storyEnsure` (save migrations v2/v4), map, events, campfire, `storyEndFight`, `makeBoss`, bag (`openBag`) |
| `ui_cw.js` | Combat wheel: `renderMoves`, `cwSlices` (kit moves + basics), focus chips (Attack/Defend/Skill/Special), `cwSpin`, `cwLand`, `cwCommit`, read pill (`readClue`) |
| `ui_modes.js` | **Overrides `lootList`, `lootTask`, `fightMods`.** Daily challenge, boss rush, fight club, mode cards (`renderModes`) |
| `ui_prog2.js` | Ranked pool (`FPOOL`, `poolBuild`, `poolPick`), **overrides `storyOpponent`, `openTalents`, `applyLegacyStart`, `useItem`, `renderShop`, `merchant`, `renderMerchant`, `updateReroll`**, `CH_PCT`, `MERCHANTS`, `fightRules()` |
| `ui_econ.js` | Gems (`awardGems`), haggling (`haggleChance`, `openHaggle`), **base shop `renderShop` (final), `merchant`/`renderMerchant` (final)**, scarcer rewards, `sellValue` |
| `ui_armory.js` | Armory (`syncArmory`, **`gearChoice` (final)**, `openArmory`), `confirmBig` + `CONFIRM_RULES` capture listener, `readClue` |
| `ui_kit.js` | Move strip on cards (`kitStrip`), `findMove`, Moves collection section, `markKits` |
| `ui_act2.js` | Chapters 11–20, bosses, achievements, merchants, `act2Migrate`, `rushBosses()`, sets `LASTCH` |
| `ui_goals.js` | Goals (`GOALS`, `track`, `trackMax`, `checkGoals`), class mastery (`MASTERY`, `addMasteryWin`, wraps `applyLegacyStart`), collection milestones, Goals tab |
| `ui_numbers.js` | Numeric stat block (`numBlock`), modifier text (`modTxt`), `statWatch`/`showStatPop`, `hpTxt`, `hudHpTxt`, `pctHp` |
| `ui_hubnav.js` | Play tab layout (`playLayout`), bottom nav, wraps `setHubTab` and `renderModes`, ripples, coin bump |
| `ui_icons.js` | Pixel icon set (`PXI`, `PXP`, `pxSVG`) and emoji→icon swap (`EMO_ICON`, `iconizeText`, MutationObserver) |
| `ui_flavor.js` | `FLAVOR` one-liners (~310), `flav()`, wraps `infoHTML`, witty mode subtitles |
| `ui_extras.js` | Scout strip, forfeit, speed toggle, settings sheet, tutorial |
| `ui_shell.js` | No-scroll app shell, records sheet, "So far" sheet, `fightDims`/`applyFightVars` (fight layout for any screen), fight menu (`openFightMenu`) |
| `ui_e.js` | Init, toggles, resize |

CSS (in order): `css_add.css`, `style_v7.css`, `css_story.css`, `css_fx.css`, `css_fight.css`, `css_shell.css`, `css_unified.css`, `css_prog2.css`, `css_clarity.css`, `css_econ.css`, `css_anim.css`. Later files override earlier ones, often with `!important`. Treat the final computed look as the spec, not any single file.

## Global state (UI)

`DB` (save), `F` (active fighter), `T` (current tournament or mode context: `{tier, story, node, daily, rush, challenge, gauntlet, rounds, r…}`), `G` (gauntlet), `BT` (battle), `curOppF`, `curArena`, `Q` (queue of follow-up tasks after a fight, consumed by `nextQ`), `BR` (boss rush run), `FC` (fight club), `FPOOL` (ranked pool).

## Save format (localStorage key `wheel-has-spoken-v1`)

`DB` (one JSON object):

```
spins, entered, won, champs[], sound, fast, coins, gems, seen{cat:[keys]}, last[], champIds{}, lastTop[],
career (active fighter, synced into slots), retired[], nemesis, season{n,tourneys,stats}, patch{race,arch},
patchNotes{season,notes[],unseen}, ach{}, gbest, lastArena, tourney, legacy{pts,perks{}}, rivals[],
slots[3]{career, nemesis, tourney, coins}, active, haptics, autoDefault, tut, lastLegacy,
stats{wins,elites,bosses,chapters,cups,worlds,gauntletBest,dailies,rushes,bets,loot,gearFound,setsDone,topLevel,built},
goalsDone[], mastery{archKey:wins}, colMiles, gearSeen[], dc{date,opp,mut,done,won,streak,lastWin}, rushBest,
deal{date,cid,star,more[],sold[]}, baseHag{date,mult}, gstock
```

Fighter (`serFighter`):

```
name, picks{wheelKey: item name | '__skip'}, bonus{stat:n}, boons[{n,e}], fame, tp, talents{nodeKey:rank} (old saves: array),
challenge, chalLvl, story{ch,ng,rows[][],row,picks,hp(0–100 = % of max),grit,cleared[],seenIntro,used,stock,stockRow,gearOffers,
hagMult,hagDone,v2,v3,v4}, bag{itemKey:n}, lootBoost, lvl, xp, pendingLv, rec{w,l}, earned[], inj[], next{…mods},
belts{}, defenses, tourneys, fights, gbest, trained, isNem, cid, gear{slot:key}, armory[keys], contract, offers
```

Story HP is stored as a percentage (0–100) and shown as real HP via `hpTxt()`.

## Known weak spots (fix during the rebuild)

- Global scope and override chains (above) cause bugs like the chapter-order bug (old-save migration re-applied to new chapters).
- The ranked pool rebuilds every session on the main thread (~3 s idle).
- One save key holds everything; no automatic backups.
- CSS layered with `!important` over 11 files.
- Emoji icons for content; `ui_icons.js` swaps interface emojis at runtime with a MutationObserver (replace with real components).
