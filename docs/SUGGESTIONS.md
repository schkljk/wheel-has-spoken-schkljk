# Review and suggestions (October 2026)

This is a full review of the game after the art, animation and sound passes. Three reviewers worked in parallel:

- **Player experience:** a fresh career through chapter 1 and every Play-tab mode on a mid-game save, at 390×844, 320×568 and 844×390.
- **Performance:** the production build on a mid-range phone profile (4× CPU slowdown, Fast 3G).
- **Game design:** 40,000 simulated fights plus 120 simulated story runs.

The evidence (screenshots, profiles, sim scripts and outputs) is in the session scratchpad. Every item has an ID so it can be picked by number. Effort: S is under an hour, M is a few hours, L is a day or more.

## What already works

- **Presentation:** the pixel wheels, arena scenes, boss intros and the landscape fight layout.
- **Layout:** no clipping, page scroll or console errors on any screen or mode tested.
- **Writing:** the voice lands, and the mechanics line stays separate from the joke.
- **Explaining itself:** odds chips explain ▲▼, gear compare shows the changes, stat changes pop up as old → new, any map step can be previewed, and reads are in words.
- **Safety:** confirmations on boss fights, scrapping and salvage, and first-time tips that can be switched off.

## A. Bugs and rule breaks (fix first)

| ID | Problem | Fix | Effort |
|---|---|---|---|
| A1 | **The daily streak resets if you skip a day** (`core/game/modes.ts` `dailyState`: the streak only survives if the last win was yesterday; the pay goes 11 → 19 coins). This breaks the no-FOMO rule. | Count daily wins in a row whenever they're played, not by calendar day. | S |
| A2 | **HP thresholds in 24 descriptions say "HP" but mean %.** "Below 45 HP" is really 45% of max HP (about 100 HP at level 12). | Write "45% HP"; keep fixed amounts as "heals 20 HP". The data tables must stay equal to legacy (the content parity test), so change the wording through display overrides, the way `RULES_NOW` does. | S |
| A3 | A tip says "the boss is at the bottom". The boss is at the top and you walk up (`data/content/tips.ts`). | Reword. | S |
| A4 | **Unfinished choices are lost when the phone kills the app:** a finished fighter build, a pending reward, loot or gear choice, an open encounter. Encounters and opponents also re-roll on reload, which invites save-scumming. | Save pending steps and resume straight into them. | M |
| A5 | **The loot sheet suggests downgrades:** "Wear new" is always first, even for a common piece replacing an epic one. Armory rows show no better/worse cue. | Tag options Upgrade/Downgrade and list the better one first. Add ▲▼ on armory rows and a "Wear best" button. | S–M |
| A6 | Talents are spent on a single tap with no undo, and a learned talent gets a red, error-looking border. | The 3-second undo from gear swaps; a gold border. | S |
| A7 | The "Stats changed" popup covers choices on reward sheets and talents. | Show it at the top while a sheet is open, or wait until the sheet closes. | S |
| A8 | **Percentages are still shown:** "100% to win", "Top 86% of 1000" (which means about 860th), fight club "95% to win", "Beats about 31%". | Words ("Heavy favorite") and ranks ("Rank 860 of 1000"). | S |
| A9 | **The fighter card buries the fighter:** the scouting report pushes name, sprite and rating below the fold. "Speed 16" in the report vs "64 Speed" in the grid. A green "+2" beside a penalty. | Fighter first, report collapsed; show only the effect. | S |
| A10 | The build counter's total keeps changing ("1 of 21", then "2 of 22", then "4 of 23"). | Count the sub-wheels from the start, or say "21+". | S |
| A11 | Stat wheels have upside-down labels on their left half. | Rotate the text to read outward on both halves. | S |
| A12 | The base shop shows no lock mid-chapter but can't be used. | "Opens after this chapter" with a lock badge. | S |
| A13 | Small text and tap targets in fights: HP numbers 10.6 px, focus chips 34 px tall, momentum pips 12 px. Grit hearts and the belt have no accessible names. | HP text at least 13 px, targets at least 44 px, labels. | S |

## B. Speed and flow

