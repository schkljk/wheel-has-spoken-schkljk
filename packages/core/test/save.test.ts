import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OLD_TAL,
  CHA_TIERS, SAVE_VERSION, SaveFormatError, WEAKS, deserFighter, eff, hashStr, loadCareer, migrate, mulberry32, newSave, numStats, randomFighter,
  saveVersion, serFighter, summarize, type CareerFighter, type SaveData,
} from '../src';

const fixture = (n: string) => readFileSync(resolve(__dirname, 'fixtures', n), 'utf8');
const played = () => JSON.parse(fixture('legacy-played.json')) as Record<string, unknown>;
const NOW = 1_800_000_000_000;

describe('legacy save import', () => {
  it('recognizes legacy saves, new saves and junk', () => {
    expect(saveVersion(played())).toBe(0);
    expect(saveVersion({ coins: 3 })).toBe(0);
    expect(saveVersion(newSave())).toBe(SAVE_VERSION);
    expect(saveVersion({ hello: 1 })).toBeNull();
    expect(saveVersion([1, 2])).toBeNull();
    expect(saveVersion(null)).toBeNull();
    expect(() => migrate('not json')).toThrow(SaveFormatError);
    expect(() => migrate('{"hello":1}')).toThrow(SaveFormatError);
    expect(() => migrate({ ...newSave(), version: SAVE_VERSION + 1 })).toThrow(/newer version/);
  });

  it('imports a played save: three fighters, the active slot, purses and settings', () => {
    const s = migrate(played(), NOW);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.savedAt).toBe(NOW);
    expect(s.roster.active).toBe(0);
    expect(s.roster.slots).toHaveLength(3);
    expect(s.roster.slots.map((x) => x?.career.name)).toEqual([played().slots && (played().slots as { career: { name: string } }[])[0]!.career.name, 'Slot Fighter 1', 'Slot Fighter 2']);
    expect(s.roster.slots.map((x) => x?.coins)).toEqual([21, 20, 40]);
    expect(s.roster.retired).toHaveLength(1);
    expect(s.settings).toMatchObject({ sound: true, fast: true, haptics: true, autoBattle: false, tutorialSeen: true, motion: 'system', textSize: 'normal' });
    const sum = summarize(s);
    expect(sum.fighters.every((f) => f.ok)).toBe(true);
    expect(sum.warnings).toEqual([]);
    expect(sum.gems).toBe(5);
    expect(sum.coins).toBe(81);
  });

  it('keeps every collection, record and progress field', () => {
    const raw = played();
    const s = migrate(raw, NOW);
    for (const k of ['seen', 'gearSeen', 'last', 'season', 'patch', 'legacy', 'stats', 'goalsDone', 'mastery', 'dc', 'champs', 'lastTop', 'ach']) {
      expect((s.profile as unknown as Record<string, unknown>)[k], k).toEqual(raw[k]);
    }
    expect(s.profile.gems).toBe(5);
    expect(s.profile.lastArena).toBe(raw.lastArena);
  });

  it('keeps unknown fields instead of dropping them', () => {
    const s = migrate({ ...played(), someFutureThing: { a: 1 }, lastWords: 'bye' }, NOW);
    expect(s.profile.extra).toEqual({ someFutureThing: { a: 1 }, lastWords: 'bye' });
  });

  it('accepts the text the old game copies to the clipboard', () => {
    const s = migrate(fixture('legacy-copied.txt'), NOW);
    expect(s).toEqual(migrate(played(), NOW));
  });

  it('imports an old single-fighter save (before roster slots)', () => {
    const raw = JSON.parse(fixture('legacy-old-single.json')) as Record<string, unknown>;
    const s = migrate(raw, NOW);
    expect(s.roster.active).toBe(0);
    expect(s.roster.slots[0]!.career.name).toBe((raw.career as { name: string }).name);
    expect(s.roster.slots.slice(1)).toEqual([null, null]);
    // 13 coins plus 4 old tokens at two coins each
    expect(s.roster.slots[0]!.coins).toBe(21);
    expect(s.settings.haptics).toBe(false);
    expect(s.settings.tutorialSeen).toBe(true);
    expect(s.profile.legacy).toEqual({ pts: 0, perks: {} });
    // the fighter predates charisma, growth, sidekicks, quirks and stances and still plays
    const f = loadCareer(s.roster.slots[0], s.profile)!;
    expect(f).not.toBeNull();
    expect(f.cha).toBeUndefined();
    expect(f.growth).toBeUndefined();
    expect(f.stance?.k).toBe('balanced');
    expect(f.quirk?.k).toBe('none');
    // missing charisma counts as tier 5, before race, class and backstory modifiers
    expect(eff(f).cha).toBe(eff({ ...f, cha: CHA_TIERS[4]! }).cha);
    expect(numStats(f).hp).toBeGreaterThan(0);
    // a turn-skip weakness saved as "__skip" comes back as a matching one
    const sk = WEAKS.filter((x) => x.skip && x.st);
    expect(f.weak).toBe(sk[hashStr(f.name) % sk.length]);
    // old talent lists become talent tree ranks the first time they are read, as in legacy; story state stays as it was
    const ranks: Record<string, number> = {};
    for (const k of ['o1', 'o2', 'd1']) ranks[OLD_TAL[k]!] = (ranks[OLD_TAL[k]!] || 0) + 1;
    expect(f.talents).toEqual(ranks);
    expect(f.story).toEqual((raw.career as { story: unknown }).story);
  });

  it('is a no-op on a current save', () => {
    const s = migrate(played(), NOW);
    const again = migrate(JSON.parse(JSON.stringify(s)) as SaveData, NOW + 5);
    expect(again).toEqual(s);
  });

  it('flags fighters that cannot be rebuilt but keeps them', () => {
    const raw = played();
    const slots = raw.slots as { career: { picks: Record<string, string> } }[];
    delete slots[1]!.career.picks.race;
    const s = migrate(raw, NOW);
    const sum = summarize(s);
    expect(sum.fighters.find((f) => f.slot === 1)?.ok).toBe(false);
    expect(sum.warnings).toHaveLength(1);
    expect(s.roster.slots[1]).not.toBeNull();
  });
});

describe('fighter save format', () => {
  it('round-trips random fighters with career fields', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const f = randomFighter('Roundtrip ' + seed, mulberry32(seed)) as CareerFighter;
      Object.assign(f, { lvl: 7, xp: 3, fame: 11, gear: { armor: 'chain' }, talents: { off_sharp: 2 }, rec: { w: 4, l: 1 }, cid: 'c' + seed });
      const back = deserFighter(JSON.parse(JSON.stringify(serFighter(f))))!;
      expect(back).not.toBeNull();
      expect(serFighter(back)).toEqual(serFighter(f));
      expect(numStats(back)).toEqual(numStats(f));
    }
  });
});
