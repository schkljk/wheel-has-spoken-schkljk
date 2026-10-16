import { render } from 'preact';
import type { HistoryEntry } from '@whs/core';
import { App } from './App';
import { save } from './state/game';
import { ensurePool } from './state/pool';
import { startTutorial } from './sheets/Tutorial';
import { installPressFeedback } from './ui/kit';
import './styles/tokens.css';
import './styles/app.css';
import './styles/screens.css';

installPressFeedback();
render(<App />, document.getElementById('app')!);

const s = save.value;
// first launch: the tour, unless there are fighters already (as in the legacy game)
if (!s.settings.tutorialSeen && !s.roster.slots.some(Boolean)) startTutorial();

// today's ranked pool builds in a worker while you look around
const p = s.profile;
ensurePool({
  patch: p.patch,
  history: { champs: (p.champs as unknown as HistoryEntry[]).filter((c) => c && c.best), lastTop: p.lastTop as unknown as HistoryEntry[] },
});
