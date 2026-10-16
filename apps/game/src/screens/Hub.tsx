import { activeFighter, activeSlot, go, route, save, type Tab } from '../state/game';
import { openSheet } from '../state/ui';
import { SettingsSheet } from '../sheets/Settings';
import { Icon, type IconName } from '../ui/Icon';
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
  return (
    <main class="screen hub">
      <header class="bar pad row">
        <button class="iconbtn" aria-label="Your fighters" onClick={() => go({ screen: 'title' })}>
          <Icon name="people" />
        </button>
        <span class="grow ellipsis bar-name">
          <b>{f.name}</b>
          <small>Level {f.lvl || 1}</small>
        </span>
        <span class="chip" aria-label={`${slot.coins} coins`}>
          <Icon name="coin" /> {slot.coins}
        </span>
        <span class="chip" aria-label={`${save.value.profile.gems} gems`}>
          <Icon name="gem" /> {save.value.profile.gems}
        </span>
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
          </button>
        ))}
      </nav>
    </main>
  );
}
