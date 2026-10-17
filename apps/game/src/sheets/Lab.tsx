import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import type { LabReport } from '@whs/core';
import { Segmented, Sheet } from '../ui/kit';
import type { LabMessage, LabRequest } from '../workers/lab.worker';

/** Win rates outside this band get flagged. */
const HIGH = 0.58;
const LOW = 0.42;
type Size = '2000' | '10000' | '40000';

// the last run survives closing the sheet
const report = signal<LabReport | null>(null);
const progress = signal<number | null>(null);
let worker: Worker | null = null;

function run(fights: number) {
  worker?.terminate();
  worker = new Worker(new URL('../workers/lab.worker.ts', import.meta.url), { type: 'module' });
  progress.value = 0;
  worker.onmessage = (e: MessageEvent<LabMessage>) => {
    const m = e.data;
    if (m.type === 'progress') progress.value = m.done / m.total;
    else {
      report.value = m.report;
      progress.value = null;
      worker?.terminate();
      worker = null;
    }
  };
  worker.postMessage({ fights, seed: Math.floor(Math.random() * 1e9) } satisfies LabRequest);
}

/**
 * The balance lab (hidden; five taps on the build line in Settings): mass same-level fights between random
 * fighters in random gear, with win rates by class, race, weapon, sidekick, gear set, growth and personality.
 */
export function LabSheet() {
  const [size, setSize] = useState<Size>('10000');
  const [tab, setTab] = useState('arch');
  const r = report.value;
  const p = progress.value;
  const t = r?.tables.find((x) => x.k === tab);
  return (
    <Sheet icon="dice" title="Balance lab" sub="Hidden. Random same-level fighters in random gear, fighting it out">
      <Segmented<Size>
        label="Fights"
        value={size}
        options={[
          ['2000', '2,000'],
          ['10000', '10,000'],
          ['40000', '40,000'],
        ]}
        onChange={setSize}
      />
      <button class="btn block" disabled={p != null} onClick={() => run(Number(size))}>
        {p != null ? `Simulating… ${Math.round(p * 100)}%` : r ? 'Run again' : 'Run the simulation'}
      </button>
      {p != null && (
        <div class="lab-prog" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${p * 100}%` }} />
        </div>
      )}
      {r && (
        <>
          <p class="fine">
            {r.fights.toLocaleString()} fights, seed {r.seed}. Flagged: above {Math.round(HIGH * 100)}% or below {Math.round(LOW * 100)}%.
          </p>
          <div class="chips lab-tabs" role="tablist">
            {r.tables.map((x) => (
              <button key={x.k} role="tab" aria-selected={x.k === tab} class={`chip${x.k === tab ? ' on' : ''}`} onClick={() => setTab(x.k)}>
                {x.title}
              </button>
            ))}
          </div>
          <ol class="lab-list">
            {t?.rows.map((x) => (
              <li key={x.k} class={x.w > HIGH ? 'hi' : x.w < LOW ? 'lo' : ''}>
                <span class="lab-e">{x.e}</span>
                <span class="lab-n ellipsis">{x.label}</span>
                <span class="lab-bar" aria-hidden="true">
                  <i style={{ width: `${x.w * 100}%` }} />
                </span>
                <b class="lab-w">{(x.w * 100).toFixed(1)}%</b>
                <small class="lab-c">{x.n}</small>
              </li>
            ))}
          </ol>
        </>
      )}
    </Sheet>
  );
}
