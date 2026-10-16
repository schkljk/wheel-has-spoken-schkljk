# CLAUDE.md: Rebuild "The Wheel Has Spoken"

You are taking over a finished, playable game and rebuilding it properly. The owner wants to hand you this folder and have the work done **without further explanation**. Everything you need is in this file and in `docs/`. Work autonomously, phase by phase, and keep `PROGRESS.md` updated so the owner can see where things stand.

## What this is

**The Wheel Has Spoken** is a mobile-first browser game. Every part of a fighter (race, class, stats, weapon, power, quirks, title…) comes from spinning wheels. Fighters then battle on a combat wheel through a 20-chapter story, cups, a gauntlet, daily challenges, boss rush and a betting fight club, with gear, talents, legacy and goals for long-term progression.

The current version lives in `legacy/`. It works, but it grew over ~30 iterations into one 740 KB HTML file built from ~55 source files that share global variables and override each other's functions. That architecture is the problem, not HTML.

## Setup the owner will NOT do

**The owner works only on a phone.** No computer, no terminal. He uses Claude Code from the Claude mobile app (cloud sessions on a GitHub repo). Never ask him to run commands, install tools, or use a computer.
- If the repo contains `wheel-has-spoken-rebuild.zip`, start by unzipping it so this folder's contents sit at the repo root, delete the zip, and commit.
- Install all dependencies yourself (`npm install`, Playwright browsers, Python packages for the legacy tests).
- Commit and push your work to your branch regularly. Merge to the default branch at the end of each phase so the live build updates (open a pull request and merge it yourself if needed).
- **The owner must be able to play every build on his phone.** In Phase 0, set up a GitHub Actions workflow that builds the game and deploys it to GitHub Pages on every push to the default branch. Do the same for the legacy game (`legacy/dist/wheel-has-spoken.html`, served at `/legacy/`). Turn Pages on through the workflow (`actions/configure-pages` with `enablement: true`); only if that truly fails, tell him the exact taps in GitHub's mobile site to enable Pages (Settings → Pages → Source: GitHub Actions). Put the play links at the top of `PROGRESS.md` and in your messages.
- Keep messages to the owner short and phone-friendly: what changed, the play link, what's next.

## Your mission

1. **Rebuild the game in a modern, typed, modular, optimized codebase**, with the same gameplay, story, balance and content as `legacy/` (exact parity for the battle engine).
2. **Then implement the upgrades** in `docs/UPGRADES.md`, in priority order.

## The owner's rules (do not break these)

- **Mobile-first, portrait phones are the main target**, but it must fit every common screen: phones (320×568 up to 430×932), tablets, desktop, and phones held sideways. Nothing may be cut off. The page itself never scrolls; only list panels (shop lists, collection, armory lists, bracket) may scroll inside themselves.
- **Fight screen:** the arena scene fills the whole screen. Fighters stand on the horizon; the combat wheel stands on the arena floor below them; only essential info (HP, energy, round x/limit, one read clue). Everything else lives in the ☰ fight menu. Fighters must never jump around when the layout changes.
- **All game modes in one place:** the Play tab. Bottom tab bar: Play, Fighter, Goals, More.
- **Pixel-art icons**, not vague emojis, for the interface. Content (races, gear, items, moves) should eventually get pixel icons too (see upgrades).
- **Writing style:** descriptions and flavor text are meme-inspired, dark and dry, Supercell-style witty. Mechanics stay clear and separate from the joke (mechanics line + italic flavor line).
- **Reads are words, never percentages:** Clear as day / Pretty sure / Probably / Maybe / Just a hunch / Wild guess.
- **Stats are real numbers** that scale with level (rolled stats are modifiers on top). Any time a fighter's numbers change, show a popup with old → new and the difference.
- **Big choices ask for confirmation** (buying gear, selling, salvaging, respec, retire, forfeit, abandon, erase data, entering a boss fight).
- **Lots of tasteful animation:** button press feedback and ripples, springy pop-ups, staggered card entrances, rolling counters. Respect `prefers-reduced-motion`.
- **No monetization, no season pass, no live-service timers.** It is not being distributed yet. Daily challenge and the daily deal are fine; nothing that punishes missing days.
- **Do not change story, gameplay or balance during the rebuild phases.** Parity first. Balance changes only in the upgrade phase, and say exactly what changed in `PROGRESS.md`.
- **Don't make progression grindier.** "More progression" means more content and goals, not slower leveling.

## Tech stack (decided, don't re-litigate)

