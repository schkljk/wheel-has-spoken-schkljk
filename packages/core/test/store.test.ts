import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTO_BACKUP_EVERY, KEYS, LEGACY_STORE_KEY, SaveStore, StorageFullError, exportFileName, exportText, migrate, newSave, type KV } from '../src';

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
});
