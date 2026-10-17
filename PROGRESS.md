# Progress

**Play links:**
- New game: https://schkljk.github.io/wheel-has-spoken-schkljk/
- Current game: https://schkljk.github.io/wheel-has-spoken-schkljk/legacy/

- [x] Phase 0: study and set up
- [x] Phase 1: core parity
- [x] Phase 2: app shell, saves, performance foundations
- [x] Phase 3: every screen ported
- [ ] Phase 4: upgrades (see docs/UPGRADES.md)

## Phase 4 log: upgrades

Upgrades from `docs/UPGRADES.md`, top to bottom. Done so far:

- [x] 1. Balance pass for the numeric system

### 1. Balance pass (story difficulty)

**How it was measured.** `npm run sim` now also plays whole stories: a headless player (`tools/sim/story.ts`) walks the map with the real rules (fights on auto-battle, rewards, loot, level-ups, talents, campfires, events) with weak, average and strong builds (the worst, median and best of 8 random fighters). It reports, per chapter, how many runs clear it, the level at the clear, the win rate of regular fights and bosses, and chapter restarts. `--cups 1` lets the player win some levels in a cup after each restart (the side modes). Auto-battle is the same AI the opponents use, so a player who reads the clues does better than these numbers.

**What was wrong.** Bosses re-tuned themselves to the player (up to 8 extra levels) toward odds that fell 2 points per chapter, and some bosses were walls (Titan Prime, Queen Hivemind and the Wheelmaster gave an average build at the chapter's level 2-8% per try). Levels barely helped, so players restarted chapters until the dice agreed, which made them over-leveled (level 21 at the end of Act I) and still stuck. The weakest builds mostly could not finish chapter 1.

**What changed** (all in `packages/core/src/data/balance.ts`; the old numbers stay in `LEGACY_BALANCE`, which the parity tests use):
- Bosses sit one level above their chapter (was three) and only toughen when the player is well above the aimed odds, by at most 3 levels (was 8), so levels won anywhere count.
- Each boss has a stat tier shift and an HP value, tuned over 13 rounds of 90 whole story runs (`tools/sim/tune-bosses.ts`) toward an average build winning about 72% of tries in chapter 1, falling to 54% at the end of Act I, and 42% to 28% across Act II. HP stays within 60-160% of the old values.
- Regular opponents in chapters 1-3 come from a slightly weaker slice of the ranked pool (chapter 1: the weakest 18% instead of 3-30%), so the weakest builds can get going. Later chapters are unchanged.
- XP, chapter levels and rewards are unchanged: nothing got grindier.

**Before and after** (40 runs per build, story only unless noted):

| | Old game | Now |
|---|---|---|
| Weak builds that clear chapter 1 | 40% | 63% (95% with side modes) |
| Average build: finishes Act I | 60%, at level 21 | 70%, at level 18 |
| Average build: boss wins per try, Act I | 16-49% | 32-72% |
| Average build: finishes Act II, story only | 55% | 55% |
| Average build: finishes Act II, a cup after each restart | not measured | 98% (about 10 cups per run) |
| Weak build: finishes Act II with side modes | not measured | 78% (about 17 cups) |
| Strong build: finishes Act I / Act II | 90% / 60% | 95% / 80% |

So an average build clears Act I around level 18 (16 for strong builds) with few restarts; Act II bosses are tougher and most players who play only the story stall somewhere in it, while a few cups get almost everyone through. Notes: Frost Queen and the Sandman (chapters 16-17) stay a little easier than aimed even at their caps (a breather); the First Wheel is the hardest boss at about 30% per try.

## Phase 3 log: every screen ported

**What you can do in the new version now:** everything the old version does. Spin a fighter (flick the wheel with your finger or tap Spin, one free reroll, or "spin the rest for me"), read their card, then play the 20-chapter story (map, events, campfires, merchants with haggling, the bag, bosses), cups with brackets and nemeses, the gauntlet, the daily challenge and daily wheel, boss rush and the fight club. Gear in the armory, the base shop (with the lock rule and the daily deal), talents, goals and class mastery, the collection, records and legacy all work. Old saves keep working.

**Rules** (`packages/core/src/game`): career, story, loot, shops, cups, gauntlet, daily, rush and fight club rules act on the save with an injected random source, no DOM. Story fights, gauntlet runs and whole cups (with season rolls) match the old game exactly in seeded side-by-side tests.

**Screens** (`apps/game`):
- Every wheel is a PixiJS wheel with real physics: a flick's speed sets the spin, friction varies a little each time, pegs can bounce a crawling wheel back, and a spin under 1½ turns doesn't count. Combat and signature wheels pick the result first and spin to it (as before, so the odds are unchanged).
- The fight is one Pixi scene: arena scenery with ambient particles, both fighters on the horizon (pixel sprites ported pixel for pixel), the combat wheel on the floor below them, hits, floating numbers and banners. Only HP, energy, round x/limit and the read are on screen; the rest is in the ☰ fight menu (odds, auto-battle, fast mode, skip, fight log, their card, help, settings, forfeit). Fighters keep their place when the layout changes.
- Flows that used to be a task queue are plain async steps, so every screen can be reached and left cleanly.
- Reduced motion (phone setting or Settings, Animations: calm): wheels land in half a second and fights only pause briefly per event.

**Tests:** unit and parity tests (`npm run test`), and Playwright:
- `screens.spec.ts`: every screen (building, landed wheel, so-far sheet, card, title, all four tabs, talents, armory, full card, shop tabs, fight club, bag, records, collection, chapter intro, map, arena wheel, fight, fight menu, result, bracket, gauntlet) at all 12 required sizes, nothing clipped, no page scroll, no console errors.
- `modes.spec.ts`: a whole story chapter including the boss, a cup from round one to the end, the gauntlet until it ends, the daily challenge, a boss rush and a fight club bet, all end to end with no console errors.

**60 fps check** (`npx tsx tools/dev/fps.ts`: Chrome with the CPU 4× slower, 390×844 at 2× density, full animation, a story fight on auto):
- The game's work per frame (fight updates plus Pixi's drawing) is 5–6 ms at the median, a third of the 16.7 ms a 60 fps frame allows. All JavaScript together used 3.8% of the main thread over 15 s of fighting; the biggest single cost is measuring text for floating damage numbers.
- The cloud machine has no GPU, so it draws in software: even a static page only reaches 40 fps there (19 fps at 2× density) and the fight shows 2–4 fps. A trace showed 94% of that time is Chrome copying the WebGL canvas back in software, which phones with a GPU don't do. So the frame rate itself can only be confirmed on a phone; the CPU budget, which is what the 4× slowdown tests, has plenty of room.
- The hit-flash shader now compiles during the fighters' entrance instead of on the first hit (a 34 ms hitch at 4× slowdown).

