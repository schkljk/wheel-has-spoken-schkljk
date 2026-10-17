import {
  SaveStore,
  clockAt,
  enterCareer,
  myNemesis,
  mulberry32,
  nemLog,
  newChapter,
  newSave,
  persistFighter,
  randomFighter,
  setNemesis,
  type CareerFighter,
  type Game,
  type Story,
} from '../../packages/core/src';

/**
 * A save with a career fighter ready to play, as the localStorage entries the app reads.
 * For e2e tests and dev screenshots (skips the minute of wheel spinning).
 */
export function careerSaveKV(
  o: { seed?: number; name?: string; lvl?: number; coins?: number; gems?: number; ch?: number; row?: number; fast?: boolean; auto?: boolean; nemesis?: boolean; event?: boolean } = {},
): Record<string, string> {
  const rng = mulberry32(o.seed ?? 1);
  const save = newSave(Date.now());
  save.settings.tutorialSeen = true;
  if (o.fast) save.settings.fast = true;
  if (o.auto) save.settings.autoBattle = true;
  const g: Game = { save, F: null, rng, clock: clockAt(), pool: null, notes: [] };
  const f = randomFighter(o.name ?? 'Test Hero', rng) as CareerFighter;
  enterCareer(g, f);
  if (o.lvl) f.lvl = o.lvl;
  if (o.ch) f.story = { ...newChapter(g, o.ch, 0), cleared: Array.from({ length: o.ch - 1 }, (_, i) => i + 1) } as never;
  if (o.row != null && f.story) {
    const S = f.story as unknown as { row: number; rows: unknown[]; seenIntro: boolean };
    S.row = o.row < 0 ? S.rows.length + o.row : o.row;
    S.seenIntro = true;
  }
  // an encounter on the step you stand on
  if (o.event && f.story) (f.story as unknown as Story).rows[(f.story as unknown as Story).row] = ['event'];
  if (o.nemesis && f.story) {
    // Gary beat you in the City Circuit and now waits on the step you stand on, next to a fight and an elite
    setNemesis(g, randomFighter('Gary', rng) as CareerFighter);
    nemLog(myNemesis(g)!, { w: false, where: 'the City Circuit', r: 6, hp: 17 });
    const S = f.story as unknown as Story;
    S.rows[S.row] = ['fight', 'elite', 'nemesis'];
    S.nemRow = S.row;
  }
  save.roster.slots[0]!.coins = o.coins ?? 50;
  save.profile.gems = o.gems ?? 0;
  persistFighter(g);
  const kv = new Map<string, string>();
  const mem = {
    getItem: (k: string) => kv.get(k) ?? null,
    setItem: (k: string, v: string) => void kv.set(k, v),
    removeItem: (k: string) => void kv.delete(k),
    key: (i: number) => [...kv.keys()][i] ?? null,
    get length() {
      return kv.size;
    },
  };
  const store = new SaveStore(mem as never);
  store.write(save);
  return Object.fromEntries(kv);
}
