/**
 * A headless player for the story: walks the map, fights on auto-battle, takes rewards, spins level-ups and
 * spends talent points with the real rules, so whole runs can be simulated for the balance pass.
 * The choices are a plain "average player": heal when hurt, loot when healthy, wear better gear.
 */
import {
  BOSSES,
  CHAPTERS,
  GEARK,
  LASTCH,
  RARITY,
  TNODE,
  TIERS_T,
  arenaLand,
  arenaOdds,
  cupOpponent,
  endTierFight,
  saveRun,
  startCup,
  tierUnlocked,
  autoChoice,
  campfire,
  canRank,
  clockAt,
  endStoryFight,
  enterCareer,
  eventList,
  eventOption,
  eventOptionOk,
  gearArrives,
  gearChoose,
  healS,
  levelUpLand,
  levelUpList,
  lootLand,
  lootList,
  lootStart,
  makeBoss,
  mysteryLand,
  mysteryList,
  newSave,
  pickW,
  prizeMoney,
  randomFighter,
  rankTalent,
  addCoins,
  applyEvent,
  startBattle,
  storyEnsure,
  storyEvent,
  storyOf,
  storyOpponent,
  trainLand,
  trainList,
  upgradeChoose,
  upgradeLists,
  upgradeNone,
  useItem,
  winRate,
  type CareerFighter,
  type FightOutcome,
  type FightResult,
  type FightSpec,
  type Game,
  type LootTable,
  type NodeKind,
  type PoolRanking,
  type Rng,
  type Step,
} from '../../packages/core/src';

export interface ChapterLog {
  ch: number;
  /** level when the chapter was cleared */
  lvl: number;
  bossTries: number;
  bossWins: number;
  fights: number;
  wins: number;
  /** times the chapter started over (out of grit) */
  resets: number;
  /** cups played as side modes during the chapter */
  cups: number;
}
export interface RunLog {
  chapters: ChapterLog[];
  /** the chapter the run got stuck on, if it did */
  stuck: number | null;
}

const spin = <T>(rng: Rng, list: { it: T; w: number; mult?: number }[]) => list[pickW(rng, list.map((x) => ({ w: x.w * (x.mult ?? 1) })))]!.it;
const rarRank = (r: string) => Object.keys(RARITY).indexOf(r);

/** A new career fighter in a fresh save. */
export function newRun(rng: Rng, pool: PoolRanking | null, pickFighter?: (g: Game) => CareerFighter): Game {
  const g: Game = { save: newSave(Date.now()), F: null, rng, clock: clockAt(), pool, notes: [] };
  g.save.settings.tutorialSeen = true;
  const f = pickFighter ? pickFighter(g) : (randomFighter('Sim', rng) as CareerFighter);
  enterCareer(g, f);
  storyEnsure(g);
  return g;
}

/**
 * Builds of a given strength: of 8 random fighters rated against random level 1 fighters, the weakest
 * (about the bottom 11%), the median one or the strongest (about the top 11%).
 */
export function fighterOfStrength(strength: 'weak' | 'average' | 'strong') {
  return (g: Game): CareerFighter => {
    const c = Array.from({ length: 8 }, () => randomFighter('Sim', g.rng) as CareerFighter)
      .map((f) => ({ f, w: winRate(f, {}, 40) }))
      .sort((a, b) => a.w - b.w);
    return c[strength === 'weak' ? 0 : strength === 'strong' ? 7 : 4]!.f;
  };
}