**Fixes to old text and one exploit** (no gameplay or balance change):
- Reaching Eternal said "1 talent point" but gave 3; the text now says 3.
- Winning a rival challenge said "+10 coins" but paid 6; the text now says 6.
- The daily challenge intro now shows the coins a win really pays.
- The gauntlet's info said the wrong coin reward per win; it now says 1 coin.
- Selling a gear piece from the armory left a copy behind, so it could be sold again. Selling now removes it.

**Decisions**
- The old game's optional "Claude narration" button only worked inside the Claude app's artifact viewer, so it is not ported.
- The "who is this?" figure shown before the race wheel lands is the old game's no-race silhouette; its older vector renderer is not ported.
- Layout bugs found by the 12-size check were fixed at the root: sheets and the build screen now give content one column that can shrink, so a long odds chip or name can't push the page wider than the phone.
- Screens that show the live fighter re-render after every change (a bug where abandoning a cup still showed it "in progress" until you left the tab).
- Under reduced motion, "spin the rest" could pick from the previous wheel's slices (and freeze if that wheel had more slices). Spins now always use the wheel on screen.

**Next (Phase 4):** the upgrades in `docs/UPGRADES.md`, top to bottom.

## Phase 2 log: app shell, saves, performance foundations

**What you can do in the new version now:** bring over your save from the old version (it finds it automatically when both run on the same site, or paste the text from the old game's Settings, Back up your save), see your fighters with their real numbers, moves, synergies and build, your goals and class mastery, your records, change settings, take the tour, back up and restore your save. Fights, the story and the modes come in Phase 3; the Play tab shows them as "Soon" and links to the current version.

**Save system** (`packages/core/src/save`):
- Versioned schema with numbered migrations. Version 0 is the old game's raw save, so importing it is migration #1; it repeats the old game's own load-time repairs (old single-fighter saves move into slot 1, old tokens become coins, missing parts get defaults). Anything unknown is kept in `profile.extra`, nothing is dropped.
- Split storage: settings, roster, the active fighter (written on its own, it changes most) and profile (collection, records, goals, legacy...). Unchanged parts are not rewritten.
- Three rolling automatic backups (at most one every 20 minutes), plus a backup before every import, restore and erase, so all of them can be undone. A damaged save falls back to the newest good backup. When storage is full, old backups make room.
- Export as a file or as copied text; import from a file, pasted text, or the old version's save on the same site (never modified).
- Fighters keep the old save format (picks by name); `serFighter`/`deserFighter` are ported and checked against the real legacy game.
- Tests: real-shaped fixtures made by playing the legacy game with a seeded RNG (`tools/fixtures/legacy-saves.ts`), an old single-fighter save and the old clipboard text.

**Ranked pool:** 1,000 fighters rated over 5,000 simulated fights (same Elo rules as before) now build in a Web Worker instead of freezing the phone at startup, and the ranking is cached for the day (about 4 KB). Each pool fighter is rebuilt from the day's seed, so only the ranking order is stored.

**App shell** (`apps/game`): title screen with your three fighters, hub with Play / Fighter / Goals / More tabs, settings (sound, vibration, fast mode, auto-battle, text size, animations: like my phone / calm / full), the tour, save and backup sheet, confirmations for big choices, ripples and springy animations (off when animations are calm). Pixel icons: the 38 legacy icons plus new ones (save, download, upload, trash, back, close, plus, check, clock) in the same style.

**Tests:** 141 unit and parity tests; 19 Playwright tests, including every screen at all 12 required sizes (nothing cut off, no page scroll, no console errors) and the save flows (bring over, paste, file export and import, erase and undo, settings, pool worker and cache).

**Decisions**
- The game always opens on the title screen, as the old one did.
- Story repairs for old saves (old chapter numbering, longer chapters, Act II) run when a fighter's story is played, exactly as in the old game; they arrive with the story in Phase 3.
- The tour still said "Five chapters"; it now says twenty in two acts (text fix, no gameplay change).
- `commit()` changes a copy of the save so every changed part is a new object (a bug where toggles did not update was found by the tests).
- Pixi's screen-reader helper button is kept (it lets screen readers reach canvas content); the layout check skips elements parked far off-screen on purpose.

**Next (Phase 3):** port every screen: fighter building with spinning wheels, fights (combat wheel, signature wheel, fight menu, results), story map and events, shops and haggling, armory, talents, cups, gauntlet, daily challenge, boss rush, fight club, collection.

## Phase 1 log: core parity

**Result:** the whole rules core runs in typed TypeScript (`packages/core`, no DOM, injectable seeded RNG) and matches the legacy game exactly. No approximations were needed anywhere.

**Parity tests** (`npm run test`, all against the real legacy code):
- 2,000 seeded fighters roll identically on all 24 wheels, also with past champions on the reincarnation wheel; names match too.
- Effective stats, traits, synergies, `numStats`, rating, power scale and move kits match for 2,000 fighters with random levels (1–50), gear in all six slots (incl. sets), talents, injuries, legacy perks and boss traits; balance patches and level-ups match.
- **Battles:** 2,000 seeded AI fights with arenas, mutators, story HP, bosses (phase two, the Wheelmaster's wheel), 1–30 round limits and sudden death give the same winner, round count and exact HP, and use the same random draws. 600 fights also match event for event (narration, numbers, animation cues), and 600 player-driven fights (telegraphed move, chosen moves, kit moves, landed signature) match.
- All 66 core data tables and 40 content tables equal the legacy ones.

**What is in `packages/core`:**
- `data/` (typed tables): wheels, gear, synergies, arenas, kits, talents, names, misc; `data/content/`: story (chapters, bosses, events, items, merchants), progression (ranks, legacy perks, goals, mastery, achievements), economy, help and flavor text.
- `fighter.ts` (the 24 wheels, odds shifts, random fighter, level-ups), `stats.ts` (effective stats, traits, talents, gear, numbers), `synergy-tests.ts`, `kits.ts`, `names.ts`, `battle.ts` (the fight engine).
- Fight narration is structured: each event has plain text with `{0}`/`{1}` where names go, the real amount, pills, an animation cue and an HP/energy snapshot.

**Decisions**
- Data was ported with a one-off extraction tool (`tools/parity/extract-data.ts`, `extract-content.ts`) that dumps the legacy tables *after* every legacy patch ran (odds flattening, trait amplification, late additions). Hand-copying ~10,000 lines would risk typos; logic was ported by hand.
- Legacy globals that came from the save (`PATCH` balance patches, `HISTORY` past champions) are an explicit `GameContext` argument now.
- Exact float order is kept where it matters (e.g. pet damage `a*b*ls1/ls2` left to right; the layered traits chain). The tests showed a different grouping changes fight results.
- One legacy quirk kept on purpose: weaknesses with a turn-skip chance don't feed later odds shifts (legacy reused the field name `skip`).
- Story event effects, goal progress counters and unlock checks are rules that act on the save. Their data is ported; their logic comes with the save system and screens (Phases 2–3).

**`npm run sim`** prints balance tables (first version): level gaps, archetypes, races, growth types. Observations for the Phase 4 balance pass, no changes made:
- Same build, +2 levels wins about 61%, +5 about 72% (design doc: 64% / 75%). With random builds the level edge is smaller (+5 ≈ 62%) because builds vary more than levels.
- Necromancer (≈69%), Chosen one, Tank and Paladin are strongest; NPC (≈23%) is far behind (a joke pick; upgrade #16 covers that). Prodigy is the best growth type, Plateau the worst (upgrade #18).

**Next (Phase 2):** app shell and navigation, settings, versioned saves with backups and export/import, the legacy save importer, and the ranked pool in a Web Worker.

## Phase 0 log: study and set up

**Done**
- Unzipped the rebuild package to the repo root and removed the zip.
- Read `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/UPGRADES.md`.
- Legacy game builds (`npm run legacy:build`) byte-identical to the committed `legacy/dist/wheel-has-spoken.html`. Legacy tests ran: `pw_matrix.py 390x844` OK, `pw_story.py 45 0` played chapter 1 with no console errors.
- Scaffolded npm workspaces: `apps/game` (Vite + Preact + signals + PixiJS v8 + PWA), `packages/core`, `tools/parity`, `tools/sim`.
- Placeholder app shell: full height, no page scroll, bottom tabs (Play / Fighter / Goals / More), spinning Pixi wheel, link to the current version.
- Workflows: `ci.yml` (typecheck, tests, Playwright e2e on branches and PRs) and `pages.yml` (on push to `main`: tests, build the new game at `/` and the legacy game at `/legacy/`, deploy to Pages).

**Commands:** `npm run dev`, `npm run build`, `npm run test` (unit + parity), `npm run e2e`, `npm run sim`, `npm run typecheck`, `npm run legacy:build`.

**Decisions**
- Well established versions rather than brand-new majors: TypeScript 5.9, Preact 10, Vite 7.3, Vitest 4.1, PixiJS 8.22. `npm audit` is clean.
- `.npmrc` sets `legacy-peer-deps=true` (works around an npm 10 crash on Vitest 4's optional peer dependencies).
- `@playwright/test` is pinned to 1.56.0 to match the Chromium in the cloud container; CI installs its own browser.
- PRNG: `mulberry32`, injected into both engines for parity.
