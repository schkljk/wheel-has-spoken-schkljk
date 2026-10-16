# Game design: what the game is (keep all of this in the rebuild)

## Fighter building: 24 wheels in this order
race → sub-race → archetype (class) → specialty → fighting stance → size → backstory → reincarnation (sometimes) → strength → speed → durability → IQ → charisma → growth → weapon → weapon mastery → power → power mastery → enchantment → weakness → chaos factor → quirk → sidekick → title

- Earlier picks shift later odds (e.g. vampire → Sunlight weakness more likely, chefs → frying pan, high charisma → flashy titles). Slices with changed odds are marked ▲/▼ and chips explain why. Collection-based shifts exist. Luck streaks were removed on purpose.
- One free reroll per build: the button sits next to "Spin the rest for me" and greys out once used.
- Content: 47 races (each with a sub-race wheel), 25 classes (each with a specialty wheel), 14-tier stats (Wet tissue → Universal), 6 growth types, 35 weapons, 33 powers, 14 enchantments, 24 weaknesses, 11 chaos factors, 18 quirks, 12 sidekicks, 34 backstories, 30 titles, 7 stances, 6 sizes, 77 synergies (including gear-set bonuses), about 5 million meme names.

## Numbers and level
- Level scale `LS = growth.s × (1 + 0.12 × growth.g × (level − 1))`. HP = 100 × LS (bosses: their HP multiplier × LS).
- Shown stats: HP, Attack, Power, Defense, Speed, Crit %, Dodge %, Charisma. Rolled tiers are modifiers (e.g. Strength "Building level: +60% Attack").
- Damage = base × 1.17^softGap(offense − defense) × LS(attacker)/LS(defender) × multipliers. softGap: first 5 points count fully, the rest at a third.
- Level gap of 2 → the higher level wins about 64%, gap of 5 → about 75%.
- Every change to a career fighter's numbers pops up a delta panel (old → new, ± difference).

## Combat
- Each round: pick a focus (Attack, Defend, Skill, Special), then flick or tap the wheel. It lands, pauses briefly, then the move resolves (no countdown bar).
- Each focus mixes the fighter's **own moves** first (2 class moves in gold, 1 racial and 1 weapon move in teal) with basics (Strike/Heavy blow/Feint, Guard/Sidestep/Counter, Power/Overcharge/Charge up). Max 5 slices.
- Special (full energy): the combat wheel itself becomes the damage wheel (Whiff ×0.5, Solid ×1, Big hit ×1.4, Devastating ×1.8, Jackpot ×2.5). One spin, no second wheel.
- The opponent uses its own kit too (40% chance when its plan matches a kit family).
- Reads: a pill on the arena floor: "🔮 Pretty sure: Guard". Words only.
- Statuses: burn, poison, bleed, freeze, stun, soak; buffs and debuffs with round counts; summons; element combos; Wheelmaster's own wheel for that boss.
- Round limits: 12 normal; 20 elites, cup finals and legend challenges; 30 plus sudden death for bosses and boss rush; 30 for the World championship final. Results at the limit (non-sudden-death) are decided on HP.

## Story
- 20 chapters in two acts (Act I 1–10, Act II 11–20), 10–16 stages each. Stages: fight (sometimes with an elite option), events, rest spots (campfire, merchant), boss at the end. Chapter levels: Act I 1, 2, 4, 5, 7, 9, 10, 12, 13, 15; Act II 17 → 35 (step 2).
- Opponents come from a 1,000-fighter ranked pool (Elo from 5,000 simulated fights), drawn from a percentile window per chapter (`CH_PCT`). Elites are about 15% higher.
- HP carries over (stored as a %). Grit: 3 per chapter (more with legacy). Losing costs one; running out resets the chapter.
- After a win, pick a reward: loot spin, heal, or prize money. Loot spins choose a rarity first (junk → mythic), then the piece.
- Bosses (20, each with a phase two): Big Tony, Mama Gnocchi, Lady Venom, Admiral Saltbeard, the Professor, Count Crypt, Titan Prime, Neon Ronin, Queen Hivemind, the Wheelmaster; Captain Cumulus, Baron Brimstone, the Clockmaker, Leviathan Rex, Mister Giggles, the Frost Queen, the Sandman, Null, Aurelion the Radiant, the First Wheel.
- After a boss, the story goes to the next chapter you haven't cleared. Out-of-fight healing is in % of max HP.

## Modes (all on the Play tab)
Story; daily challenge (one fight per day, mutator wheel, streak bonus); boss rush (Act I bosses, then Act II bosses once chapter 11 is reached; HP carries, +25% after each win); fight club (bet 5–50 coins on AI fights, payout from odds); cups (Local 8, Regional 16, World 32 fighters); gauntlet (streak, opponents climb the ranking); rival and legend challenges; daily wheel.

## Economy
- Coins are deliberately scarce (story win about 2 + chapter/2; boss about 14 + chapter/2).
- **Gems** (premium currency, account-wide) only come from hard fights: elites +1, bosses +2–8, sudden-death wins +1, World championship win +3, Regional +1, legend win +2, daily win +1, boss rush +1 per boss and +10 for a clear, and goals, rank-ups and mastery. Premium gear: 9 pieces at 28–40 gems, or 2,100–2,800 coins.
- **Base shop** (fighter page; only usable between chapters, when the current chapter is at stage 0): Basics, Daily deal (one discounted rare/epic plus two regular pieces), Premium vault, Services (physio, talent respec, mystery box, sell gear). One haggle per day.
- **Story merchants** (one per chapter theme): their own stock (rations, grit tonic, whetstone, bandages, salts, drinks, scouting reports, med kits, charms) and 2 gear pieces. Items go straight to the bag. One haggle per visit.
- **Haggling:** ask 10/25/40/60% off. Base success 85/62/40/20%, plus charisma (capped −25%…+30%), class (bard/streamer/gambler +8%), Professional Yapper +5%, Trash talker −6%, the Bargain hunter talent and the Merchant friends legacy. Failure raises prices by half of what you asked.

## Gear
- 6 slots: armor, trinket, boots, helmet, gloves, cape. Rarities: junk, common, rare, epic, legendary, mythic, premium. 109 pieces.
- Sets: knight (6), shadow (6), arcane (6), clown (4), with 2/4/6-piece bonuses.
- Armory: everything you get is kept (60 spaces); swap any time; salvage for coins; premium sells for 20.

## Progression (more content, not more grind)
- Level cap 50, XP needed per level = 20 + 15 × (level − 1).
- Talent tree: Offense, Defense, Tactics, Spirit, Fortune; 12 talents each in 6 tiers (tier t needs level 3(t−1)+1 and 2(t−1) points in the branch); 118 ranks in total; respec in the base shop.
- Fame ranks (10): Rookie 0, Contender 25, Pro 70, Elite 150, Champion 280, Legend 450, Mythic 700, Ascended 1000, Eternal 1400, Wheelborn 2000.
- Legacy perks (14) bought with points from retiring fighters.
- Goals: 39 permanent milestones; class mastery (5 levels at 5/15/30/60/100 wins; perks for new fighters of that class); collection milestones every 75 entries.
- Achievements and titles, including one per boss.

## Interface rules
See "The owner's rules" in `CLAUDE.md`. Screens: title/roster (3 slots), build, card, fighter page (Play / Fighter / Goals / More tabs), story map, fight, shop, armory, talents, collection, records.
