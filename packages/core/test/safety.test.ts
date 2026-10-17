import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AUTO_BACKUP_EVERY,
  KEYS,
  SAVE_VERSION,
  SaveFormatError,
  SaveStore,
  deserFighter,
  exportText,
  migrate,
  mulberry32,
  newSave,
  repair,
  type KV,
  type SaveData,
} from '../src';

// Upgrade 3: the save must survive anything a phone can do to it. Every load ends in a playable save, a damaged
// one falls back to a backup, and nothing a player owns is silently dropped.

class MemKV implements KV {
  m = new Map<string, string>();
  /** throw on this write (1-based) to simulate the app being killed or storage filling up mid-save */
  failAt = Infinity;
  n = 0;
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (++this.n >= this.failAt) throw new Error('QuotaExceededError');
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const fixture = (f: string) => readFileSync(resolve(__dirname, 'fixtures', f), 'utf8');
const played = (t = 1000) => migrate(fixture('legacy-played.json'), t);
const names = (s: SaveData) => s.roster.slots.map((x) => x?.career.name ?? null);

/** A save the game can play: three slots, a valid active index, settings and profile in shape. */
function playable(s: SaveData) {
  expect(s.roster.slots).toHaveLength(3);
  expect(s.roster.active === null || !!s.roster.slots[s.roster.active]).toBe(true);
  expect(typeof s.settings.sound).toBe('boolean');
  expect(['system', 'reduced', 'full']).toContain(s.settings.motion);
  expect(Array.isArray(s.profile.goalsDone)).toBe(true);
  expect(typeof s.profile.gems).toBe('number');
  expect(s.profile.legacy.perks).toBeTypeOf('object');
  // and it survives another round trip unchanged
  expect(repair(structuredClone(s)).fixed).toEqual([]);
}

describe('repairing saves', () => {
  it('leaves good saves alone', () => {
    expect(repair(newSave(5)).fixed).toEqual([]);
    expect(repair(played()).fixed).toEqual([]);
    const s = played();
    expect(migrate(structuredClone(s), 1000)).toEqual(s);
  });

  it('fills in missing or broken parts and keeps everything else', () => {
    const s = played() as unknown as Record<string, any>;
    delete s.settings.motion;
    s.settings.sound = 'yes';
    s.profile.goalsDone = 'all of them';
    s.profile.gems = -5;
    s.profile.legacy = { pts: 'lots' };
    s.profile.myOwnThing = { keep: true };
    s.roster.active = 7;
    s.roster.slots[1].coins = 'many';
    const { save, fixed } = repair(s as SaveData);
    playable(save);
    expect(fixed.length).toBeGreaterThanOrEqual(3);
    expect(save.settings.sound).toBe(true);
    expect(save.profile.goalsDone).toEqual([]);
    expect(save.profile.gems).toBe(0);
    expect(save.roster.active).toBeNull();
    expect(save.roster.slots[1]!.coins).toBe(0);
    expect((save.profile as unknown as Record<string, unknown>).myOwnThing).toEqual({ keep: true });
  });

  it('never drops a fighter: damaged and extra slots are set aside', () => {
    const s = played() as unknown as Record<string, any>;
    const third = s.roster.slots[2];
    s.roster.slots[2] = 'garbage';
    s.roster.slots.push(third);
    const { save } = repair(s as SaveData);
    playable(save);
    expect(save.roster.slots[2]).toBeNull();
    expect(save.profile.extra.damagedSlot3).toBe('garbage');
    expect((save.profile.extra.extraSlots as unknown[])[0]).toEqual(third);
  });

  it('migrates legacy saves the same way twice', () => {
    for (const f of ['legacy-played.json', 'legacy-old-single.json', 'legacy-copied.txt']) {
      const once = migrate(fixture(f), 1000);
      playable(once);
      expect(migrate(structuredClone(once), 1000)).toEqual(once);
    }
  });

  it('refuses junk and saves from the future, with a reason', () => {
    for (const junk of ['', 'hello', '[]', '42', 'null', '{"game":"another game","version":1}', '{"broken": ']) expect(() => migrate(junk)).toThrow(SaveFormatError);
    const future = { ...newSave(), version: SAVE_VERSION + 1 };
    expect(() => migrate(JSON.stringify(future))).toThrow(/newer version/);
  });
});

describe('a save under attack', () => {
  /** A store holding the played save, written twice so it has an automatic backup. */
  function stored() {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    const s = played();
    store.write(s);
    t += AUTO_BACKUP_EVERY;
    s.profile.gems = 77;
    store.write(s);
    return { kv, s, now: () => t };
  }

  const DAMAGE: [string, (v: string) => string | null][] = [
    ['deleted', () => null],
    ['cut off', (v) => v.slice(0, Math.floor(v.length / 2))],
    ['null', () => 'null'],
    ['a list', () => '[]'],
    ['a number', () => '12'],
    ['an empty object', () => '{}'],
    ['random bytes', () => '\u0000ÿ{{'],
  ];

  for (const key of Object.values(KEYS))
    for (const [what, hurt] of DAMAGE)
      it(`still loads a playable save when ${key} is ${what}`, () => {
        const { kv, s, now } = stored();
        const v = hurt(kv.getItem(key)!);
        if (v == null) kv.removeItem(key);
        else kv.setItem(key, v);
        const r = new SaveStore(kv, now).load();
        playable(r.save);
        // the fighters come back, from the save or from its backup
        if (!(key === KEYS.meta && v == null)) expect(names(r.save)).toEqual(names(s));
        if (r.source === 'saved' && key !== KEYS.meta) expect(r.problems.length).toBeGreaterThan(0);
      });

  it('starts fresh (and says so) when the save and every backup are ruined', () => {
    const { kv, now } = stored();
    for (const k of kv.m.keys()) kv.m.set(k, '{"oops":');
    const r = new SaveStore(kv, now).load();
    playable(r.save);
    expect(r.source).toBe('recovered');
    expect(r.problems.join(' ')).toMatch(/fresh save/);
  });

  it('survives being cut off in the middle of any write', () => {
    for (let failAt = 1; failAt <= 6; failAt++) {
      const { kv, s, now } = stored();
      kv.n = 0;
      kv.failAt = failAt;
      const store = new SaveStore(kv, now);
      store.load();
      s.profile.gems = 5;
      s.roster.slots[0]!.coins = 999;
      try {
        store.write(s);
      } catch {
        // storage gave up mid-save
      }
      kv.failAt = Infinity;
      const r = new SaveStore(kv, now).load();
      playable(r.save);
      expect(names(r.save)).toEqual(names(s));
    }
  });

  it('can restore every backup it lists', () => {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    for (let i = 0; i < 5; i++) {
      const s = played();
      s.profile.gems = i;
      store.write(s);
      t += AUTO_BACKUP_EVERY;
    }
    const list = store.listBackups();
    expect(list).toHaveLength(3);
    for (const b of list) playable(store.readBackup(b.slot));
  });

  it('round-trips random saves through export and import', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 20; i++) {
      const s = played();
      s.profile.gems = Math.floor(rng() * 1000);
      s.settings.textSize = (['small', 'normal', 'large', 'huge'] as const)[i % 4]!;
      s.roster.active = [0, 1, 2, null][i % 4] as number | null;
      if (s.roster.active != null && !s.roster.slots[s.roster.active]) s.roster.active = null;
      const back = migrate(exportText(s), 1000);
      expect(back).toEqual(s);
      for (const sl of back.roster.slots) if (sl) expect(deserFighter(sl.career)).not.toBeNull();
    }
  });
});
