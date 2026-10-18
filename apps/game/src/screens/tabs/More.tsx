import { go } from '../../state/game';
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
  const items: [IconName, string, string, () => void][] = [
    ['gear', 'Settings', 'Sound, vibration, text size, animations', () => openSheet(<SettingsSheet />)],
    ['save', 'Your save', 'Backups, export, import, bring over the old save', () => openSheet(<SaveSheet />)],
    ['cup', 'Records and legacy', 'Seasons, legacy perks, the hall of fame', () => openSheet(<RecordsSheet />)],
    ['card', 'Collection', 'Everything your fighters have found', () => go({ screen: 'codex' })],
    ['cup', 'Trophy room', 'Belts, boss kills, rare titles and mastered classes', () => void import('../../sheets/Trophies').then((m) => m.openTrophies())],
    ['book', 'How to play', 'A quick tour of the game', startTutorial],
    ['people', 'Your fighters', 'Switch fighter', () => go({ screen: 'title' })],
  ];
  return (
    <div class="stack tab-stack">
      {items.map(([icon, name, sub, act], i) => (
        <button class="card tap row" key={name} onClick={act} {...rise(i)}>
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
          <b>The current version</b>
          <small style={{ display: 'block' }}>Every mode, while the new one is being built</small>
        </span>
      </a>
      <small class="center" {...rise(items.length + 1)}>
        Ranked opponents: {pool.value ? "today's 1,000 are ranked" : `ranking today's fighters… ${Math.round(poolProgress.value * 100)}%`}
      </small>
    </div>
  );
}