| ID | Problem | Fix | Effort |
|---|---|---|---|
| B1 | **Building a fighter takes about 2.5 minutes by hand.** "Spin the rest" still takes about a minute and can't be skipped. | A second tap reveals everything at once; only Good and Goated results get a full spin. | S |
| B2 | **Fights are slow by default** (6–12 s a round, a boss about 90 s) and fast mode is buried in Settings. Every fight also opens with a separate arena-wheel screen (about 7 s and a tap). | A 1×/2× toggle in the fight HUD, offered after chapter 1. Spin the arena wheel during the fighters' walk-in. | S / M |
| B3 | A win costs 6–8 taps of follow-up: XP and coins, reward choice, loot wheel, level-up. | One "Spoils" screen. | M |
| B4 | The first-spin "Nudge" offer adds 1.5 s to the first round of every fight. | Stop offering it after it has been ignored 3 times. | S |
| B5 | A reload always lands on the title screen. | A "Continue" button that resumes the last map, fight or bracket. | S–M |
| B6 | Goals list "Reach level 50" above "Win 10 fights". | Sort by closest to done, and pin the next goal on the Play tab. | S |
| B7 | Map previews don't show your level against the fight's, or where the next campfire is. | Show both. | S |

## C. Understanding fights

| ID | Problem | Fix | Effort |
|---|---|---|---|
| C1 | **You can't tell why you won or lost.** The defeat screen says only "+4 XP, lose a grit". The log has no round headers. The bottom half of the screen is empty while a round plays. | A recap card: damage dealt and taken, biggest hit, matchups won, status damage, one tip. Round headers in the log. A live "your Sidestep vs their Strike → dodged" line. | M |
| C2 | The teal "recommended focus" ring is never explained. | One line in the first fight; tapping the read opens a "what beats what" cheat sheet. | S |
| C3 | Cup and gauntlet losses add injuries silently. | Say so, and say how to cure them. | S |

## D. Performance (mid-range phone profile)

| ID | Measured | Fix | Gain | Effort |
|---|---|---|---|---|
| D1 | **Icon readbacks stall up to 3.2 s** (`toDataURL` on canvases while WebGL runs): 3.2 s on the arena Info popup, 0.9 s on the fight result. In a micro-benchmark, 20 readbacks took 1.9 s by default and 18 ms with `willReadFrequently`. | `getContext('2d', { willReadFrequently: true })` on every canvas that is read back. | Seconds of stalls removed | S |
| D2 | **Startup sprite pre-warming:** 107 sprites, 4.7 s of main-thread work and 29 long tasks; the first race wheel takes 6.4 s to appear right after load. | Pre-bake race, class and weapon icons at build time, or draw them in a worker. | About 3 s sooner to the first wheel | M |
| D3 | The sprite engine makes about 1 MB of garbage per sprite, and the same sprite is built three times by different caches. | Typed arrays in the pixel buffer; one shared sprite cache. | About 40% faster builds | S–M |
| D4 | A new WebGL context for every screen: 49 in 16 fights, with 0.8–1.5 s stalls on teardown. | One persistent Pixi app that moves between screens. | No more GL setup and teardown | M |
| D5 | The combat wheel is redrawn 4–5 times a round with the same slices (24% of fight JavaScript). | Skip unchanged redraws; cache rim and hub by size. | About a quarter less fight CPU | S |
| D6 | Win-odds simulations (120 fights, 468 ms) run on the main thread at fight start. | Run them in a worker, or split them up. | No hitch at fight start | S–M |
| D7 | The title wheel keeps the GPU busy (81 ms/s of main thread). | A CSS-animated wheel image on the title screen. | Battery | S–M |
| D8 | Bundle: the main chunk is 272 KB gzipped. The offline cache carries the lab worker, the WebGPU renderer and an unused icon. | Lazy-load screens and the share card; exclude the unused files from the cache. | About 110 KB less download | S / M |
| D9 | Every save write re-reads all 3 backups (about 10 ms per action at 4×; about 25 writes per fight cycle). | Keep the backup index in memory. | Smoother taps | S |
| D10 | Caches without size limits; evicted fighter textures are never destroyed. | LRU limits, and destroy on eviction. | Memory | S |
| ~~D11~~ | ~~Music kept adding audio nodes (also when switched off); audio load rose from 3.6% to 14.4% in 30 s.~~ **Fixed now:** finished voices are disconnected, and nothing is scheduled with music off. Load stays at 3–8%. | | | done |

## E. Game design (from 40,000 simulated fights)

Every change here moves balance, so each needs before/after simulation numbers. Bosses need a retune after E1–E4.

