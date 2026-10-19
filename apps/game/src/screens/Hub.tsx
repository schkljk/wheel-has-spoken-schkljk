import { RANKS, ensureSeen, rankOf, seeGoals, tabDots } from '@whs/core';
import { G, activeFighter, activeSlot, ensure, go, route, save, type Tab } from '../state/game';
import { openSheet } from '../state/ui';
import { SettingsSheet } from '../sheets/Settings';
import { FighterFace } from '../art/FighterFace';
import { Icon, type IconName } from '../ui/Icon';
import { Inf } from '../ui/Info';
import { FighterTab } from './tabs/Fighter';
import { GoalsTab } from './tabs/Goals';
import { MoreTab } from './tabs/More';
import { PlayTab } from './tabs/Play';

const TABS: [Tab, string, IconName][] = [
  ['play', 'Play', 'play'],
  ['fighter', 'Fighter', 'fist'],
  ['goals', 'Goals', 'target'],
  ['more', 'More', 'menu'],
];

export function Hub({ tab }: { tab: Tab }) {
  const slot = activeSlot.value;
  const f = activeFighter.value;
  if (!slot || !f) {
    // the slot is gone (erased, replaced): back to the roster
    queueMicrotask(() => go({ screen: 'title' }));
    return null;
  }
  // something new waiting on a tab (upgrade 32); saves from before the dots start with goals seen
  void save.value;
  if (G.save.profile.extra.goalsSeen == null) ensure((g) => seeGoals(g));
  // the "New" ribbons (H1) start from what is already open
  if (G.save.profile.extra.seenNew == null) ensure((g) => ensureSeen(g));
  const dots = tabDots(G);
  return (
    <main class="screen hub">
      <header class="bar pad row">
        <button class="bar-me" aria-label="Your fighters" onClick={() => go({ screen: 'title' })}>
          <span class="bar-face">
            <FighterFace f={f} e={f.race?.e} />
          </span>
          <span class="bar-lvl" aria-hidden="true">
            {f.lvl || 1}
          </span>
        </button>
        <span class="grow ellipsis bar-name">
          <b>{f.name}</b>
          <small>
            {RANKS[rankOf(f)]!.n}
            {f.story ? `, chapter ${(f.story as { ch: number }).ch}` : ''}
          </small>
        </span>
        <span class="chip" aria-label={`${slot.coins} coins`}>
          <Icon name="coin" /> {slot.coins}
        </span>
        <Inf k="rule|gems" class="chip" label={`${save.value.profile.gems} gems. What gems buy`}>
          <Icon name="gem" /> {save.value.profile.gems}
        </Inf>
        <button class="iconbtn" aria-label="Settings" onClick={() => openSheet(<SettingsSheet />)}>
          <Icon name="gear" />
        </button>
      </header>
      <section class="tabpanel scroll pad" key={tab} role="tabpanel" aria-label={TABS.find((t) => t[0] === tab)![1]}>
        {tab === 'play' && <PlayTab />}
        {tab === 'fighter' && <FighterTab />}
        {tab === 'goals' && <GoalsTab />}
        {tab === 'more' && <MoreTab />}
      </section>
      <nav class="tabbar" role="tablist">
        {TABS.map(([k, label, icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => (route.value = { screen: 'hub', tab: k })}>
            <Icon name={icon} />
            <span>{label}</span>
            {dots[k as keyof typeof dots] && tab !== k && (
              <>
                <i class="tdot" aria-hidden="true" />
                <span class="sr">, something new</span>
              </>
            )}
          </button>
        ))}
      </nav>
    </main>
  );
}
