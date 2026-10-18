import type { FxLevel, MotionPref, TextSize } from '@whs/core';
import { commit, settings } from '../state/game';
import { openSheet } from '../state/ui';
import { Segmented, Sheet, Toggle } from '../ui/kit';
import { SaveSheet } from './Save';
import { ErrorLogSheet } from './ErrorLog';
import { errLog } from '../state/errlog';

const taps = { n: 0 };
import { startTutorial } from './Tutorial';

export function SettingsSheet() {
  const st = settings.value;
  const set = (change: (s: typeof st) => void) => commit((s) => change(s.settings));
  return (
    <Sheet icon="gear" title="Settings" sub="Saved on this device">
      <Toggle label="Sound effects" sub="Wheel ticks, hits, taps and fanfares" on={st.sound} onToggle={() => set((s) => (s.sound = !s.sound))} />
      <Toggle label="Music" sub="A light loop in every arena, and the bosses' own" on={st.music !== false} onToggle={() => set((s) => (s.music = s.music === false))} />
      <Toggle label="Vibration" sub="Buzzes on presses, big hits and spins, on phones that support it" on={st.haptics} onToggle={() => set((s) => (s.haptics = !s.haptics))} />
      <Toggle label="Fast mode" sub="Quicker spins and fight animations" on={st.fast} onToggle={() => set((s) => (s.fast = !s.fast))} />
      <Toggle label="Auto-battle by default" sub="Fights play themselves unless you switch it off" on={st.autoBattle} onToggle={() => set((s) => (s.autoBattle = !s.autoBattle))} />
      <Toggle label="Tips" sub="Each thing explains itself the first time it shows up" on={st.tips !== false} onToggle={() => set((s) => (s.tips = s.tips === false))} />
      {(st.tipsSeen || []).length > 0 && st.tips !== false && (
        <button class="btn ghost sm" onClick={() => set((s) => (s.tipsSeen = []))}>
          Show all tips again ({st.tipsSeen.length} seen)
        </button>
      )}
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
        {st.motion !== 'reduced' && (
          <Segmented<FxLevel>
            label="Hit effects"
            value={st.fx || 'normal'}
            options={[
              ['soft', 'Soft'],
              ['normal', 'Normal'],
              ['big', 'Big'],
            ]}
            onChange={(v) => set((s) => (s.fx = v))}
          />
        )}
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
            // the hidden lab loads on demand (upgrade 44)
            void import('./Lab').then(({ LabSheet }) => openSheet(<LabSheet />));
          }
        }}
      >
        The Wheel Has Spoken · build {__BUILD__}
      </p>
      {/* the hidden error log: only shows up when something went wrong (upgrade 45) */}
      {errLog.value.length > 0 && (
        <button class="btn ghost sm errbadge" onClick={() => openSheet(<ErrorLogSheet />)}>
          ⚠ {errLog.value.length} {errLog.value.length === 1 ? 'error' : 'errors'} logged
        </button>
      )}
    </Sheet>
  );
}
