import { useMemo, useState } from 'preact/hooks';
import { GHOST_TIER, ctxOf, ghostCode, powerScale, readGhost } from '@whs/core';
import { FighterSprite } from '../art/FighterSprite';
import { lookOf } from '../art/sprite';
import { fight } from '../flows/fight';
import { runSteps } from '../flows/nav';
import { G } from '../state/game';
import { closeSheet } from '../state/ui';
import { copyText } from '../ui/copy';
import { Sheet } from '../ui/kit';

/**
 * Ghost codes (review F9): your fighter as a line of text, and a box to paste a friend's and fight it.
 * Ghost fights are for pride only: no XP, no coins, nothing lost.
 */
export function GhostSheet() {
  const F = G.F!;
  const mine = useMemo(() => ghostCode(F), []);
  const [text, setText] = useState('');
  const ghost = useMemo(() => (text.trim() ? readGhost(text) : null), [text]);
  const ctx = ctxOf(G);
  const go = async () => {
    if (!ghost) return;
    closeSheet();
    const r = await fight({ kind: 'ghost', tier: GHOST_TIER, opp: ghost });
    await runSteps(r.next);
  };
  return (
    <Sheet emoji="👻" title="Ghost codes" sub="Send your fighter to a friend as text. Fight theirs back">
      <div class="stack">
        <span class="sec-label">{F.name}'s code</span>
        <code class="ghost-code" aria-label={`${F.name}'s ghost code`}>
          {mine}
        </code>
        <button class="btn block" onClick={() => void copyText(mine)}>
          Copy the code
        </button>
        <span class="sec-label">Fight a friend's ghost</span>
        <textarea class="ghost-in" rows={3} placeholder="Paste a code that starts with WHS1." value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} aria-label="A friend's ghost code" />
        {text.trim() && !ghost && <p class="hint">That code doesn't read. It may have lost a character on the way: copy it again.</p>}
        {ghost && (
          <div class="ghost-prev">
            <FighterSprite look={lookOf(ghost)} h={72} />
            <span class="grow">
              <b class="ellipsis">{ghost.name}</b>
              <small>
                Level {ghost.lvl} {ghost.race.n.toLowerCase()} {ghost.arch.n.toLowerCase()}. 📈 {powerScale(ghost, ctx).n}
              </small>
            </span>
          </div>
        )}
        <button class="btn block" disabled={!ghost} onClick={() => void go()}>
          👻 Fight the ghost
        </button>
        <p class="hint center">For pride only: no XP, no coins, nothing to lose but face.</p>
      </div>
    </Sheet>
  );
}
