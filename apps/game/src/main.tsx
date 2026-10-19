import { render } from 'preact';
import type { HistoryEntry } from '@whs/core';
import { App } from './App';
import { route, save } from './state/game';
import { ensurePool } from './state/pool';
import { installPressFeedback } from './ui/kit';
import { installEmojiIcons } from './ui/emoji';
import { installErrorLog } from './state/errlog';
import { loadPx } from './pixi/usePixi';
import { warmPortraits } from './art/portraits';
import { effect } from '@preact/signals';
import { installAudio } from './audio/engine';
import { THEME_TRACK, playMusic } from './audio/music';
// the fonts ship with the game (offline, and inside the Android app): a pixel display face, a very readable body
// face, and the condensed one the fight scene draws its numbers with
import './styles/fonts.css';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import '@fontsource/saira-condensed/latin-600.css';
import '@fontsource/saira-condensed/latin-800.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/screens.css';
import './styles/game.css';

installErrorLog();
installEmojiIcons();
// the Android app's glue, only in the Android build (the web build doesn't carry Capacitor at all)
if (__NATIVE__) void import('./native').then((m) => m.installNative());
installPressFeedback();
// sound starts with the first tap; the theme plays everywhere but in fights, which bring their own
installAudio();
effect(() => {
  if ((route.value as { screen?: string }).screen !== 'fight') playMusic(THEME_TRACK);
});
render(<App />, document.getElementById('app')!);

const s = save.value;
// no tour up front any more: each system explains itself the first time it shows up (upgrade 31). The tour
// is still in More, How to play.

// today's ranked pool builds in a worker while you look around
const p = s.profile;
ensurePool({
  patch: p.patch,
  history: { champs: (p.champs as unknown as HistoryEntry[]).filter((c) => c && c.best), lastTop: p.lastTop as unknown as HistoryEntry[] },
});

// the Pixi chunk (wheels and fights) loads once the first screen is up, so the first spin doesn't wait for it
if ('requestIdleCallback' in window) requestIdleCallback(() => void loadPx());
else setTimeout(() => void loadPx(), 300);
// and the pixel icons the wheels show, a few at a time
warmPortraits();