- **TypeScript (strict)** + **Vite**.
- **PixiJS v8** for the fight scene, the wheels (all spinning wheels), character sprites, particles and arena scenery.
- **Preact + @preact/signals** for menus and UI (small, fast). Plain CSS modules or a single tokens file for the design system.
- **Vitest** for unit and parity tests, **Playwright** for end-to-end and screenshot tests.
- **vite-plugin-pwa** so it installs and works offline. Capacitor (Android/iOS) is a later, optional step. Don't add it now, just don't block it.
- Pure game logic (`packages/core`) must have **zero DOM imports** and take an injectable seeded RNG, so it runs identically in tests, in a Web Worker and in the UI.

Suggested layout:

```
apps/game/            Vite app (Preact UI + Pixi scenes)
packages/core/        data + engine + rules (pure TS, no DOM)
packages/core/test/   parity + unit tests
tools/parity/         harness that runs the legacy engine for comparison
legacy/               the old game (read-only reference)
docs/                 design docs (read these)
PROGRESS.md           your running log
```

## Phases and acceptance criteria

Commit at the end of every phase (and often within). Update `PROGRESS.md` each time: what's done, what's next, any decision you made and why.

### Phase 0: Study and set up
- Read `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/UPGRADES.md`.
- Build and run the legacy game: `cd legacy/src && python3 build_core.py && python3 assemble.py`, then open `legacy/dist/wheel-has-spoken.html` in a browser. Play it briefly with Playwright to see every screen.
- Legacy tests: `pip install playwright && python3 -m playwright install chromium`, then run e.g. `python3 legacy/tests/pw_story.py 45 0` and `python3 legacy/tests/pw_matrix.py 390x844`. Screenshots land in `legacy/tests/shots/`.
- Scaffold the new repo layout and tooling.

### Phase 1: Core parity (most important)
- Port all game data (wheels, races, classes, gear, synergies, moves, talents, chapters, bosses, arenas, items, achievements, names…) and the battle engine to typed modules in `packages/core`. The final, effective behavior of the legacy code is what counts. Many legacy functions are overridden or wrapped by later files; `docs/ARCHITECTURE.md` lists them.
- Build `tools/parity`: load `legacy/src/core_new.js` (generated by `build_core.py`) in a Node `vm` context with `Math.random` replaced by the same seeded PRNG you inject into the new engine.
- **Acceptance:** for 2,000 seeded random fighter pairs (mixed levels, gear, mods, round limits incl. sudden death), the new engine produces the same winner, round count and HP results as legacy. Same for fighter generation from a seed and for `numStats`. If an exact match is impossible somewhere (e.g. iteration order), document why and prove the distributions match (win rates within 1%).

### Phase 2: App shell, saves, performance foundations
- Screens and navigation, settings (sound, vibration, fast mode, auto-battle, reduced motion, text size), tutorial.
- Save system: versioned schema with numbered migrations, split storage (active fighter / roster / collection & stats / settings), 3 rolling automatic backups, export/import as a file.
- **Legacy save import:** the old game stores everything under localStorage key `wheel-has-spoken-v1` (schema in `docs/ARCHITECTURE.md`). Support both reading it directly (same origin) and pasting/uploading the JSON (the old game's Settings has "copy save"). Write tests for the importer using real-shaped fixtures.
- The 1,000-fighter ranked pool runs in a Web Worker and is cached for the day.

### Phase 3: Port every screen
Title/roster, fighter building (wheel spins, reroll, "spin the rest"), fighter card, fighter page with bottom tabs (Play / Fighter / Goals / More), story map and events, fights (combat wheel, signature damage wheel, fight menu, results), shops (base shop with lock rule, story merchants, haggling), armory, talents, goals and mastery, collection, cups/bracket, gauntlet, daily challenge, boss rush, fight club, settings and records.
- **Acceptance:** every screen passes a Playwright check at 320×568, 375×667, 390×844, 430×932, 360×800, 412×915, 768×1024, 1024×768, 1280×720, 1440×900, 844×390 and 667×375 with nothing clipped and no page scroll (port the idea of `legacy/tests/pw_matrix.py`). Full story chapter, cup, gauntlet, daily, rush and fight club flows run end to end in Playwright with no console errors.
- Fight runs at 60 fps on a mid-range phone profile (Chrome DevTools CPU 4× slowdown).

### Phase 4: Upgrades
Work through `docs/UPGRADES.md` top to bottom. Each item: implement, test, note in `PROGRESS.md`. Balance items need simulation evidence (before/after numbers).

## Working style

- Make sensible decisions yourself; the owner doesn't want to be asked about details. Only stop if something would break one of the owner's rules above.
- Keep the game playable at the end of every phase (`npm run dev` and `npm run build` work).
- Prefer data-driven content (tables) over code branches, so new races, gear and moves are one-line additions.
- Write the witty flavor text yourself where it's missing, in the same voice as `legacy/src/ui_flavor.js`.
- Commands you should provide: `npm run dev`, `npm run build`, `npm run test` (unit + parity), `npm run e2e` (Playwright), `npm run sim` (balance simulations that print a table).
