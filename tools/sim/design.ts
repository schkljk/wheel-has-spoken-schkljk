/**
 * The review's game-design pass (E1-E4) measured: every table is played twice on the same seeds, with the
 * review's switches off (before) and on (after). Story pacing (E5) is measured with whole story runs:
 * `npx tsx tools/sim/story-run.ts` with and without `--off storyPacing`.
 *   npx tsx tools/sim/design.ts [--n 3000] [--seed 1] [--only decisions|reads|stats|powers]
 */
import {
  BALANCE,
  CW_REC,
  ULT_WHEEL,
  autoChoice,
  cwPowOk,
  cwSlices,
  invalidate,
  labFighter,
  mulberry32,
  newBattle,
  pickW,
  readClue,
  simulate,
  useBalance,
  type Fighter,
  type Focus,
  type Move,
} from '../../packages/core/src';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const N = arg('n', 3000);
const SEED = arg('seed', 1);
const SWITCHES = ['pureFocus', 'fairReads', 'statRoles', 'healRules'] as const;
const NOW = { ...BALANCE };
const before = () => useBalance({ ...NOW, ...Object.fromEntries(SWITCHES.map((k) => [k, false])) });
const after = () => useBalance(NOW);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const pts = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}`;

function table(title: string, head: string[], rows: (string | number)[][]) {
  const all = [head, ...rows.map((r) => r.map(String))];
  const w = head.map((_, c) => Math.max(...all.map((r) => r[c]!.length)));
  const line = (r: string[]) => r.map((x, c) => (c === 0 ? x.padEnd(w[c]!) : x.padStart(w[c]!))).join('  ');
  console.log(`\n${title}\n${line(head)}\n${w.map((n) => '-'.repeat(n)).join('  ')}`);
  for (const r of all.slice(1)) console.log(line(r));
}
/** Runs `fn` before and after on the same seeds. */
function both<T>(fn: () => T): [T, T] {
  before();
  const b = fn();
  after();
  return [b, fn()];
}
const pair = (i: number, salt: number) => {
  const rng = mulberry32((SEED * 7919 + i * 104729 + salt * 31) >>> 0);
  const lvl = 1 + Math.floor(rng() * 30);
  return { a: labFighter(rng, lvl), b: labFighter(rng, lvl), seed: (SEED * 31 + i * 15485863 + salt) >>> 0 };
};

// ---------------------------------------------------------------- E1 and E2: decisions and reads
type Pol = 'auto' | 'read';
/** A player who follows the read: the focus that counters it, then a spin of that focus's wheel. */
function playRead(ch: number, i: number, pol: Pol, words?: Record<string, number>) {
  const { a, b, seed } = pair(i, ch);
  b.aiSkill = 0.06 * (ch - 1);
  const bt = newBattle(a, b, mulberry32(seed), { quiet: true });
  const prng = mulberry32(seed ^ 0x9e3779b9);
  bt.start();
  let shown = 0;
  let right = 0;
  while (!bt.over) {
    const p = bt.plan();
    if (words) words[readClue(p.acc)] = (words[readClue(p.acc)] || 0) + 1;
    const me = bt.P[0];
    if (pol === 'auto') bt.step(autoChoice(prng, me, bt.P[1], bt.hist[1]));
    else {
      let focus: Focus = CW_REC[p.shown] ?? 'atk';
      if (focus === 'pow' && !cwPowOk(me) && !BALANCE.pureFocus) focus = 'atk';
      if (me.en >= 100 && p.shown !== 'guard') focus = 'ult';
      const list = cwSlices(me, focus);
      const it = list[pickW(prng, list)]!.it;
      if (it.c === 'ult') {
        if (it.ultIdx != null) me.ultSpin = ULT_WHEEL[it.ultIdx]!;
        bt.step('ult', null, { ...(it.m || {}) });
      } else bt.step(it.c as Move, null, { ...(it.m || {}) });
    }
    shown++;
    if (bt.hist[1].at(-1) === p.shown) right++;
  }
  return { won: bt.w === 0, shown, right };
}
function decisions() {
  const rows: (string | number)[][] = [];
  for (const ch of [1, 10, 20]) {
    const [b, a] = both(() => {
      let auto = 0;
      let read = 0;
      for (let i = 0; i < N; i++) {
        if (playRead(ch, i, 'auto').won) auto++;
        if (playRead(ch, i, 'read').won) read++;
      }
      return { auto: auto / N, read: read / N };
    });
    rows.push([`Chapter ${ch}`, pct(b.auto), pct(b.read), pts(b.read - b.auto), pct(a.auto), pct(a.read), pts(a.read - a.auto)]);
  }
  table(
    `E1 decisions: wins for auto-battle vs following the read, same-level pairs, ${N} fights a cell (AI skill of the chapter)`,
    ['', 'Before auto', 'Before read', 'Edge', 'After auto', 'After read', 'Edge'],
    rows,
  );
}
function reads() {
  const rows: (string | number)[][] = [];
  const top = (w: Record<string, number>) => {
    const n = Object.values(w).reduce((x, y) => x + y, 0);
    return ['Clear as day', 'Pretty sure', 'Probably', 'Maybe', 'Just a hunch', 'Wild guess'].map((k) => `${Math.round(((w[k] || 0) / n) * 100)}`).join('/');
  };
  for (const ch of [1, 5, 10, 15, 20]) {
    const [b, a] = both(() => {
      const words: Record<string, number> = {};
      let shown = 0;
      let right = 0;
      for (let i = 0; i < Math.round(N / 3); i++) {
        const r = playRead(ch, i, 'auto', words);
        shown += r.shown;
        right += r.right;
      }
      return { words, true: right / shown };
    });
    rows.push([`Chapter ${ch}`, top(b.words), pct(b.true), top(a.words), pct(a.true)]);
  }
  table(
    'E2 reads: share of each word (Clear as day / Pretty sure / Probably / Maybe / Just a hunch / Wild guess, in %) and how often the read is right',
    ['', 'Before words', 'Right', 'After words', 'Right'],
    rows,
  );
}

// ---------------------------------------------------------------- E3: what each stat is worth
function statValue() {
  const variants: [string, (f: Fighter) => void][] = (['str', 'dur', 'spd', 'iq', 'wm', 'pm', 'cha'] as const).map((k) => [
    `+2 ${k}`,
    (f: Fighter) => (f.bonus = { ...f.bonus, [k]: (f.bonus[k] || 0) + 2 }),
  ]);
  const rows: (string | number)[][] = [];
  for (const [k, fn] of variants) {
    const [b, a] = both(() => {
      let base = 0;
      let up = 0;
      for (let i = 0; i < N; i++) {
        const { a: x, b: y, seed } = pair(i, 77);
        const x2 = structuredClone(x) as Fighter;
        fn(x2);
        invalidate(x2);
        if (simulate(x, y, mulberry32(seed)) === 0) base++;
        if (simulate(x2, y, mulberry32(seed)) === 0) up++;
      }
      return (up - base) / N;
    });
    rows.push([k, pts(b), pts(a)]);
  }
  table(`E3 stats: win-rate points from +2 of one stat, same fighter vs the same opponent, ${N} fights each`, ['', 'Before', 'After'], rows);
}

// ---------------------------------------------------------------- E4: heals, revives, powers, classes
function byPick(keyOf: (f: Fighter) => string) {
  const s = new Map<string, { w: number; n: number }>();
  for (let i = 0; i < N * 4; i++) {
    const { a, b, seed } = pair(i, 91);
    const won = simulate(a, b, mulberry32(seed)) === 0;
    for (const [f, w] of [
      [a, won],
      [b, !won],
    ] as const) {
      const x = s.get(keyOf(f)) ?? { w: 0, n: 0 };
      x.n++;
      if (w) x.w++;
      s.set(keyOf(f), x);
    }
  }
  return new Map([...s].map(([k, v]) => [k, v.w / v.n]));
}
function powersAndClasses() {
  const [pb, pa] = both(() => byPick((f) => f.power.n));
  const none = (m: Map<string, number>) => m.get('No power') ?? NaN;
  const below = (m: Map<string, number>) => [...m].filter(([k, v]) => k !== 'No power' && v < none(m)).length;
  const sorted = [...pa].sort((x, y) => pb.get(x[0])! - pb.get(y[0])!);
  const rows: (string | number)[][] = [...sorted.slice(0, 6), ...sorted.slice(-4)].map(([k]) => [k, pct(pb.get(k)!), pct(pa.get(k)!)]);
  rows.push(['Powers below No power', below(pb), below(pa)]);
  const spread = (m: Map<string, number>) => {
    const v = [...m.values()];
    return pts(Math.max(...v) - Math.min(...v));
  };
  rows.push(['Spread, best to worst', spread(pb), spread(pa)]);
  table(`E4 powers vs random same-level opponents (${N * 8} fighter-fights; the six weakest before, the four strongest)`, ['', 'Before', 'After'], rows);

  const [cb, ca] = both(() => byPick((f) => f.arch.n));
  const crow = [...ca].sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, pct(cb.get(k)!), pct(v)]);
  crow.push(['Spread, best to worst', spread(cb), spread(ca)]);
  table('E4 classes vs random same-level opponents', ['', 'Before', 'After'], crow);
}

const t0 = Date.now();
console.log(`The review's design pass, before and after (${N} fights a cell, seed ${SEED})`);
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1]! : '';
if (!only || only === 'decisions') decisions();
if (!only || only === 'reads') reads();
if (!only || only === 'stats') statValue();
if (!only || only === 'powers') powersAndClasses();
after();
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
