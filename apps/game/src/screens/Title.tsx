import { fullName, deserFighter, randName, savedBuild } from '@whs/core';
import { useState } from 'preact/hooks';
import { continueGame, continueText, goHub } from '../flows/nav';
import { G, enterSlot, go, loadProblems, save, store } from '../state/game';
import { closeSheet, confirm, openSheet } from '../state/ui';
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
  // Continue (B5): a fighter being built, or the last fighter played, straight back where they were
  const build = savedBuild(G) as { f: { name: string }; idx: number; done: boolean } | null;
  const cur = s.roster.active != null && slots[s.roster.active] ? s.roster.active : null;
  const curName = cur != null ? (deserFighter(slots[cur]!.career)?.name ?? null) : null;
  // only one build is kept at a time: a new one would throw the waiting one away, so ask first (review G4)
  const spinNew = async () => {
    if (
      build &&
      !(await confirm({
        title: `Scrap ${build.f.name}?`,
        body: build.done
          ? `${build.f.name} is fully spun and waiting to start a career. A new fighter takes their place.`
          : `${build.f.name}'s spins so far are kept for you. A new fighter throws them away.`,
        yes: 'Scrap and spin new',
        no: `Keep ${build.f.name}`,
        danger: true,
      }))
    )
      return;
    openSheet(<NewFighterSheet />);
  };
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
        {build ? (
          <button
            class="btn block big cont"
            onClick={() => (build.done ? go({ screen: 'card', f: build.f }) : go({ screen: 'build', name: build.f.name, resume: build }))}
            {...rise(n++)}
          >
            <Icon name="play" /> {build.done ? `Meet ${build.f.name}` : `Keep building ${build.f.name}`}
            <small>{build.done ? 'Every wheel is spun. They are waiting to start their career' : 'Your spins so far are kept'}</small>
          </button>
        ) : cur != null && curName ? (
          <button class="btn block big cont" onClick={() => void continueGame(cur)} {...rise(n++)}>
            <Icon name="play" /> Continue with {curName}
            <small>{continueText()}</small>
          </button>
        ) : null}
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
                <button class="btn ghost sm" onClick={() => void spinNew()}>
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
        <button class="btn ghost sm grow" onClick={() => go({ screen: 'codex', from: 'title' })}>
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
