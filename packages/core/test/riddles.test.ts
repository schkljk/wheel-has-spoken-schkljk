import { describe, expect, it } from 'vitest';
import { RIDDLES, SYN, SYN_HIDDEN, SYN_SETS, infoFor, riddleOf } from '../src';

// Review F6: every undiscovered synergy has a riddle, and none gives its name away.
describe('synergy riddles', () => {
  it('cover every synergy', () => {
    const sets = [...SYN, ...SYN_SETS].filter((s) => s.k.startsWith('set_'));
    for (const s of [...SYN, ...SYN_HIDDEN]) if (!sets.includes(s)) expect(RIDDLES[s.k], s.k).toBeTruthy();
    for (const s of sets) expect(riddleOf(s.k)).toMatch(/ set\./);
  });
  it('never say the name', () => {
    for (const s of [...SYN, ...SYN_HIDDEN]) expect(riddleOf(s.k).toLowerCase(), s.k).not.toContain(s.n.toLowerCase());
  });
  it('open as an info page', () => {
    expect(infoFor('riddle|inferno')!.p).toBe(RIDDLES.inferno);
  });
});
