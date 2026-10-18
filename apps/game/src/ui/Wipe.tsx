import { useEffect, useRef, useState } from 'preact/hooks';
import { reducedMotion, route } from '../state/game';

/**
 * The screen transition (upgrade 40): when the screen changes, a wheel of colored slices spins open over the
 * new one and fades away. It never takes a tap, never covers anything for long, and stays off with calm
 * animations. Switching tabs on the fighter page isn't a new screen and doesn't trigger it.
 */
export function WipeHost() {
  const screen = (route.value as { screen: string }).screen;
  const last = useRef(screen);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (screen === last.current) return;
    last.current = screen;
    if (!reducedMotion()) setN((x) => x + 1);
  }, [screen]);
  if (!n) return null;
  return <div class="wipe" key={n} aria-hidden="true" onAnimationEnd={() => setN(0)} />;
}
