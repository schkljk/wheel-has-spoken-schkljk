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
- [x] 2. Pixel-art content icons
- [x] 3. Save safety net
- [x] 4. Fight replay and share card
- [x] 5. More agency on the combat wheel
- [x] 6. Named combo and synergy banners with distinct sounds
- [x] 7. Opponent move history
- [x] 8. Status icons with round counters
- [x] 9. Long-press a slice for a damage preview
- [x] 10. Boss phase two: lighting, music and a unique slice
- [x] 11. AI personalities
- [x] 12. Finisher: slow-motion zoom on the knockout blow
- [x] 13. A visible momentum meter

That's the whole "Combat feel" group (6 to 13). Next up is "Balance and system health" (14 to 18).

- [x] 14. Developer balance dashboard (hidden)
- [x] 15. Soft caps on crit, dodge and damage reduction
- [x] 16. Hidden synergies for joke picks
- [x] 17. Charisma in story events
- [x] 18. Growth types checked and tuned

That closes "Balance and system health". Next up is "Content and long-term progression" (19 onwards).

- [x] 19. The nemesis follows you into the story
- [x] 20. Every chapter has encounters of its own
- [x] 21. Gear upgrades, +1 to +5
- [x] 22. Four new gear sets: pirate, chef, cosmic, royal

### 22. Four new gear sets: pirate, chef, cosmic, royal

- **What changed (content):** 22 new pieces in four sets, each with its own idea, plus set bonuses at 2, 4 and 6 pieces:
  - 🏴‍☠️ **Pirate** (6 rare): extra swings and reads. Tricorn hat, hook hand, captain's coat, salt-stained vest, sea boots and a loud parrot (*"It squawks the move before they make it."*). 2: +5% extra hit chance; 4: +1 strength, +15% damage while behind; 6: acts first, +10% extra hit chance.
  - 👨‍🍳 **Chef** (4 common): the snack set. Toque, kitchen mitts, stained apron, kitchen clogs. 2: a 25 HP snack below 30% HP, once; 4: +2 HP every round, +1 charisma. *"Yes, chef. The secret ingredient is violence."*
  - 🌌 **Cosmic** (6 epic): energy and the signature. 2: start with +10 energy; 4: +1 power mastery, +3 energy every round; 6: signature 25% harder, +8% dodge.
  - 👑 **Royal** (6 legendary): presence, counters, guards. 2: +2 charisma; 4: counters 20% harder, guards block 8% more; 6: takes 8% less damage, +10% damage. *"Uneasy lies the head. Easy lies everyone else, on the floor."*
- They drop from loot, the mystery box, shops and merchants like the rest, opponents can wear them, and they count in the collection (22 gear entries and 11 synergy entries more). Their set bonuses show in the armory's set list, and each has an info card with its joke.
- **Balanced against the old sets** (balance lab, 60,000 fights, win rate vs random same-level opponents):

| Set | 2 pieces | 4 pieces | 6 pieces |
|---|---|---|---|
| Knight (rare) | 57.3% | 66.0% | 69.4% |
| Royal (legendary) | 49.0% | 60.0% | 66.7% |
| Cosmic (epic) | 48.3% | 52.9% | 59.0% |
| Pirate (rare) | 48.0% | 55.3% | 56.8% |
| Arcane (rare) | 46.6% | 49.0% | 55.8% |
| Shadow (rare) | 47.2% | 48.8% | 49.0% |
| Chef (common) | 49.2% | 55.6% | - |
| Clown (common) | 46.6% | 45.9% | - |
| No set | 45.0% | | |

  The first pass had the chef set at 57.3% with 4 cheap commons (+3 HP a round); it's now +2 HP a round. Knight stays the strongest set, so no new set takes its place.
- **Story** (seed 1, 60 runs per strength): reaching the end 30 / 67 / 90% (weak / average / strong) with the new sets vs 27 / 62 / 90% without, within noise.
- The new pieces live in their own table (`data/content/gear-sets.ts`), dealt in through one `gearPool()` behind a `moreSets` switch, so the ported gear table, loot draws and parity are untouched. Two new pieces first reused existing keys and names (Comet boots, Gilded gauntlets); the parity tests caught it, and they were renamed.
- Tested: `gear-sets.test.ts` checks that no key or name clashes with the old gear, that each set has one piece per slot, that the bonuses come in at 2, 4 and 6 pieces and change the fighter, that the old balance keeps them out of loot and bonuses, and that every piece and bonus is in the collection with an info card.

### 21. Gear upgrades, +1 to +5

