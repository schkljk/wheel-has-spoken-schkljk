import { signal } from '@preact/signals';
import { WheelStage } from './WheelStage';

const TABS = ['Play', 'Fighter', 'Goals', 'More'] as const;
type Tab = (typeof TABS)[number];
const tab = signal<Tab>('Play');

export function App() {
  return (
    <div class="shell">
      <main class="stage">
        <WheelStage />
        <div class="overlay">
          <h1>The Wheel Has Spoken</h1>
          <p>Rebuild in progress. The wheel is warming up.</p>
          <a href={`${import.meta.env.BASE_URL}legacy/`}>Play the current version</a>
        </div>
      </main>
      <nav class="tabbar">
        {TABS.map((t) => (
          <button key={t} aria-current={tab.value === t ? 'page' : undefined} onClick={() => (tab.value = t)}>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
