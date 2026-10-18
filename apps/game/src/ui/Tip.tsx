import { TIPS } from '@whs/core';
import { dismissTip, noMoreTips, tipNow } from '../state/tips';

/** The tip card: what this is, how it works, a joke, and "Got it". */
export function TipHost() {
  const k = tipNow.value;
  if (!k) return null;
  const t = TIPS[k];
  return (
    <aside class="tipcard" role="dialog" aria-labelledby="tip-title" key={k}>
      <div class="tc-head">
        <span class="tc-e" aria-hidden="true">
          {t.e}
        </span>
        <span class="grow">
          <small>First time here</small>
          <b id="tip-title">{t.t}</b>
        </span>
      </div>
      <p>{t.d}</p>
      <p class="flav">{t.f}</p>
      <div class="row">
        <button class="btn sm grow" onClick={dismissTip}>
          Got it
        </button>
        <button class="btn ghost sm" onClick={noMoreTips}>
          No more tips
        </button>
      </div>
    </aside>
  );
}
