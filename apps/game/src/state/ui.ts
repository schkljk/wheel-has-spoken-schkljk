import { signal, type Signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';

/** The open bottom sheet (one at a time; opening another replaces it). */
export const sheet: Signal<ComponentChildren | null> = signal(null);
export const openSheet = (c: ComponentChildren) => {
  sheet.value = c;
};
export const closeSheet = () => {
  sheet.value = null;
};

/** The full-screen story card overlay (tutorial, intros). */
export const cine: Signal<ComponentChildren | null> = signal(null);

/** Asks before a big choice. Resolves true when confirmed. */
export interface ConfirmOpts {
  title: string;
  body: string;
  yes: string;
  no?: string;
  danger?: boolean;
}
export const confirmReq = signal<(ConfirmOpts & { resolve: (ok: boolean) => void }) | null>(null);
export const confirm = (o: ConfirmOpts) => new Promise<boolean>((resolve) => (confirmReq.value = { ...o, resolve }));
