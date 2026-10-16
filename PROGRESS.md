# Progress

**Play links** (live once Phase 0 is merged to `main` and Pages has deployed):
- New game: https://schkljk.github.io/wheel-has-spoken-schkljk/
- Current game: https://schkljk.github.io/wheel-has-spoken-schkljk/legacy/

- [ ] Phase 0: study and set up (done locally; waiting on GitHub push access to publish)
- [ ] Phase 1: core parity
- [ ] Phase 2: app shell, saves, performance foundations
- [ ] Phase 3: every screen ported
- [ ] Phase 4: upgrades (see docs/UPGRADES.md)

## Phase 0 log

**Done**
- Unzipped the rebuild package to the repo root and removed the zip.
- Read `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/UPGRADES.md`.
- Legacy game builds (`npm run legacy:build`) and the rebuild is byte-identical to the committed `legacy/dist/wheel-has-spoken.html`.
- Legacy tests run: `pw_matrix.py 390x844` OK, `pw_story.py 45 0` played chapter 1 with no console errors.
- Scaffolded npm workspaces: `apps/game` (Vite + Preact + signals + PixiJS v8 + PWA), `packages/core` (pure TS, seeded RNG), `tools/parity`, `tools/sim`.
- Parity harness foundation: `tools/parity/legacy.ts` loads `legacy/src/core_new.js` into a Node `vm` context with `Math.random` replaced by the injected seeded PRNG (`mulberry32`). Tested: deterministic per seed.
- Placeholder app shell: full-height, no page scroll, bottom tabs (Play / Fighter / Goals / More), spinning Pixi wheel, link to the current version.
- Workflows: `ci.yml` (typecheck, unit + parity tests, Playwright e2e on branches/PRs) and `pages.yml` (on push to `main`: build the new game, build the legacy game into `/legacy/`, enable and deploy Pages).

**Commands**
- `npm run dev`, `npm run build`, `npm run test` (unit + parity), `npm run e2e` (Playwright), `npm run typecheck`, `npm run legacy:build`. `npm run sim` is wired and gets its script in Phase 1/4.

**Decisions**
- Pinned versions that are well established rather than brand-new majors: TypeScript 5.9, Preact 10, Vite 7.3.6, Vitest 4.1.11, PixiJS 8.22. Vitest 3 was dropped because its `tinypool` dependency has a critical advisory; `npm audit` is clean.
- `.npmrc` sets `legacy-peer-deps=true` to work around an npm 10 crash on Vitest 4's optional peer dependencies.
- `@playwright/test` is pinned to 1.56.0 (matches the Chromium build available in the cloud container; CI installs its own browser).
- PRNG for parity: `mulberry32`, shared by both engines.

**Blocker**
- Pushing to GitHub was refused (403: the Claude GitHub App has no access to this repo). The work is committed locally and will be pushed as soon as access is fixed.

**Next (Phase 1)**
- Port data tables (races, classes, wheels, gear, synergies, moves, talents…) and the battle engine to typed modules in `packages/core`, in the final effective form of the legacy override chain.
- Parity tests: 2,000 seeded fighter pairs (winner, rounds, HP), seeded fighter generation, `numStats`.
