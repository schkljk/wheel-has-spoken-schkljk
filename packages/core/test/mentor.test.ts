import { describe, expect, it } from 'vitest';
import {
  MENTOR_EVENT,
  clockAt,
  deserFighter,
  enterCareer,
  eventOption,
  labFighter,
  mentorOptions,
  mulberry32,
  newChapter,
  newSave,
  randomFighter,
  retire,
  serFighter,
  storyEvent,
  storyOf,
  takeMentor,
  type CareerFighter,
  type Game,
} from '../src';

// Review F10: a retired fighter mentors a new one.
function game(): Game {
  const rng = mulberry32(6);
  const g: Game = { save: newSave(0), F: null, rng, clock: clockAt(), pool: null, notes: [] };
  const old = labFighter(rng, 20) as CareerFighter;
  old.name = 'Old Gus';
  enterCareer(g, old);
  g.F = old;
  retire(g);
  const f = randomFighter('Rookie', rng) as CareerFighter;
  enterCareer(g, f);
  g.F = f;
  f.story = newChapter(g, 2, 0) as never;
  return g;
}

describe('mentors', () => {
  it('come from the retired, teach their best stat, and stay with the fighter', () => {
    const g = game();
    const [m] = mentorOptions(g);
    expect(m!.n).toBe('Old Gus');
    const before = g.F!.bonus[m!.k] || 0;
    takeMentor(g.F!, m!);
    expect(g.F!.bonus[m!.k]).toBe(before + 1);
    expect(deserFighter(serFighter(g.F!))!.mentor).toEqual({ n: 'Old Gus', e: m!.e, k: m!.k });
  });
  it('drop by on the map, at most once a chapter, by name', () => {
    const g = game();
    takeMentor(g.F!, mentorOptions(g)[0]!);
    let seen = 0;
    for (let i = 0; i < 40; i++) {
      const ev = storyEvent(g);
      if (ev.k === MENTOR_EVENT.k) {
        seen++;
        expect(ev.t).toBe('Old Gus drops by');
      }
    }
    expect(seen).toBe(1);
    const r = eventOption(g, MENTOR_EVENT.k, 0) as { txt: string };
    expect(r.txt).toContain('Old Gus');
    expect(storyOf(g).used).toContain(MENTOR_EVENT.k);
  });
});
