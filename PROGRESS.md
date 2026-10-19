# Progress

**Play links:**
- New game: https://schkljk.github.io/wheel-has-spoken-schkljk/
- Current game: https://schkljk.github.io/wheel-has-spoken-schkljk/legacy/
- Android app (APK, rebuilt on every update): https://github.com/schkljk/wheel-has-spoken-schkljk/releases/latest/download/wheel-has-spoken.apk

- [x] Phase 0: study and set up
- [x] Phase 1: core parity
- [x] Phase 2: app shell, saves, performance foundations
- [x] Phase 3: every screen ported
- [x] Phase 4: upgrades 1–45 (see docs/UPGRADES.md). Item 46, sharing, is optional and waits until the game is shared

## After the upgrade list: owner requests

### Review follow-up: the owner's picks

- **Asked for:** "Do A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A12, A13, B2, B3, B5, B6, B7, C1, C2, C3, D1–D10, E1–E5, F2–F12" (from `docs/SUGGESTIONS.md`). Skipped by the owner: A11, B1, B4, E6, E7, F1.
- **Done so far:**
  - **A1, the daily streak:** wins in a row whenever they are played; only a loss resets it. A week off keeps the streak and its pay.
  - **A2, HP thresholds:** every description with engine HP now reads as a percentage ("below 45% HP", "heals 25% HP"). Engine HP is 100 for a full bar, so these were percentages all along. The fix is a wording layer (`data/wording.ts`) laid over the tables at load, so the tables stay a faithful port. The parity tests lay the same wording over the legacy tables before comparing: 75 strings changed, no numbers.
  - **A3:** the map tip says the boss is at the top.
  - **A5, upgrades:**
    - A new piece of loot is tagged Upgrade, Downgrade or About even, and the better choice is listed first. The judgement weighs the real numbers it moves, its rarity and upgrade level, and the synergies it starts or ends.
    - Armory rows and slots show ▲ or ▼, and there is a "Wear your best gear" button (one Undo for all of it).
  - **A6:** a talent point can be taken back for 3 seconds, and learned talents get a gold frame.
  - **A7:** the stats popup waits at the top of the screen while a sheet is open.
  - **A8, words, not percentages:**
    - Win odds are words: Long shot, Big underdog, Underdog, Coin flip, Favorite, Heavy favorite, Sure thing.
    - Pool ranks read "Rank 140", and the card says "Beats most random level 1 fighters".
  - **A9, the new fighter's card:** the fighter comes first, the scouting report is folded under it, and the report speaks in words, not raw rolls. Stat rows show only their effect, green or red.
  - **A10:** the build counter says "Spin 2 of 21+" while sub-wheels may still join.
  - **A12:** mid-chapter, the bracket shows a locked "Shop opens after this chapter".
  - **A13, readable fight HUD:**
    - HP numbers are at least 13 px; focus chips are 44 px tall; momentum pips are bigger.
    - Belts have screen-reader names.
  - **B2, faster fights:**
    - After chapter 1, a 1×/2× button sits in the fight HUD; it is the Fast mode setting, and a first-time tip introduces it.
    - The arena wheel spins on the combat wheel's spot while the fighters walk in, so there is no separate arena screen or extra tap. Its scenery fades in where it lands.
  - **B6:** goals sort by about how many fights they still need, not by percent, and the next one is pinned on the Play tab.
  - **B7:** map previews show the opponents' level against yours, and how far the next campfire is.
  - **C2:** the first-fight tip explains the teal ring. Tapping the read opens "what beats what".
  - **C3:** a new injury says how it heals (by itself after cups, or a physio session or a campfire's Patch up).
  - **A4, nothing lost when the app closes** (`core/game/resume.ts`):
    - A fighter being built is saved after every wheel, and a finished one waits on its card until it starts a career or is scrapped.
    - The steps after a fight (reward, loot, a gear choice, level-ups) are saved one by one. Each is marked done in the same change that pays it, so reopening picks up at the next step and never pays twice. A gear choice from a loot spin waits as its own step.
    - A story step keeps the opponent or encounter it rolled. Reopening goes straight back into it, past any choice already made, so reloading can't re-roll a fight or an event. Treasure, mystery and training spins move the map on in the same change that pays them.
  - **B3, spoils:** a story win's reward is picked right on the result (Loot spin, Catch your breath, Prize money: one tap instead of Continue plus a sheet). Loot wheels after a fight spin and move on by themselves, and the level-up wheel moves on by itself after you spin it.
  - **B5, Continue:** the title screen leads with "Continue with {name}". It goes back to the steps still waiting, the story map, the bracket or the fighter page, and says which. A fighter being built shows "Keep building {name}".
  - **C1, understanding fights:**
    - Every result has a "How it went" card: damage dealt and taken, the biggest hit each way, reads won each way, burns and poison, dodges, and one tip from the most telling number.
    - The fight log has round headers.
    - While a round plays, a line says "Your Strike vs their guard: they read it".
  - **Performance, measured on a desktop CPU unless noted:**
    - D1: canvases that get read back are CPU-backed. This removes the seconds-long stalls the review measured on a phone profile.
    - D2: the 119 race, class, weapon and enchant icons are baked into one 100 KB image (`npm run bake`; a test fails if it goes stale). The game no longer draws 107 sprites while it starts.
    - D3: pixel buffers are typed arrays. Sprites build about 35% faster (25 ms vs 39 ms median) with byte-identical pixels (the same hash over 60 sprites, every icon and the map decorations). One build is now shared by the page, the fight and the faces.
    - D4: Pixi applications (WebGL contexts) are pooled and handed from screen to screen instead of being created and destroyed every time.
    - D5: the combat wheel skips redraws when its slices and size haven't changed, and rims are cached by size.
    - D6: fight odds run in a worker. The pool and the odds share one worker file, so the engine downloads once for both.
    - D7: the title wheel is drawn once into canvases and turned by CSS, with no WebGL on the title screen.
    - D8:
      - The web build no longer contains Capacitor.
      - The share card, sound test and error log load when opened.
      - The developer lab worker and Pixi's WebGPU renderer are left out of the offline cache.
      - The 512 px PNG icon is now in the app manifest for Android installs.
    - D9: the save keeps its backup index in memory instead of parsing three backups on every write.
    - D10: portrait caches are capped. Evicted fighter textures are destroyed unless a fighter on stage still uses them.
  - **E1–E5, the design pass.** Every rule is a switch in `data/balance.ts`, off in the old game's tuning, so the parity tests still play the old rules exactly. Measured with `npx tsx tools/sim/design.ts` (the same seeded fights with the switches off and on, 3,000 per cell) and `npx tsx tools/sim/story-run.ts [--before]`.
    - **E1, you pick what, the wheel picks how hard.** Attack holds only strikes (a quick jab joins them), Defend only guards and counters, Power only your power; with nothing to cast, the Power wheel holds the feint that beats a guard. Following the read now beats auto-battle by about 16 points:

      | Chapter | Auto | Following the read, before | After |
      |---|---|---|---|
      | 1 | 50% | 56% | 66% |
      | 10 | 49% | 53% | 65% |
      | 20 | 49% | 53% | 65% |

    - **E2, reads stay readable.** The AI's skill no longer clouds your read, IQ counts half as much, and only a trickster pushes a read below "Just a hunch". "Wild guess" went from 32% of reads in chapter 1 and 68% in chapter 20 to 2% everywhere. Reads are right about 61% of the time in every chapter (58% down to 42% before).
    - **E3, every stat has a job.** Speed is a quarter of your defense against strikes and IQ about a third against powers. IQ adds crit damage, and power mastery makes powers cheaper (25 energy, down to 15). Win-rate points from +2 of one stat (two seeds, 4,000 fights each): durability 5.3 → 4.2, speed 2.0 → 4.3, strength 2.7 → 2.5, weapon mastery 3.0 → 2.6, power mastery 0.9 → 2.0, IQ 0.9 → 1.8, charisma 0.0 → 0.3.
    - **E4, heals fade, the dead rise once.**
      - Regeneration heals a share of the HP you are missing.
      - Every heal shrinks after round 6, to a fifth by round 11.
      - One revive per fight, whatever its source.
      - Powers pierce 30% of durability.
      - A power cut off by a strike keeps half its damage instead of a third.
      - The Necromancer rises with 20% HP (35% before).

      | | Before | After |
      |---|---|---|
      | Powers below "No power" | 2 | 0 |
      | Best to worst power | 24.9 points | 18.4 |
      | Regeneration | 68% | 58% |
      | Mage | 41% | 50% |
      | Necromancer | 63% | 60% |
      | Best to worst class (the legendary Chosen one aside) | 21.5 points | 17.7 |

    - **E5 and F7, story pacing:**
      - Every fight row after the first has an elite to pick instead.
      - A story fight you are 85%+ sure to win can be claimed from the ☰ menu before round 1: full rewards, at the HP a real win costs.
      - A boss puts on at most one level after sizing you up (three before). Its intro says so, and beating it pays 2 gems a level.
    - **F4, a second opinion** (it changes how strong fighters get, so it is in this pass): every level-up spins twice and you keep one.
    - **Boss retune** (`tools/sim/tune-bosses.ts`, 5 rounds of 90 story runs): the same aims as before for an average build (72% of boss tries in chapter 1, 54% at the end of Act I, 42% to 28% across Act II). The Wheelmaster now fights at its chapter's level.
    - **Whole story runs**, 30 per build strength, story only, on auto-battle:

      | Runs that finish the story | Before | After |
      |---|---|---|
      | Weak builds | 13% | 30% |
      | Average builds | 73% | 77% |
      | Strong builds | 83% | 87% |

      In Act II a strong build now beats bosses more often than an average one (chapter 15: 62% vs 42%, chapter 17: 72% vs 51%; before, about the same). Regular fights are 73% to 98% wins, with sure wins claimed.
  - **New features:**
    - **F2, daily duel** (Play tab): one matchup a day, the same for everyone. Both fighters, the arena and every die (the fight's and the combat wheel's) come from the date. Scored by result, rounds and HP left, with a line to copy (a square per round's read). No streak; the last seven days stay playable, and the first win of each pays 8 coins.
    - **F5, bounty board** (Goals tab): three standing build challenges ("Beat a story boss as a Pigeon"), 24 in all, one table row each. A new one goes up only when one is done; swapping one costs a gem.
    - **F6, synergy riddles:** an undiscovered synergy in the collection is a dashed tile with a riddle (83 written, set bonuses generated). A test checks no riddle says its synergy's name.
    - **F8, fight club insider:** payouts follow a bookie's line, which is the real odds plus noise. The insider tells the real odds and the dirt on whoever the line has wrong, for a gem, or free with 45 charisma. Exhibitions can be called before the bell: 5 coins for a right call.
    - **F9, ghost codes** (More tab): your fighter as a line of text a friend can paste and fight. Only the build travels, with a checksum. Ghost fights are for pride: no XP, no coins.
    - **F10, mentors:** a new career can take a retired champion as a mentor: +1 to their best stat, and they drop by on the map at most once a chapter.
    - **F11, the locker** (More tab): 20 earned cosmetics for gems (wheel rims, pointer charms, victory confetti, nameplates). Looks only.
    - **F12, Wheelborn trials** (Play tab, level 34 or a finished story): ten remixed bosses for levels 34 to 50. Each is one boss's picks wearing two other bosses' phase-two kits, so phase two puts two one-time slices on your wheel. Stat tier and HP are set per trial (`tools/sim/trials.ts`) for a ladder from about 55% to 30% at the trial's level. First clears pay gems; losing costs nothing.
  - **Still to do:** F3, Spin & Run.


### Full review (October 2026)

- **Asked for:** "review the game entirely, and give me suggestions for improvements, optimizations, and new features."
- **How:** three reviewers worked in parallel: player experience, performance on a mid-range phone profile, and game design from 40,000 simulated fights.
- **Result:** every suggestion, numbered, with evidence and effort, is in `docs/SUGGESTIONS.md`.
- **Fixed right away (D11):** the music sequencer kept finished voices connected until garbage collection, and kept scheduling notes with music switched off. Audio-thread load rose from 3.6% to 14.4% in 30 s.
  - Finished voices now let go of the mix as they end.
  - Music off schedules nothing (0 new nodes in 10 s).
  - Audio-thread load stays at 3–8% while the theme plays (sampled every 5 s for 40 s with Chrome's WebAudio stats).

### Full sound pass and a looping theme

- **Asked for:** "do the full sound pass, and add a looping game theme music."
- **The engine** (`apps/game/src/audio/`):
  - Every sound is synthesized in code, so it works offline and in the APK.
  - A sound is a list of voices. Each voice is a tone (four wave types plus 12.5% and 25% pulse waves, the chiptune leads) or filtered noise. Each has an envelope, a pitch glide, vibrato, chorus, flutter, drive and pan.
  - There is one bus for effects and one for music, both through a limiter. Music dips under big moments: knockouts, fanfares, ultimates, boss intros.
  - Sound starts with the first tap, as browsers require, and pauses while the game is in the background.
  - Repeated sounds vary their pitch slightly so they never sound identical.
- **167 named sounds** (`audio/sfx-data.ts`), as data:
  - **Weapons:** each style has its own sounds, timed to the frame of the new animations.
    - Bow: draw, twang and arrow thunk.
    - Crossbow: mechanical clack.
    - Laser rifle: charge, zap and sizzle.
    - Thrown weapons: the whir of shuriken, chakrams and boomerangs (on the way out and back), a brick thud, a card flick.
    - Blades: swish and shing. Greatsword: heavy clang.
    - Hammers: boom.
    - Frying pan: a bonk with ringing metal and dizzy tweets.
    - Bat: wooden crack. Noodles: a boing and a wet slap.
    - Fists: punches. Nunchucks: a flurry of whaps.
    - Whip: crack. Fishing rod: reel ratchet.
    - Magic staff: charge sparkle, cast and impact.
    - Chainsaw: a motor that revs. Electric guitar: a power chord.
  - **Powers:** each of the 32 has a cast and an impact, plus sounds in the air where something flies. Examples:
    - Fire: an ignition roar and an explosion with crackle.
    - Ice: shards, then a shatter.
    - Lightning: a thunder crack and rumble.
    - Holy light: a choir chord and a bell.
    - Absurd luck: a falling whistle and an anvil clang.
    - Power negation: a game-show "wrong answer" buzzer.
    - Clones: footsteps.
    - Time stop: tick-tock.
  - **Fight:**
    - A bell at the start.
    - Crit ting, dodge whoosh, shield clank, heal chime.
    - Status sting, poison bubbles, revive arpeggio.
    - Knockout boom with a bell, slow-motion finisher.
    - Ultimate charge (a rising power chord) and boss phase-two roar.
    - A win fanfare and a sad trombone for a loss.
    - Calm animations still play the hit sounds.
  - **Wheels:**
    - Ticks get lower and louder as the wheel slows. The speed is read from how close together the ticks come.
    - A spin whoosh scaled by flick strength.
    - Drum roll, reroll dice rattle.
    - Landing stingers: cooked (wah-wah), mid, good, goated (fanfare with sparkles).
  - **Menus:**
    - Taps, panels opening and closing, "are you sure?", yes and no, notices.
    - Buy (register and coins), equip (clank), forge upgrade (two anvil strikes), salvage.
    - Locked tiles (a dull buzz), level up, stats changed, goal done.
  - **Story:**
    - Footsteps while walking the map.
    - Encounter, merchant door bell, campfire crackle, treasure chest creak.
    - Boss and nemesis intros, chapter fanfare, deal or no deal.
- **The theme** (`audio/songs.ts`, `audio/music.ts`):
  - "The Wheel Has Spoken": A minor, 112 bpm, 24 bars (53 seconds), looping.
  - Written like a tracker: per bar a chord, the melody, a drum line and a bass groove.
  - **A section:** the hook over Am F C G | Am F E Am. Lead, bass, light drums and a soft pad.
  - **B section:** a game-show lift into the relative major (F G Em Am | F G E E7). Driving drums and arpeggios.
  - **A' section:** the hook again with a harmony line, arpeggios, full drums and a pickup back into bar 1.
  - The lead is a 25% pulse with delayed vibrato and a dotted-eighth echo. The bass doubles a square over a triangle so phone speakers can play it.
  - It plays on every screen except fights. Fights crossfade into their arena loop, and a boss's phase two into its own. After a fight, the fanfare or trombone plays, then the theme returns.
- **Settings:**
  - Effects and Music volume sliders. Dragging previews live; letting go saves the value.
  - Saves from before this keep the defaults: effects 80%, music 55%. No migration was needed.
  - A **Sound test** page plays every sound by its in-game name ("Frying pan: hit", "Absurd luck: hit") and every music track, so feedback is easy to give.
- **Checked without ears:**
  - `tools/audio/levels.mjs` renders every sound offline in Chromium with the game's own synth and prints its peak and RMS.
    - Hits sit around -20 to -26 dB RMS, swings and casts around -30 to -37, menu sounds around -37 to -41.
    - Thirteen outliers were trimmed.
    - Nothing peaks above 0.9 before the limiter.
  - `tools/audio/music.mjs` renders the music and can save previews as WAV.
    - The tracks are balanced to within 3 dB of each other: theme -25.5, arena -28.5, phase two -26.8 dB RMS.
    - Pitch-tracking the rendered theme reads back the written melody note for note.
- **Tests:**
  - Every sound is sane: positive lengths, levels at most 0.6 per voice, under 3 seconds.
  - Every sound name used anywhere in the game exists, and every power has its own impact.
  - The theme is well formed bar by bar: notes parse, the melody stays between E4 and A5, and over 70% of its notes are chord tones.
  - E2E: the theme starts with the first tap; the volumes stick across a reload; the sound test page fits 320×568 and 844×390, plays sounds and switches tracks; leaving it brings the theme back.

### Finer pixel art, readable wheels, attacks that make sense

- **Asked for:**
  - "Some sprites are too coarse, I want finer, higher quality pixel art."
  - "Wheel especially, many things are unreadable, especially with lots of slices."
  - "Attack animations need an upgrade, makes no sense to smack someone with a crossbow."
  - "Power attack animations need a contextual rework, not just throwing a random pixelated emoji."
- **Finer pixel art:**
  - The pixel engine (`art/px.ts`) can now draw at two real pixels per art pixel. Every drawing call keeps its coordinates. Shapes are sampled at the finer grid, so curves are smoother and outlines and creases are one fine pixel thick. Shading also gets twice the steps.
  - Fighters, bosses, weapons and chapter badges are drawn this way (140×168 instead of 70×84).
  - Faces got finer details: rounded eyes under a lid line, with a one-pixel glint and a lit rim. Brows and mouths are thin lines.
  - Wheel slices and fight effects use 32-pixel versions of the icons. The page keeps the 16-pixel ones, which suit its small sizes.
  - Fine art drawn smaller than 1.5 screen pixels per pixel scales smoothly instead of dropping outline rows: small fighters on the map, faces in lists. Big art stays crisp.
  - At one pixel per art pixel the engine's output is byte-for-byte what it was (checked against the old sheets).
  - Cost: about 13 ms per fighter sprite, built once and cached.
- **Readable wheels:**
  - Each wheel either names every slice in full or none of them. No more "Tac…", "Cou…".
  - When a name doesn't fit and every slice has an icon, the slices show bigger icons only. A name plate under the pointer names whichever slice is passing it, and turns gold when the wheel stops.
  - The race wheel (47 slices) always works this way.
- **Attacks by weapon** (`pixi/weapon-style.ts`, `pixi/attacks.ts`). Each weapon has a way of being used:
  - **Shoot:** bows and crossbows aim and loose a drawn arrow or bolt, which sticks for a moment.
  - **Beam:** the laser rifle charges at the muzzle and fires a beam.
  - **Throw:**
    - Shuriken fly straight.
    - Chakrams and boomerangs leave the hand and come back (the boomerang curves).
    - A brick is lobbed and drops to the floor.
    - The Uno card is flicked.
  - **Slash:** katana and cursed blade, with a crescent trail in the weapon's enchant color.
  - **Heavy slash:** greatsword and axe, with a crescent, a floor shockwave and dust.
  - **Reap:** the scythe, with a double sweep.
  - **Thrust:** spear, trident, harpoon, rapier and dagger drive forward with the point held level.
  - **Smash:** hammers come down overhead, with a shockwave and dust. The guitar adds sound waves.
  - **Bonk:** pans and the lollipop, with dizzy stars.
  - **Swing:** the bat.
  - **Flop:** the noodles.
  - **Flurry:** nunchucks and bo staff land three quick hits.
  - **Crack:** the whip cracks from a distance.
  - **Hook:** the fishing rod casts, hooks and yanks.
  - **Cast:** the magic staff charges an orb at its tip and casts it.
  - **Grind:** the chainsaw throws sparks.
  - **Fists:** a jab-jab.
  - Counters and dodged attacks use the same moves. A dodged arrow flies past.
  - The emoji "💥" on every hit is gone. Hits get a drawn burst.
- **Powers by power** (`pixi/powers.ts`). Each of the 32 powers has its own effect, drawn with new effect sprites (`art/fx-art.ts`):
  - **Fire:** a fireball trailing embers.
  - **Ice:** a volley of shards.
  - **Lightning:** strikes from the sky.
  - **Water:** a jet of drops.
  - **Shadow:** tendrils rise from a dark pool.
  - **Summon:** a tentacle comes out of a portal.
  - **Chains:** chains erupt from the floor.
  - **Holy light:** a pillar of light falls.
  - **Smite:** a mark, then a golden pillar and a shockwave.
  - **Telekinesis:** lifts a rock and hurls it.
  - **Earthquake:** splits the floor into spikes.
  - **Mind control:** psychic rings.
  - **Sonic scream:** sound waves.
  - **Teleport:** blinks behind them, strikes, blinks home.
  - **Gravity:** a growing singularity crushes them.
  - **Shapeshift:** claws.
  - **Reality warping:** glitches them.
  - **Negation:** a no-entry sign.
  - **Divine shield:** a shield bash.
  - **Miracle:** golden rays.
  - **Regeneration:** a leaf swirl.
  - **Absurd luck:** drops an anvil on them.
  - **Life drain:** pulls red life back to the caster.
  - **Arcane missiles:** three curving missiles.
  - **Wind:** gusts that push them back.
  - **Vines:** grow and wrap them.
  - **Explosions:** a lobbed bomb.
  - **Magnetism:** field lines yank them.
  - **Clones:** three clones run in.
  - **Illusions:** ghost copies.
  - **Poison:** a toxic glob and a cloud.
  - **Time stop:** a clock face with spinning hands.
- **Ultimates:**
  - Ultimates play the fighter's best thing bigger, after the charge-up: their power when the blow is their power's element, otherwise their weapon, with a golden trail.
  - Storm chains strike as lightning.
- **Tests:**
  - Every effect sprite draws.
  - Every weapon has a style, and nothing ranged is swung.
  - The 2× engine draws the same shapes at the same coordinates, with dots filling whole art pixels and lines one fine pixel thick.
  - The sprite tests run at the new size.

### HP bars move when the blow lands

- **Reported:** "HP goes down before the strike, ruining the immersion."
- **Cause:** the fight screen handed each event's numbers to the HUD before the scene played it, so the HP, energy and momentum bars changed during the wind-up.
- **Fix:** the scene now tells the HUD when it shows a new state, which for hits is the moment of impact (mid-lunge for melee, on arrival for projectiles). The HUD also settles once each event has finished, as a safety net. Skip and reduced motion behave as before.

### Spin screen: no more text hidden behind the wheel

- **Reported:** when spinning a character, some text was cut off behind the wheel.
- **Cause:** Pixi only resizes its canvas when the window resizes. On the spin screen the wheel's box shrinks when an odds row or a long result appears, but the canvas kept its old size and covered the text under it.
- **Fix:** every Pixi canvas now follows its own box (a ResizeObserver), and the wheel's box clips, so the wheel can never cover the result even for a frame. Checked at 360×800, 320×568 and 412×915 across several spins.

### Illogical UI, fixed

- **Asked for:** "fix and rework illogical UI elements." A fresh-eyes audit toured every screen at three sizes and listed 30 problems. These are fixed:
- **Big choices ask first:**
  - **Boss rush:** asks before you start, with the rules and rewards. Between bosses you choose to fight the next one or walk away, keeping what you won (your best is saved).
  - **Scrapping a half-spun fighter** (the back arrow while spinning, and "Scrap them" on the card) now asks first.
  - **Legacy perks** are permanent, so buying one asks first.
- **The fight menu after a fight:** Skip, Forfeit and the toggles are gone once it's decided. You could forfeit a fight you had already won. Only the log, their card and help remain.
- **One name for going home:**
  - "Fighter page", "Back to your fighter" and the like all landed on the Play tab. They now say **Home**.
  - The bracket's back arrow says "Leave for now (your run is saved)".
- **Things that contradicted the rules:**
  - The Fighter tab said the next rank "Unlocks the Regional cup", but cups unlock by story chapter. It now shows what the next rank really pays (coins, talent points, gems) and its perk only when the perk does something.
  - The rank-up messages themselves stay word for word, for parity with the old game.
- **Same thing, one name:** the combat wheel's "Skill" and "Special" focus chips are now **Power** and **Signature**, which is what the reads, the move history and the signature button already called them.
- **Duplicates removed:**
  - "Your fighters" on the story card (the header face and More already open the roster).
  - The second coin count at the bottom of Play.
  - The Collection card inside Records.
  - The Bag's second close button.
  - The level shown twice in the header: the header now shows your rank and chapter under your name, and the face keeps the level badge.
- **Dead ends:**
  - The bracket no longer offers a shop that is closed mid-chapter.
  - Collection opened from the title screen goes back to the title screen.
  - The in-progress cup or gauntlet card moved up, right under the story.
- **Consistent locks:** every locked tile is greyed with a padlock and says why when tapped. That includes cups, Exhibition (needs two legends) and the base shop (closed mid-chapter).
- **Sheets step back:**
  - Sheets opened from other sheets have a back arrow: Bag → Armory → a slot → the Forge.
  - The armory opened from a merchant's bag can't be closed by accident and lose the merchant.
- **Clearer layouts:**
  - **Haggle** is at the top of both shops, since it changes every price below it.
  - **Way-out options** in choice sheets ("Not now", "Walk away", "Leave") are quieter than the real choices.
  - **Retire** is a quiet red button at the bottom instead of the loudest thing on the Fighter tab.
  - **Trophy room** has its own icon.
  - **The old game** in More is labelled "The old version".
- **Spinning a fighter:**
  - The result panel says which wheel it came from ("RACE: Frogfolk"), since the next wheel is already up.
  - The free reroll also works on the last wheel.
  - "Spin the rest" no longer wraps.
- **Smaller fixes:**
  - The fighter card's Speed row matches the stat tile, and average rolls say "average" instead of "+0%".
  - The fight help text isn't cut off on phones held sideways.
  - The arena hint names its real button.
  - Gear uses an armor icon instead of the Bag's backpack.
- **Left as they are, on purpose:**
  - Settings is still reachable from both the header and More. That's normal for games, and the title screen needs its own way to the save.
  - Selling and salvaging gear stay separate. Merging them would change the economy, which isn't a UI fix.

### No emojis left: every one is a pixel icon

- **Asked for:** "replace any emojis left over with custom icons."
- **What changed:** the game used 514 different emojis (races, moves, items, ranks, cups, goals, events, text). Now every emoji the game shows is drawn as a pixel icon instead.
  - **Hand-drawn icons** for the common ones (`art/emoji-px.ts`, about 60): coins, gems, hearts, bolts, flames, shields, swords, skulls, stars, gifts and so on.
  - **The rest** are pixelized from the phone's own emoji. Each is drawn large, averaged down to 16×16, cut to a few flat colours, and given the same dark coloured outline as the sprites. Near-black ones get a pale rim so they show on the dark panels.
- **How it reaches every screen:** one hook (`ui/emoji.ts`) swaps emojis in all the text the game renders before it is drawn. The icon keeps the emoji as its alt text, so screen readers still read it.
  - Plain symbols like ★ → ✓ ⚠ stay text.
  - Inside the fight and on the wheels, Pixi draws emojis as pixel sprites: flying effects, the wheel hub, and slices with no art of their own. Stage text (banners, combo names, damage numbers) keeps only its words.
- **Chapter badges:** each chapter's badge on the Play tab and the map header is now a piece of its own map's scenery (a bin, a lantern, a gear...).
- **Two new icons:** a campfire (rest stops) and a treasure chest.

### The wheels are pixel art now

- **Asked for:** "Rework the wheel and its animations too, it feels out of place."
- **The look:** every wheel is now drawn with the sprites' pixel engine (`art/wheel-art.ts`): the spin screen, the arena wheel, the combat wheel, the signature wheel and the title wheel.
  - **Rim:** a bevelled gold rim with bulbs.
  - **Slices:** shaded in bands with a dithered seam, separated by outlined dividers with a lit edge, with a gold peg where each divider meets the rim.
  - **Pointer and hub:** a red pointer hanging from a gold cap, and a gold medallion hub.
  - **Labels** are in the pixel font with a dark outline, and slice icons scale by whole pixels.
- **The animations:**
  - **Bulbs:** twinkle at rest; chase around the rim as fast as the wheel turns; blink while it slows down and the suspense builds; flash three times when it lands.
  - **Pointer:** a real spring. Every peg knocks it, and a bounce knocks it harder.
  - **Landing:** the winning slice pulses gold, the wheel pops, and pixel sparks fly off the pointer.
  - **Reduced motion:** the bulbs stay lit and nothing pops or flies.
- **Unchanged:** the spin physics, so results are exactly as fair as before.

### Chapters are real maps now

- **Asked for:** "Can we make chapters into actual designed maps?"
- **What a chapter looks like now:** a painted pixel-art landscape in the chapter's theme, which scrolls inside its panel.
  - **The road** starts at the bottom, winds up through every step, and ends at the boss's lair at the top.
  - **At each step** the road forks into one lane per choice, then joins again.
  - **Your fighter** stands where you are. Coming back from a step, they walk to the stop you just took.
  - **The way you came** has gold footprints. The lanes you can take now sparkle. Further ahead, the map fades into mist.
  - **The boss** stands on its glowing lair as its own sprite, in shadow until you reach it, with a red name plate and the recommended level.
- **Stops:** round pixel badges, one colour per kind:
  - fight: fist
  - elite: crossed swords
  - event: question mark
  - rest: campfire (new icon)
  - shop: cart
  - treasure: chest (new icon)
  - nemesis: their face
  
  The stops you can take now are bigger, gold-ringed and bobbing, with their name and what they do. Every other stop can still be tapped for a preview.
- **20 themes** (`art/map-themes.ts`). Each has its own ground, road and scenery:
  - asphalt and bins in the alley
  - lanterns and stalls at the night market
  - water and buoys at the docks
  - graves and dead trees on the moor
  - honeycomb in the Hive
  - floating islands and rope bridges in the sky
  - lava cracks in the Underworld
  - gears and pipes in the citadel
  - coral on the seabed
  - tents at the carnival
  - snowy pines at the glacier
  - candy and moons in dreams
  - crystals in the Void
  - columns in the Pantheon
  
  The road changes too: cobbles, planks, a yellow brick road, neon, ice.
- **About 60 scenery pieces** (`art/map-deco.ts`), drawn with the fighters' pixel engine and light, so the maps match the sprites.
- **Same chapter, same map:** the layout and scenery come from the chapter and its steps, so a map never reshuffles mid-chapter.
- **Speed:** a map paints in about 20–35 ms on a laptop:
  - scenery pieces are drawn once in three variants and reused
  - the road is stamped from precomputed discs
  - painting happens right after the screen appears
- **Fits every screen:** on phones the stops keep to a phone-width column and the scenery fills the rest. Names shrink a little on the narrowest phones instead of being cut off.

### New look: the arena at night

- **Asked for:** a UI that fits the game's theme and is as clear as other games of this type.
- **One theme:** deep indigo panels with a dark outline and a bevel, lit from the top like the pixel art. The light theme is gone.
- **Buttons:** chunky and three-dimensional, and they sink into their drop shadow when pressed.
  - **Gold** is the main action on any screen.
  - **Dark** is secondary.
  - **Red** is for big choices.
  - **Pink** is the daily wheel.
- **Fonts:** bundled with the game, so they also work offline and inside the Android app.
  - **Jersey 10** for titles, buttons, numbers and tabs. It is a pixel face whose digits stay readable: a 3 never looks like an 8.
  - **Atkinson Hyperlegible** for body text. It was designed for legibility.
  - The Google Fonts link is gone.
- **Header:** your fighter's own pixel face, with a gold level badge, instead of a generic icon. Tap it to see your fighters. Coins and gems sit in inset wells. The roster on the title screen shows each fighter's face too.
- **Tab bar:** the selected tab is a raised panel. The others are dimmed.
- **Play tab, laid out like a mobile game's home screen:**
  - **Story first:** a hero panel tinted with the chapter's colour, a segmented progress bar, an HP pill and the grit hearts. One big gold button continues the story.
  - **Modes as tiles,** two per row on phones and more on wider screens. Each tile shows its icon, its status in gold ("Best: floor 3", "1 of 2 beaten on hard"), and one short joke underneath. Locked tiles are greyed out with a padlock and say what unlocks them.
  - **Cups and the gauntlet** use the same tiles.
- **Small screens:** at 320 px wide the footer and the story card's buttons tighten instead of cutting words off. Checked on all 12 screen sizes, with nothing clipped.

### The Android app (APK)

- **What it is:** the same game, packaged with Capacitor (`apps/game/android`). It works offline.
- **Back button:** the phone's back button walks back through the game: it closes a dialog, then a sheet, then presses the screen's own back button, then returns to the Play tab. Only on the Play tab does it send the game to the background.
- **Service worker:** none in the app. The app updates by installing the new APK.
- **Icon and splash screens:** a pixel-art wheel drawn with the sprite engine (`tools/art/app-icon.ts`), scaled by whole numbers for each screen density.
- **How it's built:** `.github/workflows/android.yml` builds a signed APK on every update to main and replaces the "Android app" release, so the link at the top of this file always gives the newest one. It runs on GitHub's machines, which have the Android SDK; this cloud sandbox can't download it (dl.google.com is blocked).
  - Every build is signed with the same key (`apps/game/android/app/sideload.jks`), so new versions install over old ones and keep the save.
  - That key is meant for personal sideloading only. A store release would use a secret key, which the `ANDROID_KEYSTORE_*` variables take over.
- **Saves:** the app's save is separate from the browser's. Settings has "copy save" and import, to move a career between them.
- **Local build:** `npm run apk` (needs the Android SDK).

### New pixel art: fighters and icons

- **New fighter sprites, drawn in code from scratch** (`apps/game/src/art/`), same 70×84 canvas so nothing else moved.
  - **Proportions:** chunky and big-headed. The head is about a third of the height, so a fighter reads at a glance on a phone.
  - **Engine (`px.ts`):** every part is a shape whose shading comes from its own volume. Each shape is inflated into a bevel, lit from the top left and quantized into six hue-shifted tones per material: shadows drift violet, lights drift warm. Parts in front get a crease line in the darker tone of what is behind them, and the silhouette gets a coloured outline, never plain black.
  - **Faces:** two-by-three eyes with a glint. Brows and mouth follow a mood per class: angry brawlers, smug tricksters, calm mages, a worried "Resilient", a blank NPC.
  - **Hair:** six styles and eight colours from the name. A slicked widow's peak for vampires. Spiky hair, bobs, ponytails.
  - **Bodies:** every race feature redrawn: snouts, horns, ears, beaks, tusks, fins, bug eyes, skulls, visors. Every class outfit has real detail: belts with buckles, pauldrons, tabards, lapels, aprons, robe trims. Every hat was redrawn too.
  - **Creatures:** all nine creature body plans redrawn (slime, ghost, pigeon, toaster, eldritch horror, djinn, snowman, rubber duck, elementals by sub-race).
  - **Weapons:** all 35 have their own art. Six used to fall back to a plain sword: chainsaw, chakram, rapier, crossbow, bo staff and harpoon. Enchantments glow around the weapon's outline.
  - **Bosses:** the story bosses' silhouettes were ported onto the new engine.
- **New icon set:** all 75 interface and content icons were redrawn at 16×16 with the same engine and light (`art/icons.ts`), so icons and fighters share one style.
  - Coins, gems, tabs, stats, gear slots tinted by rarity, bag items, statuses, moves.
  - New icons: tower, flame, gift and an empty heart. The Play tab's tower and hard mode cards, the daily wheel button, and the grit hearts on the story card and map now use pixel icons instead of emojis.
- **Content icons from the sprite art** (`art/portraits.ts`):
  - **Faces:** races, sub-races (in their own colours) and classes (wearing their headgear).
  - **Weapons:** each weapon on its own, and enchantments as a glowing blade.
- **Power icons:** every power has a pixel icon. 19 are new (shadow, holy light, telekinesis, mind control, teleportation, gravity, shapeshifting, reality warping, negation, smite, miracle, life drain, arcane, earthquake, wind, vines, explosions, magnetism, summoning). The other 14 reuse the matching icon: fire is the flame, ice the snowflake, and so on.
- **Where the content icons show:** in the collection, on info cards, and **on the wheels' slices** instead of emojis. They are pre-built a few at a time while the browser is idle, because a sprite takes about 2.6 ms to draw and the race wheel has 47.
- **The old 12×12 letter-grid icons are gone**, along with their one-off extraction tool. Nothing uses them any more.
- **Size:** the main script went from 640 to 680 kB (225 → 241 kB gzipped) for the new sprite engine, about 100 drawn icons and the portraits.
- **Bug found along the way:** a fighter's skin tone and hair style both came from the same bits of the name hash, so they always paired up. The style now uses different bits. The old art also lined an eldritch horror's eyes up on a diagonal; they are now placed by hand.
- **Tests:**
  - The pixel-for-pixel comparison with the legacy sprites is retired, on purpose: the art is new. What still matches legacy (name hashing, the fields the art reads, cache keys) stays in `tools/parity/art.test.ts`.
  - New `tools/art/sprites.test.ts` checks that every race, sub-race, class and weapon draws something sensible: enough pixels, feet on the ground, the arm pivot on the canvas, every enchant glowing, each weapon different from every other, the same image every time, variety across names, and draw time.
  - New `tools/art/icons.test.ts` checks that every icon draws and that gear slots take the rarity colour. It also checks that every power and every status chip points at an icon that exists.
  - The boss silhouette tests pass unchanged.
- **Tools for looking at the art:** `npx tsx tools/art/sheet.ts <dir>` (contact sheets of races, classes, weapons and bosses; add `zoom Race:class:weapon` for close-ups), `tools/art/heads.ts` (faces at 10×) and `tools/art/icon-sheet.ts` (every icon).

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
- [x] 23. Trophy room
- [x] 24. Hall of fame exhibitions
- [x] 25. Endless tower
- [x] 26. Hard mode for cleared chapters
- [x] 27. Calendar-themed arenas

That closes "Content and progression". Next up is "UI, clarity, navigation" (28 onwards).

- [x] 28. Gear compare before equipping
- [x] 29. Scouting report after the wheels
- [x] 30. Filters and search in the collection and armory
- [x] 31. First-time tips instead of a tour
- [x] 32. Notification dots on the tabs
- [x] 33. Settings: text size and animation intensity
- [x] 34. Story map previews and the boss's recommended level
- [x] 35. Three-second undo for gear swaps

That closes "UI, clarity, navigation". Next up is "Art, animation, audio" (36 onwards).

- [x] 36. Real sound design and a music loop per arena
- [x] 37. Unique scenery for every Act II chapter
- [x] 38. Bosses with silhouettes of their own
- [x] 39. Idle breathing and victory poses by class
- [x] 40. A wheel-themed screen transition

That closes "Art, animation, audio". Next up is "Technical" (41 onwards).

- [x] 41. Ranked pool in a Web Worker, cached per day (verified)
- [x] 42. Split save data (verified)
- [x] 43. One-command regression suite
- [x] 44. Performance budget: Pixi loads on demand, rare screens lazy, fights in budget
- [x] 45. A hidden error log in settings

That closes "Technical". What's left is the optional item 46 (sharing), only if the owner later shares the game.

### 45. A hidden error log in settings

- **What changed:** uncaught errors, failed promises and console errors are kept on the device (the last 60; repeats of the same error are counted, not listed again), outside the save. Nothing shows while all is well. Once something has gone wrong, Settings shows a small **⚠ N errors logged** button under the build line, which opens the log: when, where and what (with the first lines of the stack), **Copy log** for pasting into a message, and **Clear**.
- Tested: a new e2e test (`errlog.spec.ts`) checks the button is absent at first, then breaks things on purpose (the same error twice and a failed promise), checks the count, the ×2, the messages, that the log survives a reload, and that Clear empties it.

### 44. Performance budget

- **Pixi loads on demand.** The renderer and everything built on it (wheels, the fight scene, fighters, scenery and particles) is now its own chunk, loaded the first time a wheel or a fight is on screen. Menus start without parsing it, and the offline install still caches it. The pure parts it used to drag along (the fight layout math and the SVG backdrops, which the DOM and the share card use) moved to their own Pixi-free modules.
- **No lost taps:** the chunk starts loading in the background as soon as the first screen is up, and a Spin tap that comes before a wheel is drawn now waits for it and spins, instead of doing nothing (the tower test caught that).
- **Rare screens load on demand too:** the hidden balance lab, the trophy room and hall of fame exhibitions.
- **Bundle:** the main script went from 983 kB (335 kB gzipped) to 640 kB (225 kB gzipped); Pixi's 330 kB (105 kB gzipped) comes later, when needed.
- **Fights stay in budget** (`npx tsx tools/dev/fps.ts`, Chrome with the CPU 4× slower, 390×844 at 2×, full animation, a story fight on auto, with all of this phase's additions: breathing, poses, hit sounds, music, horizons): the game's work per frame is 3.6 ms at the median (Phase 3: 5–6 ms), against the 16.7 ms a 60 fps frame allows; 3 of 60 sampled frames went over (first-time texture and text setup at the start of a fight). All JavaScript together used 3.8% of the main thread. The cloud machine draws in software, so the frame rate itself can only be confirmed on a phone.
- The FPS tool now switches off first-time tips and pins the date, like the tests.

### 43. One-command regression suite

- `npm run e2e` runs everything (98 tests in 8 files): a full story chapter with its boss, a cup, the gauntlet, the daily challenge, the boss rush and fight club (`modes.spec.ts`); every screen at all 12 required screen sizes (`screens.spec.ts`, `layout.spec.ts`); and the flows for saves, settings, fights and every Phase 4 feature, including hard mode, the tower, exhibitions, seasonal arenas, gear compare, filters, tips, map previews, undo, dots and the error log. CI runs it in 3 shards on every push and pull request; `npm test` runs the 300+ unit and parity tests.

### 42. Split save data (verified)

- The save lives in separate keys (settings, roster, the active fighter, profile, meta) with three rolling automatic backups; unchanged sections aren't rewritten. Covered by `store.test.ts` (8 tests: round trip, the active fighter in its own key, rolling backups, recovering from damage, backups before replacing or erasing, a full storage, the old version's save, export and import) and the e2e backup and damaged-save tests.

### 41. Ranked pool in a Web Worker, cached per day (verified)

- Today's 1,000-fighter ranked pool builds in its own worker (its own chunk) while you look around, and is cached for the day. The e2e test checks it gets ranked, is stored, and comes back instantly after a reload.

### 40. A wheel-themed screen transition

- **What changed (animation):** when the screen changes (title, fighter page, map, fight, bracket, collection…), a wheel of the game's colors (red, gold, teal, purple slices) spins open from the middle over the new screen and fades away, in under half a second.
- It never takes a tap (taps go straight through to the new screen), and switching tabs on the fighter page doesn't trigger it. With Calm animations (or the phone's reduced-motion setting) it doesn't play at all.

### 39. Idle breathing and victory poses by class

- **Breathing:** fighters standing on the stage breathe: a slow rise and fall of the chest, scaled from the feet so they never leave their spot. The two fighters breathe out of step, quicker when below 30% HP, and not at all lying down or with Calm animations.
- **Victory poses** by class, after a knockout or a decision:
  - **Flex** (brawler, berserker, tank, wrestler, slayer, resilient): two pumps of the arm with a squash and a little screen shake.
  - **Float** (mage, necro, alchemist, druid, chosen, monk): weapon held high, rising off the floor in a puff of sparkles.
  - **Twirl** (assassin, trickster, ninja, gunslinger): a spin with a hop, arm up at the end.
  - **Salute** (paladin, samurai, pirate, tamer): weapon raised to the brow and a small bow.
  - **Dance** (bard, streamer, gambler, chef): side-steps and hops with the arm going up and down.
  - Everyone else hops with an arm up, as before.
- Everything returns to where it was (position, facing, tilt). With Calm animations, the winner just raises their arm.

### 38. Bosses with silhouettes of their own

- **What changed (art):** all 20 story bosses get something nobody else has, drawn on top of their race and class (the chef's toque, the pirate's tricorn and the samurai's kabuto were already there):
  - Big Tony: spiked bouncer shoulders and a heavy gold chain.
  - Mama Gnocchi: a giant wooden spoon on her back and pearls.
  - Lady Venom: a towering collar and a tiara.
  - Admiral Saltbeard: gold epaulettes.
  - The Professor: tentacles reaching from behind, and a monocle.
  - Count Crypt: bone spikes from the shoulders and a crown of bones.
  - Titan Prime: boulder shoulders and peaks behind.
  - Neon Ronin: a neon visor and two swords on his back.
  - Queen Hivemind: a crown and a second pair of wings.
  - The Wheelmaster: a golden wheel behind him and a crown.
  - Captain Cumulus: a plume and clouds at his feet.
  - Baron Brimstone: great horns and a crown of fire.
  - The Clockmaker: a big gear behind him and goggles.
  - Leviathan Rex: a crown and a great dorsal fin.
  - Mister Giggles: a frilled ruff and a red balloon.
  - The Frost Queen: a crown of ice spikes.
  - The Sandman: a crescent moon behind his head and sand at his feet.
  - Null: a dark ring with an eye, and reaching tendrils.
  - Aurelion the Radiant: a golden halo and crest.
  - The First Wheel: the pink wheel itself behind them, and a crown.
- **Bigger:** bosses stand 15% taller than their size alone would make them, up to the tallest size the fight stage is laid out for, so the layout and the fighters' positions don't change.
- Everything is placed from each sprite's own head and shoulders, so it fits any race's build. Things behind the body only fill pixels the body left empty, and the weapon arm is untouched (its swing animation still lines up).
- Only fighters flagged as bosses get the layer, so every other sprite is still pixel-identical to the legacy art (the parity test still passes).
- Tested: `tools/art/boss-sprites.test.ts` checks every boss gets extra pixels with the arm unchanged, and that only flagged bosses get it and are cached separately.

### 37. Unique scenery for every Act II chapter

- **What changed (art):** story fights in chapters 11 to 20 now happen on that chapter's own horizon, drawn behind whichever arena the wheel picked:
  - ☁️ Sky Islands: floating islands with dangling roots and rope bridges.
  - 🔥 The Underworld: stalactites, hanging chains and a glow from below.
  - ⚙️ Clockwork Citadel: house-sized gears and a clock tower.
  - 🌊 The Sunken Kingdom: a drowned domed city, seaweed and bubbles.
  - 🎪 Carnival of Nightmares: a big top, a ferris wheel and bunting.
  - ❄️ The Glacier Court: an ice palace and icicles.
  - 💭 The Dream Realm: two moons, stairs to nowhere and clouds.
  - 🕳️ The Void: broken pieces of the world drifting, and an eye.
  - ⚡ The Pantheon: a temple on the horizon and lightning.
  - 🎡 The First Wheel: the Wheel itself, enormous, behind everything.
- The arena still decides the fight's rules, sky, floor, near scenery and weather; the chapter adds the far horizon, mostly as dark silhouettes so the arena stays readable. Purely visual: no rules or balance change.

### 36. Real sound design and a music loop per arena

- **Hits sound like what dealt them:** blades swish and ring, blunt weapons thump, ranged shots whoosh then thock, fists slap, and powers and signature moves boom. All synthesized, no audio files.
- **Hit strength** changes the sound: harder hits are louder and deeper (by damage, and big hits get the full weight). Crits add a bright ting on top.
- **Elements** add a layer on top of the hit: fire crackles, ice chimes, lightning zaps, water splashes, wind whooshes, shadow hums low, light sparkles, poison bubbles, plants rustle, sonic beats, gravity drops, earth rumbles, mind warbles.
- **UI taps:** every button press gives a very soft click (with the ripple and the buzz it already had). Wheel ticks were already there.
- **Music:** a light loop plays in every arena (24 arenas, seasonal ones included), each with its own root note, tempo, key and lead sound: soft bass, a pad, a few notes on top and a quiet hat. Lava is a fast minor sawtooth; the ball pit is a bouncy major square wave; the void is slow and low. A boss's phase two still swaps in its own driving loop.
- **Separate switches:** Settings now has **Sound effects** and **Music**, each on its own. Both loops fade in and out with the Music switch, even mid-fight.
- Sound is optional everywhere: if the browser has no audio, nothing breaks.

### 35. Three-second undo for gear swaps

- **What changed (UI):** wearing or taking off a piece in the armory, and wearing new loot from the swap-or-keep choice, shows the usual toast with an **Undo** button for three seconds. Undo puts back what was in the slot before (or empties it again) and says so (*"🧥 Leather vest is back on"*); the armory refreshes if it's open, and the stats popup shows the numbers going back.
- Buying gear isn't a swap and has its own confirmation, so it has no undo; the piece you replaced stays in your armory anyway.
- Tested: a new e2e test wears a piece, taps Undo, and checks the old piece is worn again.

### 34. Story map previews and the boss's recommended level

- **What changed (UI):** every step on the story map can be tapped, not just the current one, for a preview of what it holds:
  - **Fight / Elite / Nemesis:** what a win pays (*"Win: about 26 XP, 7 🪙 and 11 fame"*, the same numbers the fight uses), the extras (an elite's gem and loot spin, the nemesis's revenge bonus) and what a loss costs.
  - **Boss:** name and title, *"Recommended level 14. You are level 11: 3 short"*, and the gems and loot spin it pays.
  - **Merchant:** this chapter's merchant (*"🕯️ Graveyard keeper: Sells things the dead left behind"*), what they stock and the gear rarities for this chapter.
  - **Campfire, Treasure, Encounter:** the choices and what they do.
- The boss step shows its **recommended level** as a badge on the map (*"Lv 14"*), red when you're below it. Hard runs expect three levels more, and the previews show hard mode's extra coins, gems and treasure.
- What a story win pays now comes from one function (`storyPay`) that both the fight and the preview use, so they can't drift apart. The numbers are unchanged.
- Tested: `preview.test.ts` (4 tests) covers every kind of step, the pay matching `storyPay`, the boss's level line and gems, and the hard-mode numbers. The 12-size layout test's map check covers the badge.

### 33. Settings: text size and animation intensity

- Text size (Small to Huge) and Animations (Like my phone / Calm / Full) were already in Settings from Phase 2, and the e2e settings test covers them.
- **New: Hit effects** (Soft / Normal / Big), shown unless animations are Calm. It scales the fight's screen shake and particle bursts: Soft is a bit under half, Big is 1.6× the shake with more and wider sparks. Calm still turns them off completely, as before.
- Saved with the other settings; old saves get Normal, and a broken value is put back to Normal.
- Tested: `tips.test.ts` gains a check for the default and the repair; the e2e settings test now also sets Big and checks it survives a reload.

### 32. Notification dots on the tabs

- **What changed (UI):** a small red dot on a tab when something new is waiting there (screen readers hear "something new"):
  - **Play:** the daily wheel or today's daily challenge is ready, or a challenger is waiting.
  - **Fighter:** talent points to spend.
  - **Goals:** a goal finished since you last looked at the tab. Looking clears it.
- No dot ever counts a missed day: a new day simply has its own daily wheel and challenge. The dot doesn't show on the tab you're already on.
- Tested: `dots.test.ts` (3 tests) covers each tab's dot turning on and off, and a new day bringing a new Play dot without any mention of the day before.

### 31. First-time tips instead of a tour

- **What changed (UI):** the five-page tour no longer opens on first launch. Instead, each system explains itself the first time it shows up, in a small card at the top of the screen: what it is, how it works in plain words, and a joke, with **Got it** and **No more tips**. Each tip shows once, ever.
- 15 tips: the combat wheel and reading the opponent (first fight), sudden death (when it first starts), the story map, the base shop, story merchants, haggling, talents, the armory, the forge, tournaments, the gauntlet, fight club, the endless tower and hard mode. For example, 💀 **Sudden death**: *"The round limit is up and this fight never goes to the judges. Every hit lands harder, more each round, until someone falls. A story win in sudden death pays a gem."* / *"Nobody leaves until somebody leaves horizontally."*
- Every tip was checked against the rules it describes (haggle odds and the price rise, talent points per level and rank-up, grit, the sudden-death gem).
- Settings has a **Tips** switch and *Show all tips again*. The full tour is still in More → How to play. Saves keep which tips were seen; old saves start with tips on and none seen.
- Tests switch tips off by default (`whs:notips`, like `whs:seed`) so other tests aren't interrupted; the tests that skipped the old tour no longer need to.
- Tested: `tips.test.ts` (2 tests) checks every tip is complete and that old or broken settings get tips on with a clean list. Two new e2e tests: no tour on first launch, and a tip that shows once (armory), the next one (talents), and *No more tips* stopping the rest, with the layout checked at 320×568.

### 30. Filters and search in the collection and armory

- **What changed (UI):** both have a search field (pixel magnifier, clear button) and a **Filters** button that opens rows of chips and shows how many are on (*"Filters (2)"*). Filters stay set while you look around.
  - **Armory:** search by name, effect, set, rarity or slot (*"knight"*, *"durability"*, *"helmet"*). Filter by rarity, slot and set; only rarities and sets you own are offered. With anything on, the slot grid becomes one list of matching pieces from every slot (*"Matching pieces (4 of 5)"*), each with Wear (and its compare) and Forge. Inside a slot, the filters narrow that slot's list. *Clear filters* goes back to the slots.
  - **Collection:** search, *Found* or *Still missing*, a tier (Cooked to Goated), and a category (Races, Weapons, Gear…). Categories with nothing matching are hidden, and an empty result says so (*"The collection is big, not psychic."*). Search never matches an undiscovered "???" entry by its name, since that would give it away; it can match its parent (a sub-race's race, say).
- Search ignores case and accents and needs every word to match somewhere, so *"plate knight"* finds the Knight plate.
- The chip rows scroll sideways inside themselves when they don't fit; the page itself never scrolls.
- Tested: `filters.test.ts` (4 tests) covers the forgiving search, gear filters by set, slot, rarity and words, the collection's found/missing/tier filters, and that a hidden entry can't be found by name. Two new e2e tests use the armory (search, slot chip, the count on the Filters button, nothing-matches, clear) and the collection (missing, found, a category, nothing-matches, layout at 320×568 and 667×375).

### 29. Scouting report after the wheels

- **What changed (UI):** the "Meet your fighter" screen opens with a 📋 **Scouting report**: three strengths, the biggest weakness and the best synergy, each as a plain-words label, the number behind it and a joke, then a sign-off that depends on the verdict:
  - 🛡️ **Tough.** Durability 20, among the very best. *Has been hit by worse. Mostly by furniture.*
  - 🕯️ **Biggest weakness: Weak power.** Power mastery 1, among the very lowest. *The power is more of a party trick.*
  - ⛈️ **Best synergy: Storm caller.** Lightning power and a shocking weapon: chains three times as often. *Two things that should not mix, mixing beautifully.*
  - *"This one could go places. Mostly forward, fast."*
- "Strong" and "weak" are measured against every fighter the wheels can make (a fixed sample of 600), in words: among the very best, well above average, above average, about average. Crit and dodge chances count too. Power mastery only counts when there's a power to use.
- The weakness is a clearly low stat when there is one, otherwise the weakness the wheel gave them (with its own flavor line). Hidden synergies stay hidden: the report never names one. Jokes are picked by the fighter's name, so the report is the same every time you look.
- All the text is one table (`build-summary.ts`): nine kinds of strength and weakness with three jokes each, plus sign-offs for each verdict.
- Tested: `summary.test.ts` (5 tests) checks every report has three different strengths and a weakness that isn't one of them, everything filled in, the same report every time, a towering stat leading and a tiny one as the weakness, the trait fallback, and no hidden synergy named. The 12-size layout test now checks the report's five lines on the card screen.

### 28. Gear compare before equipping

- **What changed (UI):** before a piece goes on, a compare view shows what's in the slot now next to the new piece (pixel icons and names), then every real number that would move: *Defense 38 → **44** +6* on green, *Speed 61 → **57** −4* on red. Set bonuses and synergies it would start (*"✨ Starts ⚜️ Knight set (4)"*) or end (*"✖ Ends ⚜️ Knight set (2)"*) are listed, then both pieces' effect lines. If no number moves it says so (*"The difference is in what it does."*).
- It shows everywhere gear goes on: **Wear** in the armory (now a quick confirm with Wear it / Back), the **swap-or-keep** choice for new loot, and buying gear in the **base shop** (daily deal and premium) and from **story merchants** (those put it on right away, and now say so).
- The numbers come from the same stat code as the fighter page (`gearCompare` in core, on a copy of the fighter), so the compare and the "Stats changed" popup afterwards always agree. Forge upgrades on either piece are included.
- Tested: `compare.test.ts` (3 tests) checks the numbers match wearing it for real and the fighter isn't touched, that set bonuses gained and lost are named, and that the worn piece compares as no change. A new e2e test opens the armory with three knight pieces on, taps Wear on the knight plate, checks the green Defense row and "Knight set (4)", the layout at 320×568 and 667×375, backs out, then wears it.

### 27. Calendar-themed arenas

- **What changed (content):** nine seasonal arenas join the arena wheel in their season, by the phone's date, and come back every year:

| Arena | When | Effect |
|---|---|---|
| ❄️ Snow globe | 1 December to 6 January | Ice +30%, more freezes |
| 🎆 New Year's rooftop | 30 December to 2 January | Fire and light +20%, stray fireworks (25% a round, 6 damage to someone) |
| 💘 Lovers' ring | 1 to 20 February | Mind +30%, crits +8% |
| 🍀 Clover field | 10 to 24 March | Plants +30%, crits +5%, dodge +4% |
| 🐣 Egg hunt meadow | 1 to 21 April | Plants +20%, everyone +1 speed |
| 🔥 Midsummer bonfire | 18 June to 8 July | Fire +30%, light +20%, sunlight-weak fighters burn |
| 🏊 Heatwave pool party | 20 July to 25 August | Water +30%, everyone −1 speed |
| 🎃 Pumpkin patch | 1 October to 2 November | Shadow +30%, fire +20%, unholy fighters +1 strength and speed |
| 🍂 Leaf pile | November | Wind +30%, everyone dodges a bit more |

- Each has its own drawn backdrop and weather (snow, confetti, petals, autumn leaves, embers), a mechanics line and a flavor line (*"The pumpkins are carved with faces. The faces are judging your build."*). In season, the arena wheel's odds list says *"🎃 Pumpkin patch is in season"*, and the Play tab says so once a season in a toast.
- **No FOMO:** nothing is tied to them. No rewards, no goals, no achievements, and they don't count toward the collection total or its milestones. The collection has a separate *Seasonal arenas* section that always shows all nine with their dates (*"Not counted. They come back every year"*), marks the one in season, and opens each one's info card.
- **Balance check** (`npx tsx tools/sim/seasonal.ts`, 1,500 random pairs fight in every arena with the same dice): how often the winner differs from the Colosseum. Regular arenas: 4.3% to 21.3%. Seasonal: 4.3% to 7.3%, and 21.7% for the New Year's fireworks (like the Thunderdome's lightning, 21.3%). Average rounds stay at 6.1 to 6.5, as in the regular arenas. They sit inside the existing range.
- Tests pin the date (`whs:today`, like `whs:seed`) to a day with no season, so seeded fights don't change with the calendar.
- Tested: `seasonal.test.ts` (6 tests) covers the calendar windows (including across New Year), unique keys and names, seasons of at most six weeks, the wheel and its odds note in and out of season, fights in every seasonal arena, the collection count not moving, the info card, and one heads-up per season (again next year). A new e2e test sets the date to 10 December and checks the toast, the collection section (9 tiles, Snow globe in season) and an info card at 320×568.

### 26. Hard mode for cleared chapters

- **What changed (mode):** Play → 🔥 **Hard mode** (once a chapter is cleared). Pick any cleared chapter and play it again, meaner:
  - Fights come from higher up the ranked pool (+15%), three levels stronger, with an extra piece of gear and sharper AI (+0.1).
  - The boss gets +2 to every stat, is tuned to give you 12 points less of a chance, has 3 more levels of room to tune up, and never "eases off".
  - **One twist for the whole chapter**, drawn when you start from the daily challenge's mutators (not the ones that force an arena or set your HP, since story HP carries over). It shows on the chapter intro, the map header and the Play card.
- **Better loot:** half again the coins, boss loot from elites and nemeses, and the boss pays 3 more gems, a purse of 10 + 2 × chapter coins and an extra treasure spin.
- **Your story waits:** the main story is set aside untouched and comes back when the hard run ends. Beat the boss and the chapter gets its 🔥 for good (*"Beaten on hard: 3 of 12"*). Run out of grit and the run just ends, with no coins lost. You can also walk away from the Play card any time (with a confirm). Cups unlock from the main story's chapter, not the hard run's.
- The story card turns orange while a hard run is on, with the twist and *Continue on hard* / *Walk away*.
- **Simulated** (`npx tsx tools/sim/hard.ts`, auto-battle bot): each fighter plays the story up to a chapter, then tries that chapter on hard and the one two chapters back, from the same save:

| Build | Cleared to | Beat hard, same chapter | Beat hard, 2 back | Fights per run | Coins per run |
|---|---|---|---|---|---|
| Weak | ch 4 / 8 / 12 | 33% / 26% / 40% | 57% / 74% / 73% | 6 to 9 | 62 to 175 |
| Average | ch 4 / 8 / 12 | 33% / 33% / 57% | 71% / 63% / 65% | 7 to 9 | 63 to 175 |
| Strong | ch 4 / 8 / 12 | 58% / 42% / 79% | 96% / 46% / 75% | 8 to 9 | 101 to 206 |

  Right after clearing a chapter, its hard version is a real fight (a third to a half of tries for average builds). A couple of chapters later it's more likely than not. Nothing in the normal story changed.
- Tested: `hard.test.ts` (6 tests) covers which chapters open, the main story waiting untouched (and surviving a save), cups following the main story, the twist pool, the twist in every fight with HP still carried, stronger fights and bosses, more coins, the boss win (loot, treasure, celebration, home, marked for good), running out of grit with no coin loss, and the legacy save shape. New e2e tests: a full hard flow on a 320 px phone (picker, confirm, twist intro, hard map, a fight, the reward, the hard Play card, walking away), and the picker, confirm, intro, map and Play card at all 12 screen sizes.

### 25. Endless tower

- **What changed (mode):** Play → 🗼 **Endless tower** (from level 5 or chapter 1). One fight per floor, each a bit higher up the ranked pool and a level stronger every four floors, with smarter AI as you climb.
- **A twist every five floors:** from floor 5 on, each block of five floors has a mutator from the daily challenge's list (glass cannons, sudden death and the rest), the same for the whole block, different every climb.
- **HP carries over:** +30% after each win, and a full rest on every fifth floor's landing before the next twist. **Three hearts:** a loss costs one and you try the floor again at 60% HP against someone new; the last heart ends the climb. You can walk back down any time and keep your floor.
- **Rewards and records:** a few coins and XP per floor (more higher up), a gem and an elite loot spin on every tenth floor's landing. Your fighter's best floor shows on the Play card next to the save's record ("record 23"), and beating the record gets a 🏅 line.
- **Simulated** (`npx tsx tools/sim/tower.ts`, 30 climbs per cell, auto-battle, six random pieces of gear), floors cleared:

| Median (top 10%) | Lvl 10 | Lvl 20 | Lvl 30 |
|---|---|---|---|
| Weak build | 3 (7) | 3 (7) | 4 (10) |
| Average build | 8 (13) | 10 (16) | 6 (13) |
| Strong build | 15 (24) | 14 (27) | 11 (22) |

  The first version had no hearts and only +20% HP between floors: average builds cleared 1 to 3 floors and weak ones almost none, so every climb ended at the bottom. With hearts and rests, a typical climb lasts a few landings and a good one gets deep.
- Tested: `tower.test.ts` (3 tests) checks that the twists start on floor 5 and stay for the whole block, vary between climbs, and opponents get stronger. It also checks HP carries with +30% and a full rest every fifth floor, the tenth floor's chest, a lost heart sending you back up the same floor, and the last heart ending the climb with the records kept. A new e2e test climbs floor 1 on a 320 px phone and checks the hearts, the fight's label, the next floor (or a heart down) and walking back down.

### 24. Hall of fame exhibitions

- **What changed (mode):** Play → **Exhibition**. Two legends from the hall of fame fight for pride while two commentators call it: 🎙️ **Rex Thundermic** on play-by-play (*"THE SIGNATURE MOVE! Bob has been saving that since the Bronze Age!"*) and 🩺 **Dr. Brenda Kneecap** on colour (*"I have notes for Bob. The first note is: duck."*).
- Legends are champions (cup and story winners) and, from now on, retirees: retiring keeps the fighter in the hall of fame for this, for the best six, like champions. Pick the red and blue corners from the list or 🎲 shuffle, then 🔔 ring the bell.
- The broadcast plays round by round in a sheet: both fighters' sprites and HP bars, each round's narration, and one call per round about its biggest moment: a signature move, a crit, plot armor, a big hit, a read, a dodge, a heal, a lead change, someone hanging on below a quarter HP, or a quiet round (*"Riveting. I am going to check my phone."*). The commentators take turns and don't repeat a line until they've used the others. Skip to the end any time; reduced motion shows it all at once. Then rematch or pick a new matchup.
- No rewards and nothing at stake: it's a show. With fewer than two legends it says how to get some (*"The arena is empty. The janitor is doing push-ups."*).
- The fight is the normal engine, two AIs, from a seed; the commentators pick lines from their own stream, so commentary never changes a fight.
- Tested: `exhibition.test.ts` (4 tests) covers who counts as a legend (champions and retirees with a fighter, best first, no doubles), that a seed always gives the same fight and calls, that calls take turns with every name filled in, HP stays 0-100 and the winner is the one standing, and that every moment has lines for both commentators. A new e2e test sets up a hall of fame, puts the retiree in the blue corner, plays the exhibition, and checks the calls, the loser's greyed corner, and the layout at 320×568 and 844×390.

### 23. Trophy room

- **What changed (progression):** More → **Trophy room**, a set of wooden shelves with everything your fighters have won, across the whole roster and the hall of fame:
  - **Belts:** Local brawl, Regional cup and World championship, with how many times and who won each first.
  - **Boss kills:** all 20 bosses as trophies ("3 of 20"). Beaten ones show their emblem and a ×N for repeat kills; the rest are question marks with their chapter.
  - **Rare titles:** the rarest titles (boss titles live on the boss shelf). Earned ones open their info card; the rest are "???" silhouettes.
  - **Class mastery:** every class with at least one mastery level, with five pips; fully mastered classes glow gold.
- Belts and boss kills are counted in the save as they happen (`profile.trophies`). The first time the room is opened, it also counts what the fighters on the roster and in the hall of fame already hold, so existing saves start with their silverware. Nothing else in the save changes.
- Items pop in one after another (skipped with reduced motion). The sub line reads *"Everything your fighters have won. Dust not included"*, and an empty room says *"An empty room echoes. Go win something."*
- Tested: `trophies.test.ts` (3 tests) checks the one-time count of existing belts and bosses, that later wins add up and remember who was first, and the shelves' contents. A new e2e test opens the room for a career with a belt, three bosses, two rare titles and a mastered class, checks the counts and the gold class, opens a title's info card, and checks nothing is cut off at 320×568, 390×844, 844×390 and 1280×720.

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
