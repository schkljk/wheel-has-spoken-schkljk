// The Android app's glue (Capacitor). The phone's back button walks back through the game the way its own back
// buttons do, instead of closing the app on the first press. Nothing here runs in the browser.

import { Capacitor } from '@capacitor/core';

const shown = (el: Element | null): el is HTMLElement => !!el && (el as HTMLElement).getClientRects().length > 0;

/** One step back: the open dialog, else the open sheet, else the screen's own back button, else the Play tab. */
export function stepBack(): boolean {
  const cancel = document.querySelector('[role=alertdialog] .btn.ghost');
  if (shown(cancel)) return cancel.click(), true;
  if (document.querySelector('.sheet')) {
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    return true;
  }
  const menu = document.querySelector('.fmenu');
  if (shown(menu) && !document.querySelector('.fresult')) return menu.click(), true;
  const back = [...document.querySelectorAll('main button')].find((b) => b.querySelector('[data-i="back"]') && shown(b));
  if (back) return (back as HTMLElement).click(), true;
  const tabs = [...document.querySelectorAll('[role=tablist] [role=tab]')];
  if (tabs.length && tabs[0]!.getAttribute('aria-selected') !== 'true') return (tabs[0] as HTMLElement).click(), true;
  return false;
}

export async function installNative() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native');
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    // on the Play tab with nothing open, the game goes to the background (it keeps its place)
    if (!stepBack()) void App.minimizeApp();
  });
}
