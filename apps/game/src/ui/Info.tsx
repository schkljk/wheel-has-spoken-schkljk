import type { ComponentChildren } from 'preact';
import { infoFor } from '@whs/core';
import { infoKey, openInfo } from '../state/ui';
import { iconForInfoKey } from './ContentIcon';
import { Icon } from './Icon';

/** Something you can tap to learn what it does. */
export function Inf(props: { k: string; children: ComponentChildren; class?: string }) {
  return (
    <span
      class={`inf${props.class ? ' ' + props.class : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        openInfo(props.k);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openInfo(props.k);
        }
      }}
    >
      {props.children}
    </span>
  );
}

/** The info card: mechanics first, the joke underneath. */
export function InfoHost() {
  const key = infoKey.value;
  if (!key) return null;
  const it = infoFor(key);
  const close = () => (infoKey.value = null);
  if (!it) {
    queueMicrotask(close);
    return null;
  }
  return (
    <div class="scrim info-scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <section class="confirm info-card" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div class="row">
          <span class="info-e" aria-hidden="true">
            {iconForInfoKey(key, it.e)}
          </span>
          <div class="grow">
            <h2 id="info-title">{it.title}</h2>
            {it.sub && <small>{it.sub}</small>}
          </div>
          <button class="iconbtn" aria-label="Close" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div class="info-body scroll">
          {it.p && <p>{it.p}</p>}
          {it.lines.length > 0 && (
            <ul class="info-lines">
              {it.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          {it.hint && <p class="hint">{it.hint}</p>}
          {it.flavor && <p class="flav">“{it.flavor}”</p>}
        </div>
      </section>
    </div>
  );
}
