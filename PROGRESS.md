# Progress

**Play links** (they work once GitHub Pages is switched on, see "Owner action" below):
- New game: https://schkljk.github.io/wheel-has-spoken-schkljk/
- Current game: https://schkljk.github.io/wheel-has-spoken-schkljk/legacy/

**Owner action (one time):** open https://github.com/schkljk/wheel-has-spoken-schkljk/settings/pages on your phone, and under "Build and deployment" set **Source** to **GitHub Actions**. GitHub does not let the workflow do this itself. After that every merge publishes automatically.

- [x] Phase 0: study and set up
- [x] Phase 1: core parity
- [ ] Phase 2: app shell, saves, performance foundations
- [ ] Phase 3: every screen ported
- [ ] Phase 4: upgrades (see docs/UPGRADES.md)

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