// ---------------------------------------------------------------- the player's choices
export function spendTalents(g: Game) {
  const F = g.F!;
  for (let guard = 0; guard < 60 && (F.tp || 0) > 0; guard++) {
    const open = Object.values(TNODE).filter((n) => canRank(F, n));
    if (!open.length) return;
    rankTalent(g, open[Math.floor(g.rng() * open.length)]!.key);
  }
}
function heal(g: Game, below: number) {
  const F = g.F!;
  for (const k of ['ration', 'bandage', 'medkit']) {
    while (storyOf(g).hp < below && (F.bag?.[k] || 0) > 0) useItem(g, k);
  }
}
function loot(g: Game, table: LootTable) {
  lootStart(g, table);
  const r = lootLand(g, spin(g.rng, lootList(g, table)));
  if (r && r.kind === 'gear' && r.then === 'choose') {
    gearArrives(g, r.gear);
    const old = GEARK[g.F!.gear![r.gear.slot]!];
    gearChoose(g, r.gear, !old || rarRank(r.gear.r) >= rarRank(old.r) ? 'wear' : 'store');
  }
}
function levelUps(g: Game) {
  const F = g.F!;
  while ((F.pendingLv || 0) > 0) {
    const up = levelUpLand(g, spin(g.rng, levelUpList()));
    if (!up) continue;
    const L = upgradeLists(g, up);
    if (!L.list.length) {
      upgradeNone(g, up);
      continue;
    }
    upgradeChoose(g, up, { it: spin(g.rng, L.list), m: spin(g.rng, L.mlist) });
  }
  spendTalents(g);
}
function runSteps(g: Game, steps: Step[]) {
  for (const s of steps) {
    if (s.t === 'loot') loot(g, s.table);
    else if (s.t === 'reward') {
      if (!g.F!.story) continue;
      if (storyOf(g).hp < 55) healS(g, 25);
      else if (g.rng() < 0.75) loot(g, 'normal');
      else addCoins(g, prizeMoney(g));
    } else if (s.t === 'event') applyEvent(g, spin(g.rng, eventList()));
    else if (s.t === 'levelups') levelUps(g);
  }
}

/** Plays a fight on auto-battle and hands the outcome to the mode's rules. */
function battle(g: Game, spec: FightSpec, end: (o: FightOutcome) => FightResult): FightResult {
  const F = g.F!;
  const arena = spin(g.rng, arenaOdds(g, F, spec.opp).list);
  arenaLand(g, arena);
  spec.arena = arena;
  // the odds only decide the "giant slayer" achievement: not worth 120 simulated fights here
  spec.odds = 0.5;
  const bt = startBattle(g, spec);
  bt.start();
  for (let i = 0; i < 200 && !bt.over; i++) bt.step(autoChoice(g.rng, bt.P[0], bt.P[1], bt.hist[1]));
  if (!bt.over) bt.w = bt.P[0].hp >= bt.P[1].hp ? 0 : 1;
  const r = end({ w: bt.w!, me: bt.P[0], round: bt.round, sd: !!bt.sd });
  runSteps(g, r.next);
  return r;
}

/** One story fight. Returns whether the player won. */
function fight(g: Game, node: 'fight' | 'elite' | 'boss', opp?: CareerFighter): boolean {
  heal(g, node === 'boss' ? 75 : 45);
  const o = opp ?? storyOpponent(g, node as 'fight' | 'elite');
  const spec = { kind: 'story', node, tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp: o } as FightSpec;
  return battle(g, spec, (out) => endStoryFight(g, spec, out)).won;
}

/** A whole cup at the highest open tier, as a side mode. Returns how many fights it took. */
export function playCup(g: Game): number {
  const F = g.F!;
  const tier = [...TIERS_T].reverse().find((t) => t.size && tierUnlocked(t, F))!;
  const T = startCup(g, tier.k);
  let n = 0;
  while (!T.done && !T.out && n < 12) {
    const spec = { kind: 'cup', tier: T.tier, opp: T.fs[cupOpponent(T)]!, run: T } as FightSpec;
    battle(g, spec, (out) => endTierFight(g, spec, out));
    n++;
  }
  saveRun(g, null);
  return n;
}

