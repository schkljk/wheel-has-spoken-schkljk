import type { CareerFighter } from '@whs/core';
import { route, type Tab } from './state/game';
import { Hub } from './screens/Hub';
import { Title } from './screens/Title';
import { BuildScreen, SpinScreen, type SpinSpec } from './screens/Spin';
import { CardScreen } from './screens/Card';
import { FightScreen } from './screens/Fight';
import { MapScreen } from './screens/Map';
import type { FightOutcome, FightResult, FightSpec } from '@whs/core';
import { CineHost, ConfirmHost, SheetHost, ToastHost } from './ui/kit';
import { InfoHost } from './ui/Info';
import { StatPopHost } from './ui/StatPop';

function Screen() {
  const r = route.value as { screen: string; [k: string]: unknown };
  switch (r.screen) {
    case 'hub':
      return <Hub tab={r.tab as Tab} />;
    case 'build':
      return <BuildScreen key={r.name as string} name={r.name as string} />;
    case 'card':
      return <CardScreen f={r.f as CareerFighter} />;
    case 'spin':
      return <SpinScreen key={r.key as number} spec={r.spec as SpinSpec} done={r.done as (it: unknown) => void} />;
    case 'fight':
      return <FightScreen key={r.key as number} spec={r.spec as FightSpec} end={r.end as (o: FightOutcome) => FightResult} done={r.done as (x: FightResult) => void} />;
    case 'map':
      return <MapScreen key={r.key as number} />;
    default:
      return <Title />;
  }
}

export function App() {
  return (
    <>
      <Screen />
      <SheetHost />
      <ConfirmHost />
      <CineHost />
      <InfoHost />
      <StatPopHost />
      <ToastHost />
    </>
  );
}
