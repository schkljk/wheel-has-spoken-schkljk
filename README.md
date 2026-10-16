# The Wheel Has Spoken: rebuild package

**To use:** open this folder in Claude Code and say:

> Read CLAUDE.md and do it.

That's all. Claude Code handles git, building and publishing by itself, and gives you a link to play each new version on your phone. `CLAUDE.md` holds the mission, rules, tech stack and phases. `docs/` holds the architecture, the full game design and the upgrade list. `legacy/` is the current game: source, build scripts, tests and a playable `legacy/dist/wheel-has-spoken.html` (open it in any browser).

Claude Code keeps a running log in `PROGRESS.md` so you can check where it is at any time.

Your current save stays in the old version. The rebuild includes an importer: in the old game, open Settings and copy your save, then paste it into the new game's import screen.
