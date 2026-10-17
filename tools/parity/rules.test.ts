import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BALANCE,
  LEGACY_BALANCE,
  useBalance,
  CHAPTERS,
  TIERK,
  autoChoice,
  clockAt,
  cupOpponent,
  deserFighter,
  endStoryFight,
  endTierFight,
  fightOdds,
  gainFame,
  gainXP,
  genMap,
  haggleChance,
  legacyFx,
  lootList,
  makeBoss,
  mulberry32,
  nameKey,
  newChapter,
  newSave,
  nextGauntletOpp,
  priceOf,
  randomFighter,
  persistFighter,
  rating,
  serFighter,
  startBattle,
  startCup,
  storyOpponent,
  type CareerFighter,
  type FightSpec,
  type Game,
  type Gauntlet,
  type SerFighter,
} from '../../packages/core/src';
import { evalLegacy, openLegacyPage } from './browser';
import { decorate, randomExtras } from './fixtures';

// The career, story and cup rules (they live in the legacy UI files) match the legacy game: both
// run from the same seeded random source in the real legacy page, and every number has to agree.
// They play by the old game's tuning here; the Phase 4 balance pass changed some story numbers.
const tuned = { ...BALANCE };
beforeAll(() => useBalance(LEGACY_BALANCE));
afterAll(() => useBalance(tuned));

const MULBERRY = `(seed)=>{let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}`;

interface Case {
  seed: number;
  ser: SerFighter;
  coins: number;
  perks: Record<string, number>;
  tourneys?: number;
}

/** A career fighter in the middle of a story chapter. */
function mkCase(seed: number, o: { ch?: number; ng?: number; hp?: number; perks?: Record<string, number>; tourneys?: number } = {}): Case {
  const r = mulberry32(seed * 7919);
  const ex = randomExtras(seed);
  const f = decorate(randomFighter('Hero ' + seed, mulberry32(seed)), { ...ex, lvl: ex.lvl ? Math.min(ex.lvl, 30) : 1 }) as CareerFighter;
  Object.assign(f, { career: true, cid: 'cid' + seed, fame: Math.floor(r() * 300), tp: Math.floor(r() * 3), xp: Math.floor(r() * 30), rec: { w: 3, l: 1 }, earned: [], belts: {}, bag: { bandage: 1 } });
  if (r() < 0.4) f.lootBoost = true;
  if (r() < 0.3) f.contract = ['combo2', 'reads3', 'clean', 'upset', 'quick', 'ults', 'wall', 'bigger', 'semis', 'streak'][Math.floor(r() * 10)]!;
  const ch = o.ch ?? 1 + Math.floor(r() * 20);
  const story = newChapter({ rng: mulberry32(seed + 1), save: newSave(0) } as unknown as Game, ch, o.ng ?? (r() < 0.2 ? 1 : 0));
  story.hp = o.hp ?? 30 + Math.floor(r() * 71);
  story.row = Math.floor(r() * 4);
  story.cleared = Array.from({ length: ch - 1 }, (_, i) => i + 1);
  f.story = story as never;
  const perks = o.perks ?? (r() < 0.5 ? { xp: 2, famous: 1, merchant: 2, bloodline: 1, trust: 2, iron: 1, scouts: 1 } : {});
  return { seed, ser: JSON.parse(JSON.stringify(serFighter(f))), coins: Math.floor(r() * 200), perks, tourneys: o.tourneys };
}

function gameOf(c: Case): Game {
  const save = newSave(0);
  save.profile.legacy = { pts: 0, perks: { ...c.perks } };
  save.profile.season.tourneys = c.tourneys || 0;
  const F = deserFighter(JSON.parse(JSON.stringify(c.ser)))!;
  F.career = true;
  F.lfx = legacyFx(save.profile);
  save.roster.slots[0] = { career: serFighter(F), nemesis: null, tourney: null, coins: c.coins };
  save.roster.active = 0;
  return { save, F, rng: mulberry32(c.seed), clock: clockAt(), pool: null, notes: [] };
}

