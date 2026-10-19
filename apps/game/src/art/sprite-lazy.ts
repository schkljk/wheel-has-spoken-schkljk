// The sprite drawing code (about 55 KB: every race, class, outfit, weapon and boss) loads as its own chunk as soon
// as the game starts, instead of in the script the title waits for. Until it arrives the page draws what doesn't
// need it (faces kept from last time, the baked icons) and leaves sprites blank; what reads `spritesReady` draws
// again when it lands.
import { signal } from '@preact/signals';

type Art = typeof import('./sprite-art');
let art: Art | null = null;
let loading: Promise<Art | null> | null = null;
/** true once the drawing code has loaded */
export const spritesReady = signal(false);
/** Loads the drawing code (once). */
export function loadSprites(): Promise<Art | null> {
  return (loading ??= import('./sprite-art')
    .then((m) => {
      art = m;
      spritesReady.value = true;
      return m;
    })
    .catch(() => {
      loading = null;
      return null;
    }));
}
/** The drawing code, if it has loaded (and it starts loading if not). */
export function spriteArt(): Art | null {
  if (!art) void loadSprites();
  return art;
}
