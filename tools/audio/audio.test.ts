import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POWER_ALL } from '../../packages/core/src';
import { SFX, SFX_GROUPS } from '../../apps/game/src/audio/sfx-data';
import { THEME, bassNotes, chordOf, harmonyUnder, leadNotes, midiOf } from '../../apps/game/src/audio/songs';
import { lengthOf } from '../../apps/game/src/audio/synth';

// The sound pass: every sound the game asks for exists and is sane, every power has its own impact, and the
// theme is well formed bar by bar. (Levels are checked by ear-free rendering: tools/audio/levels.mjs.)

/** every file under a folder */
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

describe('sound effects', () => {
  it('every sound is sane: positive lengths, levels between 0 and 1, nothing that piles up past full scale', () => {
    for (const [k, specs] of Object.entries(SFX)) {
      expect(specs.length, k).toBeGreaterThan(0);
      for (const s of specs) {
        expect(s.d, k).toBeGreaterThan(0);
        expect(s.v, k).toBeGreaterThan(0);
        expect(s.v, k).toBeLessThanOrEqual(0.6);
        expect(s.f, k).toBeGreaterThan(0);
        expect(s.at ?? 0, k).toBeGreaterThanOrEqual(0);
      }
      expect(lengthOf(specs), k).toBeLessThan(3);
    }
    // the sound test page lists every one
    expect(SFX_GROUPS.flatMap((g) => g.keys).sort()).toEqual(Object.keys(SFX).sort());
  });
  it('every sound the game plays by name exists', () => {
    const names = new Set<string>();
    for (const f of walk('apps/game/src').filter((f) => /\.tsx?$/.test(f) && !f.includes('sfx-data'))) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/'((?:w|p|f|wh|ui|s)\.[a-z0-9]+(?:\.[a-z0-9]+)?)'/g)) names.add(m[1]!);
    }
    expect(names.size).toBeGreaterThan(60);
    for (const n of names) expect(SFX[n], n).toBeDefined();
  });
  it('every power lands with its own sound', () => {
    for (const p of POWER_ALL) if (p.k !== 'none') expect(SFX[`p.${p.k}.hit`], p.k).toBeDefined();
  });
});

describe('the theme', () => {
  it('has a chord, eight eighths, sixteen drum and bass steps in every bar', () => {
    const bars = THEME.chords.length;
    expect(bars).toBe(24);
    for (const k of ['lead', 'harm', 'arp', 'pad', 'drums', 'bass'] as const) expect(THEME[k].length, k).toBe(bars);
    THEME.lead.forEach((b, i) => {
      const toks = b.trim().split(/\s+/);
      expect(toks.length, `bar ${i + 1}`).toBe(8);
      for (const t of toks) expect(t === '-' || t === '.' || midiOf(t) != null, `bar ${i + 1}: ${t}`).toBe(true);
    });
    for (const d of THEME.drums) expect(d).toMatch(/^[kshoc.]{16}$/);
    for (const d of THEME.bass) expect(d).toMatch(/^[RO53.]{16}$/);
  });
  it('the melody stays in a range a phone speaker plays well, mostly on the chord', () => {
    const notes = leadNotes(THEME);
    expect(notes.length).toBeGreaterThan(100);
    let onChord = 0;
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(midiOf('E4')!);
      expect(n.midi).toBeLessThanOrEqual(midiOf('A5')!);
      const ch = chordOf(THEME.chords[Math.floor(n.step / 16)]!);
      if (ch.includes(n.midi % 12)) onChord++;
    }
    // passing notes are fine; a melody that ignores its chords is not
    expect(onChord / notes.length).toBeGreaterThan(0.7);
  });
  it('parses notes and chords, and builds harmony and bass from them', () => {
    expect(midiOf('A4')).toBe(69);
    expect(midiOf('G#4')).toBe(68);
    expect(midiOf('Bb3')).toBe(58);
    expect(midiOf('-')).toBeNull();
    expect(chordOf('Am')).toEqual([9, 0, 4]);
    expect(chordOf('E7')).toEqual([4, 8, 11, 2]);
    expect(chordOf('F')).toEqual([5, 9, 0]);
    // under E5 on A minor: C5
    expect(harmonyUnder(76, chordOf('Am'))).toBe(72);
    const b = bassNotes('R..R..O.R..5..O.', chordOf('Am'));
    expect(b.map((x) => x.midi)).toEqual([45, 45, 57, 45, 52, 57]);
  });
});
