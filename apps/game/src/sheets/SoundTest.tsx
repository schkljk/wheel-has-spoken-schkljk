import { useEffect, useState } from 'preact/hooks';
import { ARENAS, POWER_ALL } from '@whs/core';
import { SFX_GROUPS } from '../audio/sfx-data';
import { THEME_TRACK, arenaTrack, phaseTrack, playMusic, musicWanted } from '../audio/music';
import { sfx } from '../ui/sound';
import { Sheet } from '../ui/kit';
import { route } from '../state/game';

// A page to hear every sound and every piece of music, by its name in the game, so "the bonk is too loud" is
// easy to say.

const WEAPON_NAMES: Record<string, string> = {
  shoot: 'Bow', xbow: 'Crossbow', beam: 'Laser rifle', throw: 'Thrown weapon', brick: 'Brick', card: 'Uno card', slash: 'Sword',
  heavy: 'Greatsword', reap: 'Scythe', thrust: 'Spear', smash: 'Hammer', bonk: 'Frying pan', swing: 'Baseball bat', flop: 'Noodle',
  fists: 'Fists', flurry: 'Nunchucks', whip: 'Whip', rod: 'Fishing rod', cast: 'Magic staff', saw: 'Chainsaw', riff: 'Electric guitar',
};
const MOMENT: Record<string, string> = { draw: 'draw', charge: 'charge', go: 'swing', cast: 'cast', fly: 'in the air', hit: 'hit' };
// prettier-ignore
const OTHER: Record<string, string> = {
  'f.crit': 'Critical hit', 'f.miss': 'Dodged', 'f.guard': 'Guard', 'f.heal': 'Heal', 'f.status': 'Status effect', 'f.dot': 'Poison tick',
  'f.revive': 'Back up', 'f.ko': 'Knockout', 'f.finisher': 'Final blow (slow motion)', 'f.ult': 'Ultimate charge', 'f.phase': 'Boss phase two',
  'f.round': 'Fight start bell', 'f.read': 'Read it right', 'f.timestop': 'Time stop', 'f.uno': 'Uno reverse', 'f.skip': 'Skipped turn',
  'f.pet': 'Pet attack', 'f.self': 'Hit themself', 'f.win': 'Win fanfare', 'f.lose': 'Loss', 'wh.tick': 'Wheel tick', 'wh.tick2': 'Wheel tick, heavy',
  'wh.spin': 'Spin', 'wh.roll': 'Drum roll beat', 'wh.land0': 'Landed: cooked', 'wh.land1': 'Landed: mid', 'wh.land2': 'Landed: good',
  'wh.land3': 'Landed: goated', 'wh.reroll': 'Reroll', 'ui.tap': 'Button', 'ui.open': 'Panel opens', 'ui.close': 'Panel closes', 'ui.tab': 'Tab',
  'ui.confirm': 'Are you sure?', 'ui.yes': 'Yes', 'ui.no': 'Never mind', 'ui.coin': 'Coins', 'ui.buy': 'Buy', 'ui.sell': 'Sell', 'ui.error': 'Locked',
  'ui.lvl': 'Level up', 'ui.stat': 'Stats changed', 'ui.equip': 'Equip gear', 'ui.upgrade': 'Forge upgrade', 'ui.salvage': 'Salvage', 'ui.toast': 'Notice',
  'ui.goal': 'Goal done', 'ui.gem': 'Gems', 'ui.unlock': 'Unlock', 's.step': 'Footstep', 's.event': 'Encounter', 's.shop': 'Merchant', 's.rest': 'Campfire',
  's.chest': 'Treasure', 's.boss': 'Boss appears', 's.nemesis': 'Nemesis appears', 's.chapter': 'Chapter start', 's.good': 'Deal!', 's.bad': 'No deal',
};
const POWER_NAME = Object.fromEntries(POWER_ALL.map((p) => [p.k, p.n]));
/** What a sound is called on this page. */
export function soundLabel(k: string): string {
  if (OTHER[k]) return OTHER[k]!;
  const [g, a, b] = k.split('.');
  if (g === 'w') return `${WEAPON_NAMES[a!] ?? a}: ${MOMENT[b!] ?? b}`;
  if (g === 'p') return `${POWER_NAME[a!] ?? a}: ${MOMENT[b!] ?? b}`;
  return k;
}

export function SoundTestSheet({ back }: { back?: () => void }) {
  const [on, setOn] = useState(musicWanted());
  const music = (id: string, t: Parameters<typeof playMusic>[0]) => {
    playMusic(on === id ? null : t);
    setOn(on === id ? null : id);
  };
  // leaving the page brings back whatever this screen plays
  useEffect(
    () => () => {
      if (route.value.screen !== 'fight') playMusic(THEME_TRACK);
    },
    [],
  );
  const arena = ARENAS[0]?.k ?? 'colosseum';
  return (
    <Sheet icon="sound" title="Sound test" sub="Tap to hear. Tell me what to change." back={back}>
      <h3 class="st-h">Music</h3>
      <div class="st-grid">
        <button class={`btn sm ghost${on === 'theme' ? ' on' : ''}`} onClick={() => music('theme', THEME_TRACK)}>
          {on === 'theme' ? 'Stop' : 'Play'} the theme
        </button>
        <button class={`btn sm ghost${on === 'arena:' + arena ? ' on' : ''}`} onClick={() => music('arena:' + arena, arenaTrack(arena))}>
          {on === 'arena:' + arena ? 'Stop' : 'Play'} an arena
        </button>
        <button class={`btn sm ghost${on?.startsWith('phase') ? ' on' : ''}`} onClick={() => music('phase:45:132', phaseTrack({ root: 45, bpm: 132 }))}>
          {on?.startsWith('phase') ? 'Stop' : 'Play'} boss phase two
        </button>
      </div>
      {SFX_GROUPS.map((g) => (
        <section key={g.n}>
          <h3 class="st-h">{g.n}</h3>
          <div class="st-grid">
            {g.keys.map((k) => (
              <button key={k} class="btn sm ghost" onClick={() => sfx(k, { vary: 0 })}>
                {soundLabel(k)}
              </button>
            ))}
          </div>
        </section>
      ))}
    </Sheet>
  );
}
