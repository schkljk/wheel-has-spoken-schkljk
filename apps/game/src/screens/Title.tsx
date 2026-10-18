import { fullName, deserFighter, randName } from '@whs/core';
import { useState } from 'preact/hooks';
import { goHub } from '../flows/nav';
import { G, enterSlot, go, loadProblems, save, store } from '../state/game';
import { closeSheet, openSheet } from '../state/ui';
import { offerImport, describeSave } from '../sheets/Save';
import { SettingsSheet } from '../sheets/Settings';
import { RecordsSheet } from '../sheets/Records';
import { startTutorial } from '../sheets/Tutorial';
import { FighterFace } from '../art/FighterFace';
import { Icon } from '../ui/Icon';
import { Sheet, rise } from '../ui/kit';
import { careerLine, raceEmoji } from '../ui/fighter';
import { WheelStage } from '../WheelStage';

/** Name a new fighter (or roll a silly name), then spin every wheel. */
function NewFighterSheet() {
  const [name, setName] = useState('');
  const start = () => {
    const n = name.trim().replace(/\s+/g, ' ') || randName(G.rng);
    closeSheet();
    go({ screen: 'build', name: n.slice(0, 24) });
  };
  return (
    <Sheet icon="plus" title="New fighter" sub="Name them, then let the wheels decide everything else">
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <div class="row">
          <input
            class="field grow"
            aria-label="Fighter name"
            placeholder="Name (or roll one)"
            maxLength={24}
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
          />
          <button type="button" class="iconbtn" aria-label="Roll a random name" onClick={() => setName(randName(G.rng))}>
            <Icon name="dice" />
          </button>
        </div>
        <button class="btn block" type="submit">
          Spin a new fighter
        </button>
      </form>
    </Sheet>
  );
}

export function Title() {
  const s = save.value;
  const slots = s.roster.slots;
  const hasFighters = slots.some(Boolean);
  const legacy = !hasFighters ? store.readLegacy() : null;
  const play = (i: number) => {
    if (enterSlot(i)) void goHub();
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
              <span class="avatar face" aria-hidden="true">
                {f ? <FighterFace f={f} e={raceEmoji(slot.career)} /> : raceEmoji(slot.career)}
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
        <button class="btn ghost sm grow" onClick={() => openSheet(<RecordsSheet />)}>
          <Icon name="cup" /> <span class="ellipsis">Records</span>
        </button>
        <button class="btn ghost sm grow" onClick={() => go({ screen: 'codex' })}>
          <Icon name="card" /> <span class="ellipsis">Collection</span>
        </button>
        <button class="iconbtn" aria-label="How to play" onClick={startTutorial}>
          <Icon name="book" />
        </button>
        <button class="iconbtn" aria-label="Settings" onClick={() => openSheet(<SettingsSheet />)}>
          <Icon name="gear" />
        </button>
      </div>
    </main>
  );
}
