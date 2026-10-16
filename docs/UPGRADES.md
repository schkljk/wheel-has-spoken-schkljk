# Upgrades (work top to bottom after parity, phases 0–3)

Mark each one done in `PROGRESS.md`. Balance items need before/after simulation numbers.

## Priority 1: highest impact
1. **Balance pass for the numeric system.** Build `npm run sim`: simulate full story runs with average, weak and strong builds. Tune chapter levels, boss HP and XP so an average build clears Act I around level 15–17 without grinding and Act II needs some side modes. Report clear rates per chapter.
2. **Pixel-art content icons.** One pixel icon per gear slot tinted by rarity at minimum; ideally unique icons for items, statuses, moves, races and classes. Same 12×12 style and palette as `legacy/src/ui_icons.js` (scale up crisply).
3. **Save safety net.** Rolling automatic backups (last 3), export/import file, versioned migrations (done in phase 2; make sure it's bulletproof and tested).
4. **Fight replay and share card.** Save a big win as an image: both fighters, the final blow, damage numbers, fighter names and titles.
5. **More agency on the combat wheel.** One "nudge" per fight (nudge a spinning wheel one slice) or one "lock" per fight (keep a slice for next round). Keep it simple and visible.

## Combat feel
6. Named combo and synergy banners with distinct sounds when they trigger.
7. Opponent move history: their last 2–3 moves as icons near their HP bar.
8. Status icons with round counters above each fighter (burn, poison, stun, buffs, debuffs).
9. Long-press a wheel slice: rough damage preview against this opponent and what it beats.
10. Boss phase-two arena changes (lighting, music, one unique phase slice).
11. AI personalities (aggressive, turtle, gambler, tactician) shown on the opponent card and biasing their choices.
12. Finisher moment: slow-motion zoom on the knockout blow.
13. A visible momentum meter.

## Balance and system health
14. Developer balance dashboard (hidden): win rates by class, race, weapon, sidekick, gear set and growth from mass simulation.
15. Soft caps on crit, dodge and damage reduction stacking.
16. Joke picks (NPC, Rubber duck, junk gear) get hidden synergies that make them secretly viable.
17. Charisma unlocks dialogue options and better outcomes in story events.
18. Check Growth types (Unstoppable, Prodigy) at levels 20 and 40; tune if they dominate.

## Content and progression (content, not grind)
19. The nemesis appears in the story with taunts referencing past fights, escalating across chapters.
20. Chapter-themed events (Night Market food events, Highlands ghost events, and so on), not the same 13 everywhere.
21. Gear upgrading (+1 to +5) with coins and duplicates.
22. More gear sets: pirate, chef, cosmic, royal.
23. Trophy room: a visual shelf of belts, boss kills, rare titles and mastered classes.
24. Hall of fame exhibitions: retired champions fight each other with commentary.
25. Endless tower: one floor per fight, a mutator every 5 floors, personal best records.
26. Hard mode for cleared chapters with modifiers and better loot.
27. Calendar-themed arenas (snowy arena in December), with no FOMO mechanics.

## UI, clarity, navigation
28. Gear compare view (current vs new, green/red per stat) before equipping.
29. Build summary after the wheels: three strengths, biggest weakness, best synergy, in plain words with a joke.
30. Filters and search in the collection and armory (rarity, slot, set, name).
31. Contextual first-time tips when a system first appears (shops, haggling, talents, armory, sudden death), replacing the up-front tour.
32. Notification dots on tabs (unspent talent points, daily ready, goal done).
33. Settings: text size, animation intensity.
34. Story map: tap a node to preview it (elite reward, merchant type); recommended level shown on the boss node.
35. A 3-second undo for gear swaps.

## Art, animation, audio
36. Real sound design: weapon-type hits, hit strength, elements, UI taps, wheel ticks; a light music loop per arena; separate mute toggles.
37. Unique arena scenery for all Act II chapters.
38. Bigger hand-tuned boss sprites with unique silhouettes.
39. Idle breathing animation and class-specific victory poses.
40. A wheel-themed screen transition.

## Technical
41. Ranked pool in a Web Worker, cached per day (phase 2; verify).
42. Split save data (phase 2; verify).
43. One-command regression suite (`npm run e2e`) covering all modes and screen sizes.
44. Performance budget: profile on a throttled phone profile; keep fights at 60 fps and the bundle small (lazy-load rarely used screens).
45. A hidden error log viewable in settings.

## Optional, only if the owner later shares the game
46. Share a fighter via a code; ghost fights against a friend's fighter; fighter card image export.
