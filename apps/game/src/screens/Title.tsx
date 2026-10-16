import { fullName, deserFighter } from '@whs/core';
import { commit, go, loadProblems, save, store } from '../state/game';
import { openSheet } from '../state/ui';
import { offerImport, describeSave } from '../sheets/Save';
import { SettingsSheet } from '../sheets/Settings';
import { startTutorial } from '../sheets/Tutorial';
import { Icon } from '../ui/Icon';
import { Sheet, rise } from '../ui/kit';
import { careerLine, raceEmoji } from '../ui/fighter';
import { WheelStage } from '../WheelStage';

const OLD_VERSION = `${import.meta.env.BASE_URL}legacy/`;

function NewFighterSheet() {
  return (
    <Sheet icon="plus" title="New fighter" sub="The wheels are being rebuilt">
      <p>
        Spinning a fighter, the story and every mode arrive in the next update of the new version. Until then the current version has all of it, and
        your save there can be brought over here any time from More, Your save.
      </p>
      <a class="btn block" href={OLD_VERSION}>
        Play the current version
      </a>
    </Sheet>
  );
}

export function Title() {
  const s = save.value;
  const slots = s.roster.slots;
  const hasFighters = slots.some(Boolean);
  const legacy = !hasFighters ? store.readLegacy() : null;
  const play = (i: number) => {
    commit((x) => (x.roster.active = i));
    go({ screen: 'hub', tab: 'play' });
  };
  let n = 0;
  return (
    <main class="screen title-screen">
      <div class="title-hero" aria-hidden="true">
        <WheelStage />
      </div>
      <h1 class="title-name">The Wheel Has Spoken</h1>
      <div class="title-body scroll pad stack">
        {loadProblems.value.length > 0 && (
          <div class="card" role="status" {...rise(n++)}>
            <b>About your save</b>
            {loadProblems.value.map((p) => (
              <small key={p} style={{ display: 'block' }}>
                {p}
              </small>
            ))}
          </div>
        )}
        {legacy && legacy.roster.slots.some(Boolean) && (
          <div class="card" {...rise(n++)}>
            <b>Found your save from the old version</b>
            <p style={{ margin: '0.25rem 0 0.6rem' }}>
              <small>{describeSave(legacy)}</small>
            </p>
            <button class="btn sm block" onClick={() => offerImport(legacy, 'your old save')}>
              Bring it over
            </button>
          </div>
        )}
        <span class="sec-label">Your fighters</span>
        {slots.map((slot, i) => {
          if (!slot)
            return (
              <div class="card slot empty" key={i} {...rise(n++)}>
                <span class="avatar" aria-hidden="true">
                  <Icon name="plus" class="lg" />
                </span>
                <span class="grow">
                  <b>Empty slot</b>
                  <small>Room for one more fighter</small>
                </span>
                <button class="btn ghost sm" onClick={() => openSheet(<NewFighterSheet />)}>
                  Spin one
                </button>
              </div>
            );
          const f = deserFighter(slot.career);
          return (
            <div class={`card slot${s.roster.active === i ? ' current' : ''}`} key={i} {...rise(n++)}>
              <span class="avatar" aria-hidden="true">
                {raceEmoji(slot.career)}
              </span>
              <span class="grow">
                <b class="ellipsis">{f ? fullName(f) : slot.career.name}</b>
                <small>
                  {careerLine(slot.career)}. {slot.coins} <Icon name="coin" />
                </small>
              </span>
              <button class="btn sm" disabled={!f} onClick={() => play(i)}>
                Play
              </button>
            </div>
          );
        })}
      </div>
      <div class="title-foot pad row">
        <button class="btn ghost grow" onClick={startTutorial}>
          <Icon name="book" /> How to play
        </button>
        <button class="iconbtn" aria-label="Settings" onClick={() => openSheet(<SettingsSheet />)}>
          <Icon name="gear" />
        </button>
      </div>
    </main>
  );
}
