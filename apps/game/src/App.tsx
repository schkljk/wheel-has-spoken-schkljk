import type { CareerFighter } from '@whs/core';
import { h, type ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route, type Tab } from './state/game';
import { Hub } from './screens/Hub';
import { Title } from './screens/Title';
import type { SpinSpec } from './screens/Spin';
import type { Run } from '@whs/core';
import { G, go } from './state/game';
import { goHub } from './flows/nav';
import type { ArenaWheel } from './flows/fight';
import type { FightOutcome, FightResult, FightSpec } from '@whs/core';
import { CineHost, ConfirmHost, SheetHost, StaleHost, ToastHost } from './ui/kit';
import { InfoHost } from './ui/Info';
import { TipHost } from './ui/Tip';
import { WipeHost } from './ui/Wipe';
import { StatPopHost } from './ui/StatPop';

/**
 * A screen loaded on first use, in its own chunk (the wheels, fights, map, bracket, collection and card were all
 * downloaded and parsed before the title could draw). Blank for the moment it takes; prefetchScreens() fetches
 * them all once the game is up, so that moment is usually none.
 */
function lazy<P>(load: () => Promise<ComponentType<P>>): { C: ComponentType<P>; load: () => Promise<unknown> } {
  let C: ComponentType<P> | null = null;
  let p: Promise<unknown> | null = null;
  const get = () => (p ??= load().then((c) => (C = c)));
  function Lazy(props: P) {
    const [, loaded] = useState(0);
    useEffect(() => {
      if (C) return;
      let live = true;
      void get().then(() => live && loaded(1));
      return () => {
        live = false;
      };
    }, []);
    return C ? h(C as ComponentType<object>, props as object) : <main class="screen" aria-busy="true" />;
  }
  return { C: Lazy, load: get };
}
const Spin = () => import('./screens/Spin');
const BuildScreen = lazy(() => Spin().then((m) => m.BuildScreen));
const SpinScreen = lazy(() => Spin().then((m) => m.SpinScreen));
const CardScreen = lazy(() => import('./screens/Card').then((m) => m.CardScreen));
const FightScreen = lazy(() => import('./screens/Fight').then((m) => m.FightScreen));
const MapScreen = lazy(() => import('./screens/Map').then((m) => m.MapScreen));
const BracketScreen = lazy(() => import('./screens/Bracket').then((m) => m.BracketScreen));
const CodexScreen = lazy(() => import('./screens/Codex').then((m) => m.CodexScreen));
/** Fetches every screen in the background (once the game is up). */
export function prefetchScreens() {
  for (const s of [BuildScreen, SpinScreen, CardScreen, FightScreen, MapScreen, BracketScreen, CodexScreen]) void s.load().catch(() => {});
}

function Screen() {
  const r = route.value as { screen: string; [k: string]: unknown };
  switch (r.screen) {
    case 'hub':
      return <Hub tab={r.tab as Tab} />;
    case 'build':
      return <BuildScreen.C key={r.name as string} name={r.name as string} resume={r.resume as { f: unknown; idx: number; done: boolean } | null} />;
    case 'card':
      return <CardScreen.C f={r.f as CareerFighter} />;
    case 'spin':
      return <SpinScreen.C key={r.key as number} spec={r.spec as SpinSpec} done={r.done as (it: unknown) => void} />;
    case 'fight':
      return <FightScreen.C key={r.key as number} spec={r.spec as FightSpec} end={r.end as (o: FightOutcome) => FightResult} done={r.done as (x: FightResult) => void} arenaWheel={r.arenaWheel as ArenaWheel | null} />;
    case 'map':
      return <MapScreen.C key={r.key as number} />;
    case 'bracket':
      return <BracketScreen.C key={r.key as number} run={r.run as Run} />;
    case 'codex':
      // back to wherever it was opened from (the title screen or a fighter's More tab)
      return <CodexScreen.C back={() => (r.from === 'title' || !G.F ? go({ screen: 'title' }) : void goHub('more'))} />;
    default:
      return <Title />;
  }
}

export function App() {
  return (
    <>
      <Screen />
      <WipeHost />
      <SheetHost />
      <ConfirmHost />
      <CineHost />
      <InfoHost />
      <TipHost />
      <StatPopHost />
      <ToastHost />
      <StaleHost />
    </>
  );
}