| ID | Problem | Fix | Effort |
|---|---|---|---|
| E1 | **Decisions are worth little:** following the read wins 54% vs 50% for auto-battle, and even perfect knowledge only 59%. The wheel overrides the chosen focus (Defend gives a Guard only 59% of the time). | You choose WHAT and the wheel chooses HOW HARD: every slice of a focus wheel stays in that family. Prototype: following the read goes from 56% to 65% in chapter 1. | M |
| E2 | **Reads turn into noise in Act II:** 67% "Wild guess" by chapters 18–20. | Keep the AI's skill out of your read, halve the IQ slope, and floor reads at "Just a hunch" except against tricksters. | S |
| E3 | **Durability is the only stat that matters:** +2 durability is worth +5.5 points of win rate, +2 speed +1.4, IQ +0.8, charisma +0.1. | Speed adds defense against strikes and IQ against powers; power mastery lowers power cost; IQ boosts crit damage. | M |
| E4 | **Healing beats damage:** Regeneration wins 69%, and 7 powers do worse than no power (Arcane missiles 39.7%). Mage 39.9% vs Necromancer 64.1%. | Heal a share of missing HP, fading after round 6; one revive per fight from all sources; attack powers ignore some durability. | M |
| E5 | **Story fights are filler (81–95% wins) and bosses are rubber-banded:** in Act II a strong build has the same boss odds as an average one. | Show the boss's tune-up and reward beating it; cap it at +1 level; one elite per row; auto-win with full rewards above 85% odds. | M |
| E6 | **A new fighter takes 5–7 hours to finish the story,** and weak first rolls get stuck in chapters 1–3. | A short run mode (F3) and "beginner's luck" rerolls for the very first career. | M |
| E7 | Gems have few uses; fight-club bets lose 8% on average with nothing to decide; charisma barely matters in fights. | F8, F10, F11. | S–M |

## F. New features (best value first)

| ID | Feature | Effort |
|---|---|---|
| F1 | **Replay links:** share any fight as a link. Fights are seeded and deterministic, so the seed plus your choices fit in about 40 bytes. | S |
| F2 | **Daily Duel:** one date-seeded matchup with the same dice for everyone. Score is rounds and HP left, with a Wordle-style share line. No streak, and past duels stay playable. *"Same fighters. Same dice. Different excuses."* | S |
| F3 | **Spin & Run:** a 20-minute throwaway fighter. 8 fights and a boss; after each win pick 1 of 3 boons. Rewards are account-wide (collection, mastery, a best-run trophy). *"Built in two minutes. Expected to last three."* | M |
| F4 | **Second opinion:** every level-up spins twice and you keep one. More choice, no extra grind. | S |
| F5 | **Bounty board:** three standing build challenges with no timers ("Beat a boss as a Pigeon", "Win a cup with No power"). A new one appears only when one is done. | S |
| F6 | **Synergy riddles:** undiscovered synergies show as riddles in the collection. | S |
| F7 | **The boss sizes you up:** the intro shows the tune-up and pays gems for beating it. *"Big Tony saw your card and called his trainer. From the parking lot."* | S |
| F8 | **Fight club insider:** noisy odds, plus a charisma line or a gem to reveal a fighter's secret, so good bets exist. Predictions in exhibitions. | S |
| F9 | **Ghost codes:** a fighter as a text or QR code that a friend can fight. For when the game is shared. | M |
| F10 | **Mentors:** a retired fighter mentors a new one (+1 to the mentor's best stat, cameos on the map). | S–M |
| F11 | **Earned cosmetics as a gem sink:** wheel rims, pointer charms, knockout confetti, nameplates. No power and nothing to buy. | M |
| F12 | **Wheelborn trials:** an endgame for levels 34–50 with remixed bosses (swapped kits, two phase slices). | M |

## Suggested order

1. **Quick wins:**
   - Fixes: A1–A3, A5–A13.
   - Faster flow: B1, B2 toggle, B4, B6.
   - Performance: D1, D5, D8 cache trim, D9, D10.
2. **Flow:**
   - Resume after the app is closed (A4), the Spoils screen (B3), the fight recap (C1), Continue (B5).
   - Performance: D2, D3, D4, D6.
3. **Balance pass with simulation numbers:** E1–E5 and a boss retune.
4. **Features:**
   - F1, F2, F4, F5, F7 first.
   - Then F3 and the rest.
