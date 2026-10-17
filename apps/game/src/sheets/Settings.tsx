import type { MotionPref, TextSize } from '@whs/core';
import { commit, settings } from '../state/game';
import { openSheet } from '../state/ui';
import { Segmented, Sheet, Toggle } from '../ui/kit';
import { SaveSheet } from './Save';
import { LabSheet } from './Lab';

const taps = { n: 0 };
import { startTutorial } from './Tutorial';

export function SettingsSheet() {
  const st = settings.value;
  const set = (change: (s: typeof st) => void) => commit((s) => change(s.settings));
  return (
    <Sheet icon="gear" title="Settings" sub="Saved on this device">
      <Toggle label="Sound" sub="Wheel ticks, hits and fanfares" on={st.sound} onToggle={() => set((s) => (s.sound = !s.sound))} />
      <Toggle label="Vibration" sub="Buzzes on presses, big hits and spins, on phones that support it" on={st.haptics} onToggle={() => set((s) => (s.haptics = !s.haptics))} />
      <Toggle label="Fast mode" sub="Quicker spins and fight animations" on={st.fast} onToggle={() => set((s) => (s.fast = !s.fast))} />
      <Toggle label="Auto-battle by default" sub="Fights play themselves unless you switch it off" on={st.autoBattle} onToggle={() => set((s) => (s.autoBattle = !s.autoBattle))} />
      <div style={{ paddingTop: '0.7rem' }}>
        <Segmented<TextSize>
          label="Text size"
          value={st.textSize}
          options={[
            ['small', 'Small'],
            ['normal', 'Normal'],
            ['large', 'Large'],
            ['huge', 'Huge'],
          ]}
          onChange={(v) => set((s) => (s.textSize = v))}
        />
        <Segmented<MotionPref>
          label="Animations"
          value={st.motion}
          options={[
            ['system', 'Like my phone'],
            ['reduced', 'Calm'],
            ['full', 'Full'],
          ]}
          onChange={(v) => set((s) => (s.motion = v))}
        />
      </div>
      <div class="stack" style={{ marginTop: '0.4rem' }}>
        <button class="btn ghost block" onClick={startTutorial}>
          How to play
        </button>
        <button class="btn ghost block" onClick={() => openSheet(<SaveSheet />)}>
          Your save and backups
        </button>
      </div>
      {/* five taps open the hidden balance lab */}
      <p
        class="fine build"
        onClick={() => {
          if (++taps.n >= 5) {
            taps.n = 0;
            openSheet(<LabSheet />);
          }
        }}
      >
        The Wheel Has Spoken · build {__BUILD__}
      </p>
    </Sheet>
  );
}
