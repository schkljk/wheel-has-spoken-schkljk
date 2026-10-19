import { describe, expect, it } from 'vitest';
import { ghostCode, headToHead, labFighter, mulberry32, numStats, readGhost, type CareerFighter } from '../src';

// Review F9: a fighter as a line of text, fought by a friend.
describe('ghost codes', () => {
  it('carry the build exactly: same numbers, same fights', () => {
    for (let s = 1; s <= 25; s++) {
      const f = labFighter(mulberry32(s), 1 + (s % 30)) as CareerFighter;
      const code = ghostCode(f);
      expect(code).toMatch(/^WHS1\.[\w-]+\.[0-9a-z]{3}$/);
      const g = readGhost(code)!;
      expect(g.name).toBe(f.name);
      expect(numStats(g)).toEqual(numStats(f));
      const o = labFighter(mulberry32(s + 99), 10);
      expect(headToHead(g, o, mulberry32(7), 20)).toBe(headToHead(f, o, mulberry32(7), 20));
    }
  });
  it('keep names with accents and emoji', () => {
    const f = labFighter(mulberry32(5), 9) as CareerFighter;
    f.name = 'Zoë the 🐸, Destroyer';
    expect(readGhost(ghostCode(f))!.name).toBe('Zoë the 🐸, Destroyer');
  });
  it('survive spaces and line breaks from a chat app', () => {
    const code = ghostCode(labFighter(mulberry32(3), 12) as CareerFighter);
    const messy = code.slice(0, 20) + '\n ' + code.slice(20, 50) + ' ' + code.slice(50);
    expect(readGhost(messy)?.name).toBeTruthy();
  });
  it('refuse a damaged code or anything else', () => {
    const code = ghostCode(labFighter(mulberry32(4), 12) as CareerFighter);
    const i = 12;
    const broken = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    expect(readGhost(broken)).toBeNull();
    expect(readGhost('hello')).toBeNull();
    expect(readGhost('WHS1.e30.000')).toBeNull();
  });
});
