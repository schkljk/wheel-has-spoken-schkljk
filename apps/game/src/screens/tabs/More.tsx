import { go, save } from '../../state/game';
import { pool, poolProgress } from '../../state/pool';
import { openSheet } from '../../state/ui';
import { SaveSheet } from '../../sheets/Save';
import { SettingsSheet } from '../../sheets/Settings';
import { startTutorial } from '../../sheets/Tutorial';
import { Icon, type IconName } from '../../ui/Icon';
import { Sheet, rise } from '../../ui/kit';

const OLD_VERSION = `${import.meta.env.BASE_URL}legacy/`;

function RecordsSheet() {
  const p = save.value.profile;
  const st = p.stats;
  const rows: [string, number | string][] = [
    ['Fights won', st.wins ?? 0],
    ['Elite wins', st.elites ?? 0],
    ['Bosses beaten', st.bosses ?? 0],
    ['Chapters cleared', st.chapters ?? 0],
    ['Cups won', st.cups ?? 0],
    ['World titles', st.worlds ?? 0],
    ['Best gauntlet streak', Math.max(st.gauntletBest ?? 0, p.gbest)],
    ['Daily challenges won', st.dailies ?? 0],
    ['Loot spins', st.loot ?? 0],
    ['Gear found', st.gearFound ?? 0],
    ['Fighters built', st.built ?? 0],
    ['Highest level', st.topLevel ?? 0],
    ['Wheel spins', p.spins],
    ['Legacy points', p.legacy.pts],
    ['Retired fighters', save.value.roster.retired.length],
  ];
  return (
    <Sheet icon="cup" title="Records" sub="Everything this device remembers">
      <div class="card build">
        {rows.map(([k, v]) => (
          <div class="build-row" key={k}>
            <small>{k}</small>
            <b>{v}</b>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export function MoreTab() {
  const items: [IconName, string, string, () => void][] = [
    ['gear', 'Settings', 'Sound, vibration, text size, animations', () => openSheet(<SettingsSheet />)],
    ['save', 'Your save', 'Backups, export, import, bring over the old save', () => openSheet(<SaveSheet />)],
    ['cup', 'Records', 'Wins, cups, streaks and spins', () => openSheet(<RecordsSheet />)],
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
