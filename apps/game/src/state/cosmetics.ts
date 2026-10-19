import { effect } from '@preact/signals';
import { worn } from '@whs/core';
import { WHEEL_LOOK } from '../art/look';
import { setConfetti } from '../ui/fx';
import { G, save } from './game';

/** Puts the worn cosmetics (review F11) on every wheel, win and nameplate, whenever the save changes. */
export function installCosmetics() {
  effect(() => {
    void save.value;
    WHEEL_LOOK.rim = worn(G, 'rim')?.col ?? null;
    WHEEL_LOOK.charm = worn(G, 'charm')?.e ?? null;
    setConfetti(worn(G, 'confetti')?.col ?? null);
    const pl = worn(G, 'plate');
    const root = document.documentElement;
    if (pl?.col) {
      root.dataset.plate = pl.k;
      root.style.setProperty('--plate-bg', pl.col[0]!);
      root.style.setProperty('--plate-ink', pl.col[1]!);
    } else delete root.dataset.plate;
  });
}
