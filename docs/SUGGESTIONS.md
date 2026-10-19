# Review and suggestions, round 2 (October 2026)

Round 1 (below) is finished: every item was built except the six the owner skipped (A11, B1, B4, E6, E7, F1). This round reviewed the game as it is now, including everything round 1 added. Four reviewers worked in parallel:

- **Player experience:** a new career through chapter 1's boss, plus every mode and every round-1 feature on mid-game saves. Sizes: 390×844, 320×568, 844×390, and 360×800 with huge text.
- **Performance:** the production build on a mid-range phone profile (4× CPU slowdown, Fast 3G).
- **Game design:**
  - 24 whole story runs with the economy tracked;
  - simulations of every new mode, plus paired-fight tests of stats, talents, sets and items;
  - proposed changes tested in memory, with before → after numbers.
- **Bugs and exploits:** the app closed at every step of every flow; saves, imports, two tabs, date changes, a new version deploying; and the new code read line by line.

Every finding below was reproduced, or measured in a simulation. IDs continue from round 1 (G onward), so they can be picked by number. Effort: S is under an hour, M is a few hours, L is a day or more.

## What works now

- **Decisions matter:**
  - Following the read wins 66–68%, against 51% on auto-battle.
  - No focus dominates.
  - "Wild guess" is 3% of reads (was up to 68%), and the read words predict accuracy.
- **Every stat has a job:**
  - +2 durability is worth 3.9 points of win rate, speed 3.5, and the others about 2 (round 1: durability 5.5, charisma 0.1).
  - Strong builds now beat bosses more often than average ones.
- **Nothing lost on close (with the exceptions in G2, G5 and G6):**
  - Steps after a fight resume exactly and never pay twice.
  - Run opponents and boon offers come from the run's own seed.
  - The legacy import refuses junk.
  - The app works offline after the first load.
- **Clean:**
  - No console errors and an empty error log across a long session of every mode.
  - No clipping or page scroll at any size, huge text included.
  - Icon buttons have labels.
- **The voice:** tips, boons, locker items and the boss tune-up line land.

## G. Bugs, exploits and rule breaks (fix first)