function pickNode(g: Game, opts: NodeKind[]): number {
  const hp = storyOf(g).hp;
  const idx = (k: NodeKind) => opts.indexOf(k);
  if (opts.length === 1) return 0;
  if (hp < 60 && idx('rest') >= 0) return idx('rest');
  if (idx('elite') >= 0) return hp >= 75 && g.rng() < 0.5 ? idx('elite') : idx('fight');
  const pref = opts.map((k, i) => ({ k, i })).filter((x) => x.k !== 'rest' || hp < 85);
  return (pref.length ? pref : opts.map((k, i) => ({ k, i })))[Math.floor(g.rng() * (pref.length || opts.length))]!.i;
}

function visit(g: Game, kind: NodeKind) {
  const F = g.F!;
  if (kind === 'fight' || kind === 'elite') return void fight(g, kind);
  if (kind === 'boss') return void fight(g, 'boss', makeBoss(g, storyOf(g).ch));
  if (kind === 'treasure') {
    loot(g, 'treasure');
    storyOf(g).row++;
    return;
  }
  if (kind === 'rest') {
    const S = storyOf(g);
    if ((F.inj || []).length && S.hp >= 50) campfire(g, 'medic');
    else if (S.hp < 75) campfire(g, 'sleep');
    else {
      campfire(g, 'train');
      trainLand(g, spin(g.rng, trainList()));
    }
    storyOf(g).row++;
    return;
  }
  if (kind === 'event') {
    const ev = storyEvent(g);
    const ok = ev.o.map((o, i) => ({ o, i })).filter((x) => eventOptionOk(g, x.o));
    const r = eventOption(g, ev.k, ok[Math.floor(g.rng() * ok.length)]!.i);
    if ('fight' in r) return void fight(g, r.fight);
    if ('wheel' in r) mysteryLand(g, spin(g.rng, mysteryList()));
    else if ('loot' in r) loot(g, r.loot as LootTable);
    storyOf(g).row++;
    return;
  }
  // a merchant: only stock up on healing for the road
  storyOf(g).row++;
}

/** Plays the story from where the fighter is until `toCh` is cleared or the run gets stuck. */
export function playStory(g: Game, toCh = LASTCH, o: { maxResets?: number; cupsPerReset?: number } = {}): RunLog {
  const maxResets = o.maxResets ?? 4;
  const cupsPerReset = o.cupsPerReset ?? 0;
  const out: ChapterLog[] = [];
  const F = g.F!;
  let log: ChapterLog | null = null;
  for (let guard = 0; guard < 5000; guard++) {
    const S = storyEnsure(g);
    if ((S.ng || 0) > 0 || (S.cleared || []).includes(toCh)) break;
    if (!log || log.ch !== S.ch) log = { ch: S.ch, lvl: 0, bossTries: 0, bossWins: 0, fights: 0, wins: 0, resets: 0, cups: 0 };
    const row = S.rows[S.row]!;
    const i = pickNode(g, row);
    S.picks[S.row] = i;
    const kind = row[i]!;
    const before = { cleared: (S.cleared || []).length, grit: S.grit, rec: { ...(F.rec || { w: 0, l: 0 }) } };
    visit(g, kind);
    const rec = F.rec || { w: 0, l: 0 };
    log.fights += rec.w + rec.l - before.rec.w - before.rec.l;
    log.wins += rec.w - before.rec.w;
    const S2 = storyOf(g);
    if (kind === 'boss') {
      log.bossTries++;
      if ((S2.cleared || []).length > before.cleared) log.bossWins++;
    }
    if ((S2.cleared || []).length > before.cleared) {
      log.lvl = F.lvl || 1;
      out.push(log);
      log = null;
      continue;
    }
    if (S2.ch === log.ch && S2.row === 0 && S2 !== S) {
      log.resets++;
      if (log.resets > maxResets) return { chapters: out, stuck: log.ch };
      // stuck players go and win some levels elsewhere
      for (let c = 0; c < cupsPerReset; c++) {
        playCup(g);
        log.cups++;
      }
    }
  }
  return { chapters: out, stuck: null };
}

export const CH_NAMES = CHAPTERS.map((c) => c.n);
export const BOSS_NAMES = BOSSES.map((b) => b.name);