/** Page-side setup: the same fighter, purse and perks; opponents are plain random fighters (no ranked pool). */
const SETUP = `const setup=(c)=>{
  DB.legacy={pts:0,perks:Object.assign({},c.perks)};DB.coins=c.coins;DB.gems=0;DB.stats={};DB.goalsDone=[];DB.mastery={};DB.seen={};DB.colMiles=0;
  DB.ach={};DB.champs=[];DB.rivals=[];DB.retired=[];DB.season={n:1,tourneys:c.tourneys||0,stats:{race:{},arch:{}}};DB.patch={race:{},arch:{}};DB.patchNotes=null;syncPatch();
  DB.nemesis=null;DB.tourney=null;DB.entered=0;DB.won=0;DB.gbest=0;DB.lastArena=null;DB.champIds={};DB.lastTop=[];DB.gearSeen=[];syncHistory();
  DB.slots=[null,null,null];DB.active=0;F=deserFighter(JSON.parse(JSON.stringify(c.ser)));F.career=true;F.lfx=legacyFx();DB.career=serFighter(F);
  FPOOL.ready=false;winRate=()=>0.5;Math.random=mk(c.seed);};
  const snap=()=>({F:serFighter(F),coins:DB.coins,gems:DB.gems,stats:DB.stats,mastery:DB.mastery,ach:DB.ach,goals:DB.goalsDone,seen:DB.seen,
    champs:DB.champs.map(x=>Object.assign({},x,{d:0})),nem:DB.nemesis,season:DB.season,patch:DB.patch,lastTop:DB.lastTop,champIds:DB.champIds,
    lines:[...document.querySelectorAll('#result .gains li')].map(li=>li.textContent),big:(document.querySelector('#result .big')||{}).textContent,
    desc:(document.querySelector('#result p')||{}).textContent,next:Math.random()});
  const fightTo=(O)=>{curOppF=O;curArena=null;curOdds=headToHead(F,O,120,curArena,fightMods(O));
    BT=newBattle(F,O,false,Object.assign({arena:curArena,mods:fightMods(O)},fightRules()));F.next=null;saveCareer();fightLog=[];
    BT.start();while(!BT.over){BT.plan();BT.step(autoChoice(BT.P[0],BT.P[1],BT.hist[1]));}};`;

function snapNew(g: Game, r?: { lines: string[]; big: string; desc: string }) {
  persistFighter(g);
  const p = g.save.profile;
  return {
    F: serFighter(g.F!),
    coins: g.save.roster.slots[0]!.coins,
    gems: p.gems,
    stats: p.stats,
    mastery: p.mastery,
    ach: p.ach,
    goals: p.goalsDone,
    seen: p.seen,
    champs: (p.champs as Record<string, unknown>[]).map((x) => ({ ...x, d: 0 })),
    nem: g.save.roster.slots[0]!.nemesis,
    season: p.season,
    patch: p.patch,
    lastTop: p.lastTop,
    champIds: p.champIds,
    lines: r?.lines,
    big: r?.big,
    desc: r?.desc,
    next: g.rng(),
  };
}
/** Plays the fight to the end on auto-battle, as the legacy fight screen does. */
function fightTo(g: Game, spec: Omit<FightSpec, 'odds'>) {
  const s = { ...spec, odds: 0 } as FightSpec;
  s.odds = fightOdds(g, s);
  const bt = startBattle(g, s);
  persistFighter(g);
  bt.start();
  while (!bt.over) {
    bt.plan();
    bt.step(autoChoice(g.rng, bt.P[0], bt.P[1], bt.hist[1]));
  }
  return { spec: s, out: { w: bt.w!, me: bt.P[0], round: bt.round, sd: !!bt.sd } };
}
const norm = (v: unknown) => JSON.parse(JSON.stringify(v));

let legacy: { page: Awaited<ReturnType<typeof openLegacyPage>>['page']; close: () => Promise<void> };
beforeAll(async () => {
  const { page, browser } = await openLegacyPage();
  legacy = { page, close: () => browser.close() };
  rating.winRate = () => 0.5;
});
afterAll(async () => legacy?.close());

