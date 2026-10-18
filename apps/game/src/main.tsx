import { render } from 'preact';
import type { HistoryEntry } from '@whs/core';
import { App } from './App';
import { save } from './state/game';
import { ensurePool } from './state/pool';
import { installPressFeedback } from './ui/kit';
import './styles/tokens.css';
import './styles/app.css';
import './styles/screens.css';
import './styles/game.css';

installPressFeedback();
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