| ID | Problem | Fix | Effort |
|---|---|---|---|
| ~~G1~~ | ~~**Fight results piled their text on top of itself.**~~ A chapter-cleared result was unreadable at every size, and nothing scrolled. The cause: the scroll box and the list inside it shared a class, so the box's rows could shrink to nothing. **Fixed during the review:** the lines and the recap now stack and scroll. A new e2e check for overlapping text fails on the old style. | | done |
| ~~G2~~ | **Closing the app mid-fight is a free retry, and closing it mid-spin re-rolls the wheel.** Reproduced:<ul><li>A lost story boss: grit stayed 3/3 and the record 0–0.</li><li>A cup final.</li><li>The daily challenge: its one attempt a day was bypassed.</li><li>A Spin & Run fight.</li><li>The loot spin during spoils.</li></ul>The cause: dice are re-seeded on every launch, wheel landings use `Math.random`, and a loss is only written when the result shows. | Every fight gets a stored seed, and its moves are saved as they happen. On reopening, the fight replays to where it was (the engine is deterministic). Each wheel's landing is rolled from a stored die before the animation. | done |
| ~~G3~~ | **The first session after an update breaks screens.** Spin & Run's tile does nothing, and a story fight shows its HUD but never starts, because the new version's files replace the old ones under the running page. The next launch works. | A "New version: tap to reload" prompt, and an automatic reload when a screen fails to load. | done |
| ~~G4~~ | **Starting a new fighter silently throws away a build in progress** ("Keep building Keeper One" is gone after one spin of a new fighter). This breaks the rule that big choices confirm. | Ask "Scrap Keeper One's spins?" in the danger style. | done |
| ~~G5~~ | **An Awakening or "New weapon" upgrade is lost if the app closes during its spin.** The level is used up before the upgrade spin starts. | Save the upgrade as a pending step in the same write, and resume into it. | done |
| ~~G6~~ | **Boss rush and tower runs are not saved.** After 3 bosses, Continue offers "Start the rush". | Keep both runs in the save with their own seed, like Spin & Run. | done |
| ~~G7~~ | **A save from a newer version gets wiped by older code** (a stale tab, an older APK, a rolled-back deploy). The newer save is called "damaged", a fresh one starts, and the first write erases it. | On a newer-version save, block all writes and say "Update the game to open this save". | done |
| ~~G8~~ | **Two tabs overwrite each other.** Retire in one tab and Continue in an old one: legacy points go back to 0, and retiring again lists the fighter twice in the hall of fame. | A save generation number: a tab with an older one reloads instead of writing. | done |
| ~~G9~~ | **The fight's tap targets are 34 px again.** A later style rule for the collection filters overrides round 1's A13 fix. It also hits the duel's day chips, the fight club's bet chips and the shop tabs; the ☰ button is 40×37 and the 1×/2× button 40×30. | Scope the filter rule to the filters, and give the HUD buttons a 44 px hit area. | done |
| ~~G10~~ | **The loot reveal vanishes before you can read it:** 1.7 s, 0.85 s in fast mode, 0.43 s with reduced motion. Gear goes on automatically; the only sign is a "Defense −2" popup. | New gear, and anything rare or better, waits for a tap. Reduced motion keeps the reading time. | done |
| G11 | **Spin & Run is a free collection farm:** 60 runs of "spin, walk away at once" filled 367 of 993 collection entries and paid 12 gems. | The picks join the collection when the run pays out, and only after a win. | S |
| ~~G12~~ | **Changing the phone's date refreshes the dailies, backward too:** a new daily challenge and daily wheel on every switch, and past duels pay their 8 coins again. | Remember the latest day seen; the daily things only move forward. | done |
| G13 | **The daily duel ranks losses backwards:** losing in 3 rounds scores better than losing in 12, and every loss stores 0 HP, so nothing breaks ties. | A loss scores by the HP the opponent had left (lower is better). | S |
| ~~G14~~ | **The save safety net misses the new fields:**<ul><li>One damaged bounty entry makes every win show "Something went wrong".</li><li>Pasting a save too big for storage deletes every backup, including the undo copy.</li><li>A split write can half-save: the gem is kept, the coins are not.</li></ul> | Repair checks for the new fields. Import writes into free space first. A two-step commit. | done |
| ~~G15~~ | **Rule breaks crept back:**<ul><li>Percentages: Spin & Run's "100% HP", the duel's best score, "read 25% better" from the informant, "20% better" from the scouting report.</li><li>The runner's and the mentor's stat changes show no old → new popup.</li><li>"Likeable −0% crit" in red.</li><li>Stale help text: it says a win pays 3 coins, a loss 1, and rerolls cost 2. All three are wrong now.</li></ul> | Real HP numbers and words, the stats popup for any fighter on screen, and corrected text. | done |
| ~~G16~~ | **Small bugs:**<ul><li>Two quick taps on "Prize money" pay twice.</li><li>A half-spun level-up carries over to another fighter.</li><li>Ghost codes accept level 100000 (1 million HP) or level "abc".</li><li>Spin & Run's arena wheel is weighted for the career fighter.</li><li>A date before 2026 shows "Duel #-30".</li></ul> | One guard each; ghost codes clamp level, bonuses and gear. | done (one part waits: the "Duel #-30" date) |

## H. Player experience

