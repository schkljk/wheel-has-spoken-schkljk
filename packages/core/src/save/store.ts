import { LEGACY_STORE_KEY, migrate, NewerSaveError, SaveFormatError } from './migrate';
import { newSave, type Roster, type SaveData, type Slot } from './schema';

/** The bit of localStorage the store needs (in tests, a Map-backed fake). */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Split storage: the fighter being played changes most and is written on its own. */
export const KEYS = {
  meta: 'whs:meta',
  settings: 'whs:settings',
  roster: 'whs:roster',
  active: 'whs:active',
  profile: 'whs:profile',
} as const;
export const BACKUP_SLOTS = 3;
const backupKey = (i: number) => `whs:backup:${i}`;
/** Automatic backups are at least this far apart. */
export const AUTO_BACKUP_EVERY = 20 * 60 * 1000;

export interface BackupInfo {
  slot: number;
  at: number;
  reason: string;
  version: number;
}
export class StorageFullError extends Error {}
/** Another tab (or window) has written the save since this one read it: this one must reload, not write (G8). */
export class StaleSaveError extends Error {}

export interface LoadResult {
  save: SaveData;
  /**
   * 'saved' (normal), 'new' (nothing stored yet), 'recovered' (from a backup), or 'newer': the stored save comes
   * from a newer version of the game, so nothing is written until the game is updated (a stale tab, an older
   * app, a rolled-back deploy used to call it damaged and write a fresh save over it)
   */
  source: 'saved' | 'new' | 'recovered' | 'newer';
  problems: string[];
}

export class SaveStore {
  /** last written text per key, to skip rewriting unchanged sections */
  private written = new Map<string, string>();
  /** true while the stored save is from a newer version: writes are dropped so it is never lost (G7) */
  locked = false;
  /**
   * The save's generation when this store last read or wrote it. Every write bumps it in meta; a store whose
   * generation is behind (another tab wrote since) refuses to write instead of putting its stale copy back (G8).
   */
  private gen = 0;
  private storedGen(): number | null {
    const m = this.kv.getItem(KEYS.meta);
    if (m == null) return null;
    try {
      const g = (JSON.parse(m) as { gen?: unknown }).gen;
      return typeof g === 'number' ? g : 0;
    } catch {
      return 0;
    }
  }
  /** True when another tab has written the save since this store last read or wrote it. */
  stale(): boolean {
    const g = this.storedGen();
    return g != null && g !== this.gen;
  }

  constructor(
    private kv: KV,
    private now: () => number = Date.now,
  ) {}

  // ---------- load and write ----------
  load(): LoadResult {
    const problems: string[] = [];
    if (this.kv.getItem(KEYS.meta) == null) return { save: newSave(this.now()), source: 'new', problems };
    try {
      const fixed: string[] = [];
      const save = this.readSplit(fixed);
      if (fixed.length) problems.push(`Repaired your save: ${fixed.join(', ')}`);
      return { save, source: 'saved', problems };
    } catch (e) {
      if (e instanceof NewerSaveError) {
        this.locked = true;
        problems.push('Your save comes from a newer version of the game. Update the game to keep playing: nothing was changed.');
        return { save: newSave(this.now()), source: 'newer', problems };
      }
      problems.push(`Your save could not be read (${(e as Error).message})`);
    }
    // restoring a backup writes over what is stored now: this store owns it from here
    this.gen = this.storedGen() ?? 0;
    for (const b of this.listBackups()) {
      try {
        const save = this.readBackup(b.slot);
        problems.push(`Restored the backup from ${new Date(b.at).toLocaleString()}`);
        this.write(save);
        return { save, source: 'recovered', problems };
      } catch {
        problems.push(`A backup from ${new Date(b.at).toLocaleString()} was damaged too`);
      }
    }
    problems.push('Started a fresh save');
    return { save: newSave(this.now()), source: 'recovered', problems };
  }

  private readSplit(notes: string[]): SaveData {
    const get = (k: string) => {
      const v = this.kv.getItem(k);
      if (v == null) throw new Error(`missing ${k}`);
      const o = JSON.parse(v) as unknown;
      // a section that is not even an object is damage, not something to patch over: a backup is better
      if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(`damaged ${k}`);
      this.written.set(k, v);
      return o;
    };
    const meta = get(KEYS.meta) as { game: string; version: number; savedAt: number; gen?: number };
    this.gen = typeof meta.gen === 'number' ? meta.gen : 0;
    const roster = get(KEYS.roster) as Roster;
    const active = get(KEYS.active) as { i: number | null; slot: Slot | null };
    // sections that lost their core are damaged too (patching them would quietly lose fighters or records)
    if (!Array.isArray(roster.slots)) throw new Error(`damaged ${KEYS.roster}`);
    if (!('i' in active) || (active.i != null && (!active.slot || typeof active.slot !== 'object'))) throw new Error(`damaged ${KEYS.active}`);
    const slots = Array.isArray(roster.slots) ? roster.slots.slice() : [];
    if (typeof active.i === 'number' && active.i >= 0 && active.i < 3) slots[active.i] = active.slot;
    const settings = get(KEYS.settings) as Record<string, unknown>;
    const profile = get(KEYS.profile) as Record<string, unknown>;
    if (!('sound' in settings)) throw new Error(`damaged ${KEYS.settings}`);
    if (!('seen' in profile) && !('gems' in profile)) throw new Error(`damaged ${KEYS.profile}`);
    // the generation is the store's own bookkeeping, not part of the save
    const { gen: _gen, ...head } = meta;
    return migrate({ ...head, settings, roster: { ...roster, active: active.i, slots }, profile }, this.now(), notes);
  }

