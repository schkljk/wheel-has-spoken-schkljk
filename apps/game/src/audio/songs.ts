// The game's theme, written like a tracker: per bar a chord, eight eighth notes of melody, a drum line and a
// bass groove. Pure data and a parser (no Web Audio), so tests can check that every bar adds up.
//
// "The Wheel Has Spoken" theme, A minor, 112 bpm, 24 bars (about 51 seconds), then it loops:
//   A  (bars 1-8):   the hook. Am F C G | Am F E Am. Lead, bass, light drums, a soft pad.
//   B  (bars 9-16):  the game-show lift into the relative major. F G Em Am | F G E E. Drums drive, arpeggios.
//   A' (bars 17-24): the hook again with a harmony under it, the arpeggios and full drums, and a pickup
//                    back into bar 1.

export interface SongData {
  bpm: number;
  /** per bar: the chord (Am, F, C, G, E, E7, Em, Dm...) */
  chords: string[];
  /** per bar: eight eighth notes, "E5", "G#4", "-" holds the note before, "." is a rest */
  lead: string[];
  /** per bar: does the lead get a harmony a chord tone below */
  harm: boolean[];
  /** per bar: arpeggios in sixteenths */
  arp: boolean[];
  /** per bar: a sustained pad chord */
  pad: boolean[];
  /** per bar: sixteen drum steps (k kick, s snare, h hat, o open hat, c crash, . nothing) */
  drums: string[];
  /** per bar: sixteen bass steps (R root, O octave up, 5 fifth, 3 third, . nothing) */
  bass: string[];
}

const A_LEAD = ['E5 - A4 - C5 D5 E5 -', 'F5 - E5 D5 C5 - A4 -', 'G4 - C5 - E5 - G5 -', 'F5 E5 D5 - B4 - G4 -', 'E5 - A4 - C5 D5 E5 -', 'F5 - A5 - G5 F5 E5 -', 'E5 D5 C5 B4 - G#4 - B4', 'A4 - - - - - . .'];
const B_LEAD = ['A5 - - G5 F5 - C5 -', 'D5 - - E5 F5 - G5 -', 'E5 - - D5 B4 - G4 -', 'A4 - C5 - E5 - A5 -', 'A5 - G5 - F5 - C5 -', 'B4 - D5 - G5 - F5 -', 'G#4 - B4 - E5 - D5 -', 'B4 - - - . . . .'];
const A2_LEAD = [...A_LEAD.slice(0, 7), 'A4 - - - . . G#4 B4'];
const A_CH = ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'Am'];
const B_CH = ['F', 'G', 'Em', 'Am', 'F', 'G', 'E', 'E7'];

const D_LIGHT = 'k...s...k.k.s...';
const D_DRIVE = 'k.h.s.hhk.hks.ho';
const D_FILL = 'k.h.s.h.s.ssssss';
const D_FULL = 'k.hhs.hhk.hks.ho';
const BASS_A = 'R..R..O.R..5..O.';
const BASS_B = 'R.O.R.O.R.O.5.O.';

const rep = <T>(x: T, n: number) => Array.from({ length: n }, () => x);

export const THEME: SongData = {
  bpm: 112,
  chords: [...A_CH, ...B_CH, ...A_CH],
  lead: [...A_LEAD, ...B_LEAD, ...A2_LEAD],
  harm: [...rep(false, 16), ...rep(true, 8)],
  arp: [...rep(false, 8), ...rep(true, 16)],
  pad: [...rep(true, 8), ...rep(false, 8), ...rep(true, 8)],
  drums: [
    'c...s...k.k.s...', ...rep(D_LIGHT, 6), D_FILL,
    'c.h.s.hhk.hks.ho', ...rep(D_DRIVE, 6), D_FILL,
    'c.hhs.hhk.hks.ho', ...rep(D_FULL, 6), D_FILL,
  ],
  bass: [...rep(BASS_A, 8), ...rep(BASS_B, 8), ...rep(BASS_A, 8)],
};

// ---------------------------------------------------------------- parsing
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "G#4" -> midi 68; null when it isn't a note */
export function midiOf(n: string): number | null {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + PC[m[1]!]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/** A chord's pitch classes: root first, then third and fifth (and the seventh, for 7 chords). */
export function chordOf(c: string): number[] {
  const m = /^([A-G][#b]?)(m?)(7?)$/.exec(c);
  if (!m) return [0, 4, 7];
  const r = midiOf(m[1] + '4')! % 12;
  const out = [r, (r + (m[2] ? 3 : 4)) % 12, (r + 7) % 12];
  if (m[3]) out.push((r + 10) % 12);
  return out;
}

export interface NoteEv {
  /** sixteenth step from the start of the song */
  step: number;
  midi: number;
  /** length in sixteenths */
  len: number;
}
/** The lead line as notes: eighths become two sixteenths, holds lengthen the note before, rests end it. */
export function leadNotes(song: SongData): NoteEv[] {
  const out: NoteEv[] = [];
  let cur: NoteEv | null = null;
  song.lead.forEach((bar, b) => {
    const toks = bar.trim().split(/\s+/);
    toks.forEach((t, i) => {
      const step = b * 16 + i * 2;
      if (t === '-') {
        if (cur) cur.len += 2;
        return;
      }
      cur = null;
      const m = midiOf(t);
      if (m == null) return;
      cur = { step, midi: m, len: 2 };
      out.push(cur);
    });
  });
  return out;
}
/** The note a harmony plays under `midi`: the highest chord tone at least a minor third below it. */
export function harmonyUnder(midi: number, chord: number[]): number {
  for (let m = midi - 3; m > midi - 12; m--) if (chord.includes(((m % 12) + 12) % 12)) return m;
  return midi - 5;
}
/** Bass notes for a bar: steps and midi notes from the groove and the chord (in the E2 to D#3 range). */
export function bassNotes(groove: string, chord: number[]): { s: number; midi: number; len: number }[] {
  const root = 40 + ((chord[0]! - 4 + 12) % 12);
  const out: { s: number; midi: number; len: number }[] = [];
  for (let s = 0; s < 16; s++) {
    const c = groove[s];
    if (!c || c === '.') continue;
    const iv = c === 'O' ? 12 : c === '5' ? 7 : c === '3' ? (chord[1]! - chord[0]! + 12) % 12 : 0;
    let len = 1;
    while (s + len < 16 && groove[s + len] === '.' && len < 3) len++;
    out.push({ s, midi: root + iv, len });
  }
  return out;
}
