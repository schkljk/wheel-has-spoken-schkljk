import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { buzz, toasts } from '../state/game';
import { cine, closeSheet, confirmReq, sheet, sheetLocked } from '../state/ui';
import { Icon, type IconName } from './Icon';

/** Press feedback for anything pressable: a ripple where the finger landed, and a tiny buzz. */
export function installPressFeedback() {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const b = (e.target as Element | null)?.closest<HTMLElement>('.btn,.iconbtn,.card.tap,.tabbar button,.setrow,.seg button');
      if (!b || (b as HTMLButtonElement).disabled) return;
      if (document.documentElement.dataset.motion !== 'reduced') {
        const r = b.getBoundingClientRect();
        const s = Math.max(r.width, r.height) * 2.2;
        const rp = document.createElement('span');
        rp.className = 'ripple';
        rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
        b.appendChild(rp);
        setTimeout(() => rp.remove(), 600);
      }
      buzz(8);
    },
    { passive: true },
  );
}

/** Layout for a bottom sheet: title row, a scrolling body, and buttons at the bottom. */
export function Sheet(props: { icon?: IconName; emoji?: string; title: string; sub?: string; children: ComponentChildren; foot?: ComponentChildren; locked?: boolean }) {
  return (
    <>
      <div class="sheet-grab" />
      <div class="sheet-head">
        {props.icon && <Icon name={props.icon} class="lg" />}
        {props.emoji && (
          <span class="sheet-emoji" aria-hidden="true">
            {props.emoji}
          </span>
        )}
        <div class="grow">
          <h2>{props.title}</h2>
          {props.sub && <small>{props.sub}</small>}
        </div>
        {!props.locked && (
          <button class="iconbtn" aria-label="Close" onClick={closeSheet}>
            <Icon name="close" />
          </button>
        )}
      </div>
      <div class="sheet-body scroll">{props.children}</div>
      <div class="sheet-foot">{props.foot}</div>
    </>
  );
}

export function SheetHost() {
  const content = sheet.value;
  useEffect(() => {
    if (!content) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !sheetLocked.value && closeSheet();
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [content]);
  if (!content) return null;
  return (
    <div class="scrim" onClick={(e) => e.target === e.currentTarget && !sheetLocked.value && closeSheet()}>
      <section class="sheet" role="dialog" aria-modal="true">
        {content}
      </section>
    </div>
  );
}

export function ConfirmHost() {
  const c = confirmReq.value;
  const yes = useRef<HTMLButtonElement>(null);
  useEffect(() => yes.current?.focus(), [c]);
  if (!c) return null;
  const done = (ok: boolean) => {
    confirmReq.value = null;
    c.resolve(ok);
  };
  return (
    <div class="scrim" style={{ alignItems: 'center', zIndex: 55 }} onClick={(e) => e.target === e.currentTarget && done(false)}>
      <section class="confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{c.title}</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>{c.body}</p>
        <button ref={yes} class={`btn block${c.danger ? ' danger' : ''}`} onClick={() => done(true)}>
          {c.yes}
        </button>
        <button class="btn ghost block" onClick={() => done(false)}>
          {c.no ?? 'Never mind'}
        </button>
      </section>
    </div>
  );
}

export function ToastHost() {
  return (
    <div class="toasts" aria-live="polite">
      {toasts.value.map((t) => (
        <div key={t.id} class="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function CineHost() {
  return cine.value ? <div class="cine">{cine.value}</div> : null;
}

export function Toggle(props: { label: string; sub: string; on: boolean; onToggle: () => void }) {
  return (
    <button class="setrow" role="switch" aria-checked={props.on} onClick={props.onToggle}>
      <span class="grow">
        <b>{props.label}</b>
        <small>{props.sub}</small>
      </span>
      <i class={`switch${props.on ? ' on' : ''}`} />
    </button>
  );
}

export function Segmented<T extends string>(props: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={props.label}>
      <b>{props.label}</b>
      <div class="seg">
        {props.options.map(([v, text]) => (
          <button key={v} aria-pressed={props.value === v} onClick={() => props.onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Staggered entrance: spread onto list items with increasing i. */
export const rise = (i: number) => ({ 'data-rise': '', style: { '--d': `${Math.min(i, 12) * 40}ms` } });