| ID | Problem | Fix | Effort |
|---|---|---|---|
| ~~H1~~ | **New modes unlock silently.**<ul><li>"Chapter 1 cleared" says only "Next up", though the tower, hard mode and a cup just opened.</li><li>New tiles get no "New" badge.</li><li>The More tab (Locker, Ghost codes) never gets a dot.</li><li>The gem counter can't be tapped.</li><li>Two lock texts are wrong: "Chapter 2 or level 10" really needs chapter 2 cleared, and the tower's text has the same problem.</li></ul> | "Unlocked: …" lines on the chapter card, a one-time "New" ribbon, and a tap on gems to show what they buy. Reword the locks. | done |
| H2 | **Spin & Run doesn't connect to the rest of the game.**<ul><li>Walking away pays out with no summary.</li><li>You never see your runner's card, and "every wheel, all at once" doesn't actually spin.</li><li>"Patch up" is offered at full HP.</li><li>Run wins count toward neither bounties nor goals, though a throwaway fighter is the natural way to hunt a race bounty.</li></ul> | A payout card, a quick reveal plus a "Your runner" card, no heal at full HP, and run wins counting toward bounties and goals. | M |
| ~~H3~~ | **The boss confirmation comes before the boss information.** "Face Big Tony?" shows only your HP. Level, HP, tune-up and gem bonus appear after you confirm. | Make the intro the confirmation, with "Fight" and "Not yet". It also saves a tap. | done |
| ~~H4~~ | **The level-up "Keep one" hides the real numbers** ("+1 to everything" against "+2 Strength"). With two level-ups waiting, both say "reached level 6". | Show each option's old → new, like gear compare, and "Level-up 2 of 2". | done |
| ~~H5~~ | **Bounties and riddles can't be steered.**<ul><li>23 of the 24 bounties need a roll only 1–11% of fighters get: about one career in 40.</li><li>Nothing tells you when a fighter fits one.</li><li>The riddles start 15 screens down the collection.</li></ul> | A "fits Fiona" tag, sorted first. At least one bounty your roster can do. A Riddles jump. "Solves a riddle" on the fighter card. See L1. | done |
| H6 | **Auto-battle from the fight menu lasts one fight:** 3 taps every fight to keep it on. | Keep it on until it's turned off. | S |
| ~~H7~~ | **The Locker sells blind:** two color swatches for 5–8 gems. | Tap to see a wheel wearing it before buying. | done |
| ~~H8~~ | **Ghost codes are 717 characters.** | Encode the picks as indexes (about 60 characters) and offer the phone's share sheet. | done |
| ~~H9~~ | **Polish:**<ul><li>The mentor doesn't appear on the Fighter tab ("+1 iq" in lower case).</li><li>The pinned goal "Silverware 0/1" doesn't say "win a cup".</li><li>The HUD says 83/100 HP and the result 93/100 (the +10 after a win isn't named).</li><li>A loss shows "+0 🪙".</li><li>A disabled "Pay for intel" doesn't say why.</li><li>Three tips stack before the very first spin.</li><li>At 320 px the opponent's HUD has no edge gap.</li><li>In landscape, only the story card fits on the Play tab.</li></ul> | One small fix each. | done |

## J. Performance (mid-range phone profile)

Measured on the production build at 4× CPU, the median of at least 3 runs.

| Since round 1 | Round 1 | Now |
|---|---|---|
| From load to the first race wheel | 6.4 s | about 3.3 s |
| Startup long tasks for a new player | 29 tasks; 4.7 s of sprite warm-up | 3–4 tasks, 2.3 s |
| WebGL contexts over 16–20 fights | 49 | 3 |
| Idle title, main-thread JavaScript | 81 ms/s | 37 ms/s (mostly music) |
| Save writes per fight cycle | about 25 × 10 ms | about 12 × 2 ms |
| Heap | 10.6 MB after 1 fight | 15.4 MB after 20, flat |
| Main chunk, gzipped | 272 KB | 288.6 KB |

What's left are one-time stalls when Pixi starts up and on the build and card screens. A fight itself is light: 5–10% of the main thread.

| ID | Measured | Fix | Gain | Effort |
|---|---|---|---|---|
| J1 | **Building a fighter resizes the wheel's canvas 36 times** (a regression). The result box under the wheel grows and shrinks with each result, the wheel's box follows, and every change resizes the WebGL canvas: 73 callbacks and 589 canvas size writes per build. | Give the result box a fixed height, and skip resizes under about 40 px. | No jank on every spin | S |
| J2 | **A Pixi start-up check freezes the main thread for 2.3–3.9 s** about 6 s after launch. If you tap quickly, it lands on the first spin instead (1.3–2.8 s). It reads pixels back from a GPU canvas. | Patch the check to use a CPU canvas: long tasks 4.8 s → 1.6 s in a test. | The stall is gone | S |
| J3 | **All WebGL setup waits for the first tap.** Three contexts are made and the first shaders compiled when the first wheel opens: 3.0 s from tap to the race wheel. The first fight of a session opens with a 1.4–2.3 s task. | Warm up one Pixi app during idle time after launch. | About 0.1–0.4 s on a phone, off the first wheel and the first fight | S |
| J4 | **Emojis are redrawn as pixel art on every launch:** 2.7 s of main-thread work per fighter build and 0.6 s per arena or trial wheel. The game has 504 distinct emojis. | Bake an atlas at build time with the existing `tools/art/bake.ts`; the art then also looks the same on every phone. | About 2.7 s less per build | M |
| J5 | **The fighter card reveal runs 2 s of simulations on the main thread:** a 160-fight win rate (1.15 s) and a 600-fighter population (1 s) that never changes. | Compute the population at build time, and run the win rate in the existing simulation worker. | About 2 s less at the reveal | S |
| J6 | **Opening the hub freezes for 1.4 s**, and 92% of its page is icon pixels: 2,073 of the Play tab's 2,256 elements are the rectangles of 23 icons. | Draw icons as cached images. | About 90% fewer elements, and 100–150 ms less per hub render | S–M |
| J7 | **The music is synthesized note by note:** 34 ms/s of JavaScript on the idle hub and about 80 audio nodes a second, about 15% of the game's JavaScript in fights. | Render each loop once into a buffer and play that on repeat. | About 5% less main-thread work in menus | M |
| J8 | **The main chunk grew to 288.6 KB gzipped,** because every screen is imported up front: 2.2 s to download on Fast 3G. | Load the fight, spin, map, bracket, collection and card screens, the flows and the story text when needed. | 50–60 KB less, about 0.45 s sooner on Fast 3G | M |
| J9 | **The collection lays out 3,944 elements at once.** | `content-visibility: auto` on its categories: 950 → 620 ms in a test. | 330 ms | S |
| J10 | **Small costs at startup:**<ul><li>The first date formatting takes 122–155 ms and runs on every action.</li><li>Rewording the data tables at load takes 66–77 ms.</li><li>The title builds full fighter sprites for its faces (about 440 ms).</li><li>Fonts are found late on Fast 3G.</li></ul> | Format the date by hand, reword at build time, cache the face images, and preload the two title fonts. | About 0.7 s in total | S |
| J11 | **Small leaks and repeated work:**<ul><li>About 6 GL textures are leaked per fight.</li><li>The emoji cache has no limit.</li><li>Some tabs serialize the whole save twice on every render.</li><li>A fighter build writes the profile 47 times.</li></ul> | Destroy the textures, cap the cache, and memoize the serialization. | Memory, smoother taps | S |

## K. Balance and economy (from simulations)

Each of these changes how the game plays, so each ships with before and after simulation numbers in PROGRESS.md.

| ID | Problem | Fix | Effort |
|---|---|---|---|
| K1 | **Premium gear bought with gems makes the story trivial.**<ul><li>A full premium kit wins 88–92% against random fighters of the same level, against 53% for six random pieces.</li><li>The Coat of a thousand stars alone adds 22 points; an average story can afford it by chapter 4.</li><li>With the kit, average builds win Act I boss fights 92% of the time instead of 58%, and every weak build reaches chapter 10 instead of 38%.</li><li>Two premium pieces, the Crown of rizz and Gambler's halo boots, do nothing.</li></ul> | One premium piece per fighter, available after Act I. The Coat loses its revive (+22 → +9.5). The two dead pieces get a real effect. | S |
| K2 | **The fight club insider prints money.**<ul><li>Backing the side the insider tips returns 27% per coin on half the matchups.</li><li>The tip is free at 45 charisma, and "New matchup" is unlimited.</li><li>That makes about 3,000–5,000 coins an hour, against 2,200 for the whole story; after 100 bets you're behind less than 1% of the time.</li></ul> | A tighter line, a slightly lower payout, an insider who tells the odds in words but no dirt, and the matchup kept until you bet. After: the insider +3% on a third of matchups; blind bets −5% to −10%. | S |
| K3 | **Spin & Run: "+2 levels" does nothing and boon choices barely matter.** Opponents level with you, so the boon is wasted. Smart picks beat random ones by only 0.3 wins, and 10% of runs lose fight 1. | Opponents' levels by fight number, not yours: smart picks 4.2 → 4.7 wins, and finished runs 14% → 21%. One second wind per run (the first loss leaves you at 60% HP): runs with no wins 9.6% → 4.8%. | S |
| K4 | **Daily duel days are lopsided.** On 19% of days you have under 15% to win, and on 18% over 85%. | Re-roll the day's matchup until it's between 25% and 75%. Everyone still gets the same one. | S |
| K5 | **Wheelborn trials: a bumpy ladder and a levelling wall.**<ul><li>Average builds win 38, 33, 63, 46, 50, 29, 38, 38, 33 and 33% across the ten trials; weak builds 0–8%.</li><li>Levels 34–50 take 20 to 230 more chapter-20 fights after the story.</li></ul> | Trials at levels 32–41, which halves the XP needed, and a retune on 100 fighters instead of 24. | S–M |
| K6 | **Revives are the new durability.** Stubborn adds 10.7 points, Second wind 8.6, Lucky break 8.1. Most of the Coat's value is its revive. The talent tree sells two revives, though only one counts. | One revive node per tree, or label them "doesn't stack", plus K1's Coat change. | S |
| K7 | **Crit and dodge are nearly worthless, and two sets are useless.**<ul><li>+10% dodge is worth 1.1 points, crit 1.4, damage reduction 3.3. Evasion ×3 adds nothing.</li><li>The rare Knight set beats the epic Cosmic set.</li><li>Shadow is −0.8 and Clown −4.0.</li></ul> | Shadow's first strike each fight can't be guarded; trim Knight's 4-piece; dodge also halves signature damage. | M |
| K8 | **Gems pile up with nothing to buy:** about 300 a story (190 an hour), and everything gems can buy adds up to 412. Gear upgrades vanish when the piece is sold. | Repeatable gem sinks that aren't power (L1, L4, more Locker sets). Upgrades carry over to the next piece in that slot. | M |
| K9 | **Injuries pile up for new players.** 30% of story losses add one, and they never wear off; a weak first fighter stacked 5 in chapter 1. | At most 2 from story losses, healed when a chapter restarts, and "a med kit cures this" on the defeat screen. | S |
| K10 | **Small balance items:**<ul><li>The quick jab is a dud (−3.7% HP swing; its damage would go from 75% to 90%).</li><li>Five fight talents add almost nothing: Life drain, Counterweight, Iron guard, Shield wall, Evasion.</li><li>Outliers: the title Fraud Watch wins 36% (the worst pick in the game), "the Undisputed GOAT" 64%, Uno reverse card 60%; Regeneration is still the top power.</li></ul> | Retune each with paired sims. | S–M |

## L. New features

| ID | Feature | Effort |
|---|---|---|
| ~~L1~~ | **Take the job:** accept a bounty, and its slice is fixed on your next fighter's wheel, for a gem or two. Each bounty then takes one career instead of about 40. *"The wheel takes requests. It charges in dignity."* | done |
| L2 | **Claim or wager:** on a sure win, take it free, or fight it at 60% HP for elite loot and a gem. Today 63% of story fights are claimed. *"Free win, or a stupid risk for shinier junk. You know which."* | M |
| L3 | **Duel par:** a par worked out from 30 simulated players on the day's dice; the share line says "2 under par". Scores become comparable without a server. *"Par is what a pigeon with a plan would score."* | S |
| L4 | **Remix workshop:** spend gems to build your own trial from any boss and two kits, with goals like "Beat 10 remixes". A gem sink that is also content. *"Mix and match bosses like a cursed salad bar."* | M |
| L5 | **Spin & Run relics:** every third boon is a tradeoff, e.g. Glass cannon (+40% damage, −25% HP) or Borrowed time (a full heal, but the run ends in 3 fights). *"Every relic is cursed. Some just admit it."* | M |
| ~~L6~~ | **Synergy hunt goals:** find 10, 25 and 50 synergies. Synergies matter: no synergies wins 45%, four win 57%. *"Two bad ideas, holding hands."* | done |

## Suggested order

1. **Quick fixes and exploits:** G3, G4, G9–G13, G15, G16, K1, K2.
2. **Nothing lost, nothing re-rolled:** G2, G5–G8, G14.
3. **Flow and clarity:** H1–H6, then H7–H9.
4. **Performance:** J1, J2, J3, J5 and J9 first (quick); then J4, J6, J8, J7, J10, J11.
5. **Balance pass with simulation numbers:** K3–K10.
6. **Features:** L1, L3 and L6 first (cheap), then L2, L4, L5.

---

# Round 1 (October 2026): done

Everything here was built, except A11, B1, B4, E6, E7 and F1, which the owner skipped. Kept for reference.

This is a full review of the game after the art, animation and sound passes. Three reviewers worked in parallel:

- **Player experience:** a fresh career through chapter 1 and every Play-tab mode on a mid-game save, at 390×844, 320×568 and 844×390.
- **Performance:** the production build on a mid-range phone profile (4× CPU slowdown, Fast 3G).
- **Game design:** 40,000 simulated fights plus 120 simulated story runs.

The evidence (screenshots, profiles, sim scripts and outputs) is in the session scratchpad. Every item has an ID so it can be picked by number. Effort: S is under an hour, M is a few hours, L is a day or more.

### What already works

- **Presentation:** the pixel wheels, arena scenes, boss intros and the landscape fight layout.
- **Layout:** no clipping, page scroll or console errors on any screen or mode tested.
- **Writing:** the voice lands, and the mechanics line stays separate from the joke.
- **Explaining itself:** odds chips explain ▲▼, gear compare shows the changes, stat changes pop up as old → new, any map step can be previewed, and reads are in words.
- **Safety:** confirmations on boss fights, scrapping and salvage, and first-time tips that can be switched off.

### A. Bugs and rule breaks (fix first)

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

### B. Speed and flow

| ID | Problem | Fix | Effort |
|---|---|---|---|
| B1 | **Building a fighter takes about 2.5 minutes by hand.** "Spin the rest" still takes about a minute and can't be skipped. | A second tap reveals everything at once; only Good and Goated results get a full spin. | S |
| B2 | **Fights are slow by default** (6–12 s a round, a boss about 90 s) and fast mode is buried in Settings. Every fight also opens with a separate arena-wheel screen (about 7 s and a tap). | A 1×/2× toggle in the fight HUD, offered after chapter 1. Spin the arena wheel during the fighters' walk-in. | S / M |
| B3 | A win costs 6–8 taps of follow-up: XP and coins, reward choice, loot wheel, level-up. | One "Spoils" screen. | M |
| B4 | The first-spin "Nudge" offer adds 1.5 s to the first round of every fight. | Stop offering it after it has been ignored 3 times. | S |
| B5 | A reload always lands on the title screen. | A "Continue" button that resumes the last map, fight or bracket. | S–M |
| B6 | Goals list "Reach level 50" above "Win 10 fights". | Sort by closest to done, and pin the next goal on the Play tab. | S |
| B7 | Map previews don't show your level against the fight's, or where the next campfire is. | Show both. | S |

### C. Understanding fights

| ID | Problem | Fix | Effort |
|---|---|---|---|
| C1 | **You can't tell why you won or lost.** The defeat screen says only "+4 XP, lose a grit". The log has no round headers. The bottom half of the screen is empty while a round plays. | A recap card: damage dealt and taken, biggest hit, matchups won, status damage, one tip. Round headers in the log. A live "your Sidestep vs their Strike → dodged" line. | M |
| C2 | The teal "recommended focus" ring is never explained. | One line in the first fight; tapping the read opens a "what beats what" cheat sheet. | S |
| C3 | Cup and gauntlet losses add injuries silently. | Say so, and say how to cure them. | S |

### D. Performance (mid-range phone profile)

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

### E. Game design (from 40,000 simulated fights)

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

### F. New features (best value first)

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

### Suggested order

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