  /**
   * Writes the save, section by section (unchanged sections are skipped). All or nothing (G14): a section that
   * doesn't fit puts back the ones this write already changed, so a save is never half old and half new (the
   * gem kept, the coins not). `protect` is a backup that must not be dropped to make room (an import's undo).
   */
  write(save: SaveData, protect?: number): void {
    if (this.locked) return;
    if (this.stale()) throw new StaleSaveError('The game was saved from another tab since this one loaded');
    save.savedAt = this.now();
    const gen = this.gen + 1;
    const { active } = save.roster;
    const parts: [string, unknown][] = [
      [KEYS.settings, save.settings],
      [KEYS.profile, save.profile],
      [KEYS.roster, { ...save.roster, slots: save.roster.slots.map((s, i) => (i === active ? null : s)) }],
      [KEYS.active, { i: active, slot: active != null ? save.roster.slots[active] : null }],
      // meta last: a save only counts once all its sections are in
      [KEYS.meta, { game: save.game, version: save.version, savedAt: save.savedAt, gen }],
    ];
    const done: [string, string | null][] = [];
    try {
      for (const [k, v] of parts) {
        const txt = JSON.stringify(v);
        if (k !== KEYS.meta && this.written.get(k) === txt) continue;
        done.push([k, this.written.get(k) ?? this.kv.getItem(k)]);
        this.set(k, txt, protect);
      }
    } catch (e) {
      for (const [k, old] of done.reverse()) {
        try {
          if (old == null) this.kv.removeItem(k);
          else this.kv.setItem(k, old);
        } catch {
          // the old text fit before this write; if even that fails there is nothing better to do
        }
        if (old == null) this.written.delete(k);
        else this.written.set(k, old);
      }
      throw e;
    }
    this.gen = gen;
    if (this.backupDue()) this.backup(save, 'Automatic');
  }

  /** setItem that makes room by dropping old backups when storage is full (never the `protect` one). */
  private set(k: string, v: string, protect?: number) {
    for (;;) {
      try {
        this.kv.setItem(k, v);
        this.written.set(k, v);
        return;
      } catch (e) {
        const oldest = this.listBackups()
          .filter((b) => b.slot !== protect)
          .at(-1);
        if (!oldest || k.startsWith('whs:backup:')) throw new StorageFullError(`Storage is full (${(e as Error).message})`);
        this.kv.removeItem(backupKey(oldest.slot));
        this.index = this.listBackups().filter((b) => b.slot !== oldest.slot);
      }
    }
  }

  // ---------- backups ----------
  /**
   * The backups' headers, read once and then kept up to date here. Every write used to re-read and parse all
   * three backups (whole saves) just to see whether one was due: about 10 ms a tap on a mid-range phone.
   */
  private index: BackupInfo[] | null = null;
  /** Newest first. */
  listBackups(): BackupInfo[] {
    if (!this.index) this.index = this.readIndex();
    return [...this.index];
  }
  private readIndex(): BackupInfo[] {
    const out: BackupInfo[] = [];
    for (let i = 0; i < BACKUP_SLOTS; i++) {
      const v = this.kv.getItem(backupKey(i));
      if (!v) continue;
      try {
        const b = JSON.parse(v) as { at: number; reason: string; save: { version: number } };
        out.push({ slot: i, at: b.at, reason: b.reason, version: b.save.version });
      } catch {
        // a damaged backup is simply not offered
      }
    }
    return out.sort((a, b) => b.at - a.at);
  }

  private backupDue(): boolean {
    const newest = this.listBackups()[0];
    return !newest || this.now() - newest.at >= AUTO_BACKUP_EVERY;
  }

  /** Copies the save into the oldest (or an empty) backup slot. */
  backup(save: SaveData, reason: string): void {
    if (this.locked || this.stale()) return;
    const used = this.listBackups();
    let slot = [...Array(BACKUP_SLOTS).keys()].find((i) => !used.some((b) => b.slot === i));
    if (slot === undefined) slot = used.at(-1)!.slot;
    try {
      const at = this.now();
      this.set(backupKey(slot), JSON.stringify({ at, reason, save }));
      const s = slot;
      this.index = [{ slot: s, at, reason, version: save.version }, ...this.listBackups().filter((b) => b.slot !== s)].sort((a, b) => b.at - a.at);
    } catch {
      // a backup that does not fit is skipped; the live save matters more
    }
  }

  readBackup(slot: number): SaveData {
    const v = this.kv.getItem(backupKey(slot));
    if (!v) throw new SaveFormatError('That backup is gone');
    return migrate((JSON.parse(v) as { save: unknown }).save, this.now());
  }

  /**
   * Replaces the whole save (import, restore), backing up the current one first. A save too big for the device's
   * storage is refused whole (StorageFullError): the current save and its undo backup stay as they were (G14).
   */
  replace(current: SaveData, next: SaveData, reason: string): void {
    this.backup(current, reason);
    const undo = this.listBackups()[0]?.slot;
    this.write(next, undo);
  }

  /** Erases the save (backups stay, so it can be undone). */
  erase(current: SaveData): SaveData {
    this.backup(current, 'Before erasing everything');
    for (const k of Object.values(KEYS)) this.kv.removeItem(k);
    this.written.clear();
    this.gen = 0;
    return newSave(this.now());
  }

  // ---------- the legacy game's save on the same site ----------
  /** The old version's save, converted (the old save itself is never touched). */
  readLegacy(): SaveData | null {
    const v = this.kv.getItem(LEGACY_STORE_KEY);
    if (!v) return null;
    try {
      return migrate(v, this.now());
    } catch {
      return null;
    }
  }
}

/** A save as a file: plain JSON, with the game marker so it can be recognized on import. */
export const exportText = (save: SaveData) => JSON.stringify(save);
export const exportFileName = (now: Date) =>
  `wheel-has-spoken-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
