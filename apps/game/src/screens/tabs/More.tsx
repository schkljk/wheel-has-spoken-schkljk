import { isNew, seeNew } from '@whs/core';
import { G, act, go } from '../../state/game';
import { RecordsSheet } from '../../sheets/Records';
import { pool, poolProgress } from '../../state/pool';
import { openSheet } from '../../state/ui';
import { SaveSheet } from '../../sheets/Save';
import { SettingsSheet } from '../../sheets/Settings';
import { startTutorial } from '../../sheets/Tutorial';
import { Icon, type IconName } from '../../ui/Icon';
import { rise } from '../../ui/kit';

const OLD_VERSION = `${import.meta.env.BASE_URL}legacy/`;

export function MoreTab() {
  const items: [IconName, string, string, () => void, string?][] = [
    ['gear', 'Settings', 'Sound, vibration, text size, animations', () => openSheet(<SettingsSheet />)],
    ['save', 'Your save', 'Backups, export, import, bring over the old save', () => openSheet(<SaveSheet />)],
    ['cup', 'Records and legacy', 'Seasons, legacy perks, the hall of fame', () => openSheet(<RecordsSheet />)],
    ['card', 'Collection', 'Everything your fighters have found', () => go({ screen: 'codex' })],
    ['shield', 'Trophy room', 'Belts, boss kills, rare titles and mastered classes', () => void import('../../sheets/Trophies').then((m) => m.openTrophies())],
    ['gem', 'Locker', 'Wheel rims, charms, confetti and nameplates for gems', () => void import('../../sheets/Locker').then((m) => openSheet(<m.LockerSheet />)), 'locker'],
    ['people', 'Ghost codes', 'Send your fighter to a friend, fight theirs', () => void import('../../sheets/Ghosts').then((m) => openSheet(<m.GhostSheet />)), 'ghosts'],
    ['book', 'How to play', 'A quick tour of the game', startTutorial],
    ['people', 'Your fighters', 'Switch fighter', () => go({ screen: 'title' })],
  ];
  return (
    <div class="stack tab-stack">
      {items.map(([icon, name, sub, open, k], i) => (
        <button
          class={`card tap row${k && isNew(G, k) ? ' has-ribbon' : ''}`}
          key={name}
          onClick={() => {
            // a feature not looked at yet has a "New" ribbon until it is (H1)
            if (k && isNew(G, k)) act((g) => seeNew(g, k));
            open();
          }}
          {...rise(i)}
        >
          {k && isNew(G, k) && <span class="ribbon">New</span>}
          <Icon name={icon} class="lg" />
          <span class="grow">
            <b>{name}</b>
            <small style={{ display: 'block' }}>{sub}</small>
          </span>
        </button>
      ))}
      <a class="card tap row" href={OLD_VERSION} {...rise(items.length)}>
        <Icon name="robot" class="lg" />
        <span class="grow">
          <b>The old version</b>
          <small style={{ display: 'block' }}>The first build of the game, still playable</small>
        </span>
      </a>
      <small class="center" {...rise(items.length + 1)}>
        Ranked opponents: {pool.value ? "today's 1,000 are ranked" : `ranking today's fighters… ${Math.round(poolProgress.value * 100)}%`}
      </small>
    </div>
  );
}