describe('career and story rules match the legacy game', () => {
  it('generates the same chapter maps', async () => {
    const seeds = Array.from({ length: 200 }, (_, i) => i + 1);
    const out = await evalLegacy<string[][][]>(legacy.page, `(()=>{const mk=${MULBERRY};const r=[];for(const s of ${JSON.stringify(seeds)}){Math.random=mk(s);r.push(genMap(CHAPTERS[(s%20)]));}return r;})()`);
    seeds.forEach((s, i) => expect(genMap({ rng: mulberry32(s) } as Game, CHAPTERS[s % 20]!), `seed ${s}`).toEqual(out[i]));
  });

  it('prices, haggling, XP, fame and loot odds agree', async () => {
    const cases = Array.from({ length: 80 }, (_, i) => mkCase(i + 1));
    const out = await evalLegacy<unknown[]>(
      legacy.page,
      `(()=>{const mk=${MULBERRY};${SETUP}const r=[];for(const c of ${JSON.stringify(cases)}){setup(c);
        const o={price:[3,8,17,40,111].map(priceOf),hag:[10,25,40,60].map(haggleChance),loot:['normal','elite','boss','treasure'].map(t=>lootList(t))};
        o.fame=gainFame(c.seed%37*3).map(x=>x.replace(/<[^>]+>/g,''));o.ups=gainXP(F,c.seed*7%90);o.after={F:serFighter(F),coins:DB.coins,gems:DB.gems};r.push(o);}return r;})()`,
    );
    cases.forEach((c, i) => {
      const g = gameOf(c);
      const o: Record<string, unknown> = {
        price: [3, 8, 17, 40, 111].map((x) => priceOf(g, x)),
        hag: ([10, 25, 40, 60] as const).map((x) => haggleChance(g, x)),
        loot: (['normal', 'elite', 'boss', 'treasure'] as const).map((t) => lootList(g, t)),
      };
      // legacy said "1 talent point" for the Eternal rank-up although it paid 3
      const exp = norm(out[i]) as Record<string, unknown>;
      exp.fame = (exp.fame as string[]).map((x) => x.replace('Eternal! +48 🪙 and 1 talent point.', 'Eternal! +48 🪙 and 3 talent points.'));
      o.fame = gainFame(g, ((c.seed % 37) * 3) as number);
      o.ups = gainXP(g, g.F!, (c.seed * 7) % 90);
      o.after = { F: serFighter(g.F!), coins: g.save.roster.slots[0]!.coins, gems: g.save.profile.gems };
      expect(norm(o), `case ${c.seed}`).toEqual(exp);
    });
  });

  it('builds the same story opponents and bosses', async () => {
    const cases = Array.from({ length: 60 }, (_, i) => mkCase(100 + i));
    const out = await evalLegacy<unknown[]>(
      legacy.page,
      `(()=>{const mk=${MULBERRY};${SETUP}const r=[];for(const c of ${JSON.stringify(cases)}){setup(c);
        const k=c.seed%3,o=k===2?makeBoss(F.story.ch):storyOpponent(k?'elite':'fight');
        r.push({o:serFighter(o),x:[o.lvl,o.aiSkill,o.maxHp||0,o.bonus],next:Math.random()});}return r;})()`,
    );
    cases.forEach((c, i) => {
      const g = gameOf(c);
      const k = c.seed % 3;
      const o = k === 2 ? makeBoss(g, (g.F!.story as { ch: number }).ch) : storyOpponent(g, k ? 'elite' : 'fight');
      expect(norm({ o: serFighter(o), x: [o.lvl, o.aiSkill, o.maxHp || 0, o.bonus], next: g.rng() }), `case ${c.seed}`).toEqual(out[i]);
    });
  });

  it('plays story fights to the same results', async () => {
    const cases = Array.from({ length: 60 }, (_, i) => mkCase(300 + i, { hp: i % 4 === 0 ? 15 : undefined }));
    const out = await evalLegacy<unknown[]>(
      legacy.page,
      `(()=>{const mk=${MULBERRY};${SETUP}const r=[];for(const c of ${JSON.stringify(cases)}){setup(c);
        if(c.seed%5===0)F.story.grit=1;
        const node=['fight','elite','boss'][c.seed%3],O=node==='boss'?makeBoss(F.story.ch):storyOpponent(node);
        T={tier:{k:'story',n:'Story fight',e:'📖',xpW:0,coins:0},story:true,node};fightTo(O);storyEndFight(BT.w===0,O);r.push(snap());}return r;})()`,
    );
    cases.forEach((c, i) => {
      const g = gameOf(c);
      if (c.seed % 5 === 0) (g.F!.story as { grit: number }).grit = 1;
      const node = (['fight', 'elite', 'boss'] as const)[c.seed % 3]!;
      const O = node === 'boss' ? makeBoss(g, (g.F!.story as { ch: number }).ch) : storyOpponent(g, node);
      const { spec, out: res } = fightTo(g, { kind: 'story', node, tier: { k: 'story', n: 'Story fight', e: '📖', xpW: 0, coins: 0 }, opp: O, arena: null });
      const r = endStoryFight(g, spec, res);
      expect(norm(snapNew(g, r)), `case ${c.seed}`).toEqual(out[i]);
    });
  });

  it('plays gauntlet fights to the same results', async () => {
    const cases = Array.from({ length: 40 }, (_, i) => mkCase(500 + i));
    const out = await evalLegacy<unknown[]>(
      legacy.page,
      `(()=>{const mk=${MULBERRY};${SETUP}const r=[];for(const c of ${JSON.stringify(cases)}){setup(c);
        T={tier:TIERK.gauntlet,gauntlet:true};G={streak:c.seed%12,opp:null,used:new Set([nameKey(F.name)])};nextGauntletOpp();
        fightTo(G.opp);endFight();const s=snap();s.streak=G.streak;s.opp=serFighter(G.opp);r.push(s);}return r;})()`,
    );
    cases.forEach((c, i) => {
      const g = gameOf(c);
      const G: Gauntlet = { kind: 'gauntlet', tier: TIERK.gauntlet!, streak: c.seed % 12, opp: null as never, used: new Set([nameKey(g.F!.name)]) };
      nextGauntletOpp(g, G);
      const { spec, out: res } = fightTo(g, { kind: 'gauntlet', tier: G.tier, opp: G.opp, run: G, arena: null });
      const r = endTierFight(g, spec, res);
      const s = { ...snapNew(g, r), streak: G.streak, opp: serFighter(G.opp) };
      expect(norm(s), `case ${c.seed}`).toEqual(out[i]);
    });
  });

  it('plays whole cups to the same brackets, belts and seasons', async () => {
    const cases = Array.from({ length: 18 }, (_, i) => mkCase(700 + i, { tourneys: i % 3 === 0 ? 2 : 0 }));
    const out = await evalLegacy<unknown[]>(
      legacy.page,
      `(()=>{const mk=${MULBERRY};${SETUP}const r=[];for(const c of ${JSON.stringify(cases)}){setup(c);
        startTournament(['local','regional','world'][c.seed%3]);
        let n=0;while(!T.done&&!T.out&&n++<6){const m=T.rounds[T.r][myMatch()];curOpp=m[0]===T.me?m[1]:m[0];fightTo(T.fs[curOpp]);endFight();}
        const s=snap();s.cup={res:T.res,rounds:T.rounds,champ:T.champ,fs:T.fs.map(f=>serFighter(f))};r.push(s);}return r;})()`,
    );
    cases.forEach((c, i) => {
      const g = gameOf(c);
      const T = startCup(g, ['local', 'regional', 'world'][c.seed % 3]!);
      let r: ReturnType<typeof endTierFight> | undefined;
      let n = 0;
      while (!T.done && !T.out && n++ < 6) {
        const { spec, out: res } = fightTo(g, { kind: 'cup', tier: T.tier, opp: T.fs[cupOpponent(T)]!, run: T, arena: null });
        r = endTierFight(g, spec, res);
      }
      const s = { ...snapNew(g, r), cup: { res: T.res, rounds: T.rounds, champ: T.champ, fs: T.fs.map((f) => serFighter(f)) } };
      expect(norm(s), `case ${c.seed}`).toEqual(out[i]);
    });
  });
});
