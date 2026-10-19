import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTO_BACKUP_EVERY, KEYS, LEGACY_STORE_KEY, SaveStore, StaleSaveError, StorageFullError, exportFileName, exportText, migrate, newSave, type KV } from '../src';

/** In-memory localStorage with an optional size limit, counting writes per key. */
class MemKV implements KV {
  m = new Map<string, string>();
  writes = new Map<string, number>();
  constructor(public limit = Infinity) {}
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    const size = [...this.m].reduce((a, [kk, vv]) => a + (kk === k ? 0 : vv.length), 0) + v.length;
    if (size > this.limit) throw new Error('QuotaExceededError');
    this.m.set(k, v);
    this.writes.set(k, (this.writes.get(k) ?? 0) + 1);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const legacyText = () => readFileSync(resolve(__dirname, 'fixtures', 'legacy-played.json'), 'utf8');
const imported = (t = 1000) => migrate(legacyText(), t);

describe('save store', () => {
  it('reads the backups once, not on every write (D9)', () => {
    let t = 1000;
    const kv = new MemKV();
    let reads = 0;
    const get = kv.getItem.bind(kv);
    kv.getItem = (k: string) => {
      if (k.startsWith('whs:backup:')) reads++;
      return get(k);
    };
    const store = new SaveStore(kv, () => t);
    const s = imported();
    store.write(s);
    const after = reads;
    for (let i = 0; i < 25; i++) {
      t += 1000;
      s.profile.gems = i;
      store.write(s);
    }
    expect(reads).toBe(after);
    // and it still knows when one is due, and where it went
    t += AUTO_BACKUP_EVERY + 1;
    store.write(s);
    expect(store.listBackups().length).toBe(2);
    expect(new SaveStore(kv, () => t).listBackups()).toEqual(store.listBackups());
  });

  it('starts fresh, then round-trips a save through split keys', () => {
    let t = 1000;
    const kv = new MemKV();
    const store = new SaveStore(kv, () => t);
    expect(store.load().source).toBe('new');
    const s = imported();
    store.write(s);
    for (const k of Object.values(KEYS)) expect(kv.getItem(k), k).not.toBeNull();
    t += 10;
    const back = new SaveStore(kv, () => t).load();
    expect(back.source).toBe('saved');
    expect({ ...back.save, savedAt: 0 }).toEqual({ ...s, savedAt: 0 });
  });

  it('keeps the active fighter in its own key and skips unchanged sections', () => {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    const s = imported();
    store.write(s);
    const active = JSON.parse(kv.getItem(KEYS.active)!) as { i: number; slot: { career: { name: string } } };
    expect(active.i).toBe(0);
    expect(active.slot.career.name).toBe(s.roster.slots[0]!.career.name);
    expect((JSON.parse(kv.getItem(KEYS.roster)!) as { slots: unknown[] }).slots[0]).toBeNull();
    // a fight changes only the active fighter
    s.roster.slots[0]!.career.xp += 5;
    t += 1000;
    store.write(s);
    expect(kv.writes.get(KEYS.active)).toBe(2);
    expect(kv.writes.get(KEYS.roster)).toBe(1);
    expect(kv.writes.get(KEYS.profile)).toBe(1);
    expect(kv.writes.get(KEYS.settings)).toBe(1);
  });

  it('keeps three rolling automatic backups', () => {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    const s = imported();
    for (let i = 0; i < 5; i++) {
      s.profile.gems = i;
      store.write(s);
      t += AUTO_BACKUP_EVERY / 4; // too soon: no new backup
      store.write(s);
      t += AUTO_BACKUP_EVERY;
    }
    const list = store.listBackups();
    expect(list).toHaveLength(3);
    expect(list.map((b) => store.readBackup(b.slot).profile.gems)).toEqual([4, 3, 2]);
    expect(list.every((b) => b.reason === 'Automatic')).toBe(true);
  });

  it('recovers from a damaged save using the newest backup', () => {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    const s = imported();
    store.write(s);
    kv.setItem(KEYS.profile, '{not json');
    t += 5;
    const r = new SaveStore(kv, () => t).load();
    expect(r.source).toBe('recovered');
    expect(r.save.roster.slots[0]!.career.name).toBe(s.roster.slots[0]!.career.name);
    expect(r.problems.join(' ')).toMatch(/Restored the backup/);
  });

  it('backs up before replacing or erasing, so both can be undone', () => {
    const kv = new MemKV();
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    const s = imported();
    store.write(s);
    t += 1;
    store.replace(s, newSave(t), 'Before importing a save');
    expect(store.load().save.roster.slots.every((x) => x === null)).toBe(true);
    expect(store.listBackups()[0]!.reason).toBe('Before importing a save');
    t += 1;
    const fresh = store.erase(store.load().save);
    expect(fresh.roster.slots.every((x) => x === null)).toBe(true);
    expect(new SaveStore(kv, () => t).load().source).toBe('new');
    const undo = store.listBackups().find((b) => b.reason === 'Before importing a save')!;
    expect(store.readBackup(undo.slot).roster.slots[0]!.career.name).toBe(s.roster.slots[0]!.career.name);
  });

  it('drops old backups when storage is full, and reports a save that cannot fit', () => {
    const s = imported();
    const one = exportText(s).length;
    const kv = new MemKV(one * 3.6);
    let t = 1000;
    const store = new SaveStore(kv, () => t);
    store.write(s);
    t += AUTO_BACKUP_EVERY;
    s.profile.gems = 9;
    store.write(s);
    expect(new SaveStore(kv, () => t).load().save.profile.gems).toBe(9);
    const tiny = new SaveStore(new MemKV(100), () => t);
    expect(() => tiny.write(s)).toThrow(StorageFullError);
  });

  it("reads the old version's save without touching it", () => {
    const kv = new MemKV();
    const txt = legacyText();
    kv.setItem(LEGACY_STORE_KEY, txt);
    const store = new SaveStore(kv, () => 1000);
    const s = store.readLegacy()!;
    expect(s.roster.slots.filter(Boolean)).toHaveLength(3);
    expect(kv.getItem(LEGACY_STORE_KEY)).toBe(txt);
    kv.setItem(LEGACY_STORE_KEY, 'garbage');
    expect(store.readLegacy()).toBeNull();
  });

  it('exports a file that imports back', () => {
    const s = imported();
    expect(migrate(exportText(s), 1000)).toEqual(s);
    expect(exportFileName(new Date(2026, 9, 6))).toBe('wheel-has-spoken-2026-10-06.json');
  });
  it('never writes over a save from a newer version (G7)', () => {
    const kv = new MemKV();
    const old = new SaveStore(kv, () => 1000);
    old.write(imported());
    // a newer version of the game wrote this save
    const meta = JSON.parse(kv.getItem(KEYS.meta)!) as { version: number };
    kv.setItem(KEYS.meta, JSON.stringify({ ...meta, version: meta.version + 1 }));
    const before = new Map(kv.m);
    const store = new SaveStore(kv, () => 9e12);
    const r = store.load();
    expect(r.source).toBe('newer');
    expect(store.locked).toBe(true);
    expect(r.problems.join(' ')).toMatch(/newer version/);
    // playing on, or a backup coming due, changes nothing
    store.write(r.save);
    store.backup(r.save, 'Automatic');
    expect(kv.m).toEqual(before);
  });
  it('refuses a save too big to fit, whole: nothing changes and the undo backup stays (G14)', () => {
    const cur = imported();
    const kv0 = new MemKV();
    new SaveStore(kv0, () => 1000).write(cur);
    const used = [...kv0.m.values()].reduce((a, v) => a + v.length, 0);
    // room for the current save and one backup of it, not for a huge one
    const kv = new MemKV(used * 2.6);
    const store = new SaveStore(kv, () => 1000);
    store.write(cur);
    const before = new Map([...kv.m].filter(([k]) => !k.startsWith('whs:backup:')));
    const big = imported();
    big.profile.extra.junk = 'x'.repeat(used * 3);
    expect(() => store.replace(cur, big, 'Before loading a file')).toThrow(StorageFullError);
    for (const [k, v] of before) expect(kv.getItem(k)).toBe(v);
    expect(store.listBackups()[0]?.reason).toBe('Before loading a file');
  });
  it('writes all or nothing: a section that does not fit puts back the ones written before it (G14)', () => {
    const cur = imported();
    const kv0 = new MemKV();
    new SaveStore(kv0, () => 1000).write(cur);
    const used = [...kv0.m.values()].reduce((a, v) => a + v.length, 0);
    const kv = new MemKV(used + 2000);
    const store = new SaveStore(kv, () => 1000);
    store.write(cur);
    for (const k of [...kv.m.keys()]) if (k.startsWith('whs:backup:')) kv.removeItem(k);
    const before = new Map(kv.m);
    // the profile grows a little (fits), the active fighter a lot (doesn't)
    const next = JSON.parse(JSON.stringify(cur)) as typeof cur;
    next.profile.gems += 1;
    const a = next.roster.active ?? 0;
    next.roster.active = a;
    if (next.roster.slots[a]) (next.roster.slots[a] as unknown as Record<string, unknown>).junk = 'x'.repeat(used);
    expect(() => store.write(next)).toThrow(StorageFullError);
    expect(new Map(kv.m)).toEqual(before);
  });
  it('a tab that is behind never writes its stale copy over another tab\'s save (G8)', () => {
    const kv = new MemKV();
    new SaveStore(kv, () => 1000).write(imported());
    const a = new SaveStore(kv, () => 2000);
    const b = new SaveStore(kv, () => 2000);
    const sa = a.load().save;
    const sb = b.load().save;
    // tab A plays on (say, retires a fighter for legacy points)
    sa.profile.legacy.pts += 15;
    a.write(sa);
    const after = new Map(kv.m);
    // tab B, still on the old copy, taps something
    expect(b.stale()).toBe(true);
    expect(() => b.write(sb)).toThrow(StaleSaveError);
    b.backup(sb, 'Automatic');
    expect(new Map(kv.m)).toEqual(after);
    // reloading picks up A's save, and then it can write
    const b2 = new SaveStore(kv, () => 3000);
    const fresh = b2.load().save;
    expect(fresh.profile.legacy.pts).toBe(sa.profile.legacy.pts);
    b2.write(fresh);
    expect(a.stale()).toBe(true);
  });
});
