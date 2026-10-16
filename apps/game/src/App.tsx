import { route } from './state/game';
import { Hub } from './screens/Hub';
import { Title } from './screens/Title';
import { CineHost, ConfirmHost, SheetHost, ToastHost } from './ui/kit';

export function App() {
  const r = route.value;
  return (
    <>
      {r.screen === 'title' ? <Title /> : <Hub tab={r.tab} />}
      <SheetHost />
      <ConfirmHost />
      <CineHost />
      <ToastHost />
    </>
  );
}