- **What changed (progression):** any piece you own can be upgraded from +1 to +5 at the **Forge** (Armory → a slot → Forge). Each level costs coins (the piece's value, at least 6 and at most 100, times the level: a common vest goes 6, 12, 18, 24, 30). The last two levels also take a **copy** of the piece.
- **Copies:** loot that lands a piece you already have now gives you a copy instead of salvaging it on the spot. A quarter of all gear drops also come with a bonus copy of something you're wearing. A spare copy salvages for the same coins the piece would, so nothing is lost compared with before. The mystery box works the same way.
- **What a level does**, by slot, so it reads as a number on your card: armor +2% damage reduction per level; helmets +1% damage reduction; boots and capes +1% dodge; gloves and trinkets +1% crit. The stat popup shows the change when you upgrade something you wear. The first try was +1 to the piece's main stat at +1, +3 and +5, and that was far too strong: one +5 piece was worth more than a level, a full +5 kit five levels. Percentages scale evenly.
- **Simulated** (`npx tsx tools/sim/gear-upgrades.ts`, the same fighter with and without, paired seeds, 3,000 fights per cell):

| Against the same fighter | Lvl 10 | Lvl 20 | Lvl 30 |
|---|---|---|---|
| One piece at +5 | 53.5% | 53.6% | 51.8% |
| All six at +3 | 58.8% | 59.5% | 58.0% |
| All six at +5 | 64.3% | 64.2% | 62.8% |
| (scale) one level up | 57.7% | 55.3% | 53.7% |
| (scale) three levels up | 69.0% | 63.6% | 59.6% |

  So a +5 piece is about half a level, and a full +5 kit two levels early on and three to four later.
- **Story:** the bot now upgrades its worn gear, cheapest step first, whenever it has 20 coins to spare. It has no other use for coins, so this is the most it can matter. Reaching the end: 27 / 62 / 90% (weak / average / strong) with upgrades vs 27 / 58 / 82% without. The bot ends the story with 92 coins instead of 1,399 unspent. The first price list (60% of the value per level) gave 32 / 77 / 88%, too big a shift, so prices were raised before shipping.
- Pieces show their level everywhere: "+3" next to the name in the armory and on the card, a gold badge on the Fighter tab's gear row. The forge shows five steps (the copy ones dotted), the next step and its total, the price, your copies, and a running commentary from the smith (*"It hums now. That is either good or a warranty issue."*). Upgrading, salvaging a copy and salvaging a piece all ask first. Salvaging an upgraded piece warns that its level goes and that its copies are salvaged with it.
- Behind a `gearUpgrades` switch. Upgrade levels and copies save only when a fighter has some, so older saves and the parity snapshots are unchanged.
- Tested: `gear-upgrades.test.ts` (6 tests) covers costs and copies per level, the slot bonus reaching the fighter's traits and card, no effect under the old balance, saving and loading, a duplicate drop becoming a copy, how often bonus copies come, and salvaging copies and upgraded pieces. A new e2e test upgrades a +3 vest with a copy at 320 px and checks the steps, the confirmation, the Defense popup and that nothing is cut off.

### 20. Every chapter has encounters of its own

- **What changed (content):** 40 new story encounters, two per chapter, mixed in with the classic twelve. When a chapter still has one of its own left, an encounter step deals it 60% of the time, so a chapter's own two usually both show up and nothing repeats within a chapter. Examples:
  - 🍢 **Mystery skewers** (Night Market): *"The vendor will not say which animal. The vendor will not make eye contact."*
  - 👻 **A ghost with a grudge** (Haunted Highlands): it died mid-punch in 1743 and wants you to finish the fight (an elite).
  - 🦾 **Back-alley implant** (Neon Megacity): a "mostly legal" reflex chip, 75% to get +1 speed for good.
  - 📜 **A contract in brimstone** (Underworld): *"The fine print is on fire."*
  - 🧦 **Lost and found** (the Void): everything that ever went missing, mostly single socks.
  - Every one has a 🗣️ charisma option (30 to 60), like the classic twelve since upgrade 17.
- **Mechanics line, then the joke.** Each option's line under it is written from what it does, so it can't drift: "4 coins. 70%: heal 30% HP. 30%: lose 10% HP". The result shows what happened in bold ("Heal 30% HP") and the joke in italics underneath (*"Delicious. You decide not to know."*). The effects are a small vocabulary (coins, HP, fame, +1 to a stat, next-fight buffs, a free bag item, cures, injuries, blessings, fights, loot, the mystery wheel), so a new encounter is one table row with no code.
- **Balance:** the same kind of small trades as the classic twelve. Story sims (seed 1, 60 runs per strength): reaching the end 27 / 58 / 82% with them vs 30 / 60 / 78% without, within noise.
- Behind a `themedEvents` switch; `npx tsx tools/sim/story-run.ts --off themedEvents` plays without them.
- Tested: `chapter-events.test.ts` (6 tests) checks that every chapter has two, keys are unique, every charisma option is between 30 and 60, and items and stats exist. It also checks that every outcome has its joke, the mechanics lines read right, that a chapter deals only its own and never twice, that the old balance keeps the classic twelve, that effects do what they say (including a gamble landing both ways and charging its cost either way), and that every charisma option locks, opens at 60 and pays out. A new e2e test opens a Night Market encounter on a 320 px phone and checks the option lines, the charisma option, the bold result and the italic joke, with nothing cut off.

### 19. The nemesis follows you into the story

- **What changed (content):** your nemesis now has a story arc. Whoever beat you (in a cup, the gauntlet, or a story fight if you don't have a nemesis yet) waits on the map from the next chapter on: one fight step gets a third option, a dark 😈 card with their name. Tapping it plays an intro like a boss's: their sprite, "They beat you twice, you beat them once", and a typed-out speech about your last fight with the real place, round and HP left: *"Remember the City Circuit? I do. I had it framed."*
- **It escalates.** Every meeting raises the stakes: they come in at least one to three levels over the chapter, with a new piece of gear each time and a sharper AI. The speeches get more unhinged by meeting (first, second, third and later), and depend on what happened last:
  - they won: gloating (*"I named my cat after the round I beat you in. Her name is 7. She bites."*); three wins or more: *"That's 3. I'm getting you a loyalty card. Tenth beating is free."*
  - you won: revenge (*"I sold my house to pay for a coach after Harbor Docks. The coach is a pigeon. It is working."*)
  - you walked past their step: *"You took the other path. I waited there for six hours. With snacks. For two."*
  - their last chance: *"This is it, Rex. Win and I am gone. Lose and I am never, ever going away."*
- **How it ends.** Beat them and you get elite loot, +6 coins and +10 XP; they leave with a line (*"'I let you win. For morale.' Back in two chapters, angrier."*), train (+1 to everything) and come back two chapters later. Beat them three times and they retire for good: +15 coins, +20 XP, +10 fame more and a farewell (*"Gary retires. They open a bakery. Every loaf is shaped like your fist."*). Lose and they get a level stronger and are back next chapter. Skip their step and they are back next chapter too, and they noticed. Their fights go up to 20 rounds, like elites.
- The Play tab's nemesis card now says they'll be on your story map too, with your record against them, and links to a new "Nemesis" rule card. The nemesis keeps the last six fights you had with them (where, round, the winner's HP left), so their speeches can quote them.
- **Simulated** (story runs, the bot takes the nemesis step 70% of the time when its HP is 60% or more; two seeds, 60 runs per strength each):

| Reached the end (weak / average / strong) | Seed 1 | Seed 2 | Both |
|---|---|---|---|
| Without the nemesis | 27 / 70 / 77% | 20 / 60 / 90% | 24 / 65 / 84% |
| With the nemesis | 30 / 60 / 78% | 18 / 73 / 83% | 24 / 67 / 81% |

  The same within noise: the nemesis is an optional elite-sized fight. An average build meets them about 6.6 times over the 20 chapters, wins 78% of those fights, and retires about 1.5 nemeses per story.
- Behind a `storyNemesis` switch in `data/balance.ts`, so the old game's rules (story losses make no nemesis) still hold for the parity tests. `npx tsx tools/sim/story-run.ts --off storyNemesis` plays without it, and the story table now prints nemesis fights per run.
- **Two layout fixes found on the way.** On a 320 px phone, three choices on one map step squeezed their names to one letter each ("F", "E", "G"); this already happened on rest steps with three options. Choices now go two to a line when three don't fit. In landscape, the map's boss row sat under the dock; the map now picks how many steps to show from its real height and scrolls inside itself as a last resort. The boss intro's typed line was a single line cut at the screen edge (7 of the 26 boss lines on a 320 px phone). It now wraps, with the rest of the line held invisibly in place so nothing moves while it types.
- Tested: `nemesis.test.ts` (8 tests) covers a story loss making a nemesis who remembers the fight (but not a boss, and not under the old balance). It also checks that they show up once on a fight step of the next chapter, notice a skipped step, open with the right kind of speech, come back stronger after a loss and retire after three, get a level stronger when they win, and remember a gauntlet loss by its name. A new e2e test loads a save with a nemesis, checks the Play card, the map step at 320×568 and 844×390, and the speech, then plays the fight to a result with a 😈 line. The nudge e2e test now gives its opponent more HP, because the growth tuning made its seeded fight end in one punch.

### 18. Growth types checked and tuned

- **What changed (balance):** Prodigy and Unstoppable were the best growth types by a wide margin, and Plateau was a trap. New level-scale numbers (start × growth per level; 1.00 × 1.00 is Steady):

| Growth | Old | New |
|---|---|---|
| 🌟 Prodigy | 1.05 × 1.15 | 1.04 × 1.06 |
| 🚀 Unstoppable | 0.88 × 1.40 | 0.88 × 1.32 |
| 🏔️ Plateau | 1.10 × 0.70 | 1.10 × 0.78 |

  Early bloomer, Late bloomer and Steady are unchanged. Prodigy is still better at everything than Steady and the best growth until about level 30; Unstoppable still starts slowest and is still the best from level 40 up. Plateau still barely grows; it just no longer turns a level-50 fighter into a punching bag.
- **Simulated** (`npx tsx tools/sim/growth.ts --n 4000`, add `--legacy` for the old numbers; 4,000 lab fighters per level with random gear and sets, same seeds before and after):

| Win rate vs random same-level opponents | Lvl 1 | Lvl 10 | Lvl 20 | Lvl 30 | Lvl 40 | Lvl 50 |
|---|---|---|---|---|---|---|
| Prodigy, before → after | 53.6 → 52.9% | 55.1 → 53.3% | 58.3 → 55.6% | 59.9 → 55.6% | 60.9 → 55.2% | 60.7 → 55.5% |
| Unstoppable, before → after | 42.6 → 42.8% | 52.1 → 49.0% | 55.5 → 52.7% | 57.7 → 54.9% | 58.9 → 55.7% | 60.7 → 57.5% |
| Plateau, before → after | 53.0 → 53.1% | 45.3 → 48.0% | 41.8 → 45.3% | 37.4 → 42.2% | 38.3 → 44.0% | 35.2 → 40.7% |
| Late bloomer (unchanged) | 40.2% | 48.5% | 51.4% | 54.1% | 52.0% | 53.7% |

  Against their own Steady twin (same fighter, only the growth differs), at levels 20 / 40: Prodigy 67 / 70% → 60 / 61%, Unstoppable 64 / 69% → 59 / 62%, Plateau 33 / 27% → 41 / 36%.
- No progression change: levels and XP are untouched; only how much a level is worth for these three types. The numbers sit in `GROWTH_TUNE` behind a `growth` switch in `data/balance.ts`, so the wheel table and parity are untouched (parity tests run with the old numbers and pass).

### 17. Charisma in story events

- **What changed (content):** every one of the 12 story encounters has a 🗣️ talk option on top of its usual choices. It needs charisma (30 to 60, the number on the card) and is always better than the normal options: free treatment at the doctor, talking a street fighter or an ambush out of a fight for fame, haggling the smith down to 6 coins, getting the spy's intel for free, a loot box that can't bite, and so on. Each has its own line when it works (*"They tell you everything. They also tell you about their divorce."*).
- Without enough charisma the option is still shown, locked, with a "Charisma 45" tag and "Needs 45 charisma, you have 30", so charisma finally reads as worth something. About two thirds of fighters can take the 30 options and one in six the 60 one.
- **Simulated** (60 story runs per build strength, the bot taking talk options when it can vs never): fighters reaching the end 25 / 63 / 75% (weak / average / strong) with talk vs 32 / 47 / 85% without, 54% vs 55% averaged. The per-strength swings are run-to-run noise (the runs diverge after the first event); the options are small perks, not a power spike.
- Tested: `charisma.test.ts` checks every encounter has a talk option with a valid threshold, that it is locked below it and open at it, and that each effect does what it says (coins, healing, costs, skipped fights, the safe loot box).

### 16. Hidden synergies for joke picks

- **What changed (balance and content):** six secret synergies make the joke picks quietly viable. Each has a mechanics line and a joke:
  - 🫥 **Unnamed extra** (NPC): +2 to everything, +12% dodge, +25% damage while behind on HP. *Nobody remembers their name. That is the whole plan.*
  - 🎬 **The underdog story** (NPC with a joke weapon): gets back up once with 30 HP. *Every sports movie ever. Cue the montage.*
  - 🎭 **Weaponized irony** (Wet noodle, Pool noodle, Rubber chicken, Giant lollipop, Fishing rod): +25% strike damage, and opponents sometimes laugh too hard to act. *Getting hit with a pool noodle is funny until it is not.*
  - 🎪 **Comic relief** (the joke races: Goblin, Pigeon, Frogfolk, Sentient toaster, Clown, Snowman, Rubber duck): +30% damage below a quarter HP, and opponents sometimes stop to wave. *Everyone roots for the goblin.*
  - 🗑️ **Dumpster chic** (3+ junk gear pieces): +6% dodge. 👑 **Trash king** (5+): +1 to everything. *Long live the king. The king smells like a bin.*
- **They're secret.** The build screen doesn't announce them, and the card shows "❓ ???" with "Something about this build is off. In a good way. A fight will tell." The first fight reveals them with a banner and a sparkle jingle; from then on they show on the card, in a violet-edged row, and in the collection, where they count as six new entries.
- **Simulated** (balance lab, 40,000 paired fights, off → on; the lab now also dresses 12% of fighters in junk outfits):

| Pick | Off | On |
|---|---|---|
| NPC (class) | 26.3% | 45.7% |
| Pigeon / Clown / Rubber duck (race) | 39.6% / 44.1% / 45.5% | 43.1% / 47.4% / 48.3% |
| Rubber chicken / Pool noodle / Wet noodle (weapon) | 42.6% / 42.1% / 41.1% | 47.2% / 44.9% / 43.6% |
| Fishing rod / Giant lollipop (weapon) | 46.5% / 47.8% | 49.5% / 49.8% |
| Junk outfit, 5+ pieces | 52.2% | 59.4% |

  NPC goes from the worst thing in the game by 13 points to just under average, and the joke picks gain 2 to 5 points without passing anything. The first pass was too generous: Comic relief had +1 to everything and pushed Frogfolk to 56%, and Trash king had +2 more and pushed full junk to 71%. Both were cut back before shipping.
- They're a separate table (`data/content/hidden-synergies.ts`, one row with a `test` each) behind a `jokeSynergies` switch, so the ported synergy table and parity are untouched. `npx tsx tools/sim/lab-compare.ts jokeSynergies` prints the comparison.
- Tested: `hidden-synergies.test.ts` checks who gets which (and that normal builds get none), that each has an info card with its joke, that they're found once and then show, and that they're off under the old balance. A new e2e test opens a fresh NPC's full card ("???"), plays a fight, and checks the card now says "Unnamed extra". One fix along the way: the NPC already has a kit move called "Background character", so the synergy got a different name.

### 15. Soft caps on crit, dodge and damage reduction

- **What changed (balance):** past a knee, every extra point of crit, dodge or damage reduction counts half, up to a ceiling:
  - **Crit** tapers from 35% and stops at 65%. Before, it had no cap at all.
  - **Dodge** tapers from 30%. The old hard caps (60%, or 85% while sidestepping) stay. A chosen Sidestep move adds on top of the taper, because picking it is a decision, not stacking.
  - **Damage reduction** from traits and from move buffs each taper from 25% and stop at 60%. The old 70% floor stays.
  - The fighter card's crit and dodge estimates use the same caps.
- **Why:** in 20,000 random fighters with gear and sets, crit had no ceiling. A tenth sat above 40%, a few above 50%, and one stacked to 97%. Dodge stacked to 76% before its hard cap. Upgrades 21 and 22 (gear upgrades, more sets) will make stacking easier, so the taper goes in now.
- **Simulated effect** (same fighters, same fights, caps off → on):

| Who | Off | On |
|---|---|---|
| Crit 45% or more (1,630 fights) | 51.2% | 50.0% |
| Dodge 35% or more (1,296 fights) | 47.7% | 46.8% |
| Damage reduction 15% or more (271 fights) | 57.9% | 59.8% (noise; few fights) |
| Everyone else (26,803 fights) | 49.9% | 50.0% |

  In the balance lab (40,000 paired fights) no class, race, weapon, sidekick, set, growth or personality moves by more than 1 point. Stacking wasn't winning fights yet, so this is a safety net for the gear upgrades, not a nerf to anything people play now.
- `npx tsx tools/sim/stackers.ts` prints the table above. `npx tsx tools/sim/lab-compare.ts softCaps` prints the biggest lab movers for any balance switch. `npm run sim -- --no-soft-caps` runs everything without them. The lab now gives each fight its own seeded stream, so on/off comparisons are true pairs (it was skewed before: one changed crit shifted every later fighter).
- It's a `softCaps` switch in the balance table: off under the old game's balance, so battle and fighter parity still match. Story-sim worker threads now copy every balance switch from the main thread.
- Tested: `softcaps.test.ts` checks the taper maths, and that a fighter with absurd crit and dodge bonuses crits 55% to 75% of the time (every time without caps) and dodges under 66%.

### 14. Developer balance dashboard (hidden)

- **How to open it:** Settings, then tap the build line at the bottom ("The Wheel Has Spoken · build …") five times. It's not mentioned anywhere else.
- **The Balance lab** runs 2,000, 10,000 or 40,000 same-level fights between random fighters in a Web Worker, with a progress bar, so the game stays responsive. Fighters have random levels 1 to 30 and random gear in 0 to 6 slots; 40% wear 2, 4 or 6 pieces of one set. It shows win rates in tabs for classes, races, weapons, sidekicks, gear sets, growth and personalities: a bar with a 50% line, the exact rate and the sample size. Anything above 58% is flagged red and anything below 42% blue. The last run stays while the app is open.
- `labRun(fights, seed)` in `packages/core/src/game/lab.ts` is plain core code: the same seed always gives the same report. The build line shows the commit on CI builds and the date otherwise.
- What a 20,000-fight run says today, for the next upgrades:
  - Classes: Necromancer 66%, Chosen one 64%, Paladin 62% and Resilient 59% are flagged high; Mage 42% and NPC 27% low.
  - Races: Treant 64%, Golem 60% and Titan 60% high; Pigeon 42% low.
  - Weapons: the Rubber chicken (42%) and Wet noodle (41%) are the weakest.
  - Gear sets: the Knight set wins 60%, 66% and 70% at 2, 4 and 6 pieces; the other sets are near even.
  - Growth: Prodigy 57% is the best and Plateau 44% the worst.
  - Sidekicks all land between 47% and 57%.
- Tested: `lab.test.ts` checks the same seed gives the same report, that every fighter is counted once per table, that the overall rate averages exactly 50%, and that set wearers show up. A new e2e test does the five taps, runs 2,000 fights, opens every tab, and checks for clipping and page scroll at 320×568, 1280×720 and 844×390.

### 13. A visible momentum meter

- Momentum used to be three faint dashes. Now each fighter has a meter under their name: a climbing double-chevron pixel icon, three thicker gold pips and a label ("+20%"). A new pip pops in when you win a matchup. At three pips the meter burns orange and pulses. When momentum is lost the pips flash red as they empty. The opponent's meter mirrors yours.
- Tap it for a new help page: win the move matchup for +10% damage per pip, up to +30%, lose one and it's gone, a draw keeps it. The old game's rules pages are untouched; new pages live in their own table.
- The HUD grew a few pixels (98 to 101 px, measured at all 12 sizes) and the fight layout allows for that.
- Tested: the four-round fight test checks each meter's lit pips match its label ("Momentum 2 of 3", "+20%") and that tapping opens the help page. The fight check at all 12 sizes still passes.

### 12. Finisher: slow-motion zoom on the knockout blow

- The blow that knocks someone out (a hit, a signature, a pet, a burn or even a backfire or Uno reverse) now plays 2.4× slower. Cinema bars slide in, the camera pushes in on the fighter about to fall, and a white flash, a heavier shake and a deep boom land with it. After the K.O. banner the view eases back. Reduced motion skips all of it.
- `finisherOf(events)` in core finds that blow: the last thing that hurt the fallen before the K.O.
- Screen shake now moves the world's pivot rather than its position, so it can't fight the zoom.
- Tested: over 600 random fights the finisher is found for over 95% of knockouts, always lands on the fighter who falls, and leaves them at 0 HP. A new e2e test plays a fight with full motion until the knockout, then checks exactly one finisher played and the view is back at normal scale.

### 11. AI personalities

- Every fighter now has one of four personalities, shown on their card ("Plays like") and in the fight menu's scouting row, each with a help card (mechanics plus a joke):
  - 😤 **Aggressive**: strikes a lot, guards little, swings heavy. *Thinks defense is a rumor.*
  - 🐢 **Turtle**: guards and charges up a lot, and counters. *Will outlast the heat death of the universe.*
  - 🎲 **Gambler**: feints, overcharges powers and fires the signature the moment the bar is full. *Has a system. The system is vibes.*
  - 🧠 **Tactician**: watches your habits and punishes repeats harder. *Took notes on you. Color-coded.*
- The personality is read off the build, so nothing new is rolled and old saves just work. The stance comes first (Aggressive and Reckless play aggressive, Defensive and Counter-puncher play turtle, Tactical plays tactician, Showboat gambles). After that it's the stats that stand out against the fighter's own average, plus a few chaos quirks for gamblers. Random fighters spread 26/24/25/25% over the four.
- It biases the AI's move choice (`autoChoice`) and its flourishes (heavy blows, counters, overcharges). That covers the opponent and your own fighter on auto-battle, and the read you get on their next move reflects it. It's a switch in the balance table: the old game's balance has it off, so parity still matches event for event.
- **Balance (simulated, `npm run sim`):** in 40,000 same-level fights with personalities on and off (same fights), each personality's win rate moves by about a point:

| Personality | Share | Win rate on | Win rate off |
|---|---|---|---|
| 🐢 Turtle | 23.6% | 59.5% | 58.7% |
| 😤 Aggressive | 26.1% | 51.0% | 50.1% |
| 🎲 Gambler | 25.4% | 46.2% | 47.2% |
| 🧠 Tactician | 24.9% | 43.9% | 44.5% |

  The gaps between them were there before (durable builds beat brainy ones); personalities don't add to them. Story runs (60 per build strength, same seeds, story only), personalities off → on:

| | Weak: reach ch 10 / ch 20 | Average: reach ch 10 / ch 20 | Strong: reach ch 10 / ch 20 | Average level at ch 10 / ch 20 |
|---|---|---|---|---|
| Off | 27% / 22% | 73% / 60% | 97% / 82% | 17 / 33 |
| On | 20% / 18% | 77% / 57% | 95% / 90% | 17 / 33 |

  With 60 runs one run is about 1.7 points, so these shifts are within noise (weak builds may be marginally worse), and nobody levels more. No retune was needed: personalities change how fights feel, not how hard the story is.
- Tested: `personality.test.ts` checks the spread, that a Tactical stance means a Tactician over 70% of the time, that each personality really tilts the AI as its card says (aggressive strikes more, turtles guard more, gamblers fire the signature at full energy every time, tacticians punish a repeated move harder), and that it's off under the old balance. The fight check at every size looks for the personality chip in the menu.

### 10. Boss phase two: lighting, music and a unique slice

- When a boss drops below half HP and enters phase two, three things now happen on top of the old stat boost and banner:
  - **Lighting:** over about a second and a half the arena takes on the boss's own colour (Big Tony's orange, Lady Venom's toxic green, Null's bruised violet...). It's a tinted layer over the sky, scenery and floor that breathes in time with the music; the fighters keep their own colours. Reduced motion holds it steady.
  - **Music:** a driving minor-key loop (bass, kick, hats and a stab every other bar) starts in the boss's own key and tempo, from 90 bpm for Null to 160 for the Clockmaker. It follows the sound setting while it plays and fades out when the fight ends.
  - **A unique slice:** one wheel (the chip gets a breathing gold ring) gains a boss-specific gold slice, usable once: Antidote jab against Lady Venom (cures poison, hits harder), Harpoon against Leviathan Rex (through guards, can't be dodged), Sunglasses against Aurelion, Throw a wrench against the Clockmaker, and so on for all 20. Each has a mechanics line and a joke ("Sunglasses: Huge dodge chance. *Style and safety. Mostly style.*"). Hold it to see both. The panel tells you which wheel it's on.
- The table is `packages/core/src/data/content/phase.ts`, one row per boss; a new boss is one line. It works in every mode bosses fight in (story and boss rush).
- **Balance (simulated):** `npx tsx tools/sim/phase-slice.ts` (or `npm run sim -- --phase 16`). Average builds at each chapter's level fought each boss 800 times on auto-play, and again with the same seeds taking the phase-two slice the first time it showed up:

| Chapter boss | Without | With | Slice reached |
|---|---|---|---|
| 1 Big Tony | 60% | 59% | 87% |
| 2 Mama Gnocchi | 56% | 61% | 91% |
| 3 Lady Venom | 47% | 56% | 73% |
| 4 Admiral Saltbeard | 43% | 48% | 82% |
| 5 The Professor | 37% | 37% | 83% |
| 6 Count Crypt | 31% | 35% | 95% |
| 7 Titan Prime | 28% | 27% | 78% |
| 8 Neon Ronin | 35% | 40% | 77% |
| 9 Queen Hivemind | 28% | 24% | 69% |
| 10 The Wheelmaster | 20% | 22% | 71% |
| 11 Captain Cumulus | 27% | 30% | 69% |
| 12 Baron Brimstone | 16% | 14% | 58% |
| 13 The Clockmaker | 26% | 28% | 81% |
| 14 Leviathan Rex | 8% | 8% | 43% |
| 15 Mister Giggles | 18% | 21% | 72% |
| 16 The Frost Queen | 22% | 24% | 79% |
| 17 The Sandman | 23% | 26% | 84% |
| 18 Null | 9% | 8% | 52% |
| 19 Aurelion | 7% | 8% | 70% |
| 20 The First Wheel | 9% | 12% | 51% |
| **Average** | **27%** | **29%** | |

  That's about +2 points on average. It's a small, opt-in edge for players who reach phase two and land the slice, so no bosses were retuned. (These are bare same-level builds without the story's items and side modes, so they sit below the story-run numbers in upgrade 1.) The dips are the bosses whose slice heals or defends, which trades a turn of damage for safety, and noise.
- Tested: `packages/core/test/phase.test.ts` checks there's a kit for every boss, that a slice's family matches its move, and that the slice appears only in phase two, only on its own wheel and not once used. It also plays every slice through the engine for all 20 bosses. A new e2e test runs a boss rush fight, knocks the boss under half HP and checks the phase light comes on, the gold ring and hint appear, and the slice is on that wheel. It then checks for clipping at 320×568 and 844×390. All of it is off for regular opponents.

### 9. Long-press a slice for a damage preview

- Hold a finger on any combat wheel slice for about half a second: it lights up and the panel next to the wheel shows roughly what it does to this opponent right now ("≈ 27–40 damage to Olga the Nugget", plus "weak spot" when it hits theirs) and what it beats ("Beats Power · loses to Guard"). Guard slices show the counter they deal if the opponent strikes. Feint, focus and sidestep say they deal no damage this round. Signature slices include their multiplier.
- Slide the finger around to check the other slices; letting go never spins. The idle hint now mentions it ("Hold a slice to see what it does"). There's a short buzz when the preview opens.
- The numbers come from the engine's own damage formula, run in preview mode: the low and high roll, no crit, no guard. It uses everything that's true right now (stats, the slice's own bonus, weak spots, buffs, statuses, momentum, the arena, the fighters' level scaling) and draws no random numbers. Fighters with the unhinged quirk show their full wild range. The round's matchup (a read, a caught power, a broken guard) is described in words, not added in.
- Tested: `packages/core/test/peek.test.ts` runs 200 fights while previewing every slice before every round. They play out exactly like the same fights without previews, so previewing can't change a fight. Over 1,500 fights, 97.9% of plain strikes landed inside their preview, once the round's matchup bonuses are left out. The rest are mid-round changes like rage kicking in after a hit. A new e2e test holds a slice, checks the preview names the slice under the finger, slides to the opposite slice, and checks that letting go doesn't spin. Checked for clipping at 320×568, 390×844 and 844×390. Parity is unchanged.

### 8. Status icons with round counters

- Every status and buff on a fighter now shows over their head as a pixel icon in a small frame (green helps them, red hurts them, blue for a guard), with its counter in the corner. Burning, soaked, buffs and debuffs count rounds left, poison shows the damage it does each round ("−6"), and a bent weapon shows how many times it bent ("×2"). More than four wrap onto a second row.
- What shows: guard, a feint's opening, charged up, hitting harder, toughened, eagle-eyed (crit up), frozen or stunned, burning, poisoned, soaked, exposed, weakened and bent weapon. That's everything the engine tracks, not just the five the old game drew.
- Three new 12×12 icons in the same palette: a cracked shield (exposed), a snapped blade (weakened) and a hooked blade (bent).
- The fight menu (☰) lists what's on each fighter. Tap any icon for its card: what it does, what the number means, and a joke ("Bent weapon: It's not broken. It's abstract art.").
- How it works: the engine's snapshot carries each fighter's statuses with their counters (`sx`). That's display data only: no draws or numbers change, and the parity suite leaves it out and still matches the old game. The old game's status help table is untouched; the new ones have their own table.
- Tested: `packages/core/test/statuses.test.ts` checks over 1,500 random fights that the icons match the engine's own status flags on every event, that the counters make sense, and that every status has a card. The fight check at all 12 sizes now puts a full set of statuses on both fighters and opens the menu, failing if anything is cut off.

### 7. Opponent move history

- Under the opponent's HP and energy there is now a slim **Lately** row: their last three moves as pixel icons (sword for Strike, spark for Power, shield for Guard, star for their signature, and so on), oldest to newest. The newest has a pink outline and springs in.
- It updates when a round has finished playing, never before, so it can't spoil a round you're watching. Tap it for the move rules (what beats what). Screen readers get "Their last moves: Guard, Strike, Strike".
- It's there to check the read against: "Probably: Strike" means more when they've struck twice in a row.
- The HUD is about 20 px taller (91 to 93 px on every size, measured), and the fight layout now allows for that. Fighters are up to 6 px shorter on desktop and unchanged on phones.
- Tested in the browser over four rounds: the row only shows rounds that have finished and never more than three moves. It's then checked at 320×568 and 844×390 for clipping.
- Also fixed: the upgrade 5 nudge test failed once on CI. It checked for the short-lived nudge button once per animation frame, and with software rendering a single frame can outlast the offer. It now clicks from a DOM observer, with a fixed game seed.

### 6. Named combo and synergy banners

- When an element combo lands (Electrocuted, Shatter, Fanned flames, Resonance, Overgrowth, Flash freeze), its name pops up big over the fighter who pulled it off, in the element's colour, with what it did under it ("Element combo · Blunt on frozen: double damage"). It shows at the moment of impact, every time.
- When a synergy makes the difference mid-fight, it gets the same treatment, gold for yours and pink for theirs ("Their synergy · The +15% crit chance pays off"). That covers Peak comedy (triple damage), Backstabber (a crit), Speed demon and Hurricane (extra hits), Fortress (an 85% guard), Absolute zero (a freeze), Storm caller (chain lightning), Bloodlust (a big drain), Bone lord (rising with 60 HP) and Allergic to own kit (a backfire). Each synergy shows once a fight per fighter, so a backstabber who crits five times doesn't turn the fight into a slideshow.
- Every combo and synergy has its own little synthesized sound (a crackle for Electrocuted, breaking glass for Shatter, a whoosh for Fanned flames, a honk-honk for Peak comedy, a heartbeat for Bloodlust, a sad trombone for a backfire...) plus a short buzz on phones. The fight log gets a synergy pill you can tap for the details.
- How it works: the engine tags the events where a synergy changed the result (`a.syn`, `a.sb`). The tag is only a label: no random draws or numbers change. The parity suite leaves the tag out and still matches the old game event for event over 2,000 fights. `packages/core/test/procs.test.ts` checks over 1,500 random fights that every tag is real (its owner has that synergy), that all ten synergies show up, and that each one is shown once a fight. The every-size fight check now also puts the longest banners on screen and fails if one is cut off or runs under the HP bars. It caught a 5 px overflow on 360-wide phones, so long names now shrink to fit.
- Reduced motion: the banner fades in and out instead of popping.

### 5. More agency on the combat wheel: the nudge

- Once a fight, when the combat wheel lands, a gold **Nudge to (the next slice)** button shows for a couple of seconds (2.2 s, 1.5 s in fast mode, with a bar running down). Tap it and the wheel clicks one slice on, in the direction it was spinning, and that slice becomes your move. Tap nothing and the fight carries on as before.
- It names the slice it would move to, so the choice is visible and simple: keep the heavy blow, or push it onto the strike that beats their power move.
- Auto-battle never nudges; the opponent never gets one. No random draws change, so fights without a nudge play exactly as before.
- Tested in the browser: the nudge moves the move to the offered slice, and the next spin offers no second one.

### 4. Fight replay and share card

- After any win, **Save this win as a picture** draws a 1080x1350 card (`apps/game/src/ui/share-card.ts`): the fight's arena and scenery, the winner standing with their weapon up and the loser flat on the floor (the real pixel sprites), the final blow's damage in big numbers and its narration line ("Test Hero fires a crossbow bolt at The Massive Ravioli"), both fighters' names, titles, levels, race and class, the result headline (Victory, Boss down, Chapter 3 cleared...), where it happened and how many rounds it took.
- The sheet previews it, then **Share** hands it to the phone's share sheet (WhatsApp, Messages...), or **Save picture** downloads it.
- The replay side is the fight log in the ☰ menu, which keeps every line of the fight; the card is the moment worth sending.

### 3. Save safety net

Phase 2 already had versioned migrations, split storage, three rolling backups and export/import. This made it bulletproof:
- **Repair on every load and import** (`packages/core/src/save/repair.ts`): any field the game reads gets its default when missing or of the wrong kind (settings, records, purses, the active fighter), the roster always has its three slots, and nothing is thrown away: damaged or extra slots and unknown fields are kept in the save. What was repaired is shown on the title screen, and in the import confirmation.
- **Damage goes to the backup:** a section that is cut off, not an object, or missing its core (no fighter slots, no settings) counts as damaged, and the newest good backup is restored instead of patching it with defaults.
- **The browser is asked to keep the save** (`navigator.storage.persist`) once there is a fighter, so phones don't clear it when space runs low.
- **Tests (44 new):** every storage key damaged seven ways (deleted, cut off, null, a list, a number, empty, random bytes) still loads a playable save with all fighters; a write cut off at any point still loads; every listed backup restores; junk and saves from a newer version are refused with a reason; legacy imports and current saves migrate the same way twice; 20 random saves round-trip through export and import. A browser test damages a real save and checks it comes back from its backup with a notice.

### 2. Pixel-art content icons

- **Gear:** one 12x12 icon per slot (armor, helmet, boots, gloves, cape, trinket) in the legacy style, tinted by rarity (junk grey to mythic pink, premium blue). Used in the armory, both shops, merchants, loot reveals, the fighter card and the Fighter tab; empty slots show a faded outline.
- **Bag items:** all 9 have their own icon (bandages, med kit, energy drink, scouting report, smelling salts, lucky charm, rations, grit tonic, whetstone), in the bag, shops and merchants.
- **Fights:** the focus chips (Attack, Defend, Skill, Special) and the status badges above the fighters (guard, frozen, soaked, burning, poisoned) are pixel icons; badges are drawn as Pixi sprites.
- **Races:** all 47 get a portrait cut from their own pixel sprite (the head for most, the whole body for pigeons, slimes and rubber ducks), in the collection and info cards.
- **Interface:** the stat tiles (HP, attack, power, defense, speed, crit, dodge, charisma), the stat-change popup and the shop tabs use the legacy pixel icons instead of emoji.
- Classes, weapons and powers still use their emoji on the wheels and cards; they can get pixel icons later in the same way.

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
